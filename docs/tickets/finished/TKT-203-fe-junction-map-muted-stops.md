문서 상태: 작성완료

# TKT-203 `[FE]` 노선도 작은 역 이름 복귀 — 항상 보이되 작고 흐리게(위계로 단순화)

- 상태: finished · **P1 · v0.8.1** · 담당: dev 서브에이전트(Sonnet) · 브랜치 `codex/v0.8.1`(작업 트리 `/Users/imjeonghan/newProject/wa-081`). **UX 1순위.**
- 근거: PO 2026-10-25 202 결과에 「지하철 역이 안 보여. 간단하게 했으면 좋겠는데」 → PM 1안(숨기지 말고 위계로) 「어 그렇게 해」.
- scope: `frontend/src/components/JunctionMap.vue`, `frontend/src/data/lines.js`(작은 역 라벨 좌표만), `styles.css`(지도 선택자), `JunctionMap.e2e.mjs`.

## 완료 조건
1. [x] 1440 지도에 작은 역 이름이 **항상** 보인다 — 큰 역보다 한 단계 작은 글씨(예: 11~12px)·흐린 색(본문 보조색), 굵기 보통. 큰 역은 지금처럼 굵고 밝게. 202 의 툴팁은 제거(중복).
2. [x] 202 에서 얻은 것은 유지: viewBox 가운데 정렬, 블로그 빈자리 정리, 직선 통과.
3. [x] 겹침 0 — 특히 `Work` 와 기지선 선, `발견` 과 점선, 미스터리 트레인 주변(격납고·엘리베이터·택시·화이트채플·유로트럭 2). 필요하면 작은 역 라벨 좌표만 옮긴다.
4. [x] 375 는 지금처럼 큰 역만(작은 글씨가 읽히지 않는 폭).
5. [x] E2E: 1440 작은 역 10개 이름이 보이고(색·크기가 큰 역과 다름), 라벨·노선 겹침 0, 클릭 소유권 유지. 게이트 전체, 캡처 `/private/tmp/tkt203/` 375/1440 × 다크/라이트.

## 구현 내역
- `JunctionMap.vue`: 202 의 툴팁(`activeStop`·pointer/focus 핸들러·`.junction-stop-tip`) 전부 제거, 작은 역 `<text class="junction-page-stop-name">` 복귀(pointer-events none, 배경색 외곽선으로 선 위 가독성).
- `styles.css`: 작은 역 이름 12px·굵기 400·`--text-2`(큰 역은 17px·750·`--text`). 375 는 `.junction-page-stop` 이 `display:none` 이라 큰 역만.
- `lines.js`: 작은 역 라벨 좌표만 — Work 라벨 428→418(점과 맞닿음 해소), 택시 라벨 (600,104)→(592,106)(`실험선` 노선명과 간격). viewBox·직선 통과·블로그 정리는 그대로.
- E2E: `JunctionMap.e2e.mjs` 작은 역 10개 이름 가시·11~12px·큰 역보다 작고 색·굵기 다름·툴팁 0·pointer-events none, 겹침·노선 통과 검사 대상에 작은 역 이름 포함. 클릭은 글자가 그룹 중앙을 차지해 점(`.junction-page-stop-dot`)을 직접 누르도록(`JunctionMap`·공유 파일 `Ets2Live.e2e.mjs`).
- 공유 파일: `Ets2Live.e2e.mjs`, `board.md`.

## 검증
- build(root·Pages) green, unit 29/29, JunctionMap 4/4, staticRouting 4/4, Ets2Live 4/4, WorkNotes 8/8, splashTone 14/14, blogClosed 16/16(root dist `/private/tmp/tkt203/dist-root`), ToneTools 10 pass/2 skip, `git diff --check` clean. dist 는 Pages-base 로 복귀.
- 캡처 `/private/tmp/tkt203/junction-{375,1440}-{dark,light}.png`(확대 `zoom2-1440-*.png`) — 1440 에서 작은 역 10개 이름 가시·겹침 0 육안 확인, 375 큰 역만.
- 확신 없는 점: 1440 지도가 화면에서 약 0.8배라 12px 글자는 실제 약 11px; `restricted` 소역(엘리베이터·개발자·화이트채플)은 기존 opacity 로 더 흐림.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-203-r1.md`.
- 없음.
