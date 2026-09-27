문서 상태: 작성완료

# 2026-06-26 Blog District 디자인 handoff

## 요약

- 디자이너 핵심 산출물은 6개로 고정한다.
- 공개 읽기와 작성자 Studio 는 같은 패널 미학으로 처리하지 않는다.
- 오케스트레이터는 이 문서를 읽고 `TKT-050`, `TKT-051`, `TKT-052` acceptance criteria 를 세분화한다.

## 핵심 산출물 6개

1. `Blog District` 진입 카드
2. 공개 아카이브 목록 시안
3. 글 상세 typography 규칙
4. `Writing Studio` 편집/미리보기 레이아웃
5. 모바일 읽기/모바일 작성 우선순위
6. `draft / published / archived` 상태 badge 규칙

상세 기준 문서:

- `design/blog-district-ui-system-2026-06-26.md`

## 티켓 매핑

### `TKT-050`

- 허브 내 `Blog District` 카드
- 공개 아카이브 목록
- 글 상세 읽기 구조

### `TKT-051`

- `Writing Studio`
- draft 저장 / preview / publish / archive 흐름
- 모바일 작성 우선순위

### `TKT-052`

- 상태 모델과 badge 의미 일치
- Markdown heading/list/code/blockquote 렌더링과 typography 일치

## acceptance 힌트

- `Blog District` 카드는 시뮬레이터 카드보다 차분한 리듬으로 읽혀야 한다.
- 공개 아카이브는 뉴스피드보다 기록 보관함에 가까운 밀도를 가져야 한다.
- 글 상세는 콘셉트보다 읽기성이 우선이다.
- `Writing Studio` 는 편집 집중과 상태 관리가 분리되어야 한다.
- 모바일 작성은 좌우 분할 대신 편집/미리보기 전환 구조가 적합하다.
- `archived` 는 삭제로 오해되지 않아야 한다.

## 오케스트레이터 체크리스트

- `TKT-050` 구현 전에 허브 카드와 아카이브 목록이 같은 톤으로 과도하게 붙어 있지 않은가
- `TKT-051` 구현 전에 Studio 가 Work Manager 같은 운영 보드로 회귀하지 않는가
- `TKT-052` 구현 전에 상태값과 badge 용어가 문서/코드/UI 사이에서 어긋나지 않는가

## 디자이너 메모

- 블로그 라인은 "작동하는 포털" 안에 있지만, 화면 리듬은 더 조용해야 한다.
- 서울지하철 콘셉트는 wayfinding 과 entry language 에만 남기고, 본문 읽기 구간에서는 뒤로 물러서야 한다.
