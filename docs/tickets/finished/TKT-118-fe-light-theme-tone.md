문서 상태: 작성완료

# TKT-118 `[FE]` 라이트 테마 톤 정합 — 새 톤의 토큰 매핑

- 상태: `finished` (2026-09-14, REV-TKT-118-r1 — 구 `need_review`) (2026-09-14) · P2 · 담당: codex-1 · 의존: TKT-110
- 스펙: 목업(`frontend/public/mockups/*`) + `design/tone-principles-2026-09-09.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: `frontend/src/styles.css`(`[data-theme='light']` 블록), 각 화면 라이트 검수

## 목표
목업은 다크 전용. 라이트 테마에서 원칙(면은 조작부만·hairline·노선색은 선)이 유지되도록 토큰만 매핑: 바탕 off-white, hairline 검정 9%, 노선색은 라이트 변형(기존 `--line-*` 라이트 값), 배지 대비 4.5:1. **[구체화 질문] 환영** — 라이트에서 순환선 노선도 대비가 약하면 대안 제시.

## PM 추가 (2026-09-14)
- 영어 눈썹 라벨(`ACTUAL` 등)·`0개 도시` 정리는 **TKT-128** 로 이관 — 이 티켓은 토큰 매핑만.

## 구현 결과

- 라이트 바탕은 기존 off-white 계열을 유지하고, 기본 hairline을 검정 9%(`--line`)·강조선을 18%(`--line-strong`)로 맞췄다. 면을 추가하지 않고 전 화면의 선 구분만 가볍게 정리했다.
- 보조 글자는 `#59677C`로 보정해 off-white·보조 바탕·흰 조작부에서 모두 4.5:1 이상을 확보했다. 현재 위치/포커스에 쓰는 금색도 `#895F00`으로 보정해 라이트 바탕에서 글자와 선이 묻히지 않게 했다.
- W 노선·발행 상태 녹색을 `#00863E`로 낮추고 T/P 텍스트 변형을 보정했다. E/T/P 상단 원형 배지는 밝은 노선색 위에 전용 어두운 잉크를 매핑해, 라이트의 모든 원형 노선 배지 조합이 4.5:1 이상이 되게 했다.
- `공유 파일: frontend/src/styles.css` — 직전 TKT-114가 같은 파일을 사용했으나 PM이 r2 통과·커밋한 뒤 그 최신 상태 위에 라이트 토큰 hunk만 추가했다.

## 완료 게이트

- [x] 색 대비 계산 — muted/background 4.75~5.74:1, safety/background 4.69~5.00:1, W/E/T/P/S/B/R/D/V 원형 배지 4.65~7.73:1, T/P 노선 텍스트 최소 4.76:1로 모두 4.5:1 이상.
- [x] `npm run build` 및 `npm run build -- --base=/workaround.co.kr-platform/` — Vite 각 48 modules 성공.
- [x] 프런트 unit — 정적 라우팅·글쓰기·환승 홀·여행·SIM 20/20 통과.
- [x] Pages-base Chromium — Splash/Junction/Blog/Voyage 10/10, Writing Studio 9/9 통과. 1440px 라이트의 스플래시·환승 홀·블로그 3종·여행 목록/빈 기록/노선도/상세를 직접 확인했다.
- [x] 기본 경로 Chromium — ToneTools 8/8 및 추가 엘리베이터·택시 375/1440 라이트 4/4 통과. SIM 허브·Work·Runtime·Studio와 두 시뮬 상세의 가로 overflow·브라우저 오류/경고 0을 확인했고, Writing Studio 375px 라이트의 편집/도구/표/발행 시트도 직접 확인했다.

## 질문/에스컬레이션

- [해소] 순환선 노선도는 기존 V 색을 유지해도 라이트 바탕 대비가 충분했다. 현재 위치 금색만 토큰으로 보정했으며 별도 대안 노선색은 필요하지 않다.

## 남은 위험

- Safari/WebKit과 실제 GitHub Pages 배포 환경은 미검증이다. 영어 눈썹 라벨과 지난 여행 `0개 도시`는 PM 지정대로 TKT-128 범위에 남겼다. PM 최종 판정과 commit/push가 필요하다.

## 리뷰 기록
- r1 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-118-r1.md`. [중요] W 노선색 글자 4.13:1 → TKT-119.
