문서 상태: 작성완료

# 티켓 보드

> **PM 일괄 레인 배정 (2026-08-17)**: backlog 구 티켓에 `[FE][BE][INFRA][SIM]` 태그와 착수 판정을 PM 이 일괄 부여했다. 티켓 파일 메타데이터 갱신은 착수 시점에 구현자가 상태 전환과 함께 수행한다 (보드=인덱스, 파일=진실 원칙의 한시적 예외 — 감사팀 참고).

## Backlog

- `TKT-010` `P1` `v0.1.2` `진행 불가` 빌드 툴 기준선 이후 런타임 정렬
- `TKT-012` `P1` `v0.2.1` `진행 가능` `[BE]` 테스트 코드 확장과 커버리지 측정 기반 (PM 게이트 해제 2026-08-17)
- `TKT-011` `P2` `v0.3.0` `진행 가능` 엘리베이터 시뮬레이터 통합 프리뷰 연결
- `TKT-021` `P2` `v0.3.0` `진행 가능` 23층 다중 엘리베이터 dispatch loop
- `TKT-035` `P1` `v0.3.0` `진행 가능` 엘리베이터 실시간 수요 분포와 연속 이동 루프
- `TKT-058` `P1` `v0.3.2` `보류` 엘리베이터 코어 수정 [QA] — TKT-083 원점 재설계에 흡수 예정, 착수 금지
- `TKT-059` `P2` `v0.3.2` `보류` 엘리베이터 모션 수정 [QA] — TKT-083 에 흡수 예정, 착수 금지
- `TKT-061` `P1` `v0.4.1` `진행 가능` `[FE]` Work Manager 인증 세션 만료 UX(401 토큰 정리) [QA]
- `TKT-062` `P2` `v0.4.1` `진행 가능` `[FE]` Work Manager 전이 흐름(UI 연결 + need_review→backlog) [QA]
- `TKT-063` `P2` `v0.4.1` `진행 가능` `[BE]` Work Manager 저장소 정합(persistence/감사/seed/gate) [QA]
- `TKT-064` `P2` `v0.4.1` `진행 가능` `[BE]` Work Manager 동시성 + 테스트 보강 [QA]
- `TKT-043` `P2` `v0.5.0` `v0.5.0 진행 시 가능` Work Manager DB 저장소 전환과 감사 로그
- `TKT-026` `P2` `v0.5.1` `v0.5.1 진행 시 가능` 택시 시뮬레이터 피드백/자동 학습 루프
- `TKT-054` `P1` `v0.6.0` `진행 가능` `[FE]` 블로그 Writing Studio 저장/발행 무결성 [QA]
- `TKT-055` `P1` `v0.6.0` `진행 가능` `[FE]` 블로그 공개 라우팅/딥링크 [QA]
- `TKT-056` `P2` `v0.6.0` `진행 가능` `[FE]` 블로그 아카이브 상태 모델과 상태 배지 [QA] — S3(073)와 함께
- `TKT-057` `P2` `v0.6.0` `진행 가능` `[FE]` 블로그 마크다운 렌더러 + XSS 가드 유지 [QA]
- `TKT-053` `P2` `v0.6.0` `진행 가능` `[BE]` 블로그 이미지 업로드와 미디어 자산 처리 (PM 게이트 해제)
- `TKT-086` `P2` `v0.8.0` `backlog` `[BE]` 플랫폼 챗봇 — gateway 경유 Ollama 질의 (D-009, TKT-068 선행)
- `TKT-028` `P1` `v0.7.0` `v0.7.0 진행 시 가능` Flash Game 공간과 Ruffle 기반 SWF 플레이어 통합
- `TKT-029` `P1` `v0.7.0` `v0.7.0 진행 시 가능` Flash Game 카탈로그와 합법 반입 기준
- `TKT-065` `P2` `v0.8.0` `v0.8.0 진행 시 가능` 발견 정거장 UI + 정적 주제 데이터 (depth 0~1)
- `TKT-066` `P2` `v0.8.0` `v0.8.0 진행 시 가능` 발견 노선 depth 2~3 확장 API + 캐싱
- `TKT-067` `P2` `v0.9.0` `v0.9.0 진행 시 가능` 취향 노선 - 10선택 규칙 기반 와인/커피 추천
- `TKT-068` `P2` `infra` `진행 가능` `[INFRA]` RTX5070 Ollama 실제 구동 + 게이트웨이 연결 검증 (하드웨어 단계는 PO 협조 항목으로 분리 기록)
- `TKT-073` `P2` `chore` `진행 가능` `[FE]` UI 재구현 S3 - 블로그 사인 + 상태 배지 [시안 적용]
- `TKT-074` `P1` `chore` `ready` `[SIM]` S4 시뮬 페이지 재구현 — 스펙 완료: `design/sim-taxi-spec.md` (택시 지도), work/runtime 명료화는 [FE] 후속 분할 - 시뮬/운영 페이지 사인 [시안 적용]
- `TKT-075` `P2` `chore` `진행 가능` `[FE]` UI 재구현 S5 - App.vue 컴포넌트 분해 [시안 적용]
- `TKT-076` `P2` `chore` `진행 가능` `[FE]` UI 재구현 S6 - 모바일 재배치 + 스튜디오 [시안 적용] — **모바일 재배치 1차는 2026-08-16 선행 완료**(티켓 진행 기록), 잔여=Studio 마감·모바일 세부
- `TKT-078` `P1` `v0.7.0` `진행 가능` `[INFRA]` 화이트채플 아케이드 편입 마감 — 라우팅·매니페스트 (코드 subtree 흡수는 2026-08-16 완료, D-003~005)
- `TKT-079` `P2` `v0.7.0` `v0.7.0 진행 시 가능` advisor 디자인·프레임 통합 — 미션 화면을 모선 룩앤필로 (PO: "디자인 다른 건 백로그로", TKT-071 뒤 권장)
- `TKT-080` `P1` `v0.7.0` `진행 가능` `[BE]` advisor 서비스 계약 마감 — /health·라우트·매니페스트·빌드 게이트

