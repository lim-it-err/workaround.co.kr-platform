문서 상태: 작성완료

# TKT-148 `[콘텐츠]` 중부유럽 순환선 — 남은 일정(9/15~9/17) 현장 정보와 링크 행

- 상태: finished (2026-09-15, PM 통과) · **P1** · 담당: codex-1 · 의존: TKT-149 보고서(있으면 출처로 사용, 없으면 공식 링크만 넣고 수치는 비움). 브랜치 `codex/v0.7.0-tone`. **UX 1순위·[반박] 의무.**
- 근거: PO 2026-09-15 "지금 여행 내용을 업데이트하도록 해도 돼"(U-37·D-023). `east-europe-2026.js` 의 9/15~9/17 은 계획 문장만 있고 영업시간·요금·공식 링크가 없다. 여행은 진행 중(9/8~9/18).
- scope: `frontend/src/data/voyages/east-europe-2026.js`(9/15·9/16·9/17 `tip` 보강 + 선택 필드 `links: [{ label, url, note, checkedAt }]`), `frontend/src/data/voyages/schema.js`(`links` 기본값 `[]`), `frontend/src/components/voyage/VoyageRouteMap.vue`(정차역 시트 계획 절에 링크 hairline 행), `frontend/src/data/voyageCoverage.test.mjs`, `frontend/src/components/VoyageRouteMap.e2e.mjs`. `VoyageDailyView.vue` 는 죽은 뷰(TKT-134) — 건드리지 않는다.

## 콘텐츠 규칙 (U-37)
- 링크는 **공식 사이트만**(운영사·시 관광청·공항·항공사·렌터카 업체). 구글 지도는 기존 `mapUrl` 형식만. 확인일 `checkedAt: '2026-09-15'`.
- 수치(운영시간·요금)는 TKT-149 보고서 또는 공식 페이지에서 가져온 것만. **추정 금지 — 모르면 비우고 `[확인]`**.
- PO 개인 기록(식사·지출·사진)은 만들지 않는다. 계획 문장의 어조는 기존 `tip` 과 같게(한 문장, 판단 근거 포함).

## 채울 항목
- 9/15 부다페스트: 세체니 온천(운영시간·온라인 예약·수영모 규정), 어부의 요새(상부 테라스 유료 시간대), 마차시 성당(입장·미사 시간), 부다 성 푸니쿨라(운행 여부·요금).
- 9/16 브르노→프라하: 렌터카 반납 지점 영업시간(업체명이 데이터에 없다 — `[확인]` 표기 후 PO 답변 대기), 비셰흐라드 개방·프라하 일몰 시각.
- 9/17 프라하 출국: 카를교 08시 전 근거, PRG 공항 택스 리펀(창구 위치·터미널·소요), 시내→공항 볼트/우버 요금대·소요, OZ546 터미널·체크인 카운터 오픈 시각.

## 화면
정차역 시트의 계획 절 아래 `링크` 행: 라벨 → 외부 링크(새 창, `rel="noopener"`), 면 없음·hairline, 행 높이 ≥40px, 375 overflow 0. 링크가 없는 날은 행 자체를 숨긴다.

## 완료 조건
1. [x] 9/15·9/16·9/17 각각 링크 ≥2, 모두 `checkedAt` 포함, 티켓 `## 출처` 절에 URL 전부.
2. [x] 정차역 시트 링크 행 E2E 1건(375: 40px·새 창 속성), 기존 RouteMap 4/4·coverage unit 그린.
3. [x] 데이터 파일에 추정값 0 — `[확인]` 표기 목록을 티켓에.
4. [x] build(Pages-base) 통과. 병합은 다음 배치(U-38) — PO 폰 반영 시점을 티켓에 명시.

## 질문/에스컬레이션
- TKT-149 보고서가 없어 티켓 계약대로 새 운영시간·요금·소요 수치는 넣지 않고 공식 확인 링크만 연결했다.

## 리뷰 기록
- 2026-09-15 codex-1: 남은 3일에 공식 사이트 링크를 3·2·3개 추가하고, 계획 아래 링크를 카드 면 없이 hairline 행으로 노출했다. 링크 행은 375/1440 다크·라이트에서 읽기 흐름과 가로 폭을 직접 확인했다.
- 2026-09-15 PM r1 반려 B1 → 반영: 9/15·9/16·9/17의 기존 `tip` 세 문장을 원문 그대로 복원했다.
- 2026-09-15 PM r1 반려 B2 → 반영: 9/16·9/17의 화면 `tip`에서 문서용 `[확인]` 마커를 제거했고, 미확인 항목은 이 티켓의 `## [확인] 목록`에만 유지했다.

