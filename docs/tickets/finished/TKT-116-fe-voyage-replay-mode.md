문서 상태: 작성완료

# TKT-116 `[FE]` 여정 노선도 회고 모드 — 열차 점 재생 (종착 후)

- 상태: finished (2026-09-14, REV-TKT-116-r1 통과) · P2 · 담당: codex-1 (codex-6 예비 미기동 대체) · 의존: TKT-109 (finished)
- 스펙: 목업(`frontend/public/mockups/*`) + `design/tone-principles-2026-09-09.md`. 브랜치 `codex/v0.7.0-tone`. **UX·가시성 1순위, [반박]/[구체화 질문] 의무.**
- scope: `frontend/src/components/voyage/VoyageRouteMap.vue`(109 산출), 관련 테스트

## 목표
`design/voyage-route-map-spec.md` §4-6. ▶ 누르면 열차 점이 일차 순서로 노선을 달리며 시각표 카드가 자동으로 넘어간다. 일시정지·속도 2단. `prefers-reduced-motion` 시 단계 이동만. 여행 status `arrived` 에서만 기본 노출.

## 완료 조건

- [x] `arrived` 여행에서만 회고 재생 제어가 보이고 운행 중 여행에는 노출되지 않는다.
- [x] 재생 시 일차 순서와 같은 경로로 열차 점이 이동하며 해당 일차 시각표 카드가 자동 선택된다.
- [x] 일시정지·이어서·처음부터 다시 재생과 보통/빠르게 2단 속도를 제공한다.
- [x] `prefers-reduced-motion: reduce`에서는 점의 보간 애니메이션 없이 단계식으로만 위치가 바뀐다.
- [x] 375px dark·1440px light에서 가로 overflow 0과 브라우저 오류·경고 0을 확인했다.

## 구현 내역

- `VoyageRouteMap.vue`에 도착 여행 전용 `여정 다시 보기` 제어를 추가했다. 재생·일시정지·이어서·다시 재생 상태와 보통/빠르게 2단 속도를 한 줄 hairline 구획에 두고 실제 버튼에만 면을 남겼다.
- 여행의 `legs`를 일차별 재생 프레임으로 바꿔 이동 없는 날도 시각표 카드가 빠짐없이 넘어가며, 한 날에 구간이 둘이면 두 구간 종점 모두 거치게 했다. 수동 일차·구간·정차역 선택이 들어오면 재생을 멈춰 사용자의 조작을 덮어쓰지 않는다.
- 모바일에서 재생을 누르면 접힌 노선도를 자동으로 펼치고, SVG 최상단에 노선색 열차 점을 표시했다. 상태 문구는 `aria-live`로 알리고 속도 선택은 `aria-pressed`로 드러낸다.
- 모션 축소 환경에서는 타이머에 따른 일차 전환은 유지하되 점의 CSS 이동 보간을 `0ms`로 고정했다. 컴포넌트 해제·도착 상태 해제 시 타이머와 미디어 쿼리 구독도 정리한다.
- `VoyageReplay.e2e.mjs`를 추가해 운행 중 비노출, 도착 후 재생, 일시정지, 속도 2단, 자동 일차 전환, 모바일 지도 자동 전개, reduced-motion 단계 이동과 overflow를 검증했다.

## 질문/에스컬레이션

- **[반박] 테스트용 콘텐츠 변경은 하지 않았다.** 현재 실데이터에서 노선·일차가 채워진 `중부유럽 순환선`은 `boarding`이고, `arrived`인 스페인·아이슬란드는 노선 데이터가 비어 있어 회고 제어를 실콘텐츠로 열 수 없다. 티켓 scope와 PM 콘텐츠 권한을 지키기 위해 제품 데이터는 그대로 두고, E2E 정적 서버에서 빌드 산출물의 상태값만 `arrived`로 바꾼 격리 시나리오로 동작을 검증했다. 실제 여행 종료 시 데이터 상태만 전환되면 같은 UI가 노출된다.

## 검증

- 메인 프런트 unit 20/20 통과.
- 신규 `VoyageReplay.e2e.mjs` Chromium 3/3 통과: 운행 중 비노출 1건, 1440px light 재생·일시정지·2단 속도 1건, 375px dark reduced-motion·지도 자동 전개 1건. 가로 overflow·브라우저 오류/경고·API 요청 0.
- 기존 `VoyageRouteMap.e2e.mjs` Chromium 2/2 통과: 375px dark·1440px light의 지도/시각표/편집/키보드 계약 유지.
- 기본 build와 Pages-base build `npm run build`, `npm run build -- --base=/workaround.co.kr-platform/` 각각 48 modules 통과.
- 375px dark reduced-motion·1440px light 실렌더를 직접 확인했다. 모바일은 시각표→노선도 순서를 유지하면서 재생 때 지도만 자동 전개되고, 데스크톱은 제어·지도·일차 카드의 위계가 분리됐다.
- Safari/WebKit·실제 Pages 배포·실제 여행의 `arrived` 전환은 미검증. commit/push 없음.

## 리뷰 기록

- 구현 완료, PM r1 검토 대기.

## PR 준비 메모

- 제목: `feat(voyage): add arrived trip replay controls`
- 본문: 도착 여행 노선도에 일차별 열차 점 재생, 자동 시각표 전환, 일시정지와 2단 속도, 모션 축소 단계 이동을 추가한다.
- 검증: unit 20/20, 회고 E2E 3/3, 노선도 회귀 E2E 2/2, 기본·Pages-base build 각 48 modules, 375/1440 overflow 0.
- 미검증: Safari/WebKit, 실제 Pages 배포, 실제 콘텐츠의 arrived 전환.
- r1 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-116-r1.md`. E2E 3/3 PM 직접. [반박] 수용 — arrived 전환은 PM 콘텐츠 작업.
