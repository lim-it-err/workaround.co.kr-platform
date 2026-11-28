문서 상태: 작성완료

# REV-TKT-240-r1 — Advisor 코드 받기 이지/하드 (PM, 2026-11-28)

판정: **통과** (블로커 0)

## PM 직접 검증 (실콘텐츠)
- PM 이 `s7-parcel-01`·`s7-tariff-01`·`s3-interest-01` 에 `starterTests` 를 채운 뒤, 미션 화면에서 「⬇ 이지 — 테스트 포함」「⬇ 하드 — 테스트 직접」을 실제로 눌러 받은 zip 4개를 풀어 `mvn test`(JDK 21):
  - parcel-easy: 테스트 13개 들어 있음, 뼈대 상태 Errors 13(미구현 예외 — 의도), parcel-hard: 뼈대 예시 테스트 1개만.
  - tariff-easy: 14개, Errors 14 / tariff-hard: 테스트 없음.
  - 같은 테스트를 PM 정답 코드에 돌리면 parcel 13/13, tariff 14/14, interest 7/7 통과.
- advisor `npx playwright test` 72 passed, vitest 123/124(기존 platformTheme 1), Pages base build 통과.
- 캡처 `captures/TKT-240/pm-parcel-easyhard-375.png`: 두 버튼 세로, 이지 강조, 설명 한 줄.

## 지적
- `[제안]` 버튼이 「구현할 뼈대」 카드 안(미션 탭 아래쪽)에 있어 미션 탭을 열고 스크롤해야 보인다. 미션 탭 맨 위 요약 줄에도 받기 진입점을 두는 것을 다음 손질 후보로.
