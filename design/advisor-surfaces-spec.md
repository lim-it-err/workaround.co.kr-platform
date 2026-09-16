문서 상태: 작성완료

# Developer Advisor 3표면 스펙 — 오늘 / 배우기 / 기록 (2026-09-14, PM)

근거: 감사 원점 재검토 `reports/advisory/AS-R008-advisor-rethink.md` §4·§9, 디자이너 전면 검수 `docs/reviews/UX-ADVISOR-2026-09-14.md` §3·§6, 톤 원칙 5(분류는 3묶음). 결정 D-020(제안됨, PM 잠정 시행 — ASK Q-015).

## 1. 표면 3개 — 이름·책임·URL

| 표면 | 책임 | 소유 콘텐츠 | URL | 기존 URL 이행(첫 배포는 alias/redirect, 삭제 없음) |
|---|---|---|---|---|
| **오늘** | 앱 기본 진입. "다음 한 걸음" 하나를 가장 크게 | 오늘 카드 1 + 접힌 보조(오늘 전체 2~3칸, 연속 기록, `오프라인 세션 만들기`) | `/today` (`/` → `/today`) | `/routine` → `/today` · `/inflight` → `/today#offline`(기내 실행 문서 링크 보존, 설정 UI 는 오늘 안 섹션) |
| **배우기** | 미션·사건 파일·프로젝트·전체 연습·코스를 길이와 형식으로 찾는 서가 | 코스(124) · 미션 39 · 사건 파일 · 프로젝트 · practice 131판 | `/learn` | `/missions` → `/learn` · `/games` → `/learn#practice` · `/projects` → `/learn#projects` |
| **기록** | 제출·리뷰 이력, 현재/완료 시즌, 장기 통계 | 이력(현 `/missions/history`) · 시즌(현 `/season`) · 누적 통계 | `/history` | `/missions/history` → `/history` · `/season` → `/history#season` |

- 상세·수행 딥링크는 그대로: `/missions/:id`, `/missions/:id/review`, `/games/practice/:gameId/:roundId?`, `/games/probe`, `/games/boundary`, `/games/case/:caseId`, `/routine/swipe`, `/projects/:id`.
- 상단 전역 메뉴는 정확히 3개. 게임명(판정/관측/경계/사건)은 목적지가 아니라 카드의 작은 **형식 배지**.
- 저장 키 `advisor.learner.v1`·`advisor.practice.v1` 은 이행 없음. practice 가 daily·streak·season 을 바꾸지 않는 격리는 유지.

## 2. 오늘 카드 선택 규칙
1. 미완료 사건 파일 이어보기 → 2. 시간대 슬롯(기존 루틴 엔진) → 3. 새 추천. 주 CTA 는 하나: `이어서 하기` 또는 `오늘의 첫 판 시작`. 390×900 첫 화면에서 대상 이름과 다음 조작이 보여야 한다(UX-ADVISOR 우선순위 2 재검수 기준).

## 3. 완료 후 흐름
결과/리뷰 화면에 `기록에 저장됨` 표시와 `내 기록 보기` 하나. 복귀는 **출발한 표면**(오늘/배우기)으로 — 진입 시 `from` 을 라우트 state 로 넘긴다. 버튼 이름 = 실제 목적지(`다음 미션` 이 목록이면 `목록으로`).

## 4. 미제출 초안 저장 계약 (UX-ADVISOR 우선순위 1 [블로커])
- 키: `advisor.drafts.v1` = `{ "<missionId>:<mode>": { files: [{ name, body }], description, updatedAt } }` — 미션·모드 전환 시 서로 덮어쓰지 않는다.
- 저장: 입력 debounce ≤500ms + 라우트 이탈 시. 복원: 페이지 진입 시 해당 키 전부(파일명·여러 파일·본문·설명).
- 상태 문구: `setItem` 성공 뒤에만 `저장됨 HH:MM`. 실패(quota 등)는 입력 유지 + `저장 실패 · 다시 시도` + 라우트 이탈 보호(confirm).
- 삭제: 제출 **응답 성공** 시 그 제출분만(`updatedAt ≤ 제출 시각`). 응답 대기 중 새로 쓴 내용은 보존. 보존 기간 무제한. 기록 화면에는 노출하지 않는다.
- 재검수 기준: 목록 왕복·탭 전환·새로고침 3경로 보존, 저장 실패 시나리오 1건, 제출 성공 후 비움 1건.

## 5. 이행 단계 (티켓 경계)
| 단계 | 티켓 | 범위 |
|---|---|---|
| 1 | **TKT-121** | 3표면 뼈대(상단 3·`/`→오늘·alias) + 톤 정합 + §4 입력 보호 + §3 카피/목적지 일치 + 조작부 ≥40px. 기록 표면은 현 SeasonPage·history 임베드만 |
| 2 | **TKT-124** | 배우기 안의 코스 컨테이너(코스=정류장, 형식 3종) |
| 3 | **TKT-129** | 배우기 통합 인덱스(필터 4축: 시간·코드 작성 여부·형식·완료 여부, 고급 필터 접힘) + GamesPage 중복 표면·"시즌제 스탯 준비 중" 폐기 |
| 4 | **TKT-130** | 흐름 결함: Probe 순서(상황→관측→결과 옆 가설→결말), 기내 빈 상태 복구(`시간 늘리기`/`조건 초기화`), 결과 화면 `기록에 저장됨`+`내 기록 보기` |
| 병렬 | **TKT-122**(PM 스펙) → 후속 FE | 시즌 수명주기 `seasonsById + activeSeasonId`, 종료 후 명시적 새 시즌 시작 |
| 후 | **TKT-125** | 여행(V) ↔ 배움(A) 환승 |

## 6. 수용 TC (AS-R008 §9 최소 TC + 검수 재검수 기준)
- `/advisor/` 첫 화면 전역 목적지 3개·주 CTA 1개. 오늘의 다음 항목까지 1회 동작.
- 기존 15개 URL 404 없이 새 의미로 도달, 저장된 루틴/last practice 링크 복원.
- practice 격리 테스트 유지. 오프라인 세션 생성·이어보기(네트워크 차단) 유지, 375px 키보드/overflow.
- §4 초안 3경로 보존 + 실패 + 제출 후 비움. 조작부 hit area ≥40px(홈 필터·기내 시간/취향·미션 탭·파일 제거).
- 콘텐츠 파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) 무접촉.
