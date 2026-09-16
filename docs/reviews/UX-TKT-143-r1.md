# TKT-143 UX 검수 초안 r1

문서 상태: 작성완료

- 작성: codex-8 · 2026-09-15. 최종 판정은 PM.
- 범위: 이전 UX-TONE-FINAL B1 두 목록과 I1 오늘 추천 → 특정 연습 판 → 오늘 복귀. **[블로커] 0 / [중요] 0 / [제안] 0** — 이번 변경 범위에서 신규 발견 없음.
- PM은 검수 중 티켓을 finished로 판정했다. 이 문서는 시작해 둔 디자이너 검수를 보완하는 실렌더 증거이며 PM 판정을 변경하지 않는다.

## 검증한 버전과 방법

앱 원본을 수정하지 않고 임시 스냅샷에서 메인 Pages-base 빌드(49 modules), 메인 root-base 빌드(49 modules), Advisor Pages-base 빌드(110 modules)를 직접 수행했다. Advisor의 기존 500kB 청크 경고가 남는다. 스냅샷 경로는 `UX-TKT-143-r1-assets/snapshot.txt`, 소스별 SHA는 `source-sha.json`에 보존했다.

Chromium으로 375×900 / 1440×900, 다크·라이트 4환경을 실렌더했다. Advisor는 `/workaround.co.kr-platform/advisor/today#offline`, Runtime은 root-base `/runtime`에서 검증했다. Runtime은 Pages 공개 대상이 아니므로 홈 fallback 화면을 Runtime으로 평가하지 않았다. API는 브라우저에서 검증용 응답으로 대체했고 실계정·실서버 데이터는 사용하지 않았다.

독서 추천을 재현하기 위해 브라우저 시각을 2026-08-05 08:00 Europe/Budapest로 고정했다. 입력 조건은 신규 로컬 저장소·10분 세 판·랜덤이다. 모든 환경에서 ‘안티프래질’ → `/games/practice/reading/read-…` → ‘안티프래질’ 제목 일치, `history.state.from='/today'`, ‘← 오늘’ 클릭 후 `/today` 복귀를 확인했다.

초기 실렌더 명령은 자동 승인 검토에서 사용량 한도 초과로 거절되어 실행되지 않았다. 이후 사용량 조회에서 한도 도달 표시가 해제된 것을 확인하고 같은 로컬 검수 실행을 다시 승인받아 완료했다. 거절된 시도의 화면·테스트를 성공 증거로 포함하지 않았다.

## 파일·화면 근거

| 항목 | 파일:라인 | 실렌더 관찰 |
|---|---|---|
| B1-a 기내 추천 | `services/advisor/frontend/src/modules/missions/pages/InflightPage.vue:114`, `:144` | 제목·종류/시간·화살표가 한 행에 정렬된다. 조작부 카드 아래의 읽기 목록에서 채움과 둥근 외곽선이 사라져 위계가 구분된다. |
| B1-b 배포 레일 | `frontend/src/App.vue:4733`, `frontend/src/styles.css:1646`, `:1655` | 01~05 번호와 이름이 세로 hairline 목록으로 이어진다. 값 선택용 pill로 보이지 않고 단계의 순서를 읽을 수 있다. |
| I1 추천 목적지 | `services/advisor/frontend/src/modules/missions/store/missions.js:350`, `:524`, `services/advisor/frontend/src/modules/missions/pages/TodayPage.vue:43`, `:58` | CTA 한 번으로 해당 독서 판이 열려 목록에서 재탐색할 필요가 없다. 시사회 링크의 직접 연결은 소스만 확인했고 실동선은 독서 카드로 검증했다. |
| 출발 문맥 복귀 | `services/advisor/frontend/src/modules/missions/pages/PracticeGamePage.vue:102`, `:189` | ‘← 오늘’ 접근 이름과 실제 복귀 목적지가 일치한다. |

## 측정 결과

| 환경 | 추천 3행 각각 | 배포 5행 각각 | 오늘 CTA | 가로 넘침 / pageerror |
|---|---|---|---|---|
| 375 다크·라이트 | 343×52px | 321×44px | 322×44px | 0 / 0 |
| 1440 다크·라이트 | 760×52px | 373×44px | 170×44px | 0 / 0 |

추천·배포 행 모두 computed 배경 `rgba(0, 0, 0, 0)`, radius `0px`, 상·우·좌 border `0px`, 하단 hairline `1px`. 추천 제목 세 개는 이 조건에서 잘리지 않았고 시간·화살표가 행 바깥으로 밀리지 않았다. 배포 행은 읽기 목록으로 터치 대상이 아니다. CTA 좌표는 추천 영역 캡처 후 스크롤 위치에서 측정했으므로 y값을 첫 화면 배치 판정에 사용하지 않았다.

