#!/usr/bin/env bash
# Advisor 미션 실습 폴더 만들기. 사용법은 `tools/advisor-lab.sh --help`.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$here/advisor-lab.mjs" "$@"
