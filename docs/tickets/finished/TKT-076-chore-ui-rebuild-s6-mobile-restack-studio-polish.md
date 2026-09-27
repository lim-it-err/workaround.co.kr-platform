문서 상태: 작성완료

# TKT-076

## 메타데이터

- 제목: UI 재구현 S6 - 모바일 재배치 + Writing Studio 마감 (선택)
- 우선순위: P3
- 대상 버전: `chore`
- 상태: `finished`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-076-ui-rebuild-s6-mobile-restack`

## 목표

선택 슬라이스 S6을 구현한다. 시안 A/C 모바일 프리뷰대로 "축소가 아니라 재배치"(현재 상태 → 본선 → 놀이터 목록 → 하단 빠른 환승)로 모바일 레이아웃을 정돈하고, Writing Studio 의 draft/preview/published/archived 상태 흐름과 저장·발행·보관 강조를 마감한다. 플랩 아래→위 물리 연출은 본 티켓 범위가 아니라 TKT-070 소관이다.

## 작업 내용

스펙 근거: `design/implementation-spec-2026-07-06.md` §4(writingStudio), §6(S6), §7(모바일 재배치 포인터), 부록 A(접근성/반응형). 색 근거: `design/blog-district-ui-system-2026-06-26.md` §6.

1. 모바일 재배치 (스펙 §6 S6, 부록 A). "재배치, 축소 아님" 원칙을 적용한다. 데스크톱 레이아웃을 그대로 세로로 접지 않는다(세로 접기 금지). 모바일 우선순위 = 현재 상태 → 주요 진입 → 핵심 시뮬/Work → 보조 패널. 환승 홀은 SVG 노선도 대신(또는 병행) 가로 스크롤 + `.route-rows` 목록 폴백을 우선 노출하고, 하단에 빠른 환승을 둔다. 구현은 시안 A `.phone`/`.m-*`(L659~736) 또는 시안 C 세로 노선띠 `.m-strip`/`.spine`/`.m-stop`(L614~667)를 참조한다.
2. Writing Studio 상태 흐름 마감 (스펙 §4 writingStudio, 현재 App.vue L3749~). StationHeader(code `B02` 또는 종점 표기). draft/preview/published/archived 상태 흐름을 StatusBadge(S3/TKT-073 산출물)로 표기한다 — 여기서만 draft/archived 노출 허용. 저장은 자주·비위협적으로, `published` 전환은 가장 강한 액션으로 별도 강조(`btn-exit` 계열), `archived` 는 삭제와 혼동 금지(브론즈, danger 색 금지). 편집기/미리보기 2분할은 기능 유지, 스킨만 통일.
3. 반응형/접근성 검수 (스펙 부록 A). `prefers-reduced-motion` 시 노선도 pulse/트랜지션 정지, `:focus-visible { outline:2px solid var(--safety); outline-offset:2px; }` 전역, 터치 타깃 충분히 크게, 복귀 CTA 항상 노출, 노선/상태는 색+문자+라벨 병행. 다크/라이트 둘 다 1급 검수(다크 기본).

시안 재사용 포인터(스펙 §7): 모바일 재배치는 시안 A `.phone`/`.m-*`(L659~736) 또는 시안 C `.m-strip`/`.spine`/`.m-stop`(L614~667). Writing Studio 상태 배지는 StatusBadge(시안 A `.badge*` L201~209), 색 근거 `design/blog-district-ui-system-2026-06-26.md` §6.

## 범위

- 포함: 모바일 "재배치" 레이아웃(상태→본선→놀이터 목록→하단 빠른 환승), Writing Studio 상태 흐름(draft/preview/published/archived) 표기·저장/발행/보관 강조 마감, 반응형/접근성 검수(reduced-motion/focus-visible/터치 타깃).
- 제외: 플랩 아래→위 물리 연출(→ TKT-070), 색 토큰/타이포/StationHeader(→ TKT-071/S1), 환승 홀 노선도 구현 자체(→ TKT-072/S2), 블로그 공개면 A 처리·StatusBadge 컴포넌트 신설(→ TKT-073/S3, 여기서는 Studio 노출만 추가), 컴포넌트 전면 분해(→ TKT-075/S5). 상태 값 의미 변경 금지.

## 완료 기준

- `tools/run-frontend-build.ps1` 빌드가 통과한다.
- 모바일에서 레이아웃이 "축소"가 아니라 "재배치"로 동작한다(상태 → 주요 진입 → 핵심 시뮬/Work → 보조 패널, 하단 빠른 환승). 데스크톱을 그대로 세로 접지 않는다.
- Writing Studio 에서 draft/preview/published/archived 상태 흐름이 StatusBadge 로 보이고(여기서만 draft/archived 노출), `published` 전환이 가장 강한 액션으로 강조되며, `archived` 가 삭제/위험 색과 구분(브론즈)된다.
- `prefers-reduced-motion`/`:focus-visible`/터치 타깃/복귀 CTA 노출이 두 테마 모두에서 확인된다.

## 선행 조건

- `TKT-071`, `TKT-072`, `TKT-073`(S1~S3) 선행. 토큰/헤더(S1), 노선도·route-rows 폴백(S2), StatusBadge·블로그 공개면(S3)이 있어야 모바일 재배치와 Studio 상태 흐름을 마감할 수 있다.

## 질문/결정 기록

- 결정(스펙 §6/부록 A): 반응형은 "재배치"이며 데스크톱 세로 접기 금지. 홀 노선도는 SVG 가로 스크롤 + route-rows 폴백.
- 결정(스펙 §4 writingStudio): Studio 에서만 draft/archived 배지 노출 허용. published=가장 강한 액션, archived=브론즈(삭제와 혼동 금지).
- 결정: 플랩 아래→위 물리 연출은 본 티켓 밖(TKT-070). S6은 선택 슬라이스(P3).

## 선행 읽기

- `design/implementation-spec-2026-07-06.md` (특히 §4 writingStudio/§6 S6/§7/부록 A)
- `design/mockups/2026-07-05/variant-a-seoul-signage.html`
- `design/mockups/2026-07-05/variant-c-night-line.html`
- `docs/feature-definition.md`

## 작업자 산출물

- 브랜치 이름: 브랜치 생성 없음(공유 워킹 트리, PM 커밋 대기).
- 모바일 재배치: 기존 `현재 상태 → 블로그 본선 → 놀이터 목록` 순서와 route-row 우선 노출 위에, 모바일 전용 하단 빠른 환승(`노선도`/`아카이브`/`승강장`)을 추가했다. 3열 `minmax(0, 1fr)`, 48px 터치 타깃, sticky 하단으로 구성했다.
- Writing Studio: `StatusBadge`에 Studio 전용 `preview`를 확장하고 초안→미리보기→공개→보관 흐름을 한 줄로 보이게 했다. 화면 모드는 한글/pressed 상태로, 저장은 보조, 공개 발행은 Exit Green 최강조, 보관은 브론즈로 구분했다.
- 반응형/접근성: 2026-08-16 375×812 전 페이지 오버플로 0 실측 기준을 유지하고, 신규 흐름은 2열 `minmax(0, 1fr)`, 하단 환승은 3열로 제한했다. 브라우저 CSSOM에서 모바일 규칙·48px 타깃·overflow 가드, `:focus-visible` 2px safety outline, reduced-motion의 노선 pulse/화면 전환 정지를 확인했다.
- 테마 검수: 브라우저에서 다크/라이트 모두 Studio 상태 흐름과 저장/발행/보관 위계를 육안 확인했다. 다크 archive `rgb(220,187,126)`, 라이트 archive `rgb(124,90,36)`, publish는 각 테마 Exit Green이며 데스크톱 가로 오버플로 0이다.
- 동작 검수: 미리보기 버튼을 누르면 editor가 숨고 preview가 표시되며, 상태 흐름에서 `미리보기`와 현재 저장 상태 `공개`가 함께 활성화되는 것을 확인했다.
- 빌드: `cd frontend && npm run build` 2회 통과(Vite 27 modules, 최종 819ms). `pwsh -File tools/run-frontend-build.ps1`는 이 호스트에 `pwsh`가 없어 실행 불가했으나, 스크립트의 핵심 프런트 빌드를 직접 통과했다.

## 검토 메모

- 없음

## Notes

- 플랩 아래→위 물리 연출은 TKT-070(실제 split-flap 모션)이 담당한다. 본 티켓은 플랩 CSS/JS 를 건드리지 않는다.
- 선택 슬라이스다. S1~S5 마감 후 여력이 있을 때 착수하며, 모바일 재배치와 Writing Studio 마감 두 조각은 필요하면 별도 PR 로 나눠도 된다.


## 진행 기록 (2026-08-16, claude — PO "이번엔 모바일" 지시로 모바일 몫 선행)

**모바일 재배치 1차 완료** (styles.css `@media (max-width:760px)` 블록 + JunctionMap `.map-scroll` 분리):

- 상태 바(wayfinding-bar)·통계(banner-stats): 구 720px 규칙의 세로 스택을 **가로 랩**으로 교체 — 상태 바 높이 ~290px→68px
- 환승 홀: **이동 목록(실 링크)을 노선도보다 먼저** (order 재배치, "축소 아닌 재배치" 원칙). SVG 는 `.map-scroll` 전용 컨테이너에서만 가로 스크롤 — 행 목록은 뷰포트 폭 유지
- route-row: 상태를 요약 아래 줄로 내리는 2행 그리드
- **flex 최소폭 오버플로 수정**: chip-button·section-head 등 flex 행이 min-content 로 페이지를 542px 까지 밀어 우측이 잘리던 문제 — min-width:0 가드 + flex-wrap. dispatch-table/work-board/district-grid 는 자기 컨테이너 스크롤
- 검증(375×812 실측): junction·elevator·taxi·work·bloghub·runtime 전부 **비의도 가로 오버플로 0**, 행 목록 우선 노출 확인

**잔여 (이 티켓의 나머지)**: Writing Studio 상태 흐름 마감, 시안 A/C 모바일 프리뷰의 세부(하단 빠른 환승 등), 스플래시 플랩 모바일 폭 미세조정.
