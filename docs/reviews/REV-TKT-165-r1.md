문서 상태: 작성완료

# REV-TKT-165-r1 — 글쓰기 E2E 견고화: 순간 상태 대기 제거·자체 preview 포트 격리 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-17 새벽. 리뷰어 초안 없음 — PM 직접. 제품 코드 diff 0(변경: `WritingStudio.e2e.mjs`, 신규 `frontend/scripts/e2e-isolated-preview.mjs`).
- 확인: `저장 중…` 순간 상태 `waitForFunction` 제거 — 입력 직후·저장 완료 후 두 시점에서 상단바 계약만 검사(상태 무관). 헬퍼는 기존 `dist` 를 `listen(0)` 으로 예약한 임의 포트에 `--strictPort` 로 띄우고 종료 시 자식 PID 정리, `STUDIO_TEST_URL` 지정 시 외부 서버 사용.
- PM 게이트: 자체 실행 13/13 · 두 프로세스 동시 3라운드 6/6 스위트 78/78 · 종료 후 헬퍼 잔존 preview 0(남은 2개는 PM 의 4176 진단용 — 정리함).
- [제안] 헬퍼가 `dist/index.html` 존재만 확인하고 base 를 검증하지 않아 root-base 로 빌드된 `dist` 면 자산 경로가 어긋난다 — index.html 의 asset 경로가 `basePath` 로 시작하는지 확인하고 아니면 명확한 오류. TKT-159 통합 러너에서 흡수.
- 커밋 범위: `frontend/src/components/WritingStudio.e2e.mjs`, `frontend/scripts/e2e-isolated-preview.mjs`. **병합 후보 `6b1f072` 이후 커밋 — 다음 배치.**
