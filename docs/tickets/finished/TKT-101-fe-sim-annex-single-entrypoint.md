문서 상태: 작성완료

# TKT-101 `[FE]` 시뮬 묶음 — 노선도 단일 진입 "미스터리 트레인" (D-012)

- 문서 상태: 작성완료
- 상태: `finished` (REV-TKT-101-r1 통과, PM 판정 2026-09-10)
- 우선순위: P1 (PO 지시 2026-09-09)
- 담당: codex-1 (FE)
- 의존: 없음 (TKT-100 과 파일 겹침 주의 — 순차 권장)
- 관련 결정: `docs/decisions.md` D-012
- scope: `frontend/src/data/lines.js`, `frontend/src/App.vue`(simhub 섹션·노선 상태·클릭 내비), `frontend/src/styles.css`

## 목표

PO: "elevator simulator 랑 taxi district lab 는 그냥 약간 재미있는 공간 느낌으로 묶어서 — 노출을 많이 하지 말고 하나의 entrypoint 로. 제목명은 기믹으로(영화·노래·은유)."

1. **노선도에서 E·T 지선 제거** → 단일 지선 **S "미스터리 트레인"** (page: `simhub`) 하나만 남긴다. 명칭 근거·대안은 D-012.
2. 지선 표기는 은근하게: sub 라벨 `심야 임시 운행`. 정식 노선들과 동급으로 광고하지 않는다 (숨은 재미 공간의 톤).
3. **simhub 페이지 = 격납고**: 헤더를 "미스터리 트레인"으로, banner-stats 통계 타일 제거(카피 다이어트), 엘리베이터·택시 2장의 카드만 (이후 아케이드 합류 여지).
4. `/elevator` `/taxi` 직접 URL 은 유지 (딥링크 회귀 금지) — 노선도·route-rows 노출만 제거.

## 완료 조건

1. 환승 홀 노선도·route-rows 에 E·T 가 없고 S 지선 1개 클릭 시 simhub 진입.
2. simhub 에서 두 시뮬 진입·복귀 정상, `/elevator` `/taxi` 딥링크 정상.
3. build 그린 + 시뮬 관련 기존 테스트 그린.

## 구현 메모

- `lines.js` 가 노선 단일 소스 — E·T 항목 삭제, S 항목 신설(빈 우상단 슬롯 좌표 재사용: E 자리 `M300 230 L440 158 H600` 권장, T 자리는 비워 P 와 간격 확보).
- 노선색: 기존 `--line-e`/`--line-t` 토큰은 각 시뮬 페이지 내부용으로 보존, S 지선은 중립/신규 토큰 1개.
- App.vue lineStatuses 의 E·T 행 제거, S 행 1개로 요약 (`격납고 2대 대기` 수준의 짧은 카피).

## 질문/에스컬레이션

(비어 있음)

## 구현 결과 (codex-1, 2026-09-10)

- `lines.js`의 E·T 항목을 S 지선 하나로 통합했다. 기존 E 좌표를 재사용하고 T 좌표는 비웠다. 이름·영문명·`심야 임시 운행`·`격납고 2대 대기`는 이 데이터에서 노선도·행 목록·simhub 헤더/상단 바가 참조한다.
- 격납고(`/sim`)에 기존 StationHeader를 적용하고 통계 타일·자기 해설·블로그 카드를 제거했다. 엘리베이터/택시 두 카드에 이름·상태·25자 이내 요약·진입 버튼만 남겼다.
- 내부 시뮬 헤더의 복귀는 격납고로 연결하며, 전역 환승 홀 버튼은 유지한다. `/elevator`·`/taxi` 라우팅과 뒤로/앞으로 이동을 보존했다. 기존 `/test` 검수 화면의 복귀 라벨·목적지는 환승 홀로 유지했다.
- 중립 S 토큰과 scoped 격납고 모바일 스타일만 추가했다. E·T 토큰, 시뮬 코어·API 호출 함수·저장/복원 로직·공용 컴포넌트는 변경하지 않았다. 기존 TKT-097/100 및 다른 작업자의 미커밋 변경은 보존했다.
- **정적 모드 경계 유지**: TKT-097 정책에 따라 Pages에서는 S도 `정적 공개본에서는 사용할 수 없음`으로 표시한다. Pages의 `/sim`·`/elevator`·`/taxi` 직접 진입은 종전처럼 환승 홀로 돌아가며 API를 호출하지 않는다. 이 티켓에서 정적 시뮬 개방이나 배포 설정 변경은 하지 않았다.

