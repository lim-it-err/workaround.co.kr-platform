# REV-TKT-089-r1-draft — Line V 일일 운행 안내 (오늘의 여행 지침서) (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-08-18. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: `frontend/src/components/VoyageDailyView.vue`(신설) + `VoyageView.vue`(신설, V01/V02 스위처) + `VoyagePrepView.vue`(수정 — `open-daily` emit 추가). 데이터 `voyage.js`(수정 금지 — 미변경 확인). 트렁크 `codex/v0.6.0-line` 공유 작업 트리(미커밋, 작업자 codex-1). 의존 TKT-088(선행 리뷰 통과 대기 중, `REV-TKT-088-r1-draft.md` 참조).

## 요약 권고: **통과 — 완료 게이트 전부 실측 확인, 블로커 없음**

## 구조 변경 확인 (TKT-088 대비)

TKT-088 리뷰 시점엔 `App.vue`가 `<VoyagePrepView>`를 직접 렌더했으나, 이번 티켓이 `VoyageView.vue`(신설, `activeView` 로컬 상태로 `VoyagePrepView`↔`VoyageDailyView` 스위칭)를 끼워 넣었다. `App.vue`(3847행)는 이제 `<VoyageView>`만 참조 — **scope 대로 App.vue 변경 없이 voyage 모듈 내부에서만 재배선**됐음을 확인(`git diff --stat frontend/src/App.vue` 결과 TKT-088 때와 동일한 14줄, 이번 티켓으로 인한 추가 변경 없음). `VoyagePrepView.vue`에 `open-daily` emit이 추가된 것도 "voyage 모듈 내" 선언 scope에 포함되므로 이탈 아님.

## 실행 검증

- `npm --prefix frontend run build` — 통과(vite 6.4.3, **24 modules** — 티켓 claim과 일치).
- **scope 준수**: `git status --short -- frontend/src/data/voyage.js`, `-- frontend/src/styles.css` 둘 다 결과 없음(미변경) — "데이터 수정 금지" 및 전역 스타일 비침습 확인. `StationHeader.vue`도 `git status`상 무변경 — `VoyageDailyView.vue`가 쓰는 `#actions` 슬롯은 기존(TKT-071/S1)부터 있던 확장점이라 이번 티켓이 새로 만든 게 아님(다른 페이지 20여 곳의 기존 `StationHeader` 사용과 호환, 회귀 위험 없음).
- 격리된 dev 서버(포트 7011, 종료 후 정리)로 실브라우저 검증. V01(`일일 안내` 버튼) → V02 이동 정상 확인.

## 완료 게이트 대조

### ① build + 모바일 375px 실측(스크린샷 필수)
빌드 통과(위 참조). 375px에서 `document.documentElement.scrollWidth === clientWidth === 375`(오버플로 0), 11개 날짜 도트 스트립이 한 줄에 전부 들어감을 확인. **스크린샷 2장 확보**: (a) 11일차(운전 없는 날, 초록 톤), (b) 9일차/9·16 예외일(운전 있는 날, 파란 액센트 톤) — 두 상태의 시각 구분이 색상만이 아니라 배지 텍스트("DRIVE FREE" vs "오늘의 운전")로도 이뤄짐을 확인.

### ② driveMin 분기 (핵심 로직, 3개 케이스로 직접 재현)
`hasDrive = driveMin > 0` computed를 실제 데이터 3개 케이스로 검증(단순 코드 판독이 아니라 날짜 이동 클릭 후 렌더 결과 대조):

| 날짜(인덱스) | driveMin | 기대 | 실측 |
|---|---|---|---|
| 9/8 (0) | 0 | "운전 없는 날" | ✅ "○ DRIVE FREE / 운전 없는 날 / 이동은 대중교통과 도보로 이어갑니다." |
| 9/9 (1) | 10 | 운전 배지 + 10분 | ✅ "↗ 오늘의 운전 / 10분" + 운전 원칙 문구 |
| 9/16 (8, 예외일) | 335 | 운전 배지 + 5시간 35분 | ✅ "↗ 오늘의 운전 / **5시간 35분**"(`formatDrive` 시·분 변환 직접 검산: 335÷60=5 나머지 35, 정확) + 동일 운전 원칙 문구 |

**검증 중 자체 발견·기각한 오탐**: 날짜 버튼 클릭 직후 동기적으로 DOM을 읽으면 이전 날짜의 값이 그대로 읽혀(Vue 렌더 flush가 비동기라) 처음엔 인덱스 매핑이 틀린 것처럼 보였다 — TKT-088 리뷰에서 겪은 것과 같은 종류의 타이밍 문제라 바로 알아채고, 클릭 후 짧은 대기를 넣어 재검증해 실제로는 정상 동작함을 확인했다.

### ③ 날짜 이동 경계값
인덱스 0에서 "전날" 버튼 `disabled=true`, 인덱스 10(마지막, 인천)에서 "다음날" 버튼 `disabled=true` 확인 — 범위 밖 이동 불가.

### ④ 다크/라이트
`.voyage-daily`의 `--accent`가 다크 `#55738F`/라이트 `#36566F`로 TKT-091 확정 `--line-v` 토큰과 정확히 일치(교차검증).

### ⑤ 콘솔 에러
`/api/services/elevator-service/*` 등 502/404뿐 — 이 리뷰 환경이 백엔드 게이트웨이 없이 프런트 단독 기동이라 발생(TKT-088/091 리뷰와 동일 원인, voyage 기능과 무관). 새 에러 없음.

## [제안] (경미, 블로커 아님)

- `todayIndex`가 실제 시스템 날짜(오늘 2026-08-18)를 `voyage.js`의 `days[].date`(2026-09-08~18)와 비교해 항상 -1이 나오므로 현재는 "일정 미리보기" 상태만 검증 가능했다 — "오늘 운행"(여행 중) 상태의 실제 렌더(당일 표기·pulse 등)는 여행 시작 전까지는 시스템 시계로 재현 불가능한 영역이라 이번 라운드에서 확인하지 못했다. 코드상 분기(`guideStatus`)는 존재하고 로직도 단순해 리스크는 낮지만, PM이 원하면 날짜를 임시로 바꿔치기하는 별도 수동 확인을 여행 직전에 한 번 권장.

## 상태 제안 (판정은 PM)

블로커 0, [제안] 1건(경미, 기능 결함 아님— 재현 환경 제약). 완료 게이트(빌드/375px 스크린샷/driveMin 분기 3케이스/경계값/양 테마) 전부 재실행·재현으로 확인했다. **finished 전환 권장.**


---
## PM 최종 판정 (claude, 2026-09-08)

**통과 → finished.** 리뷰어 실측 수용. 089 는 여행 당일(9/8) 실화면에서 DAY 1 프라하 자동 인식·3단 안내·운전 없는 날 표시를 PM 이 직접 재확인.
