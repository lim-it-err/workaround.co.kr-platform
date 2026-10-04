문서 상태: 작성완료

# TKT-174 UX 검수 r1 — 유로트럭 개발자

- **디자이너 초안: [블로커] 1 · [중요] 3 · [제안] 1. 판정은 PM.**
- 2026-10-05 KST, codex-8. 기준 TKT-174, `design/ets2-live-spec.md` v2 B·D, `services/ets2-adas/API.md`, 톤 원칙 1~6 및 조작부 경계. 새 목업 없이 실화면 검수.
- `codex/v0.8.0-live` 격리 사본 `/private/tmp/codex8-174-1jn9m_ff`. root 개발용·Pages 정적용 각각 build 55 modules. 375×812·1440×900 × 다크/라이트, Chromium, Asia/Seoul. 실제 게임 대신 검수 전용 loopback 스텁(48174)과 합성 단색 프레임 사용. **실제 게임·장비에 명령을 보내지 않았다.**
- [소스 SHA](UX-TKT-174-r1-assets/source-sha.json), [개발 모드 측정](UX-TKT-174-r1-assets/metrics.json), [공개본 측정](UX-TKT-174-r1-assets/public-metrics.json), [슬라이더 보충](UX-TKT-174-r1-assets/slider-metrics.json), 스크린샷 39장. 검수 중 Pantry.vue·Pantry.e2e.mjs와 여행 데이터 east-europe-2026.js가 외부 수정됐으며 TKT-174 화면·CSS는 동일했다.

## [블로커] B1 — 읽기 전용 이벤트까지 채워진 카드로 돌아왔다

`최근 이벤트`는 읽기 전용인데 배경과 사각 테두리가 있다. 좌측 정체 감시·게임 제어·차선 변경도 섹션 전체를 같은 면으로 감싸므로, 375에서는 큰 상자 네 개가 반복된다. 특히 라이트에서 흰 카드가 뚜렷하다. 버튼 자체에 면을 주는 것과 읽기 영역 전체를 카드로 만드는 것은 다르며, 톤 원칙 1의 조작부 경계에 맞지 않는다.

- 파일: `frontend/src/styles.css:4755`가 control-group과 events에 공통 border/background를 적용. 읽기 전용 이벤트는 `frontend/src/components/Ets2Dev.vue:306`.
- 화면: [375 라이트 조작·이벤트 전체](UX-TKT-174-r1-assets/ux-375-light-controls.png), [1440 라이트](UX-TKT-174-r1-assets/ux-1440-light-controls.png).
- **[디자이너 의견]** 섹션은 제목과 hairline으로 구분하고 실제 버튼·입력에만 면을 남겨달라. 최소한 이벤트 읽기 영역의 면 제거는 원칙 정합상 필요하다. 캔버스와 확인 대화상자는 이 지적 대상이 아니다.

## [중요] I1 — 실패 안내가 조작한 화면에서 보이지 않는다

명령 준비 후 ACC 버튼에 검증용 HTTP 409 응답을 주입했다. 버튼 근처에는 변화가 없고 오류 문구는 시뮬레이터와 설정 행을 모두 지난 문서 맨 아래에 나타난다. 시뮬레이터를 펼친 상태에서 375 뷰포트 높이는 812px인데 오류의 top은 약1921px, 1440에서는 높이900px에 오류 top 약1651px이다. 사용자는 실패 사실을 못 보고 같은 명령을 반복할 수 있다. `role=alert`가 있어도 시각적 발견성은 해결되지 않는다.

- 파일: `frontend/src/components/Ets2Dev.vue:195` 실패 message 지정, `:326` 맨 아래 오류 표시.
- 화면: [375 오류 직후 실제 뷰포트](UX-TKT-174-r1-assets/ux-375-dark-rejection-viewport.png), [1440 라이트 오류 직후](UX-TKT-174-r1-assets/ux-1440-light-rejection-viewport.png). 문구·좌표는 metrics.json의 rejection에 보존.
- **[디자이너 의견]** 요청한 버튼 묶음 가까이에 결과를 표시하고 오류 발생 시 화면 안에서 읽히도록 해달라. 명령 요청·성공·실패를 구분할 수 있어야 한다. 이 재현은 모의 거절이며 실제 PoC 거절 문구의 검증은 아니다.

