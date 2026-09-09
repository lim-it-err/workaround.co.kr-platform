# REV-TKT-096-r1-draft — GitHub Pages 여행·글쓰기 우선 공개 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-09-09. **이 문서는 초안이다 — finished 전환·커밋·push는 PM 몫.**
> 대상: `.github/workflows/deploy-github-pages.yml`, `infra/public-site/prepare-github-pages.mjs`. `inbox/reviewer.md`가 이 티켓을 "need_review"로 지시했으나, **티켓 파일 자체의 메타데이터는 `blocked`** — 아래 "인박스-티켓 상태 불일치" 참고.

## 요약 권고: **로컬 구현·검증 전부 재확인 통과. 그러나 완료 기준(실 URL 200)은 여전히 미충족 — `blocked` 유지가 정확함**

이 티켓의 진짜 남은 문제를 codex-2가 보고한 시점보다 더 정확히 짚었다: PM이 이미 블로커 수정 커밋(`f8963a1`, "Pages 트리거 트렁크 보정")을 로컬에 만들었지만 **그 커밋이 아직 origin에 push되지 않았다** — 그래서 GitHub Actions에는 새 워크플로 자체가 존재하지 않는다.

## 인박스-티켓 상태 불일치 (먼저 밝힐 것)

`inbox/reviewer.md`는 이 티켓을 "P0 need_review"로 지시했다. 그런데 `TKT-096-infra-github-pages-travel-first.md`를 직접 읽으면 `## 메타데이터`의 "상태" 필드가 명시적으로 `blocked`(+ "PM push·Pages 활성화·FE 0338 통합 대기")다. 문서 최상단의 "(PM 추인 2026-09-09 — 대리 발행 초안을 정식 승격)"는 **티켓 번호 승격**(초안→TKT-096)을 가리키는 것으로 보이고, **완료 상태 자체가 need_review로 바뀐 것은 아니다** — "작업자 전달" 섹션과 "질문/결정 기록"의 마지막 3개 `[차단, codex-2, ...]` 항목이 그대로 남아있어 자기 일관적이다. 이 초안은 그 불일치를 지적으로만 남기고, 티켓 상태는 건드리지 않았다(PM 전용).

## 실행 검증 (전부 직접 재실행, codex-2 보고를 그대로 믿지 않음)

| 항목 | codex-2 claim | 재검증 결과 |
|---|---|---|
| `node --check infra/public-site/prepare-github-pages.mjs` | 통과 | ✅ **재확인 통과** |
| workflow YAML parse | 통과 | ✅ **재확인 통과**(`python3 -c "yaml.safe_load(...)"`) |
| `npm run build`(기본 base) | 통과 | ✅ **재확인 통과**(31 modules — TKT-095 이후 모듈 수 증가, 회귀 아님) |
| `npm run build -- --base=/workaround.co.kr-platform/` | 통과 | ✅ **재확인 통과** |
| artifact 준비·경로 검사 | 통과(로컬 참조 2개) | ✅ **재확인 통과**, 직접 산출물을 열어 대조: `index.html`의 JS/CSS 링크가 정확히 `/workaround.co.kr-platform/assets/...`로 프리픽스됨 |
| `404.html === index.html` | 통과 | ✅ **바이트 단위로 재확인**(`diff` 결과 완전 동일) |
| project base 정적 HTTP | 루트/JS/CSS/fallback/deployment.json 전부 200 | ✅ **로컬 정적 서버로 재현**(port 8099, `frontend/dist`를 `/workaround.co.kr-platform/` 경로에 배치): 루트 200·JS 200·CSS 200·`deployment.json` 200. **단, 딥링크(`/blog/...`) 404 동작은 Python `http.server`가 GitHub Pages의 "커스텀 404.html **콘텐츠**를 200처럼 서빙"하는 동작을 재현하지 못해(일반 404만 반환) 이 부분만은 로컬 재현 한계로 남는다 — 결함이 아니라 시뮬레이션 도구의 한계임을 명시.** |
| 비밀값 패턴·`git diff --check` | 통과 | ✅ **재확인**: 워크플로/스크립트 파일에 토큰·API키·비밀번호 패턴 검색 결과 0건 |
| scope 준수 | `frontend/src/**`/`vite.config.js` 무변경 주장 | ✅ **재확인**: `git diff --stat -- frontend/src/ frontend/vite.config.js` 결과 없음 |

## 실제 배포 게이트 — 새로 확인한 정확한 원인

- `git fetch origin` 후 비교: `origin/codex/v0.6.0-line`는 `d7860d7`인데 로컬 HEAD는 그보다 여러 커밋 앞선 `9c08f9c`다. **PM의 "Pages 트리거 트렁크 보정" 커밋(`f8963a1`)이 포함된 구간이 통째로 origin에 없다.**
- `gh run list` 결과 가장 최근 워크플로 실행은 `Release baseline`(2026-07-10) — **Pages 배포 워크플로가 GitHub Actions에서 단 한 번도 돌지 않았다**(당연히, 파일 자체가 origin에 없으므로).
- `curl https://lim-it-err.github.io/workaround.co.kr-platform/` → **HTTP 404**, codex-2가 보고한 상태와 동일.
- 즉 "완료 기준 ①(실 URL 200)"이 안 되는 원인은 코드 문제가 아니라 **push 자체가 아직 없다는 것** — 이건 내 권한 밖이고(git push, GitHub repo Settings의 Pages source 활성화 모두 이 리뷰어 역할의 "절대 금지" 목록 및 이 티켓 자신의 "금지" 목록에 명시된 PM 전용 행위), 리뷰어가 대신 실행하지 않았다.

## 상태 제안 (판정은 PM)

로컬에서 검증 가능한 부분(빌드·아티팩트·경로·비밀값·scope) 전부 블로커 0으로 재확인했다. **완료 기준의 마지막 한 조각(실 배포 200 확인)은 PM이 `codex/v0.6.0-line`을 origin에 push하고 저장소 Settings에서 Pages source를 GitHub Actions로 켠 뒤, workflow 1회 실행 결과로만 닫힌다** — 그 전까지는 `blocked` 유지가 맞고, `need_review`로 조기 전환하면 안 된다. push 이후 재확인은 이 리뷰어가 다음 라운드에 바로 할 수 있다(로컬 파트는 이미 전부 그린).

---

## PM 판정 (2026-09-09) — **리뷰 채택 · blocked 유지**

- 리뷰어의 로컬 재검증 8항목 전부 인정. 남은 완료 기준(실 URL 200)은 코드가 아니라 **push + GitHub Settings(Pages→Source: GitHub Actions)** 문제라는 원인 규명도 정확하다.
- push 는 저장소 규칙상 PO 지시 필요 → PM 이 PO 에게 승인 요청함 (2026-09-09). 승인 즉시 push → workflow 1회 → 리뷰어 재확인(r2)으로 닫는다.
- 인박스 "need_review" 표기는 PM 실수 — 티켓 메타(blocked)가 진실이 맞다. 인박스 정정 완료.
