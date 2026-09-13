문서 상태: 작성완료

# Advisor UX/UI 전면 검토 — 2026-09-14

- 작성: codex-8 디자이너. 사용자 직접 요청 + TKT-121 PM 메모의 입력 자료. **화면 검수 초안이며 최종 판정·스펙 결정은 PM(Claude)**이다.
- 이번 실행은 Advisor 검토 한 작업만 수행했다. 앱·콘텐츠·원칙·결정 문서를 수정하거나 commit/push하지 않았다.
- 기준: `design/tone-principles-2026-09-09.md`, `design/ux-copy-audit-2026-08-16.md`. 감사팀 `reports/advisory/AS-R008-advisor-rethink.md`와 함께 읽되, 아래 근거는 실제 화면·조작에서 수집했다.
- 결론: 학습 소재와 판정 경험은 살릴 가치가 있다. 하지만 입구에서는 목록·모드 선택을, 학습 중에는 긴 설명·화면 왕복을 먼저 요구한다. 박스만 제거하면 미제출 입력 손실과 다음 행동의 불명확함은 남는다.

## 1. 검증 범위와 한계

원본을 임시 디렉터리에 복사해 Node 24.19.0 / Vite 5.4.21로 Pages-base 빌드(99 modules) 후 localhost:4191에서 Chromium 실렌더했다. **15개 페이지 유형 × 다크 375/390/1440px + 라이트 390px = 60개 초기 상태**를 기록했다. 높이는 모두 900px이며 390px 전체 페이지 캡처와 주요 조작 후 캡처를 추가했다. 375/1440 다크와 390 라이트의 모든 페이지를 캡처했으나, 모든 콘텐츠·분기·테마 조합을 완주한 검증은 아니다.

API 요청은 차단했고 내장 샘플·새 브라우저 저장소·검증용 닉네임 `UX Review`만 사용했다. 온라인 AI 리뷰의 정확도·실서버 동기화·실제 비행 중 오프라인 재접속·Safari는 미검증이다. 제출 결과는 샘플 리뷰 경로로 검증했다. 샘플임을 알리는 화면 문구는 유지해야 한다.

- [렌더 원자료](UX-ADVISOR-2026-09-14-assets/inventory.json), [라이트 원자료](UX-ADVISOR-2026-09-14-assets/inventory-light.json), [조작 기록](UX-ADVISOR-2026-09-14-assets/flows.json), [재확인 기록](UX-ADVISOR-2026-09-14-assets/flows-final.json), [소스 SHA-256·검증 환경](UX-ADVISOR-2026-09-14-assets/manifest.json).
- 60개 초기 상태의 가로 넘침 **0px**, 처리되지 않은 브라우저 오류 **0건**. 접근성 전체 통과를 뜻하지 않는다. 작은 조작부는 아래 별도 지적했다.
- 소스 61개(Advisor src + 공유 StationHeader)의 복사본과 검토 종료 시 원본 해시 일치. 아래 파일:라인은 이 렌더 기준이다. 후속 구현 시 최신 파일과 대조해야 한다.
- 최초 흐름 스크립트의 `today` URL은 라우터 완료 대기 누락, `journey` 실패는 이미 열린 노드를 다시 눌러 닫은 검증 절차 오류였다. 수정한 `retry.cjs`와 `flows-final.json`으로 대체했다. `inflight`의 콘텐츠 부재는 실제 재현된 화면 문제다. 실패 로그를 제품 장애나 성공으로 둔갑시키지 않았다.

## 2. 첫 진입에서 오늘 할 일까지

**현재 최소 경로는 2번 선택**이다. `/missions` 진입 → `오늘의 훈련` → 첫 슬롯의 콘텐츠. 2026-09-14 화면의 선택지는 `사라지는 적립금 · Day 1`, `오늘의 판정 5장`, `정리하는 뇌`였다. 첫 슬롯을 선택하면 사건 파일로 이동했다. 필터 12개를 모두 선택해야 하는 구조는 아니다.

문제는 클릭 수보다 선택 전에 읽는 양이다. 390×900 첫 화면에서 공통 헤더·7개 메뉴가 본문 시작 전 **254px(높이의 약 28%)**을 차지한다. 홈은 설명, 오늘의 훈련 배너, 프로젝트 배너, 난이도·범위·유형·검색이 먼저 나오고 첫 실제 미션 링크의 시작은 **y=1118px**이다. 프로젝트 첫 단계도 기본 브리핑 아래 **y=1559px**부터 시작한다. 제목은 보이지만 ‘지금 할 한 가지’는 늦게 보인다. 이는 관찰값이며 3초 인지율을 측정한 사용자 실험은 아니다.

