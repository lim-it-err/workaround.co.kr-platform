문서 상태: 작성완료

# TKT-104 `[FE]` Inflight 필터 pill 접근성 후속 — aria-pressed

## 메타데이터

- 문서 상태: 작성완료
- 상태: `finished` (REV-TKT-104-r1 통과, PM 2026-09-11)
- 우선순위: P2 (REV-TKT-098-r1 [중요] 후속)
- 담당: codex-1 (FE)
- scope: `services/advisor/frontend/src/modules/missions/pages/InflightPage.vue` (+해당 테스트)

## 목표

시간·취향 선택 pill 버튼에 `:aria-pressed` (또는 `aria-current`) 바인딩을 추가해 스크린리더/키보드 사용자가 선택 상태를 알 수 있게 한다. REV-TKT-098-r1 [중요] 항목 참조 (재현 절차 포함).

## 완료 조건

1. 선택 상태가 ARIA 로 노출된다 (E2E 또는 unit 로 검증 1건 추가).
2. `npm run test:unit`·`build` 그린.

## 구현 결과

- 시간 4개·취향 5개 pill에 기존 active 클래스와 같은 조건의 `:aria-pressed`를 바인딩했다. 선택값/추천 로직·콘텐츠·CSS·저장 계약은 변경하지 않았다.
- `services/advisor/frontend/e2e/inflight-accessibility.spec.ts`를 추가했다. 기본 선택, 9개 버튼 전체 전환, 그룹별 단일 선택 및 다른 그룹 유지, Enter/Space 조작, 새로고침 후 선택 복원과 ARIA/시각 상태 일치를 검증한다.

## 완료 게이트 (2026-09-10)

- [x] 수정 전 새 E2E 2건 실패: pressed=true 버튼이 1개여야 하나 0개로 노출되어 기존 결함 재현.
- [x] 수정 후 `npm run test:e2e` (Advisor frontend) — 17/17 통과 (기존 15 + 신규 2).
- [x] `npm run test:unit` (Advisor frontend) — 8 files, 44/44 통과.
- [x] `npm run build` (Advisor frontend) — 96 modules, 통과.
- [x] `npm --prefix frontend run build` (모선) — 36 modules, 통과.
- [x] Chromium 375×812, OS 선호 dark/light 각각 overflow 0·pageerror 0. 설정 영역 스크린샷 육안 확인: 선택 테두리/텍스트 및 줄바꿈 정상. Advisor는 기존 고정 다크 테마이며 라이트 테마를 새로 구현하지 않았다.
- [x] `git diff --check` 및 변경 문서 UTF-8 BOM 검사 통과. 로컬 테스트 서버 종료 확인.

## 검증 자료·제약

- 재현: `cd services/advisor/frontend && npm run test:e2e -- e2e/inflight-accessibility.spec.ts`.
- 캡처: `services/advisor/frontend/node_modules/.cache/playwright-test-results/inflight-accessibility-*/inflight-*-375.png` (테스트 재실행 시 갱신).
- ARIA 노출은 Playwright role/pressed 조회와 실제 DOM 속성으로 검증했다. VoiceOver 등 스크린리더 음성 출력 및 실배포 검증은 하지 않았다.
- 소스 변경은 지정 Vue 파일의 두 바인딩과 해당 E2E뿐이다. 서버·배포·콘텐츠 수정 및 커밋·push 없음. TKT-079는 TKT-103 need_review 선행 조건을 유지한다.
