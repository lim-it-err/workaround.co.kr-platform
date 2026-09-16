문서 상태: 작성완료

# TKT-126 `[FE]` 순환선 심볼 C안 적용 + 파비콘 + 스플래시 보드 높이

- 상태: finished (2026-09-14, REV-TKT-126-r1 통과) · P1 (소형) · 담당: codex-1 · 의존: 없음 (TKT-110 finished). 브랜치 codex/v0.7.0-tone. UX 1순위·[반박] 의무.
- 근거: D-018. 시안 `frontend/public/mockups/loop-symbol.html` 안 C. 목업 `home.html`(r11) 환승 홀 표기 참고.
- scope: `frontend/src/components/tone/SiteLoopSymbol.vue`, `frontend/public/favicon*`·`index.html`(파비콘 링크), `frontend/src/App.vue`(스플래시 보드 높이)·`styles.css`

## 목표
1. `SiteLoopSymbol.vue` 를 C안(열린 기점: 링 + 12시 틈 ≈36° + 기점 점)으로 교체 — 24px 상단바·스플래시 대형 공통. 2. 파비콘을 같은 심볼로(16·32·SVG), 라이트/다크 배경 대비 확인. 3. 스플래시 플랩보드 높이를 **한 줄 + 여백**으로 줄이고 '알림' 티커 상자의 면을 hairline 행으로(REV-110 [제안]).

## 완료 조건
16px 파비콘에서 링·틈·점이 식별됨(스크린샷 첨부) · 스플래시 375px 에서 보드 빈 영역 제거 · splashTone E2E 그린.

## PM 추가 (2026-09-14)
4. TKT-125 환승 링크의 임시 CSS 원(`VoyageRouteMap.vue` 환승 표식, Advisor `MissionPage.vue` `.voyage-return__loop`)을 같은 C안 소형 심볼로 교체 — 모선은 `SiteLoopSymbol` 재사용, Advisor 쪽은 인라인 SVG 사본(모듈 격리 계약) 허용. 이미 착수했으면 이 항목은 r1 판정 시 후속으로 분리해도 된다.
- 공유 파일이 있으면 `공유 파일:` 한 줄.

## 구현 내역 (2026-09-14, codex-1)

- `SiteLoopSymbol.vue`를 D-018 C안의 열린 링 경로(`M58 18.55 A33 33 0 1 1 38 18.55`)와 기점 점으로 교체했다. 24px 상단바와 68px 스플래시가 같은 SVG를 쓰며 크기와 색은 `currentColor`로 상속한다.
- Pages base를 보존하는 SVG·16px·32px 파비콘을 추가했다. SVG는 OS 라이트/다크 선호에 따라 색을 바꾸고, PNG의 고정 `#8a6500`은 어두운 `#0d131c`에서 3.50:1, 밝은 `#f7f9fc`에서 5.05:1 대비를 확보한다.
- 스플래시 보드를 실제 플랩 한 줄 + 세로 24px로 고정하고 패널 내부의 남는 면을 제거했다. 알림 티커는 카드 면·pill을 걷고 위아래 hairline과 한 줄 문구만 남겼다.
- TKT-125 환승 링크의 모선 표식은 이미 `SiteLoopSymbol`을 재사용하므로 이 교체가 자동 반영된다. 모듈 격리된 Advisor 역링크는 같은 C 경로·기점 점을 인라인 SVG로 복제하고 CSS 원·의사 요소를 제거했다.
- 공유 파일: `services/advisor/frontend/src/modules/missions/pages/MissionPage.vue`

## 검증

- 메인 unit 20/20, 기본·Pages-base build 각 48 modules, `ToneTools.e2e.mjs` 10/10 통과.
- `splashTone.e2e.mjs` 3/3 통과: 375px에서 10초 3문구·티커·문 열림, 보드 높이·overflow 0·24px 심볼, 1440px light reduced-motion, Pages-base 파비콘 링크와 16×16/32×32 실치수를 단언했다.
- Advisor unit 77/77·Pages-base build 110 modules, 병합 정적 번들의 여행↔Advisor 왕복 E2E 375px dark·1440px light 2/2 통과. 양쪽 링크가 같은 D-018 경로인지 함께 단언했다.
- 실렌더: `/private/tmp/tkt126-screens/`의 모바일 스플래시·라이트 reduced-motion·16/32px 다크/라이트 파비콘과 `/private/tmp/tkt126-transfer/`의 환승 링크 4장을 직접 확인했다. 보드 빈 면과 가로 overflow는 없고 작은 C의 틈·점이 식별된다.
- `git diff --check` 통과. commit/push 없음.

## 남은 위험

- Safari/WebKit·실제 GitHub Pages 배포는 미검증이다.
- Advisor 초기 청크 502.54kB 경고는 기존 성능 위험이며 이 티켓에서는 번들 경계를 변경하지 않았다.

## PR 준비 메모

- 제목 초안: `[tone] D-018 C 심볼·파비콘과 스플래시 밀도 반영`
- 포함: 공용 C 심볼, SVG/PNG 파비콘, 한 줄 플랩보드·hairline 티커, 여행↔Advisor 소형 환승 표식, 회귀 테스트.
- 제외: 홈 노선도 재구성, 실제 Pages 배포, Advisor 번들 분할.

## 리뷰 기록
- r1 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-126-r1.md`. 16px 파비콘 식별·스플래시 한 줄 보드·환승 표식 동일 경로 확인.
