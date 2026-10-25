문서 상태: 작성완료

# TKT-179 홈 수직 지선 UX 검수 r1

- 검수: codex-8, 2026-10-05. 대상: need_review 구현 r1·home 목업 r17, `codex/v0.8.0-live`.
- **초안: [블로커] 0 / [중요] 2 / [제안] 0. 최종 판정·좌표 변경 결정은 PM.**
- 수직 지선·모바일 목록 대체는 작동한다. 다만 데스크톱의 유로트럭 라벨이 기존 대각선/역 점과 겹치고, 라벨 끝을 클릭하면 엘리베이터 안내가 나온다. 작은 역 조작 영역도 40px에 못 미친다.

## 검증 범위와 증거

원본을 수정하지 않고 격리 복사한 frontend를 Pages base로 빌드했다. Chromium, 375×812 / 1440×900 × dark/light, Asia/Seoul, ko-KR, reduced-motion. 일반 화면은 DPR1, 지선 상세와 목업 보완 캡처는 DPR2다. 확대 그림을 위해 앱 CSS나 좌표를 바꾸지 않았다. 실제 게임·백엔드·외부 계정에 접속하지 않았다.

- 빌드: Vite6.4.3, 55 modules 성공. `index-C4R7SQFc.css`, `index-BnB9SYr8.js`.
- 기본 `JunctionMap.e2e.mjs`: **4/4**, 12.56초. 검수 보충: 4환경 클릭·키보드 진입, 데스크톱 양테마 클릭 오인 2/2 재현. 전체 28캡처.
- 모든 환경 가로 넘침0, 글자 bbox 상호 겹침0, pageerror0. 새 지선 좌표·본선과 같은 stroke·375 숨김은 기본 E2E와 실렌더로 확인했다. 글자끼리 겹침0은 **역 점/노선과 글자 겹침0을 의미하지 않는다**.
- [소스 SHA](UX-TKT-179-r1-assets/source-sha.json), [종료 시 원본 비교: 변경0](UX-TKT-179-r1-assets/source-comparison.json), [화면·조작 측정](UX-TKT-179-r1-assets/metrics.json), [히트 영역](UX-TKT-179-r1-assets/geometry.json), [경로 교차·목업 보완](UX-TKT-179-r1-assets/supplement.json), [오인 클릭 재현](UX-TKT-179-r1-assets/label-hit.json).
- `metrics.json`의 mockup.banner=null은 초기 캡처 스크립트가 잘못된 `.mockup-banner` 선택자를 사용한 결과다. 실제 배너 존재·테마·스크립트 수는 `supplement.json`과 덮어쓴 최종 목업 캡처가 기준이다. 제품 결함으로 세지 않았다.
- 재현 스크립트: assets의 `review.cjs`, `geometry.cjs`, `supplement.cjs`, `label-hit.cjs`. `source-sha.json`의 snapshot 디렉터리에 있는 frontend/dist를 기준으로 실행한다. Playwright는 번들 NODE_PATH를 사용한다.

| 환경 | 전체 화면 | 지선/소역 | 공개 진입·개발자 안내 |
|---|---|---|---|
| 375 dark | [홈](UX-TKT-179-r1-assets/375-dark-home.png) | 숨김, 목록 순서 유지 | 클릭/Enter 성공, [토스트](UX-TKT-179-r1-assets/375-dark-dev-toast.png) |
| 375 light | [홈](UX-TKT-179-r1-assets/375-light-home.png) | 숨김, 목록 순서 유지 | 클릭/Enter 성공, [토스트](UX-TKT-179-r1-assets/375-light-dev-toast.png) |
| 1440 dark | [홈](UX-TKT-179-r1-assets/1440-dark-home.png) | 수직 분기 표시 | 점 클릭/Enter 성공, 라벨 끝은 I1 |
| 1440 light | [홈](UX-TKT-179-r1-assets/1440-light-home.png) | 수직 분기 표시 | 점 클릭/Enter 성공, 라벨 끝은 I1 |

## [중요] I1 — 라벨을 가로지르는 본선과 역 점이 잘못된 목적지를 선택하게 한다

**보이는 현상:** 유로트럭 라벨의 마지막 부분 위에 엘리베이터 소역 점이 올라온다. 개발자 라벨 후반에는 본선이 비친다. 수직선의 역명인지 대각선의 역명인지 읽기 어렵고, 실제로 유로트럭 라벨 내부를 눌렀는데 다른 역이 반응한다.

1440 양테마에서 유로트럭 글자 bbox는 x580.62~621.49, y266.36~281.36이다. 내부 좌표 **(620.08,270.19)**의 최상위 클릭 대상은 `엘리베이터`다. 이 점을 마우스로 누르면 `/ets2`로 이동하지 않고 홈에서 **“서버 시뮬 · 정적 공개본에서는 준비 중”** 토스트가 나온다. 의도한 수직선의 작은 원을 클릭하면 `/ets2`로 정상 이동하므로 전체 링크 불능은 아니다.

