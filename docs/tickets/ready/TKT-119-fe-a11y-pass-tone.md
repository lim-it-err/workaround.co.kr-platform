문서 상태: 작성완료

# TKT-119 `[FE]` 접근성 패스 — 톤 전환 화면 전체

- 상태: ready · P2 · 담당: codex-1 · 의존: TKT-110·111·112·113 (각 need_review 시 해당 화면부터)
- 스펙: 목업(`frontend/public/mockups/*`) + `design/tone-principles-2026-09-09.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: 톤 전환 화면 컴포넌트, E2E

## 목표
시각표 행·노선도 구간·정차역 시트·플랩: 키보드 도달(Tab 순서 = 시각 순서), 포커스 링 가시, `aria-pressed/aria-current/aria-expanded`, 노선도 `<a>` 에 접근성 이름(“DAY 4 · 할슈타트→잘츠부르크”), 바텀시트 포커스 트랩+ESC. 스크린리더로 홈→여행→정차역 상세까지 도달하는 E2E 1건.

## PM 추가 (2026-09-14, REV-TKT-118-r1 이관)
- [중요] 라이트 테마에서 W 노선색(`--line-w` #00863E)이 글자로 쓰인 곳(환승 홀 `기지선` 라벨 SVG/목록, `junction-route-badge` W) 4.13:1 → `--line-w-text` 로 교체(`styles.css` `color: var(--line-w)` 검색). 다른 노선색의 글자 사용도 같이 검사해 4.5:1 미만 0 으로.
- (REV-TKT-129-r1) Advisor `/learn` 필터 select 4개(시간·코드 작성·형식·완료)에 `aria-label` 부여. 다른 화면의 이름 없는 select/input 도 함께 검사.
