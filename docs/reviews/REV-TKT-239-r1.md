문서 상태: 작성완료

# REV-TKT-239-r1 — Advisor 공개 페이지는 방문자의 localhost 를 부르지 않는다 (PM, 2026-11-28)

판정: **통과** (블로커 0)

## PM 직접 검증 (실호스트)
- advisor 빌드를 `vite preview --host 0.0.0.0 --port 4199` 로 띄우고 playwright 로 같은 미션 화면을 두 호스트에서 열어 `:8080` 요청을 셌다.
  - **LAN IP(공개 사이트와 같은 비-localhost 조건)**: 8080 요청 **0**, 콘솔 오류 0, 배지 「배포 · 연습 리뷰」.
  - **127.0.0.1**: 8080 요청 1(백엔드 없음 → 콘솔 오류 1, 배지 「배포 · 연습 리뷰」) — 로컬 모드 동작 유지.
- 구현자 게이트: vitest 119/120(기존 platformTheme 1), advisor playwright 71 passed, `e2e:all` 150/20/0, build 통과.
- 구현자가 단위 테스트로 갈음한 「공개 호스트 e2e」는 위 실호스트 확인으로 보완됨.

## 지적
- `[제안]` 부수효과로 바뀐 `captures/TKT-236/mission-375.png` 는 되돌렸다(PM).