## 스크린샷

각 행은 오늘 전체 / 추천 확대 / 도착 판 / Runtime 전체 / 배포 단계 확대 순서다. 모든 파일은 실제 Chromium 캡처다.

| 환경 | 근거 |
|---|---|
| 375 다크 | [오늘](UX-TKT-143-r1-assets/375-dark-today.png) · [추천](UX-TKT-143-r1-assets/375-dark-recommendations.png) · [도착](UX-TKT-143-r1-assets/375-dark-destination.png) · [Runtime](UX-TKT-143-r1-assets/375-dark-runtime.png) · [단계](UX-TKT-143-r1-assets/375-dark-steps.png) |
| 375 라이트 | [오늘](UX-TKT-143-r1-assets/375-light-today.png) · [추천](UX-TKT-143-r1-assets/375-light-recommendations.png) · [도착](UX-TKT-143-r1-assets/375-light-destination.png) · [Runtime](UX-TKT-143-r1-assets/375-light-runtime.png) · [단계](UX-TKT-143-r1-assets/375-light-steps.png) |
| 1440 다크 | [오늘](UX-TKT-143-r1-assets/1440-dark-today.png) · [추천](UX-TKT-143-r1-assets/1440-dark-recommendations.png) · [도착](UX-TKT-143-r1-assets/1440-dark-destination.png) · [Runtime](UX-TKT-143-r1-assets/1440-dark-runtime.png) · [단계](UX-TKT-143-r1-assets/1440-dark-steps.png) |
| 1440 라이트 | [오늘](UX-TKT-143-r1-assets/1440-light-today.png) · [추천](UX-TKT-143-r1-assets/1440-light-recommendations.png) · [도착](UX-TKT-143-r1-assets/1440-light-destination.png) · [Runtime](UX-TKT-143-r1-assets/1440-light-runtime.png) · [단계](UX-TKT-143-r1-assets/1440-light-steps.png) |

## 고정 체크리스트

| 기준 | 이번 범위의 확인 |
|---|---|
| 3초 안에 주인공 1개 | 오늘의 추천 제목·CTA, Runtime의 상태 문장이 먼저 읽힌다. 실제 사용자 대상 시간 측정은 하지 않았다. |
| 읽기 면 제거 | 요청된 추천 행·배포 단계 충족. 시간·취향·글자 설정 조작부 면은 유지된다. 전체 연습 화면의 기존 카드 구조는 이번 변경 범위 밖이다. |
| 영어 섹션 간판 0 | 변경 대상 간판 ‘이번 비행 추천’·‘배포 레일’은 한국어. 단계의 기존 UI/docs·tests/CI 등 본문은 간판과 구분했다. |
| 노선색은 선·배지 | 주인공의 세로 룰과 노선 배지가 유지되고 두 목록에 노선색 채움이 추가되지 않았다. |
| 375px overflow 0·터치 ≥40px | 두 검수 화면 overflow 0, 추천 행 52px·오늘 CTA 44px. 화면 전체 조작부의 hit area 전수 감사는 이번에 반복하지 않았다. |
| 목업 문구 | TKT-102 종결 후 앱이 스펙인 PM 방침과 TKT-143 목표 문구 기준. 제목·시간·화살표와 순서·이름 보존. |
| 지하철 배지·스플래시 | 두 앱 배지 유지. 스플래시는 이번 범위 밖이며 TKT-140 검수에서 별도 확인했다. |
| 라이트 테마 | 동일 행 구조·위계·복귀 동작을 라이트에서도 확인했다. |

## 검증 한계와 인계

직접 실행한 집중 검수는 4/4 완료했고 스크린샷 20장·`metrics.json`·`inspect.cjs`를 남겼다. 구현자 전체 E2E/단위 테스트 결과를 이번 디자이너 실행 결과로 재기재하지 않았다. 긴 제목 전수·글자 크기 프리셋 전수·시사회 실제 동선·WebKit·VoiceOver·실 Pages 배포는 미검증이다.

종료 시 스냅샷 대비 원본 변경은 다른 작업자가 수정 중인 `services/advisor/frontend/src/modules/missions/pages/LearnPage.vue` 한 파일뿐이었다. 나머지 추적 소스는 일치하며 이 티켓의 검증 범위는 동일하다(`source-comparison.json`). 앱·목업·티켓·보드 수정 및 commit/push 없음.
