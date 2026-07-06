문서 상태: 작성완료

# TKT-076

## 메타데이터

- 제목: UI 재구현 S6 - 모바일 재배치 + Writing Studio 마감 (선택)
- 우선순위: P3
- 대상 버전: `chore`
- 상태: `backlog`
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

- 브랜치 이름
- 모바일 재배치 우선순위/구현 요약
- Writing Studio 상태 흐름·강조 요약
- 반응형/접근성 검수 결과(두 테마)
- 검증 결과(run-frontend-build)

## 검토 메모

- 없음

## Notes

- 플랩 아래→위 물리 연출은 TKT-070(실제 split-flap 모션)이 담당한다. 본 티켓은 플랩 CSS/JS 를 건드리지 않는다.
- 선택 슬라이스다. S1~S5 마감 후 여력이 있을 때 착수하며, 모바일 재배치와 Writing Studio 마감 두 조각은 필요하면 별도 PR 로 나눠도 된다.
