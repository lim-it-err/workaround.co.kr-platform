#!/bin/bash
# 맥 로컬 종료 명령 (TKT-241) — 이 저장소에서 띄운 workaround 로컬 서버를 한 번에 내린다.
# 용법: tools/local-stop.sh [--dry-run]
#   .local/*.pid (local-start.sh 가 남김)도 읽어 같은 규칙으로 내리고 지운다.
#   내부용 옵션(services/advisor/local.sh stop 이 사용): --ports 8080,5173  --pids "123 456"  --no-docker
# 규칙: 포트를 듣는 프로세스 중 명령줄 또는 작업 디렉터리가 이 저장소 경로 안인 것만 내린다.
#       다른 프로젝트의 프로세스는 「건너뜀」으로 남기고 절대 건드리지 않는다.
#       먼저 TERM, 5초 뒤에도 살아 있으면 KILL.
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
PORTS="7000 7001 4173 4174 4175 5173 8080 8003"
DRY=0; DOCKER=1; EXTRA_PIDS=""; INTERNAL=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1 ;;
    --no-docker) DOCKER=0 ;;
    --ports) INTERNAL=1; shift; PORTS="$(echo "$1" | tr ',' ' ')" ;;
    --pids) INTERNAL=1; shift; EXTRA_PIDS="$1" ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "용법: tools/local-stop.sh [--dry-run]"; exit 1 ;;
  esac
  shift
done

in_repo() {  # $1=pid — 명령줄 또는 cwd 가 이 저장소 안이면 0
  local cmd cwd
  cmd="$(ps -o command= -p "$1" 2>/dev/null)"
  case "$cmd" in *"$ROOT/"*|*"$ROOT") return 0 ;; esac
  cwd="$(lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)"
  case "$cwd" in "$ROOT"|"$ROOT"/*) return 0 ;; esac
  return 1
}
short_cmd() { ps -o command= -p "$1" 2>/dev/null | cut -c1-80; }
tree_of() {  # $1=pid — 자손 먼저, 자기 자신 마지막
  local c
  for c in $(pgrep -P "$1" 2>/dev/null); do tree_of "$c"; done
  echo "$1"
}

seen=" "; targets=""; found=0
consider() {  # $1=pid $2=라벨
  case "$seen" in *" $1 "*) return ;; esac
  seen="$seen$1 "
  if in_repo "$1"; then
    found=1; targets="$targets $1"
    if [ "$DRY" = 1 ]; then echo "내릴 대상: $2 pid $1 — $(short_cmd "$1")"
    else echo "내림: $2 pid $1 — $(short_cmd "$1")"; fi
  else
    echo "건너뜀: 다른 프로젝트 $2 pid $1 — $(short_cmd "$1")"
  fi
}

for port in $PORTS; do
  for pid in $(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null); do
    consider "$pid" "포트 $port"
  done
done
# tools/local-start.sh 가 남긴 .local/*.pid (기본 호출일 때만 — local.sh stop 의 내부 호출은 자기 pid 만 쓴다)
PIDFILES=""
if [ "$INTERNAL" = 0 ]; then
  for f in "$ROOT"/.local/*.pid; do
    [ -f "$f" ] || continue
    PIDFILES="$PIDFILES $f"; EXTRA_PIDS="$EXTRA_PIDS $(cat "$f" 2>/dev/null)"
  done
fi
for pid in $EXTRA_PIDS; do
  kill -0 "$pid" 2>/dev/null && consider "$pid" "pid 파일"
done

if [ "$DRY" = 0 ] && [ -n "$targets" ]; then
  all=""
  for pid in $targets; do all="$all $(tree_of "$pid" | tr '\n' ' ')"; done
  kill $all 2>/dev/null
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    alive=""; for pid in $all; do kill -0 "$pid" 2>/dev/null && alive="$alive $pid"; done
    [ -z "$alive" ] && break
    sleep 0.5
  done
  if [ -n "$alive" ]; then
    echo "5초 뒤에도 살아 있어 강제 종료:$alive"
    kill -9 $alive 2>/dev/null
  fi
fi

[ "$DRY" = 0 ] && [ -n "$PIDFILES" ] && rm -f $PIDFILES

# infra/home compose — compose 작업 폴더가 이 저장소의 infra/home 인 컨테이너가 있을 때만
if [ "$DOCKER" = 1 ] && command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  compose_file="$ROOT/infra/home/docker-compose.yml"
  mine=""
  for cid in $(docker ps -q --filter label=com.docker.compose.project=home-web 2>/dev/null); do
    wd="$(docker inspect -f '{{ index .Config.Labels "com.docker.compose.project.working_dir" }}' "$cid" 2>/dev/null)"
    [ "$wd" = "$ROOT/infra/home" ] && mine="$mine $cid"
  done
  if [ -n "$mine" ]; then
    found=1
    if [ "$DRY" = 1 ]; then echo "내릴 대상: infra/home compose (home-web)"
    else
      echo "내림: infra/home compose (home-web)"
      docker compose -f "$compose_file" --profile '*' down >/dev/null 2>&1 \
        || docker compose -f "$compose_file" down >/dev/null 2>&1 \
        || echo "경고: docker compose down 실패"
    fi
  fi
fi

[ "$found" = 0 ] && echo "떠 있는 것 없음"
exit 0
