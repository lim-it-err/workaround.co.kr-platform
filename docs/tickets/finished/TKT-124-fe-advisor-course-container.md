문서 상태: 작성완료

# TKT-124 `[FE]` Advisor 코스 컨테이너 — 코스 = 정류장, 미션 형식 3종

- 상태: finished (2026-09-14, REV-TKT-124-r1 통과) · P1 · 담당: codex-1 · 의존: TKT-121(톤 정합) need_review 시. 브랜치 codex/v0.7.0-tone. **UX 1순위·[반박] 의무.**
- 스펙: `design/advisor-course-spec.md` §1
- scope: `services/advisor/frontend/src/modules/missions/**`(콘텐츠 파일 제외 — `sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js` 불가침), routes, store, 테스트

## 목표
`courses[]` 모델 + 코스 목록/상세 화면(시각표 행, 형식 배지 코딩/게임/시뮬), 기존 미션은 "기본 코스"로 자동 묶음(회귀 0). 코스 상세에서 각 형식이 기존 페이지(MissionPage/게임/시뮬)로 진입. 감사 원점 재검토 결과가 오면 표면 구조를 그에 맞춰 조정 — 그 전엔 기존 라우트 위에 코스 층만 추가.

## 완료 조건
1. 코스 목록에 기본 코스 + 비엔나 1900(빈 껍데기, 123 콘텐츠 전) 표시. 2. 형식 배지·진입·복귀. 3. unit/E2E 회귀 + 코스 테스트 3건. 4. 375/1440.

## 구현 내역 (2026-09-14, codex-1)

- `courses[]` 모델로 기존 39개를 `기본 코스(A01)`, TKT-123의 12개를 `비엔나 1900(A02)`에 묶고 배우기·독립 코스 목록·상세 시각표를 연결했다.
- 코딩 6개는 기존 `MissionPage`, 게임 5개는 기존 `PracticeGamePage`, 시뮬 1개는 격납고의 순수 택시 배차 전이 엔진을 재사용한 `CourseSimulationPage`로 진입한다. 코딩·게임은 브라우저 history state에 코스 출발지를 보존해 상세로 복귀한다.
- 읽기 콘텐츠는 카드 면 없이 hairline 시각표 행으로 구성하고, A 정류장 원형 배지와 `코딩 / 게임 / 시뮬` 형식 배지만 노선색 포인트로 썼다.
- 콘텐츠 파일 `sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`는 수정하지 않았다.
- 공유 파일: `LearnPage.vue`, `MissionPage.vue`, `ReviewPage.vue`, `PracticeGamePage.vue`, `routes.js`, `missions.js` (TKT-121과 겹침, TKT-121은 작업 중 PM이 r1 통과·커밋).

## 검증

- `npm run test:unit`: 12 files, 66/66 통과(코스 모델·12개 형식 분류·세 형식 경로 3건 포함).
- `npx playwright test`: Chromium 30/30 통과(신규 코스 E2E 3건 + 기존 27건 회귀).
- `npm run build`: 116 modules 통과. Pages base `/workaround.co.kr-platform/advisor/` 빌드도 116 modules 통과.
- 실렌더: 1440px 다크·라이트 코스 상세, 1440px 라이트 시뮬 입력/결과, 375px 다크 전체 12행을 직접 확인했다. E2E에서 375·1440 가로 overflow 0을 확인했다.
- `git diff --check` 통과, 불가침 콘텐츠 3파일 diff 없음. commit/push 없음.

## 남은 위험

- 콘텐츠 전체 로더가 초기 번들에 들어가 Vite가 `index` 503.14kB(minified, 278.84kB gzip) 경고를 낸다. 기능·Pages 빌드는 통과했으며, 코스가 늘어날 때 route 단위 콘텐츠 lazy-load 분리가 필요하다.
- Safari/WebKit과 실제 GitHub Pages 배포는 미검증이다.

## PR 준비 메모

- 제목 초안: `[advisor] 코스 정류장과 비엔나 1900 수행 경로 추가`
- 포함: 코스 모델·목록/상세·게임 카탈로그·배차 엔진 재사용 시뮬·복귀 문맥·unit/E2E.
- 제외: V↔A 환승(TKT-125), 배우기 통합 필터·GamesPage 폐기(TKT-129), Probe/기내/결과 흐름(TKT-130).

## 리뷰 기록
- r1 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-124-r1.md`. [제안] 번들 lazy-load → 129 메모, 시뮬 `생각해 볼 질문` 빈 절 → 130 확인.
