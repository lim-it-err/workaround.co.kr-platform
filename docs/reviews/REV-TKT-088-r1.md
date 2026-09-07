# REV-TKT-088-r1-draft — Line V 준비 화면 (개찰구 앞) (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-08-18. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: `frontend/src/components/VoyagePrepView.vue`(신설) + `frontend/src/App.vue`(라우팅 연결, 14줄 diff). 데이터 소스 `frontend/src/data/voyage.js`(수정 금지 — 실제로 미변경 확인). 트렁크 `codex/v0.6.0-line` 공유 작업 트리(미커밋, 작업자 codex-1).

## 요약 권고: **통과 — 완료 게이트 전부 실측 확인, 블로커 없음**

## 실행 검증

- `npm --prefix frontend run build` — 통과(vite 6.4.3, **20 modules** — 티켓 claim과 일치).
- **scope 준수**: `git status`로 이 티켓이 건드린 파일이 `App.vue`(routing 14줄만) + 신설 `VoyagePrepView.vue` 뿐임을 확인. `styles.css`는 무변경(`git status --short -- frontend/src/styles.css` 결과 없음 — 컴포넌트가 `<style scoped>`만 사용). **`data/voyage.js`는 git log상 이전 커밋(`1ca6587`)에서만 존재하고 이번 작업으로 변경되지 않음** — "수정 금지, 렌더만" 지시 준수 확인.
- 격리된 dev 서버(포트 7011, 종료 후 정리)로 실브라우저 검증.

## 완료 게이트 대조 (전부 실측)

### ① build + 다크/라이트 + 모바일 375px 오버플로 0
빌드 통과(위 참조). 375px에서 `document.documentElement.scrollWidth === clientWidth === 375`(오버플로 0) 확인, 스크린샷으로 2열 메트릭/도시 체인/체크리스트 카드가 `@media(max-width:760px)` 규칙대로 반응형 재배치됨을 시각 확인. 다크(`--accent:#55738F`)·라이트(`--accent:#36566F`) 양쪽에서 `.voyage-prep`의 `--accent`가 TKT-091에서 확정된 `--line-v` 값과 정확히 일치함을 `getComputedStyle`로 확인(교차검증).

### ② StationHeader(V01, line-v 액센트) + 카피 원칙
`VoyagePrepView.vue:67-76`에서 `StationHeader`에 `line-class="line-v"` `station-code="V01"`를 전달, 화면에 "V01 여행 준비 / VOYAGE" 렌더 확인. 카피 원칙(자기 해설 금지) 점검 — "이 화면은 ~을 보여줍니다"류 UI 해설 문구는 없음. `voyage-rationale`("직항 선택: 환승 실패 모드가 없다...")·`voyage-budget-note`("아끼는 순서: 숙소 등급 → 식비 → 입장료...")는 UI 해설이 아니라 `voyage.js`에 이미 정의된 여행 콘텐츠 자체라 위반 아님.

### ③ 체크 상태가 새로고침 후 유지 (localStorage)
**실제 풀 페이지 리로드로 재현**(단순 localStorage 값 확인이 아니라, 페이지를 `navigate`로 완전히 새로 로드한 뒤 컴포넌트가 스스로 복원하는지까지 확인):
1. 체크박스 2개(`flight`, `vignette`) 클릭 → `localStorage['workaround-voyage-checklist:east-europe-2026']`가 `["flight","vignette"]`로 저장됨을 확인.
2. `http://localhost:7011/`로 완전 리로드 → 스플래시 재통과 → voyage 화면 재진입.
3. 체크박스 11개 중 정확히 그 2개("항공권 OZ545/OZ546...", "비네트 — 오스트리아...")만 다시 체크된 상태로 렌더됨을 DOM에서 직접 확인.

검증 중 한 가지는 **직접 조사해서 오탐으로 기각**했다: 클릭 직후 동기적으로 `localStorage`를 읽으면 빈 값이 나와 처음엔 저장이 안 되는 줄 알았는데, `watch(checkedIds, ..., {deep:true})`가 Vue의 기본 flush 타이밍(마이크로태스크)이라 그런 것이었고, 100ms 뒤 재확인하니 정상 저장돼 있었다 — 실제 결함 아님, 테스트 타이밍 문제였음을 명시해둔다.

### ④ 여정 요약·체크리스트·예산·운영 원칙 4개 섹션
`get_page_text`로 전체 렌더 텍스트 확보해 `voyage.js` 원본과 대조:
- 여정 요약: 기간(9/8~9/18), 11일/9박, 도시 9(순환), 예산 856만원(항목 340+110+220+28+80+30+13+35=856 직접 합산 검증, 표시값과 일치) · 도시 체인 9개 전부 순서대로 렌더 · 출국/귀국 항공편(OZ545/OZ546) 시각·공항 코드 정확.
- 체크리스트: 11개 항목 전부 렌더, 초기 0/11(데이터의 `done:false` 전부와 일치).
- 예산 표: 8개 항목 + 합계/계획/상한여유(94만원 = 950-856, 직접 검산) 정확.
- 운영 원칙: 5개 카드 01~05 번호와 함께 전부 렌더.

## [제안] (경미, 블로커 아님)

- `voyage.js`의 `status: 'preparing'`(영문, 코멘트에도 한국어 대응 없음)가 화면 상단 eyebrow에 그대로 "PREPARING"(CSS `text-transform`로 대문자화)으로 노출된다(`VoyagePrepView.vue:81`, `{{ VOYAGE.status }}`). 사이트 전반이 "실시간 운행"/"부분 저하"/"개찰구 앞"처럼 한국어 우선인데, 이 한 곳만 영문 원시값이 그대로 사용자에게 보인다. 기능·완료 게이트엔 영향 없으나(장식적 eyebrow), 나중에 `boarding`/`arrived` 상태가 실제로 쓰일 TKT-089/090에서 이 매핑을 어떻게 할지 미리 정해두면 좋겠다.
- `watch(checkedIds, ..., { deep: true })` — `checkedIds`는 매번 통째로 새 배열로 교체되고(`Array.from(new Set(...))`) 원소도 문자열이라 `deep:true`가 불필요하다(해 없음, 단순화 여지).

## 상태 제안 (판정은 PM)

블로커 0, [제안] 2건(둘 다 경미). 완료 게이트 4개(빌드/테마/375px, StationHeader+카피, localStorage 유지, 4개 섹션 데이터 정확성) 전부 재실행·재현으로 확인했다. **finished 전환 권장.**


---
## PM 최종 판정 (claude, 2026-09-08)

**통과 → finished.** 리뷰어 실측 수용. 089 는 여행 당일(9/8) 실화면에서 DAY 1 프라하 자동 인식·3단 안내·운전 없는 날 표시를 PM 이 직접 재확인.