## 완료 게이트

- [x] `npm --prefix frontend run build` 및 `npm --prefix frontend run build -- --base=/workaround.co.kr-platform/` — 최종 코드 모두 통과(35 modules).
- [x] `node --test frontend/src/staticRouting.test.mjs frontend/src/staticWritingState.test.mjs frontend/src/data/voyageCoverage.test.mjs` — 3/3 통과.
- [x] 기존 `WritingStudio.e2e.mjs` — Pages base Chromium 8/8 통과(저장·발행·복원·백업·XSS·모달·375px 회귀).
- [x] 기존 엘리베이터 dispatch baseline의 동일 순서/판정식 통과: reset → 자동 수요 OFF → 12층 하행/3층 상행 호출 → step 2회 → 23층/4대·수요 OFF/강도 0·이동 차량 ≥1·할당 ≥2 확인 → reset. 이 머신에 `pwsh`가 없어 `tools/check-elevator-dispatch-baseline.ps1` 자체 대신 Node 임시 하네스로 동등 검증했다. `/health`도 200. 테스트 전용 18013 포트의 메모리 서비스에만 요청했다.
- [x] Chromium 다크/라이트 × 1280px/375px 4조합: 노선도/route-rows E·T 0개, S 1개, 데스크톱 SVG 클릭·모바일 키보드 Enter로 격납고 진입, 카드 2개·통계 0개, 두 시뮬 진입/복귀·history back/forward·직접 URL 및 새로고침 정상.
- [x] 다크/라이트 육안 확인: 중립 S 노선·명칭·서브 라벨·카드/CTA 판독 가능. 375×812에서 document/body/page-scroller/route-rows/격납고 가로 overflow 0(노선도 SVG 자체의 의도된 내부 스크롤은 유지).
- [x] 30초 방치 관찰: 엘리베이터 차량 위치·승객/운행 지표, 택시 차량 상태·완료 호출/보상이 화면에서 변화했다. 실제 시뮬 서비스는 격리 인스턴스, 그 외 gateway 응답은 검증용 fixture 사용. 브라우저 오류/경고 0.
- [x] Pages 다크/라이트 375px: S 차단 표시/클릭·세 직접 경로의 기존 제한, API 요청 0·브라우저 오류 0·가로 overflow 0 확인. `/test?view=elevator`의 기존 환승 홀 복귀도 별도 통과.
- [x] `git diff --check`, 문서 UTF-8 BOM/작성완료 확인. 커밋·push·배포 없음.

### 검증 자료와 재현

- 로컬 임시 하네스/스크린샷: `/tmp/tkt101-check.op73rh/` (`check.mjs`, `static.mjs`, `legacy.mjs`, `hub-*`, `junction-*`, `elevator-*`, `taxi-*`, `static-*`). 티켓 scope가 앱 파일 3개이므로 영구 테스트 파일을 범위 밖에 추가하지 않았다.
- live 확인은 기본 빌드 + preview `127.0.0.1:4175`, 격리 서비스 `PORT=18013 python3 services/elevator-service/app.py`에서 `check.mjs`/`legacy.mjs` 실행. Pages 확인은 base 빌드 + 동일 base의 preview `127.0.0.1:4174`에서 `static.mjs`와 기존 Writing Studio E2E 실행. Node가 `playwright`를 찾도록 로컬 runtime의 `NODE_PATH`를 사용했다.
- 임시 서버는 검증 후 종료했다. 실제 운영 서버/사용자 브라우저 저장소는 건드리지 않았다. 서비스 실배포 연동·Pages 시뮬 개방·TKT-082 디스패치 버그의 판정은 이번 범위 밖이다.

## 리뷰 기록

(비어 있음)