- 원인 위치: `frontend/src/data/lines.js:101`~105의 두 새 라벨과 기존 대각 소역 좌표, `frontend/src/components/JunctionMap.vue:174`~193의 렌더 순서와 클릭 그룹. 뒤에 그려지는 엘리베이터 원이 앞 라벨의 일부를 덮는다.
- halo 위치: `JunctionMap.vue:280`~284. `frontend/src/styles.css:3528`·3539의 그룹 opacity(다크0.55/라이트0.8)가 개발자 라벨의 배경색 테두리에도 적용되어 선을 완전히 가리지 못한다.
- 기본 E2E `JunctionMap.e2e.mjs:276`·291은 5px halo가 있으면 노선/글자 교차 검사에서 해당 글자를 전부 제외한다. 역 점/다른 역명 교차나 클릭 소유권은 이 검사에 없다. 따라서 기존 그린 결과가 이 문제를 부정하지 않는다.
- 근거: [다크 상세](UX-TKT-179-r1-assets/1440-dark-spur-detail.png), [라이트 상세](UX-TKT-179-r1-assets/1440-light-spur-detail.png), [잘못된 안내](UX-TKT-179-r1-assets/1440-dark-label-misdirection.png), [라이트 재현](UX-TKT-179-r1-assets/1440-light-label-misdirection.png).

**[디자이너 의견]** 구현자의 좌표 충돌 `[반박]`은 타당하다. 그러나 halo만으로 충돌을 해소했다는 결론에는 동의하기 어렵다. 수직 분기 의도는 유지하면서 라벨을 지선 왼쪽 등 본선·역 점과 충돌하지 않는 위치에 두는 좌표 재합의를 PM에게 요청한다. 선택한 배치에서 라벨 전체와 주변 여백의 클릭이 같은 목적지를 가리켜야 한다. halo 전면 면제 대신 노선/다른 역 점/글자와 클릭 소유권을 함께 검증하는 것이 좋다. 좌표는 검수자가 임의로 바꾸지 않았다.

## [중요] I2 — 수직 지선의 작은 역 클릭 영역 높이 15px

1440 양테마에서 유로트럭 그룹 bbox는 **55.13×15px**, 개발자 그룹은 **88.88×15px**, 보이는 원은 **7.09×7.09px**다. 그룹 bbox 전체가 클릭 면인 것도 아니며 실제 SVG 원과 글자 외의 빈 곳에는 확장된 hit 영역이 없다. 원 중심에서 12px 아래는 해당 작은 역의 클릭 대상이 아니다. 40px 하한에 미달한다.

- 위치: `JunctionMap.vue:185`~193은 키보드 role/tabindex는 제공하지만 원 r4.5와 글자만 렌더한다. 큰 역용 투명 hit 원(`:275`)은 소역에는 없다. `JunctionMap.e2e.mjs:306`~327의 크기 검사는 목록 및 큰 역 8개만 대상으로 한다.
- 근거: [실측 JSON](UX-TKT-179-r1-assets/geometry.json), [다크 지도](UX-TKT-179-r1-assets/1440-dark-geometry.png), [라이트 지도](UX-TKT-179-r1-assets/1440-light-geometry.png), [키보드 포커스](UX-TKT-179-r1-assets/1440-dark-dev-focus.png).
- 모바일 목록은 유로트럭55.41×40px / 개발자92.91×40px로 정상이다. 개발자 항목 Enter는 로컬 전용 안내, 공개 항목 Enter는 `/ets2`로 이동했다.
- TKT-174 UX I3에서 지적한 작은 역 공통 문제의 잔존이다. 이번에는 새 수직 배치의 두 역을 다시 측정한 값이며, 별개의 신규 원인으로 중복 집계할 필요는 없다. PM은 174/179 중 담당 범위를 정하면 된다. 두 역 간 세로 간격도 화면 약31.5px이므로, 단순 원 확대가 이웃 역을 가리지 않게 I1 배치와 함께 조정해야 한다.

## 체크리스트 자기 적용

| 항목 | 확인 |
|---|---|
| 3초 안 주인공 1개 | 홈은 노선도가 가장 큰 시각 요소. 데스크톱 지도 좌/목록 우, 모바일 지도 다음 목록. 인지 시간 사용자 실험은 아님. |
| 면은 조작부에만 | 이번 분기 변경으로 새 읽기 카드/통계 타일을 만들지 않음. |
| 영어 섹션 간판0 | 실앱 노선 그룹 제목 한글. Advisor·Work 등의 고유 서비스명은 구분. |
| 노선색 선·배지 | 본선·지선과 역 점에 사용. 새 배경 면 없음. |
| 375 overflow0·40px | overflow0, 새 목록 링크 높이40. 데스크톱 소역은 I2. |
| 목업 카피·기하 | r17의 지선 및 두 새 역명·목록 순서 일치. 목업의 기존 취향/영어 부제 등은 실앱과 다르므로 r17을 전체 홈의 새 스펙으로 해석하지 않음. |
| 지하철 배지·스플래시 | 기존 C/S 배지 유지. 스플래시 무변경; 현행 시간은178/182 개별 검수 결과를 따르고 옛10초 문구를 이 티켓에 재적용하지 않음. |
| 라이트 테마 | 모바일 목록 유지, I1/I2는 양테마 공통. |
| 목업 전달 조건 | home.html script0·외부 리소스 의존0·MOCKUP 배너. [375 light](UX-TKT-179-r1-assets/375-light-mockup.png), [1440 dark](UX-TKT-179-r1-assets/1440-dark-mockup.png). |

## 인계

PM에게 I1 좌표·클릭 충돌 조정과 I2 공통 hit 영역 담당 결정을 요청한다. 앱·목업·원칙·스펙·보드 변경이나 commit/push는 하지 않았다. 티켓 질문에는 기존 `[반박]`에 대한 UX 의견만 남긴다. 실제 VoiceOver·Safari·게임 장비 검증은 이번 범위가 아니다. 다음 미검수는172, 이어서 제품 코드 변경0인176의 검수 범위 확인이다.
