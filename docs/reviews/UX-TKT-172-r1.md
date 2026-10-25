문서 상태: 작성완료

# TKT-172 도착 여행 결산 UX 검수 r1

- 검수: codex-8, 2026-10-05. 대상: need_review r1, `codex/v0.8.0-live`.
- **초안: [블로커] 0 / [중요] 1 / [제안] 0. 최종 판정은 PM.** 중요 의견은 결산 렌더 결함이 아니라 PM 콘텐츠 상태 전환의 인계 누락이다.
- arrived 조건에서 총액·사전/현지·카테고리·지역·제외 항목의 표시와 읽기 흐름은 성립한다. 현재 원본 상태에서는 ‘운행 종료’가 보여도 결산 절에 진입할 수 없어, 이 구현을 사용자에게 노출하는 시점/방법의 확인이 필요하다.

## 검증 기준

원본 frontend를 격리 복사해 Pages base 빌드 후 Chromium으로 검수했다. 375×812 / 1440×900 × dark/light, Asia/Seoul, ko-KR, reduced-motion. 원본과 로컬 arrived fixture를 구분했다. 보충 검수 시각은 `2026-10-05T02:30:00+09:00`으로 고정했다.

**arrived fixture:** 기존 `VoyageSettlement.e2e.mjs:58`~60과 동일하게 로컬 정적 서버가 JS 응답의 첫 `status:"boarding"`만 `status:"arrived"`로 바꾼다. 디스크의 제품/콘텐츠 파일은 바꾸지 않았다. 금액·문구는 티켓이 지정한 저장소 내 정적 콘텐츠를 사용했다. 실계정·실서버·영수증 원문을 가져오지 않았고 API 호출0이었다. 이 fixture 결과를 원본 공개 경로의 정상 노출로 간주하지 않았다.

- Pages 빌드: Vite6.4.3, **55 modules 성공**. CSS `index-C4R7SQFc.css`, JS `index-BnB9SYr8.js`.
- `VoyageSettlement.e2e.mjs` 1/1(내부4환경), `VoyageRouteMap.e2e.mjs` 4/4, **합계5/5**, 4.26초. 기존 노선도 키보드 일차 선택·정차역 상세 회귀 포함.
- 4환경 보충: 원본 미노출과 arrived 노출 비교, 총액/제외 항목 스크롤, 투명 표면, 표시값 합계 확인. **28캡처**, 가로 넘침0, pageerror0, API0.
- [소스 SHA·격리 경로](UX-TKT-172-r1-assets/source-sha.json), [종료 원본 비교: 변경0](UX-TKT-172-r1-assets/source-comparison.json), [화면/조작 원자료](UX-TKT-172-r1-assets/metrics.json), [스크롤 보완·표시 금액](UX-TKT-172-r1-assets/supplement.json).
- 재현: assets의 `review.cjs`, `supplement.cjs`를 manifest의 snapshot 디렉터리에서 실행한다(frontend/dist와 번들 Playwright 필요). 초기 스크립트의 `.page-scroller.scrollTop`은 실제 문서 스크롤을 옮기지 못했다. `supplement.cjs`에서 실제 요소로 스크롤해 `original-end`·`total-viewport` 캡처를 교체했다. 제품 오류로 세지 않았다.

## [중요] I1 — 실제 콘텐츠는 boarding이라 ‘운행 종료’ 화면에서 결산을 볼 수 없다

원본 `/voyage`를 새 컨텍스트에서 열면 ‘중부유럽 순환선’의 **운행 종료 · 9월18일 · 인천**, 지출777만원이 보인다. 아래로 내려가도 기록 편집부에서 끝나며 `.route-settlement`는 **4환경 모두0개**다. 사용자에게 노선 운행은 끝난 것으로 안내하면서 영수증 결산은 감춰진 상태다.

- `frontend/src/data/voyages/east-europe-2026.js:13`: 여전히 `status:'boarding'`. 같은 파일`:471`에 결산 데이터는 있다.
- `frontend/src/components/voyage/VoyageRouteMap.vue:115`~118: 결산은 명시적 `status==='arrived'`일 때만 노출. 반면`:122`~125의 ‘운행 종료’는 날짜로 판별한다.
- `frontend/src/components/VoyageView.vue:10`~13: boarding 여행을 현재 여행으로 선택한다. 날짜가 지났다고 콘텐츠 상태가 자동으로 바뀌지는 않는다.
- `frontend/src/components/voyage/voyageRoute.js:277`~282: 지출 게이지는 상태와 무관하게 결산 grandTotal을 사용하므로 이미777만원인데 세부 결산만 없는 조합이 된다.
- `frontend/src/components/VoyageSettlement.e2e.mjs:58`~60의 응답 치환 후에만 새 결산이 노출된다. 테스트 그린은 arrived 조건부 UI 검증이며 현재 데이터의 사용자 진입 검증을 대신하지 않는다.

