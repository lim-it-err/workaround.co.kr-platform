# 디자인 운영 기준

문서 상태: 작성완료

이 폴더는 이 저장소의 UI/UX 기준선과 디자이너-오케스트레이터 협업 기록을 관리한다.

## 목적

- 현재 화면의 문제를 문서로 진단한다.
- 사용자에게 확인이 필요한 질문을 정리한다.
- 시각 규칙, 정보 구조, 인터랙션 원칙을 문서로 고정한다.
- 오케스트레이터가 구현 티켓을 만들 때 참고할 단일 디자인 기준선을 제공한다.
- 데스크톱과 모바일을 별도 제품면처럼 검토한다.

## 역할

- 디자이너
  - 관련 `docs/`, `docs/history/`, `design/` 문서를 읽고 UI/UX를 진단한다.
  - 개선 기준, 감사 기록, 사용자 질문, 리뷰 요청을 이 폴더에 남긴다.
- 오케스트레이터
  - 이 폴더의 문서를 읽고 구현 가능한 티켓과 acceptance criteria 로 번역한다.
  - 개발 제약이나 구현 상태를 `design/orchestrator_review/` 에 append 한다.

## 폴더

- `designer-role.md`: 디자이너 책임과 작업 규칙
- `ui-ux-rules.md`: 현재 기준 디자인 원칙
- `current-ui-audit-2026-06-14.md`: 현행 사이트 진단
- `questions-2026-06-14.md`: 사용자 확인 질문
- `main-page-router-concept-2026-06-15.md`: 메인 페이지 라우터형 시안 문서
- `seoul-subway-ui-ux-system-2026-06-15.md`: 서울지하철 레퍼런스 기반 UI/UX 시스템 문서
- `v0.5.0-prototype-route-2026-06-21.md`: `/test/v0-5-0` 기준 가상 화면과 모바일 설계 문서
- `blog-district-ui-system-2026-06-26.md`: 블로그 허브, 공개 읽기, Writing Studio, 상태 badge 기준 문서
- `orchestrator_review/2026-06-26-blog-writing-space-brief.md`: 블로그 공간과 글쓰기 스튜디오를 위한 디자이너 브리프
- `orchestrator_review/2026-06-26-blog-district-design-handoff.md`: 블로그 디자인 산출물과 티켓 매핑 handoff 문서
- `orchestrator_review/`: 진행 중 review 대화
- `orchestrator_review/2026-06-15-dummy-prototype-handoff.md`: 더미 프로토타입과 구현 슬라이스 handoff 문서
- `orchestrator_review/2026-06-21-v0.5.0-prototype-handoff.md`: `v0.5.0` 프로토타입 레일 handoff 문서
- `review_done/`: 종료된 review 기록

## 운영 규칙

1. UI/UX 관련 작업 전에는 관련 `docs/*`, 최신 `docs/history/*`, 관련 `design/*` 를 읽는다.
2. 디자이너는 문제를 바로 구현 지시로 쓰지 말고, 먼저 문제 정의와 기대 경험을 문서화한다.
3. 오케스트레이터는 UI/UX 구현 티켓을 만들 때 관련 디자인 문서 경로를 티켓에 남긴다.
4. 진행 중 소통은 `design/orchestrator_review/` 문서에 append 만 한다.
5. 합의가 끝난 review 문서는 `review_done/` 으로 이동한다.
6. 세부 툴은 자유롭게 확장할 수 있다. 다만 현재 저장소 기준 공식 산출물은 Markdown 문서로 남긴다.
7. `design/` 아래 문서를 수정하기 시작할 때는 먼저 `문서 상태: 수정중` 을 표시하고, 끝나면 `문서 상태: 작성완료` 로 바꾼다.
8. 다른 작업자가 `수정중` 으로 잡아 둔 디자인 문서는 기준선으로 가져와 확정하지 않는다.
9. 가상 디자인 화면은 실사용 경로와 분리한다. 기본 검수는 `/test`, 다음 버전 프로토타입은 `/test/v0-5-0` 아래에 둔다.

## 검수 방식

- 정지 스크린샷만으로 디자인을 확정하지 않는다.
- 기본 검수 단위는 아래 순서를 따른다.
  1. 실제 페이지 진입
  2. 자동 전환 확인
  3. 클릭/스크롤/섹션 이동 확인
  4. 데스크톱과 모바일 각각 재검수
- 스크린샷은 기록용 보조 수단으로만 사용한다.
- 가능하면 브라우저를 직접 탐색하면서 정보 흐름, 스크롤 리듬, 조작 감각을 본다.

## 추천 도구

- 기본 기준선: Markdown 문서
- 1차 검수: 실제 브라우저 탐색, 반응형 뷰포트 확인, 스크롤/전환 확인
- 가상 시안: `frontend/src/App.vue`, `frontend/src/styles.css` 의 `/test` 또는 `/test/v0-5-0` 프로토타입
- 빠른 보조 기록: 스크린샷, annotated image, 와이어프레임 문서
- 고정밀 시안이 필요할 때: Figma 링크를 별도 문서에 추가 가능

