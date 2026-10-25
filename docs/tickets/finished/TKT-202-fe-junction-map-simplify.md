문서 상태: 작성완료

# TKT-202 `[FE]` 환승 홀 노선도 단순화 — 큰 역만 이름, 작은 역은 점 + 포커스 때 이름

- 상태: finished · **P1 · v0.8.1(패치)** · 담당: dev 서브에이전트(Sonnet) · 브랜치 **`codex/v0.8.1`**(작업 트리 `/Users/imjeonghan/newProject/wa-081`). **UX 1순위.**
- 근거: PO 2026-10-25 노선도 캡처와 함께 「요거 좀 복잡한거 0.8.1때 해결해줘」. TKT-196 의 "블로그 빠진 뒤 지도 구도" 항목을 여기로 흡수.
- 현재: 1440 지도에 큰 역 7 + 작은 역 10 + 노선 이름 3 + `환승 홀` 라벨이 모두 글자로 떠 있어(약 21개) 한눈에 읽히지 않는다. 오른쪽 목록이 이미 작은 역을 전부 보여 준다.
- scope: `frontend/src/data/lines.js`(좌표·라벨 표시 플래그), `frontend/src/components/JunctionMap.vue`, `JunctionMap.e2e.mjs`, `frontend/src/data/junction.test.mjs`, `styles.css`(지도 부분).

## 완료 조건
1. [x] 지도 기본 상태의 글자는 **큰 역 이름 + 노선 이름 3 + 환승 홀** 만(≤ 12개). 작은 역은 점만 보이고, 마우스 올림·키보드 포커스 때 그 역 이름이 한 줄로 뜬다(툴팁, `pointer-events: none`). 작은 역 클릭·40px 히트 영역·접근 이름(`aria-label`)은 그대로.
2. [x] 블로그가 빠진 기록선 왼쪽의 빈 공간을 정리 — 환승 홀 직선 통과 원칙(r16)을 지키면서 지도 전체가 가운데 오게 viewBox·좌표 조정. 375 는 지금처럼 큰 역만.
3. [x] `BLOG_LINE_OPEN=true` 경로도 깨지지 않음(코드 경로 유지, 테스트는 false 기준).
4. [x] E2E: 1440 기본 상태 지도 안 보이는 글자 수 ≤ 12, 작은 역 포커스 시 이름 표시, 클릭 소유권·겹침 0, 375/1440 × 다크/라이트 캡처 전후 비교 `/private/tmp/tkt202/`.
5. [x] 더 나은 단순화 안이 있으면 `[반박]` 으로 대안 + 캡처를 적고 진행.

## 구현 내역
- `lines.js`: `MAP_VIEWBOX`(닫힘 `135 66 615 480` · 열림 `0 0 720 720`) 추가, 자취 밥상 이름을 점 오른쪽으로(왼쪽 경계를 줄이려고). 기록선 경로(`M290 360 L630 360`)·r16 직선 통과는 그대로.
- `JunctionMap.vue`: 작은 역 글자를 지도에서 제거하고 `activeStop` 하나만 SVG 맨 위 `<text class="junction-stop-tip">`(pointer-events none)로 그린다. 트리거 = 히트 원·점 `pointerenter/leave`, `focus-visible`(키보드 Tab). 클릭·r=26 히트·`aria-label` 유지. 모바일은 기존처럼 작은 역·툴팁 `display:none`.
- `styles.css`(지도 선택자만): `.junction-page-stop text` → `.junction-stop-tip`, 모바일 숨김.
- 테스트: `JunctionMap.e2e.mjs`(기본 글자 수 = 큰 역+4, 작은 역 전부 올림 → 이름·한 개·pointer-events none·큰 글자 가림 0, 키보드 포커스), `junction.test.mjs`(viewBox 포함 검사), 공유 파일 `staticRouting.e2e.mjs`·`Ets2Live.e2e.mjs`(`hasText` 로 소역을 찾던 셀렉터를 `data-stop-label` 로).
- 공유 파일: `board.md`(TKT-201 작업자와 같은 파일).

## 검증
- 1440 기본 상태 보이는 글자(역 코드 제외): **21 → 11**(여행·기록선·Advisor·미스터리 트레인·발견·자취 밥상·실험선·Work·Runtime·기지선·환승 홀). 375 는 전후 11.
- build(root·Pages) green, unit 29/29, JunctionMap 4/4, staticRouting·WorkNotes·blogClosed 합쳐 32/32, ToneTools 10 pass/2 skip, Ets2Live 4/4, `git diff --check` clean. dist 는 Pages-base 로 복귀.
- 캡처 `/private/tmp/tkt202/` — `before-{375,1440}-{dark,light}.png`, `after-…`, 올림 `after-hover-{dark,light}.png`(유로트럭).

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-202-r1.md`.
- 없음.