근거: [375 원본 첫 화면](UX-TKT-172-r1-assets/375-dark-original-start.png), [375 원본 마지막 기록](UX-TKT-172-r1-assets/375-dark-original-end.png), [1440 라이트 원본 끝](UX-TKT-172-r1-assets/1440-light-original-end.png), [arrived 전환 뒤 결산](UX-TKT-172-r1-assets/375-light-total-viewport.png).

**[디자이너 의견]** 티켓의 arrived 조건은 구현되어 있고 콘텐츠 파일은 PM 전담이므로, 구현자가 임의로 날짜 조건으로 우회하도록 요청하지 않는다. PM이 이 여행의 종료 상태를 확정해 콘텐츠를 arrived로 전환할지, 아직 결산 공개를 보류할지 명시해 주면 된다. 공개를 의도했다면 실제 데이터 경로에서 결산 도달까지 확인하는 인계가 필요하다. 검수자는 상태·콘텐츠·스펙을 변경하지 않았다.

## arrived 조건에서 확인한 UX

| 환경 | 결산 실렌더 | 배치/가독성 |
|---|---|---|
| 375 dark | [전체 절](UX-TKT-172-r1-assets/375-dark-settlement.png) | 총액24px, 표1열, 금액/단위 한 줄, 제외 항목 줄바꿈 정상 |
| 375 light | [전체 절](UX-TKT-172-r1-assets/375-light-settlement.png) | 같은 위계, 표/배경 분리 성립 |
| 1440 dark | [전체 절](UX-TKT-172-r1-assets/1440-dark-settlement.png) | 총액36px, 카테고리/지역2열, 굵은 합계 |
| 1440 light | [전체 절](UX-TKT-172-r1-assets/1440-light-settlement.png) | 같은2열, 숫자 우측 정렬, 가로 넘침0 |

- 주인공은 총액777.1만원, 보조값은 1인388.6만원. 사전 확정650.0 + 현지127.1 = 표시 총액777.1. 1인 금액은 소수1자리 반올림이다.
- 카테고리7행과 지역3행 모두 **현지 지출**임을 caption에서 명시한다. 표시된 반올림 금액의 합도 각각127.1만원이고 굵은 합계와 맞는다. 원시값 검산은 E2E에서 별도 확인했다.
- ‘영수증 기준 실제 지출’과 ‘합계에서 제외’3항목이 기준을 드러낸다. 전체 여행의 모든 비용을 포함한다고 단정하는 문구는 없다. [모바일 제외 항목](UX-TKT-172-r1-assets/375-light-excluded-viewport.png).
- 표/절의 background는 투명, hairline과 타이포로 구분한다. table caption·row header가 있고 결산 절은 aria-labelledby로 제목에 연결된다(`VoyageRouteMap.vue:994`~1056).
- 결산 절은 읽기 전용이며 새 버튼/입력0. 표 글씨11.84px, 모바일 총액24px. 실제 VoiceOver 낭독이나 사용자 인지 시간 측정은 이번에 하지 않았다.

## 체크리스트 자기 적용

| 항목 | 결과 |
|---|---|
| 3초 안 주인공1개 | 결산 절 진입 시 총액이 가장 큼. 전체 페이지 주인공은 기존 노선도. 인지 실험은 아님. |
| 면은 조작부에만 | 결산 표와 제외 목록에 채운 카드 없음. |
| 영어 섹션 간판0 | 결산/영수증 기준/사전 확정/현지 지출/카테고리별/지역별/합계에서 제외 모두 한글. Day는 정적 데이터의 일차 표기. |
| 노선색 선·배지 | 결산 제목 왼쪽3px 룰, 새 노선색 면 없음. |
| 375 overflow0·40px | 넘침0, 새 결산 조작부 없음. 기존 노선도 조작 회귀는4/4. |
| 카피 기준 | 별도 결산 목업 없음. TKT-172의 총액→사전/현지→7행/3행→제외 순서 및 소수1자리 준수. |
| 지하철 배지·스플래시 | 기존V 배지 유지. 이 티켓의 스플래시 변경 없음,178/182 검수와 분리. |
| 라이트 테마 | 375/1440에서 위계·합계·hairline·숫자 정렬 유지. |

## 인계

PM에 콘텐츠 상태와 실제 결산 공개 시점의 확인을 요청한다. 이번 검수는172 한 건이며 앱·목업·콘텐츠·티켓·보드·스펙 무수정, commit/push 없음. 다음 실행은 테스트 전용176의 제품 변경0 여부와 UX 검수 범위를 확인한다. 기존 임시1분 주기는 큐 소진까지 유지한다.
