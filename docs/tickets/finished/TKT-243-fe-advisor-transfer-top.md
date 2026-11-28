문서 상태: 작성완료

# TKT-243 `[FE]` Advisor 미션 탭 맨 위 「코드 받기 · 온라인에서 열기」 줄

- 상태: finished · **P1 · v0.9.5** · 담당: dev 서브에이전트(Sonnet) · 브랜치 `codex/v0.9.5`(작업 트리 `/Users/imjeonghan/newProject/wa-090`).
- 근거: PM 의문(v0.9.4) 「받기 버튼이 미션 탭 아래에 묻힌다」 → PO 「받기버튼도 고고」. D-042(Codespaces).
- scope (`services/advisor/frontend/` 아래): `src/modules/missions/pages/MissionPage.vue`, 새 컴포넌트 `src/modules/missions/components/MissionTransferBar.vue`(+ vitest), `e2e/mission-code-transfer.spec.ts`. data/ 콘텐츠 파일 금지.

## 완료 조건
- [x] 1. 「브리핑 읽었어요 → 미션 보기」로 미션 탭을 연 직후, 탭 맨 위(미션 제목 아래 첫 줄)에 받기 줄이 보인다. 스크롤 없이 1440·375 첫 화면 안.
- [x] 2. 받기 줄의 내용: starterTests 가 있으면 「⬇ 이지 — 테스트 포함」(강조)·「⬇ 하드 — 테스트 직접」, 없으면 「⬇ 코드 전체 받기 (.zip)」. 동작·파일명은 기존 `downloadMissionZip` 그대로 재사용. 그 옆(375 는 아래)에 「☁ Codespaces 에서 열기」 링크 버튼.
- [x] 3. Codespaces 링크: `https://codespaces.new/lim-it-err/workaround.co.kr-platform?quickstart=1&devcontainer_path=.devcontainer%2Fadvisor-lab%2Fdevcontainer.json`, 새 탭(`target=_blank rel=noopener`). 클릭하면 링크 아래에 접이식 안내가 펼쳐진다 — 「Codespace 가 열리면 터미널에서: `tools/advisor-lab.sh <미션id> easy` (이지가 없는 미션은 `hard`) → 구현 → `git push` 하면 Actions 가 채점합니다.」 명령 부분은 복사 버튼(clipboard 실패 시 텍스트 선택으로 대체).
- [x] 4. 기존 「구현할 뼈대」 카드의 받기 버튼은 남긴다(중복 허용 — 뼈대를 보다가 받는 경로). 두 곳 모두 같은 컴포넌트를 쓴다.
- [x] 5. 접근성: 버튼 높이 ≥44px, 가로 overflow 0(375).
- [x] 6. 검증: 새 컴포넌트 vitest, advisor `npx playwright test` 전체, `npx vite build --base=/workaround.co.kr-platform/advisor/`, `git diff --check`. e2e — 미션 탭 진입 직후 받기 줄이 viewport 안(boundingBox)·Codespaces href 정확·안내 펼침. 캡처 375·1440 `docs/tickets/captures/TKT-243/`.

## 구현 내역
- 새 `MissionTransferBar.vue`: 받기 버튼(이지/하드 또는 전체 zip, `downloadMissionZip` 재사용) + 「☁ Codespaces 에서 열기」 링크(target=_blank, rel=noopener) + 클릭 시 펼쳐지는 안내(명령 `tools/advisor-lab.sh <id> easy|hard`, 복사 버튼 — clipboard 실패 시 텍스트 선택 + 안내 문구). 안내 id 는 인스턴스 uid 로 유일화(같은 화면에 두 번 쓰이므로).
- `MissionPage.vue`: 미션 탭 section 첫 자식으로 바 삽입, 「구현할 뼈대」 카드의 기존 받기 버튼은 같은 컴포넌트로 교체(중복 허용). 안 쓰게 된 `.zip-btn/.zip-levels` CSS·`downloadMissionZip` import 제거. `.zip-note` 유지.
- 바는 버튼 높이 44px, 375 에서 세로 스택.
- `vitest.config.js` 에 `@vitejs/plugin-vue` 추가 — `.vue` 컴포넌트 vitest 를 위해 필요(ticket scope 밖 1줄, PM 확인 바람. vite.config 와 동일 플러그인).
- e2e `mission-code-transfer.spec.ts`: 받기 줄이 2곳이 되어 기존 버튼 조회를 맨 위 바(`getByTestId('transfer-bar').first()`)로 한정, 신규 테스트(첫 화면 viewport 안·href 정확·안내 펼침·복사·바 2개) 추가, 캡처 경로를 TKT-243 으로 변경(375/1440 × top/guide).
- 공유 파일: services/advisor/frontend/src/modules/missions/pages/MissionPage.vue (TKT-246 도 같은 파일 수정).
- 기존 e2e 의 TKT-236 캡처 생성은 이 spec 에서 제거(경로를 TKT-243 으로 바꿈) — 기존 TKT-236 캡처 파일은 그대로.

## 검증
- vitest: 127 중 126 통과, 실패 1건은 알려진 `platformTheme.spec.js`(무관). 신규 MissionTransferBar.spec.js 3 통과.
- `npx playwright test`: 73 passed.
- `npx vite build --base=/workaround.co.kr-platform/advisor/`: 성공. `git diff --check`: 깨끗.
- 캡처: `docs/tickets/captures/TKT-243/{top,guide}-{375,1440}.png`. 직접 확인 — 1440: 제목 아래 첫 줄에 [⬇ 코드 전체 받기 (.zip)] [☁ Codespaces 에서 열기] 한 줄; 375: 버튼 2개 세로 스택, 안내 펼침 시 명령 한 줄(`tools/advisor-lab.sh s1-wine-01 hard`)·복사 버튼·「구현 → git push 하면 Actions 가 채점합니다.」. 가로 overflow 0(e2e 단언). 영어 간판 없음(브랜드 Codespaces 만).


## 질문/에스컬레이션
- [구체화 질문] 샘플 미션 s1-wine-01 은 starterTests 가 없어 이지 버튼 경로는 vitest 로만 검증(e2e 는 분기 존재 시 기존 테스트가 검증). 문제 없으면 무시.

## 리뷰 기록
- r1 통과 (2026-11-28, PM) — `docs/reviews/REV-TKT-243-r1.md`