## 구현 내역
- `defineVoyage()`가 모든 일차의 `links`를 빈 배열 기본값으로 정규화한다. 링크가 없는 날은 DOM 행도 만들지 않는다.
- 각 링크는 라벨·현장 확인 메모·`checkedAt: '2026-09-15'`를 가지며 새 창으로 열리고 `rel="noopener"`를 사용한다.
- 행 높이는 44px 이상이고 배경 면 없이 위아래 hairline만 사용했다.
- 공유 파일: `docs/tickets/board.md`, `docs/history/2026-09-15.md`(직전 need_review TKT-145 기록 보존).
- PO 폰 반영 시점: 이 need_review가 승인되고 다음 U-38 배치가 Pages에 배포될 때이며, 현재 워킹 트리 구현 직후에는 반영되지 않는다.
- r2 공유 파일: `frontend/src/data/voyages/east-europe-2026.js`(r1 링크 데이터와 같은 파일). 반려 두 건 외 제품 코드·테스트는 수정하지 않았다.

## 검증
- `node --test src/data/voyageCoverage.test.mjs`: 1/1 통과 — 3일 링크 개수·확인일·HTTPS·공식 호스트·빈 날 기본값 단언.
- `npm run build -- --base=/workaround.co.kr-platform/`: 49 modules 통과.
- `VoyageRouteMap.e2e.mjs`: Chromium 4/4 통과 — 375/1440 × 다크/라이트, 링크 40px 이상·`_blank`·`noopener`, 기존 노선/키보드/정차역 상세·저장·복원 회귀, 가로 overflow 0.
- 4환경 링크 화면 캡처를 직접 확인했다. 모바일은 계획→팁→링크 순서가 한 열로 유지되고, 데스크톱은 지도 옆 계획 열 안에서 링크가 hairline 행으로 읽힌다.
- 첫 E2E 시도는 샌드박스의 로컬 포트 `EPERM`으로 실행 전 실패했고, 승인된 로컬 테스트 권한으로 같은 명령을 재실행해 4/4를 확인했다. Safari/WebKit·VoiceOver·실 Pages는 미검증이며 commit/push 없음.
- r2: `node --test src/data/voyageCoverage.test.mjs` 1/1, `VoyageRouteMap.e2e.mjs` Chromium 4/4, Pages-base build 49 modules, `git diff --check` 통과. 세 원문 exact match와 화면 데이터의 `[확인]` 0건을 확인했다.

## 출처
- 9/15 세체니 온천: https://www.szechenyibath.hu/opening-hours
- 9/15 마차시 성당: https://matyas-templom.hu/en/
- 9/15 부다 성 푸니쿨라: https://bkk.hu/en/travel-information/special-and-heritage-transport-services/funicular/
- 9/16 브르노 관광: https://www.gotobrno.cz/en/
- 9/16 비셰흐라드: https://prague.eu/en/objevujte/vysehrad/
- 9/17 카를교: https://prague.eu/en/objevujte/charles-bridge-karluv-most/
- 9/17 프라하 공항 택스 리펀: https://www.prg.aero/en/vat?terminal=reset&terminal_part=part
- 9/17 프라하 공항 교통: https://www.prg.aero/en/transport-and-parking

## `[확인]` 목록
- 9/15: 세체니 수영모 세부 규정·당일 예약 가능 여부, 어부의 요새 상부 테라스 유료 시간대, 마차시 성당 입장·미사 시간, 푸니쿨라 당일 운행·요금.
- 9/16: 렌터카 업체명·반납 지점 영업시간, 프라하 일몰 시각.
- 9/17: 카를교 `08시 전` 혼잡 근거, 시내→공항 Bolt/Uber 견적·소요, OZ546 터미널·체크인 카운터 운영 시각.
- 이번 변경이 새로 추가한 `tip`·`links`에는 확인되지 않은 운영시간·요금·소요 수치를 넣지 않았다. 기존 일정 본문의 계획 시각은 수정 범위 밖이라 그대로 유지했다.

## PM 반려 (2026-09-15, r1) — `docs/reviews/REV-TKT-148-r1.md`
- [블로커] B1 기존 `tip` 3개 원문 삭제 → 그대로 복원(보강은 원문 뒤 한 절 또는 `links[].note`).
- [블로커] B2 `[확인]` 마커가 9/16·9/17 화면 문구에 노출 → 제거(티켓 절에만).
- 링크 행·출처·E2E 는 통과. 두 건만 고치고 need_review.
- 2026-09-15 PM: **r2 통과 → finished** — `docs/reviews/REV-TKT-148-r1.md`(r2 절).