출처: `src/app/App.vue:53`, `pages/HomePage.vue:86`, `:99`, `:104`, `:161`, `pages/ProjectJourneyPage.vue:113`, `:140` (이후 `src`는 `services/advisor/frontend/src`, `pages`는 그 아래 `modules/missions/pages`). [홈 전체](UX-ADVISOR-2026-09-14-assets/home-390-full.png), [오늘](UX-ADVISOR-2026-09-14-assets/routine-390.png), [프로젝트 단계](UX-ADVISOR-2026-09-14-assets/flow-journey-node-final.png).

**[디자이너 의견]** 기본 입구를 ‘오늘 할 한 가지’로 만들고 전체 미션·게임·프로젝트는 ‘둘러보기’, 시즌·완료 내역은 ‘기록’ 아래 묶는 안을 추천한다. 감사팀의 3개 목적지 제안과 화면 근거가 맞는다. 메뉴 수만 줄이기 위해 콘텐츠를 없애거나 7개 메뉴를 이름만 바꿔 재나열하지 않는다. PM이 IA 변경 범위와 별도 티켓 필요 여부를 결정해야 한다.

## 3. 우선순위 상위 5

| 순위 | 문제·심각도 | 실증과 사용자 영향 | 변경 제안 / 재검수 기준 |
|---|---|---|---|
| 1 | **미제출 입력 손실 [블로커]** | 미션 제출 탭에 검증 코드를 입력 → ‘미션 목록’ → 같은 미션 제출 탭으로 복귀하면 빈 문자열. 이탈 확인이나 초안 상태 표시 없음. `MissionPage.vue:57`, `FileSubmitEditor.vue:34`. | 미제출 초안 복원과 저장 상태를 먼저 설계. 복원되지 않는 이동에는 이탈 보호. 파일명·여러 파일·본문을 입력한 뒤 목록 왕복/새로고침/탭 왕복에서 보존 여부와 상태 문구를 검증. 저장 방식·범위는 PM 결정. |
| 2 | **시작점·현재 단계가 묻힘 [중요]** | 헤더 254px, 홈 첫 미션 y1118, 프로젝트 첫 단계 y1559. 오늘은 3슬롯, 전체 카탈로그는 중첩 목록이라 시작을 고르기 전에 체계를 해독해야 함. | 오늘의 추천/이어서 하기 하나를 주인공으로, 목록·필터·전체 소개는 후순위. 390×900 첫 화면에서 다음 조작과 대상 이름을 찾을 수 있고 현재 최소 2선택을 늘리지 않아야 함. |
| 3 | **수행 순서·복귀 방향 불일치 [중요]** | Probe는 비활성 가설 → 아래 관측 → 결과 → ‘위의 가설’ → 아래 결말. 오늘에서 사건으로 들어가도 복귀는 `/games`. 기내 연습도 복귀는 `/games`. 리뷰의 ‘다음 미션으로’는 다음 미션이 아닌 목록. | 상황 → 관측 → 결과 옆 가설 → 결말 순서. 결과 다음 행동을 가까이 배치하고 출발한 오늘/기내 경로로 복귀. 버튼 이름과 실제 목적지 일치. |
| 4 | **정보 박스가 위계를 지움 [중요]** | 브리핑·상황·0개 통계·시즌 결과가 입력/선택과 같은 둥근 면을 사용. 홈과 게임 허브가 길게 반복됨. | 읽는 본문은 타이포와 hairline, 현재 질문/선택은 집중된 영역으로. 코드의 구문 가독성·입력 경계·선택 버튼은 보존. 내용 삭제가 아닌 배치 변경. 모바일뿐 아니라 1440에서도 읽기 폭과 주인공을 확인. |
| 5 | **선택 후 복구·모바일 조작 부족 [중요]** | ‘3분·운영’은 결과 0, ‘본 콘텐츠 포함’을 켜도 안내와 빈 결과 동일. 홈 필터 29px, 기내 시간/취향 38px, 미션 탭 39px 높이. 파일 제거 34×31px. | 실제 원인에 맞는 ‘시간 늘리기/조건 초기화’를 제공하고 빈 상태에서 바로 복구. 각 조작의 실제 hit area ≥40px. 설정과 추천을 함께 확인할 수 있게 순서를 재배치. |