## Ready

- `TKT-091` `P1` `voyage` `ready` `[FE]` Line V 노선 등록 — 토큰·lines.js·환승 홀 (088~090 선행)
- `TKT-088` `P1` `voyage` `ready` `[FE]` V 준비 화면 — 체크리스트·여정·예산 (데이터 voyage.js 완성됨)
- `TKT-089` `P1` `voyage` `ready` `[FE]` V 일일 운행 안내 — 오늘의 지침서 (모바일 1급)
- `TKT-090` `P2` `voyage` `ready` `[FE]` V 기록 화면 — 도시 아카이브·스탬프

- `TKT-085` `P1` `infra` `ready` `[INFRA]` 도메인 공개 준비 — Cloudflare 프록시 + Caddy (PO 수작업 체크리스트 산출 포함)
- `TKT-087` `P1` `v0.7.0` `ready` `[BE]` advisor Haiku provider 연동 (M2 — PO "haiku 푸시")

- `TKT-084` `P1` `voyage` `started` `[PM]` Line V(동유럽 여행) 콘텐츠 모델·화면 스펙 — claude 작성 중, 이후 [FE] 분할 (D-010, 출발 일정 제약)

- `TKT-083` `P1` `chore` `ready` `[SIM]` 엘리베이터 원점 재설계 — 스펙 완료: `design/sim-elevator-spec.md` (R1 승인)

- `TKT-082` `P1` `chore` `ready` `[SIM]` 택시 디스패치 버그 — 진단 절차: `design/sim-taxi-spec.md` §1 (지도보다 먼저) — 유휴 차량이 큐를 집지 않음 (PO 실사용 보고, TKT-074 와 함께 claude 직접)

## Started

- `TKT-018` `P1` `v0.2.0` `진행 가능` 릴리스 후보 검증과 PR 수용 게이트

## Need Review

- `TKT-072` `P1` `chore` `need_review` UI 재구현 S2 — 환승 홀 노선도(시안 C) + 행 목록, D/P 예정 지선 포함 (2026-08-16 claude 구현)

## Finished

- `TKT-081` `P1` `chore` UX 카피 다이어트 1차 — PO 승인 (추가 다이어트는 후속 라운드, S4 수용 기준 연계)
- `TKT-071` `P1` `chore` UI 재구현 S1 — 토큰·타이포·StationHeader, PO 승인
- `TKT-077` `P1` `chore` 스플래시 플랩 split-flap 정합(글자 배치/방향/settle) — 오케스트레이터 직접 [사용자 지목]
- `TKT-070` `P1` `chore` 스플래시 플랩 실제 split-flap 재현(플립 정상화) — 검토 통과 [사용자 지목]
- `TKT-069` `P2` `chore` 확정 디자인 1차 반영(다크 기본 + 플랩 아래→위) — 검토 통과

