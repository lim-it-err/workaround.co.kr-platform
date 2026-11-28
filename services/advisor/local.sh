#!/bin/zsh
# Advisor 로컬 모드 — 내 맥에서 백엔드 + 프런트를 한 번에 띄운다 (TKT-237, D-039).
# 용법: ./local.sh [mock|claude|ollama]   (기본 mock)
#       ./local.sh stop   — 다른 터미널·백그라운드로 떠 있는 백엔드·프런트를 내린다 (TKT-241)
#   claude 는 환경 변수 ANTHROPIC_API_KEY 가 필요하다. 키를 묻거나 저장하지 않는다.
#   Ctrl-C 로 백엔드·프런트가 함께 내려간다. 상세 로그: $TMPDIR/advisor-local/*.log
setopt NO_NOTIFY NO_MONITOR 2>/dev/null
root="$(cd "$(dirname "$0")" && pwd)"
profile="${1:-mock}"
pids_dir="$root/.local"   # 기동 때 남기는 pid 파일 (gitignore)

if [[ "$profile" == "stop" ]]; then
  # pid 파일의 pid(자식 포함) + 포트 8080·5173 을 저장소 안 프로세스만 정리한다. 규칙 본체는 tools/local-stop.sh.
  pids=""
  for f in "$pids_dir"/*.pid(N); do pids="$pids $(<"$f")"; done
  "$root/../../tools/local-stop.sh" --no-docker --ports 8080,5173 --pids "$pids"
  rm -f "$pids_dir"/*.pid(N)
  exit 0
fi
case "$profile" in
  mock|claude|ollama) ;;
  *) echo "용법: ./local.sh [mock|claude|ollama|stop]"; exit 1 ;;
esac

if ! /usr/libexec/java_home -v 21 >/dev/null 2>&1; then
  echo "❌ JDK 21 을 찾지 못했습니다. JDK 21 설치 후 다시 실행하세요."
  exit 1
fi
if [[ "$profile" == "claude" && -z "$ANTHROPIC_API_KEY" ]]; then
  echo "❌ claude 리뷰에는 ANTHROPIC_API_KEY 환경 변수가 필요합니다."
  echo "   이 터미널에서 export ANTHROPIC_API_KEY=... 후 다시 실행하세요 (파일에는 저장되지 않습니다)."
  exit 1
fi
if curl -s -m 1 -o /dev/null "http://localhost:8080/health"; then
  echo "❌ 8080 포트가 이미 사용 중입니다. 떠 있는 백엔드를 내린 뒤 다시 실행하세요."
  exit 1
fi

# 프런트를 127.0.0.1 로 열므로 백엔드 CORS 에도 허용 (기본값은 localhost 만)
export ADVISOR_CORS_ALLOWED_ORIGINS="${ADVISOR_CORS_ALLOWED_ORIGINS:-http://127.0.0.1:5173,http://localhost:5173}"

logs="${TMPDIR:-/tmp}/advisor-local"
mkdir -p "$logs"
back_pid=""; front_pid=""

stop_tree() {  # $1=pid — 자식까지 정리
  local pid="$1" child
  [[ -z "$pid" ]] && return
  for child in $(pgrep -P "$pid" 2>/dev/null); do stop_tree "$child"; done
  kill "$pid" 2>/dev/null
}
cleanup() {
  trap - INT TERM EXIT
  stop_tree "$front_pid"
  stop_tree "$back_pid"
  [[ -n "$back_pid$front_pid" ]] && echo "\n■ 로컬 모드를 종료했습니다."
  back_pid=""; front_pid=""
  rm -f "$pids_dir"/backend.pid "$pids_dir"/frontend.pid
  exit 0
}
trap cleanup INT TERM EXIT

(cd "$root/service" && exec ./run.sh start "$profile") >"$logs/backend.log" 2>&1 &
back_pid=$!
mkdir -p "$pids_dir"; echo "$back_pid" >"$pids_dir/backend.pid"

for i in {1..90}; do
  curl -s -m 1 "http://localhost:8080/health" 2>/dev/null | grep -q '"status"' && break
  if ! kill -0 "$back_pid" 2>/dev/null; then
    echo "❌ 백엔드가 종료됐습니다. 로그: $logs/backend.log"; exit 1
  fi
  sleep 1
done
if ! curl -s -m 1 "http://localhost:8080/health" 2>/dev/null | grep -q '"status"'; then
  echo "❌ 백엔드가 90초 안에 뜨지 않았습니다. 로그: $logs/backend.log"; exit 1
fi

(cd "$root/frontend" && exec npm run dev -- --host 127.0.0.1 --port 5173 --strictPort) >"$logs/frontend.log" 2>&1 &
front_pid=$!
echo "$front_pid" >"$pids_dir/frontend.pid"
for i in {1..30}; do
  curl -s -m 1 -o /dev/null "http://127.0.0.1:5173/" && break
  if ! kill -0 "$front_pid" 2>/dev/null; then
    echo "❌ 프런트가 종료됐습니다. 로그: $logs/frontend.log"; exit 1
  fi
  sleep 1
done

echo "열 주소: http://127.0.0.1:5173  (${profile} · 종료 Ctrl-C 또는 ./local.sh stop)"
wait