## [중요] I2 — 연결이 끊겼는데 ACC·속도·차선유지 버튼은 계속 활성이다

명령 준비를 마친 뒤 `/api/state` 요청을 끊었다. 상단은 `PoC 서버 없음`, 설명은 `게임 연결 후 명령을 준비할 수 있습니다.`로 바뀌지만 ACC·−5·+5·차선유지 버튼이 활성으로 남는다. 마지막 armed 상태가 화면에 남아 있기 때문이다. 빈 도로 확인에 의존하는 차선 변경은 연결 조건으로 비활성화되므로 같은 화면에서 조작 가능 여부가 일관되지 않다.

- 파일: `frontend/src/components/Ets2Dev.vue:47` armed는 마지막 state 기준, `:52` plusReady에 연결 조건 없음, `:170` 통신 실패에서 serverAvailable만 false, `:285`~`:288` 버튼 상태.
- 화면: [375 연결 끊김 이후 조작부](UX-TKT-174-r1-assets/ux-375-dark-server-lost-controls.png), [1440 라이트](UX-TKT-174-r1-assets/ux-1440-light-server-lost-controls.png). 측정의 serverLost.connection과 controls.disabled가 같은 시점 근거다.
- **[디자이너 의견]** 서버/게임 연결을 잃으면 현재 사용할 수 없는 제어를 비활성화하고 이유를 붙여달라. 중단 버튼은 별도 취급할 수 있다. 실제 서버가 위험 명령을 실행했다는 지적은 아니며, 보이는 조작 가능 상태와 연결 상태의 불일치다.

## [중요] I3 — 신규 소역과 시뮬레이터 슬라이더는 40px 미달

본문 버튼·체크 라벨은 40px 이상이나, 홈 SVG의 개발자 소역은 전체 bbox 높이가 31.75px, 원은 약9.06×9.06px이다. 원과 글자 사이 빈 공간은 hit area가 아니어서 그룹 중앙을 클릭하는 재현은 SVG에 가로막혔고, 글자를 직접 클릭했을 때만 로컬 전용 안내가 나왔다. 시뮬레이터 내부 목표 속도 range의 실제 입력 높이는 16px이다(375·1440 공통). 기본 E2E는 부모 페이지 버튼 높이만 확인해 이 두 영역을 놓친다.

- 파일: `frontend/src/components/JunctionMap.vue:175`~`:190` 소역 circle·text, `frontend/public/ets2-sim/index.html:22` range, `frontend/public/ets2-sim/styles.css:1` input은 accent-color만 지정(생성 파일, 수정 원본은 sync 스크립트 경로 확인 필요).
- 화면: [1440 개발자 소역 클릭 후](UX-TKT-174-r1-assets/public-home-dark.png), [375 슬라이더](UX-TKT-174-r1-assets/ux-375-light-simulator-controls.png). 정확한 크기는 public-metrics.json·metrics.json.
- **[디자이너 의견]** 소역 심볼 외형은 유지하며 클릭 영역을 40px 이상 확보하고, range의 트랙을 담는 입력 영역 높이를 늘려달라. 홈 소역 재배치가 예정된 TKT-179와 함께 처리할지는 PM이 정한다. PoC 복사 원본과 생성 파일의 소유 경계를 확인해 반영해야 한다.

## [제안] S1 — 견인 확인 대화상자에 접근 이름 연결

취소가 먼저 포커스되고 위험 버튼이 별도 색으로 구분되며, 취소 시 recoveryNow 요청은 0건이었다. 다만 dialog에 `aria-labelledby`/`aria-label`이 없어 눈에 보이는 제목과 접근 이름이 연결되지 않는다.

