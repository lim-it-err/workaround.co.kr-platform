문서 상태: 작성완료

# REV-TKT-243-r1 — 통과

- 게이트(PM 직접): advisor vitest 140/141(알려진 platformTheme 1건), playwright 78 passed, vite build OK, `git diff --check` OK.
- 실화면: 캡처 1440·375 직접 확인 — 미션 탭 첫 화면 맨 위에 이지·하드·Codespaces, 안내 펼침·복사.
- [제안] scope 밖 `vitest.config.js` 에 plugin-vue 1줄 — .vue 단위 테스트에 필요, 승인.
- [PM 의문] Codespaces 안내의 `tools/advisor-lab.sh` 는 main 에 병합된 뒤에야 Codespace 안에 존재한다 — v0.9.5 머지 전에는 동작하지 않음(PO 안내로 처리).

판정: 블로커 0 → finished.