입력 전후: [입력한 초안](UX-ADVISOR-2026-09-14-assets/flow-draft-before.png) → [복귀 후 소실](UX-ADVISOR-2026-09-14-assets/flow-draft-after.png). 흐름: [관측 후 위로 돌아가라는 안내](UX-ADVISOR-2026-09-14-assets/flow-probe-observed.png), [기내 빈 상태](UX-ADVISOR-2026-09-14-assets/flow-inflight-empty.png). 터치 수치는 `inventory.json`의 요소 경계와 `HomePage.vue:238`, `InflightPage.vue:105`, `FileSubmitEditor.vue:59`에 근거한다. 작은 체크박스 본체만으로 연결된 label까지 실패라고 판정하지 않았다.

## 4. 페이지별 평가 — 15종

`[원점 재검토]`는 목적·진입·진행 순서 재구성이 필요하다는 의견, `[개선]`은 현재 목적을 살린 배치/문구 수정, `[유지]`는 핵심 경험 보존 의견이다. **[유지]도 현행 박스·공통 헤더까지 승인한다는 뜻은 아니다.** 각 행의 조치는 PM 검토안이다.

| 화면 / 분류 | 보이는 문제·살릴 것·권고 | 파일:라인 근거 / 390 실화면 |
|---|---|---|
| **Home / [원점 재검토]** | 전체 커리큘럼 탐색이 첫 진입을 차지한다. 오늘 배너와 새 프로젝트 배너가 경쟁하고 첫 미션은 첫 화면 밖. 오늘 한 가지를 크게, 전체 목록은 행으로. 기존 난이도·범위 필터 기능은 상세 탐색에 보존. | `HomePage.vue:76`, `:86`, `:99`, `:104`, `:161` · [화면](UX-ADVISOR-2026-09-14-assets/home-390.png) |
| **Mission / [원점 재검토]** | 학습 단계와 제출 편집을 사용자가 4탭으로 관리하며 미제출 초안이 소실된다. 브리핑 기본 노출·다섯 배지가 과제보다 앞선다. 현재 단계와 다음 행동을 우선하고 상세 브리핑은 읽기 흐름으로. 코드 입력 경계는 유지. | `MissionPage.vue:50`, `:57`, `:176`, `:187`, `:291` · [브리핑](UX-ADVISOR-2026-09-14-assets/mission-390.png), [과제](UX-ADVISOR-2026-09-14-assets/flow-mission-task.png), [입력](UX-ADVISOR-2026-09-14-assets/flow-draft-before.png) |
| **Review / [개선]** | 점수·항목별 피드백·히든 케이스·평판·시나리오가 길게 쌓인다. 수정할 한 가지와 재제출을 먼저 제시하고 세부는 펼쳐 읽도록. 미제출 상태에서도 ‘코드 고쳐서 재제출/다음 미션으로’가 나와 현재 상태와 안 맞는다. ‘다음 미션’의 실제 목적지는 목록. 샘플 경고는 유지. | `ReviewPage.vue:94`, `:139`, `:153`, `:178`, `:224` · [빈 상태](UX-ADVISOR-2026-09-14-assets/review-390.png), [제출 결과 전체](UX-ADVISOR-2026-09-14-assets/flow-review-result.png) |
| **Routine / [개선]** | 오늘 날짜·현재 시간대 강조는 유용하다. 요일 7개와 출근/점심/저녁의 큰 카드가 먼저라 지금 시작할 콘텐츠가 시간표 안에 다시 들어간다. 현재 슬롯의 ‘시작’ 하나를 주인공으로, 나머지 두 슬롯은 얇은 행. | `RoutinePage.vue:49`, `:55`, `:82`, `:98` · [화면](UX-ADVISOR-2026-09-14-assets/routine-390.png) |
| **Swipe / [유지]** | 코드 한 조각 → 판정 → 이유 → 해설 → 다음 장의 리듬이 명확하며 5장 완료까지 작동했다. 코드 읽기 영역·선택 버튼을 유지. 완료 후 3개 통계 타일은 한 줄 결과와 오늘 복귀로 정리하고 두꺼운 외곽 카드·공통 헤더를 줄인다. | `SwipeReviewPage.vue:72`, `:86`, `:117`, `:147` · [질문](UX-ADVISOR-2026-09-14-assets/swipe-390.png), [완료](UX-ADVISOR-2026-09-14-assets/flow-swipe-complete.png) |
| **Games hub / [원점 재검토]** | 전체 게임 연습, 카드 서랍, 코드 없는 미션, 직접 플레이, 준비 중이 연속된다. 390 전체 높이 5747px. 연습/오늘의 차이를 설명 카드로 먼저 해설한다. 게임명 한 행과 소요 시간·진행 상태로 통합 탐색하고 카드를 읽는 뷰는 진입 후 제공. | `GamesPage.vue:65`, `:69`, `:73`, `:96`, `:115`, `:128`, `:172` · [첫 화면](UX-ADVISOR-2026-09-14-assets/games-390.png), [전체](UX-ADVISOR-2026-09-14-assets/games-390-full.png) |
| **Probe / [원점 재검토]** | 관측 전에는 누를 수 없는 가설이 실제 관측보다 먼저 온다. 닉네임 있는 390 화면에서 첫 관측 버튼 y1040. 결과를 읽고 위로 돌아가야 한다. 가설을 살펴보는 학습 의도는 유지하되 관측 후 결과 바로 아래에서 판정하도록 재배치. | `ProbeGamePage.vue:59`, `:74`, `:83`, `:99`, `:103` · [초기](UX-ADVISOR-2026-09-14-assets/probe-390.png), [관측 후](UX-ADVISOR-2026-09-14-assets/flow-probe-observed.png) |
| **Boundary / [개선]** | 상황·파이프라인이 먼저 길게 쌓여 닉네임 있는 390 화면의 첫 선택 y1163. 선택 두 개의 결과를 비교하는 학습은 유효했다. 상황을 압축한 요약과 경계 선택을 가까이, 결과 비교는 행 단위로. 상세 상황 원문은 보존. | `BoundaryGamePage.vue:43`, `:49`, `:93`, `:112` · [초기](UX-ADVISOR-2026-09-14-assets/boundary-390.png), [비교](UX-ADVISOR-2026-09-14-assets/flow-boundary-comparison.png) |
| **Practice / [개선]** | 한 문제·선택지·해설 구조는 이해 가능하고 기내 경로에서 완료 작동. 결과 뒤 ‘처음부터 다시/다음 판/무작위/안 본 판’이 동급. 다음 판 하나를 강조하고 나머지는 보조로. 기내에서 왔으면 기내 추천으로 돌아가야 한다. | `PracticeGamePage.vue:68`, `:75`, `:98`, `:103`, `:116` · [질문](UX-ADVISOR-2026-09-14-assets/practice-390.png), [해설](UX-ADVISOR-2026-09-14-assets/flow-practice-result-final.png) |
| **Case / [유지]** | 날짜별 단서를 접어 읽고 마지막에 판정하는 경험은 유지할 가치가 있다. 몰아보기로 5개 단서 공개→판정→해설 확인. 오늘 단서를 최상단 주인공으로, 배포 설명은 짧게. 읽기 본문 전체의 카드 면을 걷고 펼침 조작을 분명히 한다. | `CaseFilePage.vue:54`, `:62`, `:66`, `:83` · [초기](UX-ADVISOR-2026-09-14-assets/case-390.png), [판정](UX-ADVISOR-2026-09-14-assets/flow-case-result.png) |
| **Inflight / [원점 재검토]** | 읽기 전에 큰 소개·4시간 선택·5취향 선택·체크박스·글자 설정을 거친다. 추천은 첫 화면 아래. ‘3분·운영’의 잘못된 빈 상태 복구가 실제 막힘. 이어서 할 한 판을 먼저, 설정은 보조로. `OFFLINE MODE`와 내부 구현 설명은 사용자 결과 중심으로 줄인다. | `InflightPage.vue:19`, `:44`, `:47`, `:60`, `:79`, `:88`, `:93` · [설정](UX-ADVISOR-2026-09-14-assets/inflight-390.png), [복구 실패](UX-ADVISOR-2026-09-14-assets/flow-inflight-empty.png) |
| **Season / [개선]** | 네 스탯은 이미 행 구조이지만 큰 정보 카드와 빈 상태 카드가 남는다. 신규 사용자에게 0값보다 ‘오늘 첫 기록 만들기’가 우선. 최근 성장을 주인공으로, 수치는 보조 행. 시즌 개념 자체를 없앨 근거는 없다. | `SeasonPage.vue:55`, `:61`, `:81`, `:90` · [화면](UX-ADVISOR-2026-09-14-assets/season-390.png) |
| **History / [개선]** | 기록 열람 즉시 닉네임 모달이 먼저 나온다. 신규 사용자는 빈 기록도 보기 전에 입력해야 하며 취소 시 목록으로 돌아간다. 열람부터 허용하고 이름은 기록을 남길 때 요청하는 안. 4통계 타일보다는 최근 제출·다시 볼 항목을 우선. | `HistoryPage.vue:16`, `:26`, `:66`, `:96`, `:127` · [신규 게이트](UX-ADVISOR-2026-09-14-assets/history-390.png), [제출 후](UX-ADVISOR-2026-09-14-assets/flow-history-with-result.png) |
| **Projects list / [개선]** | 한 개의 프로젝트 카드로 목적은 단순하다. 프로젝트 카드 자체는 클릭 대상이므로 모두 장식 카드로 세면 안 된다. 제목·진행/이어서 하기·한 줄 설명의 행으로 다듬고 홈의 ‘새로운 모드’ 배너와 역할을 중복시키지 않는다. | `ProjectsPage.vue:15`, `:20` · [화면](UX-ADVISOR-2026-09-14-assets/projects-390.png) |
| **Project journey / [개선]** | 현재 노드 자동 펼침과 6단계 연결선은 좋다. 그러나 앞의 열린 브리핑이 현재 할 일을 y1559로 민다. 현재 단계·제출물·진행을 먼저, 전체 배경은 접어 읽도록. 샘플 첫 단계 제출 후 잠긴 노드 5→4개로 진행 확인. | `ProjectJourneyPage.vue:35`, `:113`, `:128`, `:153`, `:170` · [진입](UX-ADVISOR-2026-09-14-assets/journey-390.png), [제출 후](UX-ADVISOR-2026-09-14-assets/flow-journey-result.png) |

