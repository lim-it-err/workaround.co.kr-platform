문서 상태: 작성완료

# TKT-182 UX 검수 초안 r1

- 작성: codex-8 · 2026-10-05 KST. **최종 판정은 PM**.
- 범위: 새 출발 문 닫힘/열림, 스플래시 끝 문 열림, 연속 이동·모션 감소·목업 동기화. **[블로커]1(목업 제출 규칙) / [중요]1(읽기 시간) / [제안]0.** 앱의 문 연출 자체는 네 환경에서 확인했으나 아래 두 항목의 정합이 필요하다.
- 검수본: `/private/tmp/codex8-182-dqiwof1r/frontend`, 브랜치 `codex/v0.8.0-live`. [source-sha.json](UX-TKT-182-r1-assets/source-sha.json), 종료 [소스 대조](UX-TKT-182-r1-assets/source-comparison.json) 변경0. 파일:라인은 이 고정본 기준.

## [중요] I1 — 마지막 문구가 정착 후 0.38~0.46초 만에 사라진다

TKT-178은 첫 방문 각 문구≥0.7초를 읽도록 요구했고 직전 UX 검수에서 마지막 문구0.863~0.933초를 관찰했다. TKT-182 완료본에서는 첫 방문 DOORS OPENING이 약4.05~4.14초에 완전히 정착하고 약4.51~4.52초에 제거된다. **네 환경 모두0.7초 미달**이다. 재방문은 이번 표본에서≥1초를 유지했다.

| 환경 | 첫 방문 마지막 정착(초) | 문구 DOM 제거(초) | 마지막 문구 읽기 상한(초) | 재방문 읽기 상한(초) |
|---|---:|---:|---:|---:|
| 375 dark | 4.143 | 4.523 | **0.381** | 1.371 |
| 375 light | 4.051 | 4.511 | **0.460** | 1.372 |
| 1440 dark | 4.118 | 4.520 | **0.402** | 1.368 |
| 1440 light | 4.057 | 4.512 | **0.456** | 1.373 |

일반 난수·실제 시간·새 Chromium 컨텍스트의 rAF 관찰이다. 상/하단 정적 글자 모두 목표 문구, 실행 셀0, 플랩 하위 CSS animation0인 첫 프레임부터 제거까지를 계산했다. 문짝이 먼저 가릴 수도 있어 DOM 제거까지의 값은 실제 읽기 구간의 **상한**이다. 그 상한조차0.7초 미달이다. 최초 DOM 관찰이 원점이므로 앱 타이머 시작과 프레임 오차가 있다. 첫 두 문구는0.784~0.919초를 유지한다.

- 원인 근거: `frontend/src/App.vue:2610` scheduleSplashTransition이 총시간에서 문 열림500ms를 빼고, `:2572`에서 문을 닫힌 상태로 생성하며 스플래시를 홈으로 바꾼다. `frontend/src/styles.css:263`은 이때 기존 fade를 제거한다.
- 테스트의 빈틈: `frontend/src/splashTone.e2e.mjs:177` measureFirstVisitReadTimes는 마지막 문구 종료를 여전히5000ms로 계산한다. 화면은4500ms 무렵 사라지는데 계산에500ms가 더 포함돼0.7초 단언이 통과한다. 재방문 계산도 실제 문구 제거 대신 총시간을 사용한다. **기존14/14 통과가 읽기 시간 보존의 근거는 아니다.**
- 이미지: [375 dark 마지막 문구](UX-TKT-182-r1-assets/375-dark-first-settled-3.png)→[문 열림 시작](UX-TKT-182-r1-assets/375-dark-first-door-opening.png), [375 light](UX-TKT-182-r1-assets/375-light-first-settled-3.png), [1440 dark](UX-TKT-182-r1-assets/1440-dark-first-settled-3.png), [1440 light](UX-TKT-182-r1-assets/1440-light-first-settled-3.png). 정지 이미지에 시간 의미를 부여하지 않고 [wall-clock.json](UX-TKT-182-r1-assets/wall-clock.json)과 함께 본다.
- **[디자이너 의견/반박]** 총5초 안에 문 열림을 넣으면서 문구 읽기 시간을 단순 차감하는 방식은 앞선 읽기 계약을 해친다. 마지막 문구를 더 일찍 완성하거나 문구를 문 열림 중에도 유지하는 설계를 검토하고, PM이 시간 우선순위를 확정해야 한다. 재방문의 정착 지연/안전 타이머 경로도 ‘문이 가리기 전≥1초’로 검증해야 한다. 구현·시간 스펙을 디자이너가 직접 바꾸지 않았다.

## [블로커] B1 — 목업에 JavaScript가 들어가 ‘스크립트0’ 제출 조건을 위반한다

`frontend/public/mockups/splash.html:101`~105에 script가 추가되어 setTimeout·requestAnimationFrame으로 문 상태를 바꾸고 링크 클릭을 가로채 location.href로 이동한다. 실렌더 DOM에도 script1개를 확인했다([routes.json](UX-TKT-182-r1-assets/routes.json)의 mockup.scripts). 사용자 U-30 및 루트 `.agents/codex-designer.md`의 목업 규칙은 순수 HTML+CSS·스크립트0이다. 앱 JavaScript를 금지하는 지적이 아니라 **목업 제출 조건에 한정한 블로커 초안**이다.

