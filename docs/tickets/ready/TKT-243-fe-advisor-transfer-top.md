문서 상태: 작성완료

# TKT-243 `[FE]` Advisor 미션 탭 맨 위 「코드 받기 · 온라인에서 열기」 줄

- 상태: ready · **P1 · v0.9.5** · 담당: dev 서브에이전트(Sonnet) · 브랜치 `codex/v0.9.5`(작업 트리 `/Users/imjeonghan/newProject/wa-090`).
- 근거: PM 의문(v0.9.4) 「받기 버튼이 미션 탭 아래에 묻힌다」 → PO 「받기버튼도 고고」. D-042(Codespaces).
- scope (`services/advisor/frontend/` 아래): `src/modules/missions/pages/MissionPage.vue`, 새 컴포넌트 `src/modules/missions/components/MissionTransferBar.vue`(+ vitest), `e2e/mission-code-transfer.spec.ts`. data/ 콘텐츠 파일 금지.

## 완료 조건
- [ ] 1. 「브리핑 읽었어요 → 미션 보기」로 미션 탭을 연 직후, 탭 맨 위(미션 제목 아래 첫 줄)에 받기 줄이 보인다. 스크롤 없이 1440·375 첫 화면 안.
- [ ] 2. 받기 줄의 내용: starterTests 가 있으면 「⬇ 이지 — 테스트 포함」(강조)·「⬇ 하드 — 테스트 직접」, 없으면 「⬇ 코드 전체 받기 (.zip)」. 동작·파일명은 기존 `downloadMissionZip` 그대로 재사용. 그 옆(375 는 아래)에 「☁ Codespaces 에서 열기」 링크 버튼.
- [ ] 3. Codespaces 링크: `https://codespaces.new/lim-it-err/workaround.co.kr-platform?quickstart=1&devcontainer_path=.devcontainer%2Fadvisor-lab%2Fdevcontainer.json`, 새 탭(`target=_blank rel=noopener`). 클릭하면 링크 아래에 접이식 안내가 펼쳐진다 — 「Codespace 가 열리면 터미널에서: `tools/advisor-lab.sh <미션id> easy` (이지가 없는 미션은 `hard`) → 구현 → `git push` 하면 Actions 가 채점합니다.」 명령 부분은 복사 버튼(clipboard 실패 시 텍스트 선택으로 대체).
- [ ] 4. 기존 「구현할 뼈대」 카드의 받기 버튼은 남긴다(중복 허용 — 뼈대를 보다가 받는 경로). 두 곳 모두 같은 컴포넌트를 쓴다.
- [ ] 5. 접근성: 버튼 높이 ≥44px, 가로 overflow 0(375).
- [ ] 6. 검증: 새 컴포넌트 vitest, advisor `npx playwright test` 전체, `npx vite build --base=/workaround.co.kr-platform/advisor/`, `git diff --check`. e2e — 미션 탭 진입 직후 받기 줄이 viewport 안(boundingBox)·Codespaces href 정확·안내 펼침. 캡처 375·1440 `docs/tickets/captures/TKT-243/`.

## 구현 메모

## 질문/에스컬레이션

## 리뷰 기록
