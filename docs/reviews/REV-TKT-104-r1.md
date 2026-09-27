문서 상태: 작성완료 (리뷰어 초안 — 최종 판정은 PM)

# REV-TKT-104-r1 (draft) — Inflight 필터 pill 접근성 후속 (aria-pressed)

- 검증자: 리뷰어 (Claude Sonnet 5)
- 검증일: 2026-09-10
- 대상: `docs/tickets/need_review/TKT-104-fe-inflight-pill-aria.md`
- 배경: `REV-TKT-098-r1-draft.md`의 [중요] 지적("시간·취향 선택 pill 버튼에 aria-pressed 없음")에 대한 후속 수정 티켓.
- 검증 위치: `cd /Users/imjeonghan/newProject/workaround.co.kr-platform/services/advisor(/frontend)` 절대경로 이동 후 `pwd` 확인.

## 범위 검증

- 변경분: `services/advisor/frontend/src/modules/missions/pages/InflightPage.vue`(수정), `services/advisor/frontend/e2e/inflight-accessibility.spec.ts`(신규) — 선언 범위와 정확히 일치. `git status --short` 로 다른 파일 없음 확인.
- `git diff --check`: 클린.

## 수정 코드 직접 대조 (내가 원 리뷰에서 지적한 바로 그 지점)

`InflightPage.vue:63,67` — 내가 REV-TKT-098-r1에서 인용했던 바로 그 줄에 정확히 수정이 들어갔다:

```
:aria-pressed="prefs.duration === duration"   (line 63)
:aria-pressed="prefs.taste === taste.id"      (line 67)
```

기존 `:class="{ active: ... }"` 바인딩과 **동일한 조건식**을 그대로 재사용해 시각 상태와 접근성 상태가 어긋날 여지가 없다. 선택 로직·CSS·저장 계약 변경 없음.

## 완료 게이트 재실행

| # | 게이트 | 결과 | 근거 |
|---|---|---|---|
| 1 | `npm run test:unit` (advisor frontend) | 통과 — 8 files, 44/44 | 직접 재실행, claim과 일치 |
| 2 | `npm run build` (advisor frontend) | 통과 — 96 modules | 직접 재실행, claim과 일치 |
| 3 | `npm run test:e2e` (advisor frontend, 전체) | **17/17 통과** | 직접 재실행. 신규 `inflight-accessibility.spec.ts` 2건(dark/light 375px) 포함 기존 15건 전부 그린 — 회귀 없음 확인 |
| 4 | `npm --prefix frontend run build` (모선) | 통과 — 36 modules | 직접 재실행, claim과 일치 |
| 5 | 커밋/push 여부 | 없음 | 재확인 |

## 신규 E2E 테스트 품질 검증 (적대적 관점 — 형식적 통과 테스트인지 확인)

`inflight-accessibility.spec.ts`를 직접 읽고 다음을 확인했다 — 오답을 고정하는 얕은 테스트가 아니다:

- `expectSelection` 헬퍼가 그룹 내 **모든 버튼**을 순회하며 `aria-pressed` 값이 기대 boolean과 정확히 일치하는지, 그리고 `active` CSS 클래스와도 일치하는지 **교차 검증**한다(내가 지적한 "시각 상태와 접근성 상태 불일치" 문제를 정확히 겨냥).
- Playwright의 `getByRole('button', { pressed: true })`는 실제 ARIA pressed 상태(즉 `aria-pressed` 속성)를 근거로 조회하므로 DOM 문자열이 아니라 접근성 트리 자체를 검증한다.
- 시간 4개·취향 5개 전 옵션을 순회하며 클릭 후 정확히 1개만 pressed=true인지, 다른 그룹은 영향받지 않는지 확인.
- **키보드 조작**(Enter/Space)으로도 선택이 되는지, 새로고침 후 ARIA·시각 상태가 함께 복원되는지, 375px 가로 overflow 0, 페이지 에러 0까지 확인.
- 티켓의 "수정 전 새 E2E 2건 실패" 주장은 직접 재현하지 않았으나(운영 코드 되돌리기는 리스크 대비 실익이 낮다고 판단), `toHaveAttribute('aria-pressed', ...)` 단언은 속성 자체가 없던 수정 전 상태에서는 반드시 실패했을 것이므로 주장이 허위일 가능성은 낮다고 본다.

## 실브라우저 추가 확인

`services/advisor/frontend` 자체 빌드로 프리뷰를 띄워 `/inflight`에서 9개 pill 전체의 `aria-pressed`/`active` 클래스를 JS로 직접 조회 — 선택된 "10분 세 판"·"랜덤"만 `aria-pressed="true"`, 나머지 7개는 `"false"`로 정확히 일치함을 자동화 스위트와 별개로 재확인.

## 지적사항

없음. 이번 검증에서 [블로커]/[중요]/[제안]급 결함을 발견하지 못했다.

## 종합 의견 (초안 — 최종 판정은 PM)

내가 REV-TKT-098-r1에서 제기한 [중요] 지적이 정확한 위치에, 정확한 방식(기존 조건식 재사용)으로 수정됐음을 코드 대조로 확인했고, 완료 게이트 4종(unit 44/44·advisor build 96 modules·E2E 17/17·모선 build 36 modules)을 전부 직접 재실행했다. 신규 회귀 테스트 자체의 품질도 얕지 않음을 확인했다. 범위 위반 없음, 커밋·push 없음. finished 전환을 권장한다.

## PM 판정 (2026-09-11) — **통과 → finished**
PM 재실행: advisor unit 44/44. 리뷰어 E2E 17/17·실브라우저 aria-pressed 대조 인정. 블로커 0.