분류 합계: **원점 재검토 5 / 개선 8 / 유지 2**. 콘텐츠 ID를 가진 모든 미션·모든 연습 유형을 개별 평가한 수가 아니라 라우트별 페이지 유형 15종이다.

## 5. 고정 UX 체크리스트

| 항목 | 검수 의견 |
|---|---|
| 주인공 1개가 3초 안에 보이는가 | 홈·게임 허브·기내·미션·Probe 재구성 필요. 3초 사용자 실험은 미실시. 화면 위계와 실제 조작 위치를 근거로 판단. |
| 면은 조작부에만 있는가 | 미충족. 브리핑·상황·통계·빈 상태가 큰 면을 가진다. 전체 `.card` 개수를 위반 수로 취급하지 않음: 링크 카드와 버튼·입력 포함 컨테이너는 의미를 따로 판별. |
| 영어 섹션 간판 0 | 기내 `OFFLINE MODE` 미충족. `Reviewer Agent`, `루브릭`, `고급 — 엔진 토큰`은 학습/설정 맥락별 필요성 재검토. 브랜드 `Developer Advisor`와 코드 토큰까지 일괄 번역하지 않는다. |
| 노선색은 선·배지에만 | 기내 hero 그라데이션, 현재 슬롯·결과의 넓은 색면 재검토. 선택 버튼의 상태 표시는 남겨야 함. |
| 375px overflow 0 / 터치 ≥40px | 초기 15화면 가로 넘침 0. 홈 필터, 기내 선택, 미션 탭, 파일 제거는 40px 미달. inline 복귀 링크도 별도 hit area 필요. |
| 카피가 승인 목업과 같은가 | Advisor 15종의 승인 상세 목업과 1:1 대응은 확인하지 못했다. 현재 톤 원칙 기준 검토. ‘다음 미션’→목록, 미제출 상태의 ‘재제출’, 복구 불가 안내를 먼저 수정해야 함. |
| 지하철 배지·스플래시 10초 유지 | 공통 A 원형 역 배지는 렌더 확인. Advisor 직접 진입에는 모선 스플래시가 없으므로 10초 인트로는 이번 범위에서 미검증. 삭제/변경 제안 없음. |
| 라이트 테마에서도 성립하는가 | 390 라이트 15개 캡처에서 동일 구조와 overflow 0. 홈·오늘·기내·기록·프로젝트·리뷰의 시각 위계 문제도 동일. 전 텍스트 대비비·키보드/스크린리더 감사를 완료했다는 의미는 아님. |

