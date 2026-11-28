#!/bin/bash
# 맥 로컬 시작 명령 (TKT-242) — tools/local-stop.sh 의 짝. 서버를 백그라운드로 띄우고 주소를 알려 준다.
# 용법: tools/local-start.sh [main|advisor|all] [--profile mock|claude|ollama]   (기본 main, profile 기본 mock)
#   main    메인 프런트(vite, 기본 7000 — 막혀 있으면 7001 …). 로그 .local/logs/main.log · pid .local/main.pid
#   advisor 백엔드 8080 + 프런트 5173 (services/advisor/local.sh). 로그 .local/logs/advisor.log · pid .local/advisor.pid
#   claude 는 환경 변수 ANTHROPIC_API_KEY 가 필요하다. 키를 묻거나 저장하지 않는다.
# 이미 떠 있으면(이 저장소 프로세스) 다시 띄우지 않고 주소만 알려 준다. 끄기: tools/local-stop.sh
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
LOCAL="$ROOT/.local"; LOGS="$LOCAL/logs"
TARGET="main"; PROFILE="mock"
while [ $# -gt 0 ]; do
  case "$1" in
    main|advisor|all) TARGET="$1" ;;
    --profile) shift; PROFILE="$1" ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
    *) echo "용법: tools/local-start.sh [main|advisor|all] [--profile mock|claude|ollama]"; exit 1 ;;
  esac
  shift
done
case "$PROFILE" in mock|claude|ollama) ;; *) echo "❌ profile 은 mock|claude|ollama 중 하나입니다."; exit 1 ;; esac

in_repo() {  # $1=pid — 명령줄 또는 cwd 가 이 저장소 안이면 0 (local-stop.sh 와 같은 규칙)
  local cmd cwd
  cmd="$(ps -o command= -p "$1" 2>/dev/null)"
  case "$cmd" in *"$ROOT/"*|*"$ROOT") return 0 ;; esac
  cwd="$(lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)"
  case "$cwd" in "$ROOT"|"$ROOT"/*) return 0 ;; esac
  return 1
}
tree_of() { local c; for c in $(pgrep -P "$1" 2>/dev/null); do tree_of "$c"; done; echo "$1"; }
listeners() {  # $1=포트 — 듣는 pid 목록
  lsof -nP -iTCP:"$1" -sTCP:LISTEN -t 2>/dev/null
}
tree_ports() {  # $1=pid — 그 프로세스 트리가 듣는 포트들
  local list; list="$(tree_of "$1" | tr '\n' ',' | sed 's/,$//')"
  lsof -nP -a -p "$list" -iTCP -sTCP:LISTEN -Fn 2>/dev/null | sed -n 's/^n.*:\([0-9][0-9]*\)$/\1/p' | sort -un
}
pid_alive_mine() {  # $1=pid 파일 — 살아 있고 이 저장소 것이면 0
  local p; [ -f "$1" ] || return 1
  p="$(cat "$1" 2>/dev/null)"
  [ -n "$p" ] && kill -0 "$p" 2>/dev/null && in_repo "$p"
}
fail_with_log() {  # $1=로그 $2=pid 파일 — 죽었을 때 로그 끝을 그대로 보여 준다
  echo "❌ 실행에 실패했습니다. 로그: ${1#$ROOT/}"; tail -n 15 "$1" | sed 's/^/   /'
  rm -f "$2"
}
mkdir -p "$LOGS"
rc=0; ok=0

start_main() {
  local pidf="$LOCAL/main.pid" pid port p
  if pid_alive_mine "$pidf"; then
    pid="$(cat "$pidf")"; port="$(tree_ports "$pid" | head -1)"
    echo "이미 실행 중: 메인 http://127.0.0.1:${port:-7000}"; ok=1; return
  fi
  rm -f "$pidf"
  for p in 7000 7001 7002; do   # pid 파일 없이 이 저장소가 띄운 vite
    for pid in $(listeners "$p"); do
      if in_repo "$pid"; then echo "이미 실행 중: 메인 http://127.0.0.1:$p"; ok=1; return; fi
    done
  done
  if [ ! -d "$ROOT/frontend/node_modules" ]; then
    echo "❌ 메인: frontend/node_modules 가 없습니다. 먼저 npm --prefix frontend install"; rc=1; return
  fi
  (cd "$ROOT/frontend" && exec nohup npm run dev -- --host 127.0.0.1 </dev/null >"$LOGS/main.log" 2>&1) &
  pid=$!; mkdir -p "$LOCAL"; echo "$pid" >"$pidf"; disown 2>/dev/null
  for _ in $(seq 1 60); do
    if ! kill -0 "$pid" 2>/dev/null; then fail_with_log "$LOGS/main.log" "$pidf"; rc=1; return; fi
    port="$(tree_ports "$pid" | head -1)"
    if [ -n "$port" ] && curl -s -m 1 -o /dev/null "http://127.0.0.1:$port/"; then
      echo "메인 실행: http://127.0.0.1:$port"; ok=1; return
    fi
    sleep 0.5
  done
  echo "❌ 메인이 30초 안에 뜨지 않았습니다. 로그: ${LOGS#$ROOT/}/main.log"; rc=1
}

start_advisor() {
  local pidf="$LOCAL/advisor.pid" pid p lp
  if pid_alive_mine "$pidf"; then
    echo "이미 실행 중: 어드바이저 http://127.0.0.1:5173 (백엔드 8080)"; ok=1; return
  fi
  rm -f "$pidf"
  for p in 8080 5173; do
    for pid in $(listeners "$p"); do
      if in_repo "$pid"; then echo "이미 실행 중: 어드바이저 (포트 $p 를 이 저장소가 사용 중) http://127.0.0.1:5173"; ok=1; return; fi
      echo "❌ 어드바이저: 포트 $p 를 다른 프로젝트가 쓰고 있어 띄우지 않습니다 (pid $pid)."; rc=1; return
    done
  done
  if [ ! -d "$ROOT/services/advisor/frontend/node_modules" ]; then
    echo "❌ 어드바이저: services/advisor/frontend/node_modules 가 없습니다. 먼저 npm --prefix services/advisor/frontend install"; rc=1; return
  fi
  (cd "$ROOT/services/advisor" && exec nohup ./local.sh "$PROFILE" </dev/null >"$LOGS/advisor.log" 2>&1) &
  pid=$!; echo "$pid" >"$pidf"; disown 2>/dev/null
  for _ in $(seq 1 240); do
    if ! kill -0 "$pid" 2>/dev/null; then fail_with_log "$LOGS/advisor.log" "$pidf"; rc=1; return; fi
    if curl -s -m 1 "http://localhost:8080/health" 2>/dev/null | grep -q '"status"' \
       && curl -s -m 1 -o /dev/null "http://127.0.0.1:5173/"; then
      echo "어드바이저 실행: http://127.0.0.1:5173 (profile $PROFILE · 백엔드 http://localhost:8080/health)"; ok=1; return
    fi
    sleep 0.5
  done
  echo "❌ 어드바이저가 2분 안에 뜨지 않았습니다. 로그: ${LOGS#$ROOT/}/advisor.log"; rc=1
}

case "$TARGET" in
  main) start_main ;;
  advisor) start_advisor ;;
  all) start_main; start_advisor ;;
esac
[ "$ok" = 1 ] && echo "끄기: tools/local-stop.sh"
exit $rc
