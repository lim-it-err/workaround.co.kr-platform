문서 상태: 작성완료

# TKT-108 `[FE]` Line V 컬렉션 전환 — VOYAGES[] + 여행 목록 화면 + 지난 여행 2건

- 상태: `finished` (REV-TKT-108-r1 통과, PM 2026-09-14)
- 우선순위: P1
- 담당: codex-1 (FE)
- 관련 스펙: `design/voyage-collection-spec.md` (단일 진실)
- scope: `frontend/src/data/voyage.js`→`voyages/**`, `frontend/src/components/Voyage*.vue`·`voyage/**`, `frontend/src/App.vue`(V 진입), `frontend/src/data/lines.js`(V rowStops), 관련 테스트

## 목표
스펙 §1~§3. 동유럽 콘텐츠·화면 회귀 0 을 지키며 컬렉션으로 전환, 여행 목록 화면 신설, 스페인(2024-09)·아이슬란드(2025-09) 시드 등록. 콘텐츠 본문은 PM 이 이후 채운다 — 구조만.

## 완료 조건
스펙 §4 그대로 (목록 3건·강조·기록 진입 / 기존 테스트 그린 + 저장키 이행 테스트 / build·375px).

## 구현 결과

- 기존 동유럽 데이터를 `frontend/src/data/voyages/east-europe-2026.js`로 옮기고 스페인·아이슬란드 뼈대 파일 및 `VOYAGES` 최신순 인덱스를 추가했다. 기존 import를 위한 `VOYAGE` 호환 별칭은 현재 `boarding` 여행을 가리킨다.
- 여행 화면들이 `voyage` 객체를 받도록 전환하고, 진행 중 여행 직행·상단 여행 목록 링크·3건 컬렉션 목록·지난 여행 기록 빈 상태를 구현했다. 과거 여행 상세 본문은 추가하지 않았다.
- 여행별 저장키를 `voyage:<id>:archive|checklist`로 분리하고 기존 동유럽 키를 한 번 이행한 뒤 제거하도록 했다. 글쓰기 통합 백업도 새 키를 사용한다.
- V 노선 부제와 앱 헤더를 현재 여행/컬렉션 문맥으로 바꿨다.

## 질문/결정 기록

- 열린 질문 없음.
- `approximate`인 지난 여행은 월 단위로만 표시하고, 상세 미입력 상태를 `0개 도시 · 기록 보기`와 기록 화면 한 줄로 사실대로 노출했다. PM 콘텐츠가 들어오면 같은 데이터 파일만 채우면 된다.

## 완료 게이트

- `npm --prefix frontend run build` — 통과, 54 modules.
- `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` — 통과, 54 modules.
- `node --test frontend/src/staticRouting.test.mjs frontend/src/staticWritingState.test.mjs frontend/src/data/voyageCoverage.test.mjs frontend/src/data/voyageCollection.test.mjs frontend/src/data/voyageStorage.test.mjs frontend/src/sim/taxiDispatch.test.mjs` — 15/15 통과.
- `node --test frontend/src/components/WritingStudio.e2e.mjs` — Chromium 9/9 통과. 새 여행 저장키를 포함한 통합 백업 회귀 확인.
- `node --test frontend/src/components/VoyageCollection.e2e.mjs` — Chromium 2/2 통과. 375×812 dark·1440×900 light에서 현재 여행 직행, 3건 목록, 지난 기록 진입, API 요청·브라우저 오류·가로 overflow 0.
- 375px dark 목록/빈 기록과 1440px light 캡처를 직접 확인했다. 주인공 1개·시각표 행·한 줄 빈 상태가 톤 원칙에 맞고 핵심 동작이 첫 화면에서 보인다.

## 작업자 산출물

- 브랜치: `codex/v0.7.0-tone`
- 커밋/푸시: 없음(PM 전담).
- 주요 파일: `frontend/src/data/voyages/**`, `frontend/src/data/voyageStorage.js`, `frontend/src/components/VoyageIndexView.vue`, `frontend/src/components/VoyageEmptyArchiveView.vue`, `frontend/src/components/VoyageView.vue`, 관련 회귀 테스트.

## 검토 메모

- 스페인·아이슬란드의 상세 도시·본문·사진은 의도적으로 비어 있다. PM이 PO 자료를 정리한 뒤 데이터만 보강해야 한다.
- Safari/WebKit 실기와 실제 GitHub Pages 배포는 미검증이다.
- 공유 워킹트리의 TKT-102 목업·UX 문서는 본 티켓에서 수정하지 않았다.

## PR 준비 메모

- 제목: `feat(voyage): add multi-trip collection and scoped storage`
- 본문 요약: Line V를 단일 여행에서 3건 컬렉션으로 전환하고, 현재 여행 직행·지난 기록 빈 상태·여행별 저장키 이행을 추가한다.

## 리뷰 기록

- r1 **통과** — `docs/reviews/REV-TKT-108-r1.md`. 목록 톤은 112, 지난 여행 콘텐츠는 PM.