## 6. PM에게 넘기는 결정 사항

**[반박]** TKT-121을 둥근 박스 제거·토큰 교체만으로 완료하면 위 입력 손실·잘못된 복귀·빈 상태 복구는 남는다. UX 1순위 완료 기준에 맞게 우선순위 1~5를 구현 또는 분할 티켓으로 다룰 것을 제안한다. 이 보고서가 앱 수정이나 정보 구조 변경 승인을 대신하지 않는다.

**[디자이너 의견]** 먼저 입력 보호와 목적지/안내 문구를 바로잡고, 오늘 입구·학습 진행 화면·전체 탐색 화면 순으로 목업을 확정하는 편이 낫다. 유지 대상으로 판정한 5장 판정, 사건 단서, 프로젝트 단계선의 학습 콘텐츠와 진행 규칙은 보존한다. 리뷰 샘플 표시를 감추거나 정보량을 줄이려고 해설 본문을 삭제하지 않는다.

PM 확인 요청: ①미제출 초안의 보존 범위 ②오늘/둘러보기/기록 IA 도입 여부 ③TKT-121 내 처리와 별도 티켓 경계. 구현·최종 판정은 PM과 담당 FE 레인에 넘긴다.

## 7. 해상도별 증거 색인

아래 캡처는 모두 같은 복사본의 초기 상태다. 390 전체 페이지와 흐름 캡처는 위 본문에서 연결했다.