- 파일: `frontend/src/components/Ets2Dev.vue:329` dialog와 `:330` 제목.
- 화면: [375 확인창](UX-TKT-174-r1-assets/ux-375-dark-dialog.png), [1440 라이트](UX-TKT-174-r1-assets/ux-1440-light-dialog.png), metrics.json의 dialog 속성 확인.
- **[디자이너 의견]** 제목 ID와 dialog를 연결해달라. 실제 VoiceOver 낭독 결과를 주장하는 항목은 아니다.

## 검증과 유지할 점

- 기존 개발자 E2E **5/5**, 보충 UX 시나리오 **4/4** 통과. 보충 캡처를 뷰포트 기준으로 조정한 뒤4/4, iframe 입력이 보이는 추가 캡처1/1. 스텁 요청은 state/frame/action 세 API만 사용하며 견인 요청은 실행하지 않았다.
- 준비 전 제어 비활성, 준비 후 활성, 두 확인란 후 차선 변경, 감시 시작·중단 흐름이 정상이다. 명령 스텁은 계약 확인용이며 실제 Windows 입력·만료·복구의 성능/안전 보증은 아니다.
- 개발/공개 375·1440 양테마 가로 overflow0. 정상 첫 화면: [375 다크](UX-TKT-174-r1-assets/ux-375-dark-first.png), [1440 다크](UX-TKT-174-r1-assets/ux-1440-dark-first.png).
- 공개본 직접 진입은 조작부 inert=true, API 요청0, 중앙에 로컬 전용 안내. [375 라이트](UX-TKT-174-r1-assets/public-375-light.png), [1440 라이트](UX-TKT-174-r1-assets/public-1440-light.png). 홈 소역 글자 클릭도 이동 없이 안내를 표시한다. 그룹 중앙 클릭 실패를 정상 진입으로 계산하지 않았다.
- 프레임은 합성 단색 SVG이므로 화면의 단색 영역을 캡처 실패로 분류하지 않는다. 실제 게임 영상의 가독성과 지연은 별도 통합 검증 필요.
- 정적 시뮬레이터 canvas와 조작부 로드, iframe 가로 overflow0. 내부는 독립 다크 테마를 유지하며 부모 라이트를 자동 상속하지 않는다.

## 고정 UX 체크리스트

| 항목 | 관찰 |
|---|---|
| 주인공 1개·3초 | 큰 실시간 프레임이 주인공. 제어는 아래로 이어짐. 본문의 카드 반복은 B1 |
| 면은 조작부만 | **미충족 B1** — 이벤트 읽기 면과 전체 섹션 면 |
| 영어 섹션 간판 0 | 주요 섹션은 한글. ACC·PoC·환경변수는 개발 용어. 이벤트의 `laneChange` 원시 행동명 노출은 차선 변경 문구로 정리 권고(I1 피드백 정리 시 함께 참고) |
| 노선색은 선·배지 | S 배지 유지, 위험 버튼에 경고색. 읽기 카드 면 문제는 별도 |
| 375 overflow·40px | 가로 넘침0, 본문 버튼·확인 라벨40px 이상. **소역·range는 I3** |
| 카피 정합 | 로컬 전용·연결·게이트 이유 유지. 단 연결 단절 버튼 의미는 I2 |
| 배지·스플래시 | S 배지 유지. 새 TKT-178 변경 중인 스플래시는 이번 범위에서 재검증 안 함 |
| 라이트 | 부모 페이지·공개본·대화상자 가독 유지. 라이트에서 B1 카드가 더 두드러짐. iframe은 독립 다크 |

## PM 인계

우선 B1 원칙 정합, I1 오류 가시성, I2 연결 상태 정합, I3 클릭 영역을 검토해달라. 티켓 상태와 판정은 변경하지 않았다. 앱·목업·원칙·스펙 변경 및 commit/push 없음. 테스트 서버·브라우저 종료. 다음 실행은 인박스 우선인 TKT-170 r2(새 need_review)를 확인한다.
