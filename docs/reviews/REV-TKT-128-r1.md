문서 상태: 작성완료

# REV-TKT-128-r1 — 원칙 4 잔존 일소 (PM 판정: **반려 → started**, 블로커 1)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: Pages base build 48 modules, unit 20/20. 구현자 Chromium 6/6 인정.
- 해소 확인(localhost:7010): `/voyage` DAY 0·3·7 패널·정차역 시트에 `ACTUAL`·대문자 영어 0, 정차역 시트 `3일차`. 여행 목록 지난 여행 행 `아이슬란드 · 노선도`(`0개 도시` 0). Work 접힌 상세 `.eyebrow` 5개 한글화(목표 버전·담당 현황·우선순위 정책·저장 방식·다음 작업 예상) ✓.
- **[블로커] 완료 조건 4(전 화면 대문자 영어 눈썹 0) 미충족 — Runtime 접힌 상세** `오프로드·배포 기준` 안에 `P.eyebrow` **`Routing Rules`·`Release Path`** 가 CSS `text-transform: uppercase` 로 `ROUTING RULES`·`RELEASE PATH` 로 렌더된다(1440, details 펼침 실측). 구현자 검사는 `.tone-work-page .eyebrow` 의 textContent 만 정규식으로 봐서 ①다른 화면 ②CSS 대문자 변환을 놓쳤다. **재작업**: 두 눈썹 한글화(예: `라우팅 규칙`·`배포 경로`) + **검사 방법을 렌더 기준으로**: 전 정적 경로(`/ /blog /blog-district /studio /sim /work /runtime /voyage`) 375/1440 에서 `details` 전부 펼친 뒤 leaf 요소의 `innerText`(text-transform 반영) 에 `\b[A-Z]{4,}\b` — 결과표를 구현 기록에.
- [제안] Work 접힌 상세의 `infra / chore` 태그(span, uppercase 렌더) — 데이터 토큰이라 간판은 아니나 `인프라 / 잡무` 매핑이나 소문자 유지 중 택일해 명시.
- [제안] 렌더되지 않는 잔존 영어 눈썹 — `App.vue:3304` `QA Route`, `:3359~3439` junction 프로토타입 블록(`UI-v0.5.0 Junction`·`Prototype Lines`·`UX Pivot`·`Mobile Route`), 그리고 `VoyageDailyView.vue`(`FIELD SESSION`·`TODAY'S TIP`, 외부 참조 0건)·`VoyageArchiveView.vue`(`LOCAL NOTES`·`CITY STAMPS`, 외부 참조 0건)·`VoyageDaySession.vue`(`SUCCESS CONDITION`·`TIMELINE`·`CHECK`·`IF / THEN`, 외부 참조 2건). 화면에 안 나오면 이 티켓 범위 밖 — 죽은 코드 정리는 별도 티켓 후보(구현 기록에 렌더 여부만 적어 달라).
- 재작업 범위: Runtime 눈썹 2 + 렌더 기준 전 화면 검사표(+ [제안] 1 선택). r2 → need_review.