| 화면 | 375 다크 | 1440 다크 | 390 라이트 |
|---|---|---|---|
| Home | [375](UX-ADVISOR-2026-09-14-assets/home-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/home-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/home-390-light.png) |
| Mission | [375](UX-ADVISOR-2026-09-14-assets/mission-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/mission-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/mission-390-light.png) |
| Review | [375](UX-ADVISOR-2026-09-14-assets/review-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/review-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/review-390-light.png) |
| Routine | [375](UX-ADVISOR-2026-09-14-assets/routine-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/routine-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/routine-390-light.png) |
| Swipe | [375](UX-ADVISOR-2026-09-14-assets/swipe-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/swipe-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/swipe-390-light.png) |
| Games hub | [375](UX-ADVISOR-2026-09-14-assets/games-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/games-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/games-390-light.png) |
| Probe | [375](UX-ADVISOR-2026-09-14-assets/probe-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/probe-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/probe-390-light.png) |
| Boundary | [375](UX-ADVISOR-2026-09-14-assets/boundary-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/boundary-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/boundary-390-light.png) |
| Practice | [375](UX-ADVISOR-2026-09-14-assets/practice-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/practice-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/practice-390-light.png) |
| Case | [375](UX-ADVISOR-2026-09-14-assets/case-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/case-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/case-390-light.png) |
| Inflight | [375](UX-ADVISOR-2026-09-14-assets/inflight-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/inflight-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/inflight-390-light.png) |
| Season | [375](UX-ADVISOR-2026-09-14-assets/season-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/season-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/season-390-light.png) |
| History | [375](UX-ADVISOR-2026-09-14-assets/history-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/history-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/history-390-light.png) |
| Projects list | [375](UX-ADVISOR-2026-09-14-assets/projects-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/projects-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/projects-390-light.png) |
| Project journey | [375](UX-ADVISOR-2026-09-14-assets/journey-375.png) | [1440](UX-ADVISOR-2026-09-14-assets/journey-1440.png) | [390 라이트](UX-ADVISOR-2026-09-14-assets/journey-390-light.png) |

재현 스크립트: [초기 상태](UX-ADVISOR-2026-09-14-assets/inventory.cjs), [라이트](UX-ADVISOR-2026-09-14-assets/light.cjs), [주요 흐름](UX-ADVISOR-2026-09-14-assets/flows.cjs), [경로 재확인](UX-ADVISOR-2026-09-14-assets/retry.cjs). 로컬 증거 경로·포트가 포함된 검수용 스크립트이며 앱 번들에 포함하지 않는다.
