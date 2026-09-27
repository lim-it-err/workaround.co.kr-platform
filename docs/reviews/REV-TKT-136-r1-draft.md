문서 상태: 작성완료

# REV-TKT-136-r1-draft — 홈 노선도: 세 노선이 환승 홀을 직선으로 통과 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-09-14. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: TKT-136(목업 r16, PO "노선이 직선으로 통과하게끔" 정정 반영). scope 범위 4개 파일만 수정됨(공유 파일 충돌 없음).

## 요약 권고: **통과 (블로커 0, 중요 0)**

8지선 방사형을 노선 3개(기록선·기지선·실험선)가 환승 홀(360,360)을 직선으로 관통하는 구조로 정확히 교체했다. 목업 r16(`frontend/public/mockups/home.html`)의 SVG path 좌표를 직접 grep 대조했고 티켓 표의 좌표와 완전히 일치한다. 게이트 재실행과 375/1440×다크/라이트 실화면 확인 모두 통과.

## 실행 검증

- `pwd` 확인 후 `/Users/imjeonghan/newProject/workaround.co.kr-platform/frontend`에서 실행.
- `git diff --stat` — 이 티켓 scope로 명시된 4개 파일만 변경(`lines.js` 56줄, `JunctionMap.vue` 60줄, `JunctionMap.e2e.mjs` 79줄, `junction.test.mjs` 43줄) — App.vue·styles.css 등 공유 파일 재수정 없음(TKT-119 때와 달리 이번은 충돌 없음).
- 목업 좌표 대조: `grep -n "M90 360\|M225.6\|M360 360\|viewBox" frontend/public/mockups/home.html` → `viewBox 0 0 720 720`, `M90 360 L630 360`(기록선), `M225.6 225.6 L494.4 494.4`(기지선), `M360 360 L607.5 112.5` 실선 + `M360 360 L204.4 515.6` 점선(실험선) — 티켓 표와 1:1 일치.
- `node --test src/data/junction.test.mjs` — **4/4 통과**, 신규 "세 노선은 환승 홀을 직선으로 통과하고 소속 역이 같은 선 위에 놓인다"(점-직선 거리 검사) 포함.
- 프런트 unit 전체(`staticRouting`·`staticWritingState`·`junction`·`voyageCollection`·`voyageCoverage`·`voyageStorage`·`taxiDispatch`·`voyageRoute`) — **21/21 통과**(직전 TKT-119 기준 20/20 + 이번 신규 1건, 정확히 부합).
- `npm run build`(기본) — **49 modules**. `npx vite build --base=/workaround.co.kr-platform/`(Pages-base) — **49 modules**. 둘 다 통과, 티켓 claim과 일치.
- `NODE_PATH=.../node_modules node --test src/components/JunctionMap.e2e.mjs`(Pages-base dist 대상 — 이 파일은 소스에 `publicBase='/workaround.co.kr-platform/'`를 직접 선언하므로 base 빌드 필수) — **4/4 통과**(375/1440 × dark/light).
- **실화면 직접 확인**(`npm run dev`, 세션 공유 포트 7010 충돌 회피를 위해 `.claude/launch.json`에 `workaround-frontend-reviewer`(포트 7099) 항목 추가 후 그 서버로 확인 — 기존 두 항목은 건드리지 않음):
  - 375px dark / 375px light / 1440px light(2단 레이아웃: 약도 좌·목록 우, 원칙 §6 준수) 스크린샷 직접 육안 확인.
  - 세 노선이 허브 링을 관통하는 직선으로 렌더링됨(기록선 수평, 기지선 NW-SE, 실험선 NE 실선+SW 점선) — 목업 r16 형태와 일치.
  - 모바일에서 작은 역(스튜디오·아카이브·격납고·엘리베이터·택시·화이트채플·실행 상태·작업 흐름·코스·미션) 라벨이 지도에서 숨겨지고 큰 역만 남음 — 완료 조건 "모바일 작은 역 숨김" 규칙 실제 렌더로 확인.
  - 라벨 겹침 육안으로 확인되지 않음, 다크/라이트 모두 판독 가능.

## 완료 조건 대조

1. **점-직선 거리 < 0.5, 3노선 모두 (360,360) 통과** — `junction.test.mjs` 신규 테스트로 코드 레벨 확인. ✓
2. **375·1440×다크/라이트 렌더 겹침 0** — `JunctionMap.e2e.mjs` 4/4(자동 bbox 검사) + 실화면 3콤보 육안 확인. ✓
3. **서브링크·딥링크·대표진입·aria(119) 회귀** — E2E에 포함되어 통과, `lines.js`의 `textColorToken`(예: 기지선 `line-w-text`) 필드는 이번 diff에서 좌표만 바뀌고 유지됨을 직접 확인(라이트 테마 W 계열 대비 회귀 아님).
4. **JunctionMap E2E 갱신, build 그린** — 위 실행 검증대로 확인. ✓

## [제안] 사소한 관찰

- `.claude/launch.json`에 리뷰어 전용 포트(7099) 항목을 추가했습니다 — 세션 간 포트 7010 공유 서버와 충돌 방지 목적이며 기존 두 항목(`workaround-frontend`·`advisor-frontend`)은 변경하지 않았습니다. 필요 없어지면 정리해도 됩니다.

## 상태 제안 (판정은 PM)

블로커 0. 목업 좌표 일치, 게이트 전부 그린, 실화면 3콤보 육안 확인까지 마쳤다. **finished 전환 권장.**