- `TKT-060` `P1` `chore` Work Manager 인증 하드닝(토큰 유출/잠금 우회/해시) — 보안 hotfix, 검토 통과 [QA]
- `TKT-001` `P1` `v0.1.0` 프런트엔드 역 안내판 스플래시 및 관제실 POC
- `TKT-002` `P1` `v0.1.0` Spring Boot 게이트웨이 스캐폴드 및 플랫폼 API
- `TKT-003` `P2` `v0.1.0` 워커 흐름, 샘플 서비스 연결, 로컬 테스트 루프
- `TKT-005` `P1` `v0.2.0` `localhost:7000` 통합 프리뷰 결과물
- `TKT-013` `P3` `chore` 문서 한국어 통일과 티켓 흐름 정규화
- `TKT-015` `P2` `infra` GitHub Releases / Actions 릴리스 자동화 기준선
- `TKT-016` `P2` `v0.1.3` 샘플 Python 서비스 정리와 엘리베이터 서비스 준비
- `TKT-017` `P1` `chore` 로드맵 결정 질문 수집과 1차 목표 확정
- `TKT-019` `P1` `v0.1.2` `진행 가능` 로컬 빌드/PR 도구 가용성 preflight
- `TKT-020` `P1` `v0.1.4` `진행 가능` 게이트웨이 티켓 기본 serviceId 샘플 Python 잔여값 제거
- `TKT-022` `P1` `chore` `진행 가능` `need_review` 코드 묶음 PR 패키징과 원격 base 정렬
- `TKT-023` `P2` `v0.3.0` `진행 가능` 지하철 플랩 행선기 스타일 첫 화면 디자인 강화
- `TKT-027` `P1` `infra` `진행 가능` 오케스트레이터 `need_review` heartbeat 자동화 구현
- `TKT-038` `P1` `infra` `진행 가능` 오케스트레이터 heartbeat 작업 스케줄러 등록
- `TKT-007` `P1` `infra` `진행 가능` RTX5070 호스트 Docker 및 GPU 런타임
- `TKT-004` `P2` `infra` `진행 가능` RTX5070 오프로드 및 외부 추론 런타임 계약
- `TKT-008` `P2` `infra` `진행 가능` RTX5070 Ollama GPU 모델 서빙
- `TKT-006` `P1` `infra` `진행 가능` 인프라 부트스트랩과 단일 워커 런타임
- `TKT-014` `P1` `infra` `진행 가능` workaround.co.kr / workaround.kr 1차 공개 웹사이트 호스팅
- `TKT-030` `P1` `infra` `진행 가능` 정식 Node/npm 툴체인 설치 기준선 정리
- `TKT-009` `P2` `infra` `진행 가능` 워커-Ollama 헬스 및 degraded 실행 흐름
- `TKT-037` `P1` `v0.4.0` `진행 가능` PR 버전 표기와 one-version-one-feature 가드
- `TKT-041` `P1` `v0.4.0` `진행 가능` Main page 라우팅, 기능별 페이지, 다크모드
- `TKT-031` `P1` `v0.4.0` `진행 가능` Work Manager 메뉴와 Jira 스타일 티켓 보드
- `TKT-032` `P1` `v0.4.0` `진행 가능` Work Manager 티켓 이동과 command 브리지
- `TKT-033` `P1` `v0.4.0` `진행 가능` command 비밀번호 게이트와 secret 해시 처리
- `TKT-034` `P2` `v0.4.0` `진행 가능` Work Manager 활동 로그와 사용자-AI 대화 피드
- `TKT-039` `P1` `v0.4.0` `진행 가능` Work Manager `Backlog/Ready` 분리와 상세 패널
- `TKT-040` `P2` `v0.4.0` `진행 가능` Work Manager 메타데이터 편집과 목표 버전 헤더
- `TKT-036` `P1` `v0.4.0` `진행 가능` Work Manager 테스트, GitHub Actions, 커버리지 게이트
- `TKT-046` `P2` `v0.4.0` `진행 가능` 플랩 안내 방송 문구 확장과 랜덤 로테이션
- `TKT-044` `P1` `chore` `진행 가능` 문서 인코딩 복구와 UTF-8 BOM 정규화
- `TKT-045` `P1` `chore` `진행 가능` 문서 인코딩 가드레일과 체크 도구 추가
- `TKT-047` `P1` `chore` `진행 가능` 로컬 `main` 브랜치 뒤처짐과 dirty worktree 정렬
- `TKT-049` `P1` `v0.3.1` `진행 가능` 엘리베이터 floor warp 완화와 가변 car 수/승객 애니메이션
- `TKT-024` `P1` `v0.5.0` `진행 가능` 다양한 시뮬 포털 탭과 택시/엘리베이터 진입 라우팅
- `TKT-025` `P1` `v0.5.0` `진행 가능` 택시 시뮬레이터 코어
- `TKT-042` `P1` `v0.5.0` `v0.5.0 진행 시 가능` Work Manager worker 할당 가시화와 우선순위 반응 실행
- `TKT-050` `P1` `v0.6.0` `v0.6.0 진행 시 가능` 블로그 허브와 공개 글 아카이브/상세 라우팅
- `TKT-051` `P1` `v0.6.0` `v0.6.0 진행 시 가능` 글쓰기 스튜디오와 초안/미리보기/발행 흐름
- `TKT-052` `P1` `v0.6.0` `v0.6.0 진행 시 가능` Markdown 글 저장 계약과 렌더링 파이프라인

## 보드 규칙

- 티켓이 상태를 옮길 때마다 이 파일을 함께 갱신한다.
- 이 파일은 전체 현황을 빠르게 보는 판이며, 세부 내용의 원문은 각 티켓 파일이다.
- 우선순위는 전사 통일 척도 `P1~P3` (P1 즉시 · P2 이번 사이클 · P3 여유). 구 P4/P5 표기는 P3 로 읽는다. (PO 2026-08-18 J8)
- `진행 가능`, `진행 불가`, `vX.Y.Z 진행 시 가능` 은 worker 시작 판단용 오케스트레이터 판정이다.
- `Ready` 는 현재 저장소 파일 수명주기와 분리된 Work Manager 표시/전이 설계 항목으로 먼저 도입하며, 실제 파일 기반 상태 확장은 관련 구현 티켓에서 함께 닫는다.