- 근거 화면: [목업 초기](UX-TKT-182-r1-assets/mockup-375-initial.png), [링크 클릭 뒤 문 닫힘](UX-TKT-182-r1-assets/mockup-375-closing.png). 캡처만으로 script 유무를 판단하지 않고 위 원문·DOM계수와 대조했다.
- **[디자이너 의견]** CSS keyframes·:target으로 단계별 연출을 보여주고 별도 일반 링크로 이동하도록 정리할 수 있다. JavaScript 목업이 반드시 필요하면 PM이 먼저 사용자 규칙과 충돌을 해소해야 한다. 이번 검수에서는 제작자의 목업을 수정하지 않았다.

## 문 전환 실렌더·회귀 관찰

단색 불투명 문짝2장·노선색 중앙선·상단 DOORS CLOSING을 확인했다. 375/1440 양테마에서 닫힘 중 중앙 틈→완전 닫힘→목적 화면 노출 순서가 성립한다. 문짝 면은 PO가 요청한 연출용 그림으로 보고 정보 카드 위반으로 세지 않았다.

| 환경 | 닫힘 중 | 닫힘 | 열림 |
|---|---|---|---|
| 375 dark | [캡처](UX-TKT-182-r1-assets/375-dark-route-closing.png) | [캡처](UX-TKT-182-r1-assets/375-dark-route-closed.png) | [캡처](UX-TKT-182-r1-assets/375-dark-route-opening.png) |
| 375 light | [캡처](UX-TKT-182-r1-assets/375-light-route-closing.png) | [캡처](UX-TKT-182-r1-assets/375-light-route-closed.png) | [캡처](UX-TKT-182-r1-assets/375-light-route-opening.png) |
| 1440 dark | [캡처](UX-TKT-182-r1-assets/1440-dark-route-closing.png) | [캡처](UX-TKT-182-r1-assets/1440-dark-route-closed.png) | [캡처](UX-TKT-182-r1-assets/1440-dark-route-opening.png) |
| 1440 light | [캡처](UX-TKT-182-r1-assets/1440-light-route-closing.png) | [캡처](UX-TKT-182-r1-assets/1440-light-route-closed.png) | [캡처](UX-TKT-182-r1-assets/1440-light-route-opening.png) |

- 실제 시간: 첫 이동0.981~0.986초, 이후0.598~0.608초. 첫 프레임 관찰 기준이며 정확한1000/600ms 예약은 가상 시계 테스트와 구분한다. 375 dark10회, 나머지환경2회씩 총16회에서 maxPanels2·넘침0·완료 시 새 제목 포커스 확인. [routes.json](UX-TKT-182-r1-assets/routes.json).
- 네 환경 모두 reduced-motion 전환은 문짝0·목적 제목 포커스 확인. 기존 E2E는 본문 스크롤 복원도 검증한다. 스크린리더의 실제 안내 청취는 미검증이다.
- 구현 근거: `App.vue:2467` 스크롤 저장/복원, `:2516` 제목 포커스, `:2522` 단일 상태 머신, `styles.css:197` 오버레이 pointer-events:none, `:208` 문짝, `:242` 문구, `:259` 라이트 표면.

## 고정 UX 체크리스트

| 기준 | 이번 범위 |
|---|---|
| 주인공1개·3초 내 | 문 전환은 약1초 이내 끝나 목적 화면을 노출. 스플래시 마지막 문구는 I1. |
| 면은 조작부에만 | 새 정보 카드 없음, 문짝은 사용자 요청 연출. |
| 영어 간판0 | DOORS CLOSING/OPENING은 명시적으로 승인한 연출 문구. |
| 노선색은 선·배지 | 문 중앙 hairline·문구 외곽선, 표면은 중립색. |
| 375 overflow0·터치≥40px | 스플래시8회·역 이동16회 overflow0. 재생97.39×53.81px, 전환 자체 새 조작부 없음. 다른 화면 버튼 전수 재검수는 아님. |
| 카피·목업 정합 | 앱은 지정 문구 표시. 목업 제출 조건 B1. |
| 지하철 배지·스플래시 시간 | 심볼 유지. 최신178의5초/2.5초 총길이는 E2E 확인, 읽기 시간은 별도 I1. |
| 라이트 테마 | 네 환경 중 라이트2환경의 문3단계 직접 확인. |

## 검증·인계

- 격리 Pages build55 modules 성공. splash10+staticRouting4 = **14/14 통과**,33.43초. 실제 시간 계측은 기존 테스트와 별도로 실행했다.
- **58캡처**: 스플래시40·역 전환16·목업2. [splash.cjs](UX-TKT-182-r1-assets/splash.cjs)·[routes.cjs](UX-TKT-182-r1-assets/routes.cjs)는 스냅샷 루트에서 frontend/dist를 제공한다. 일반 난수·새 로컬 저장소만 사용, 실제 사용자 데이터 사용 없음. 각 실행 pageerror0, 서버·브라우저 종료.
- 앱·목업·티켓·보드·스펙·원칙 수정 및 commit/push 없음. PM 수신함/history 인계. 실제Safari·VoiceOver·저사양 실기기 미검증.
- 미검수179·172·176이 남아 기존 heartbeat를 임시1분으로 변경했다. 한 실행 한 작업으로 다음 실행179부터 확인하며176은 제품 화면 변경이 없는 테스트 전용 티켓인지 원문 확인 후 범위를 정한다. 큐 소진 뒤1h/24h 적응형 복귀.
