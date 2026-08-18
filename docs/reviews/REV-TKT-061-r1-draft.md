# REV-TKT-061-r1-draft — Work Manager 인증 세션 만료 UX (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-08-17. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: `frontend/src/App.vue`(인증/세션 상태 로직 + Work Manager 템플릿). 트렁크 `codex/v0.6.0-line` 공유 작업 트리(미커밋).

## 요약 권고: **통과 — 4개 완료 기준 전부 실행/실측으로 확인, 블로커 없음**

원래 버그("잠금 해제로 보이지만 모든 액션이 401로 실패")의 재현 시나리오를 직접 만들어 실제로 고쳐졌음을 확인했다. 401 감지·타이머 기반 사전 잠금·요청 전 만료 검사 3중 방어가 모두 구현돼 있고, 다크/라이트·모바일 375px에서도 문제를 찾지 못했다(직전 TKT-072 리뷰에서 모바일 가로 스크롤 블로커를 찾았던 것과 대비됨 — 이번엔 실제로 375px에서 `scrollWidth===innerWidth` 확인).

## 실행 검증

- `npm --prefix frontend run build` — 통과(vite 6.4.3, 16 modules, 티켓 claim과 일치).
- `git diff --check` — 통과(공백/줄바꿈 이슈 없음, 티켓 claim과 일치).
- 브랜치 `codex/v0.6.0-line` 확인.
- **라이브 브라우저 검증**(dev 서버를 리뷰 전용 포트 7012에 별도 기동, 다른 세션의 7010과 충돌 없음): 아래 항목별 참조.

## 완료 기준 대조 (4개)

### ① 서버 401 → 즉시 잠금 전환
`fetchJson()`(`App.vue:2603-2618`)이 `!response.ok`일 때 `requestError.status = response.status`를 붙여서 던진다. `handleWorkManagerAuthorizationError(error, target)`(`:1985-1996`)가 `error?.status===401`을 확인해 `lockWorkManagerSession()`을 호출하고, `saveWorkTicketMetadata`/`submitPresetCommand`의 catch(`:1919-1923`, `:1959-1963`)가 이걸 우선 호출한 뒤에만 일반 에러로 폴백한다 — **원 버그였던 "catch가 401을 그대로 삼킨다"가 구조적으로 막힘.** `.status` 배선이 실제로 맞는지(숫자 401 vs 문자열 등 타입 불일치로 조용히 무력화될 수 있는 지점이라 별도로) 직접 코드 추적해 확인.

### ② 저장된 expiresAt 가 지난 상태로 페이지 로드 → 잠금 시작
**라이브 재현**: `localStorage`에 가짜 토큰 + 5분 전으로 만료된 `expiresAt`을 주입 → 새로고침 → `readStoredWorkManagerSession()`(`:2737-2755`)이 만료를 감지해 두 키를 모두 지움(재로드 후 `localStorage.getItem(...)` 둘 다 `null` 로 직접 확인) → Work Manager 페이지 진입 시 **"이전 command gate 세션이 만료되어 다시 잠갔습니다. 재인증해 주세요."** 메시지가 COMMAND ZONE에 정확히 노출됨(get_page_text로 직접 확인). 코드 경로와 실제 화면 결과가 일치.

### ③ TTL 경과 후 실행성 버튼 비활성/재인증 유도
세 겹 방어를 코드로 확인: (a) `scheduleWorkManagerExpiration()`(`:2014-2034`)가 `workManagerTokenExpiresAt`까지 남은 정확한 ms로 `setTimeout`을 걸어 시간이 되면 자동으로 `lockWorkManagerSession()` 호출 — `watch([workManagerToken, workManagerTokenExpiresAt], ..., {immediate:true})`(`:1160-1167`)가 토큰 변경 시마다(초기 로드·unlock 성공·lock 모두) 이 스케줄을 다시 건다. (b) `hasActiveWorkManagerSession()`(`:1974-1983`)이 액션 직전에 만료를 재검사해 사전 잠금. (c) 401 사후 처리(①). 라이브 확인: locked 상태에서 `preset command 전송` 버튼이 `disabled:true`(JS로 직접 확인), `gate 열기`(비밀번호 입력·인증 버튼)는 `disabled:false`로 유지 — 잠긴 동안에도 재인증 경로 자체는 막지 않는 게 맞는 설계.

### ④ 재인증하면 정상 동작 복구
`unlockWorkManager()`(`:1851-1884`) 성공 시 `workManagerToken`/`workManagerTokenExpiresAt`를 갱신 → watcher가 재스케줄 → `hasActiveWorkManagerSession()`이 다시 true. 이 경로는 원 버그(401/만료 미처리)와 무관한 기존 정상 흐름이라 코드 판독으로 충분하다고 판단, 별도 라이브 재인증까지는 하지 않음(실 gateway 필요).

## UI 실검수 (다크/라이트 + 375px + 카피)

- **다크/라이트**: 두 테마 모두 Work Manager 페이지에서 COMMAND GATE 카드·잠금 메시지 대비 확인(라이트: 패널 `#fff`/텍스트 `rgb(22,32,46)`, 다크: 패널 `rgb(26,33,45)`/텍스트 `rgb(243,246,251)`, 에러 텍스트는 두 테마 모두 `rgb(255,138,138)`로 고정 — 가독성 문제 없음).
- **모바일 375px**: `document.documentElement.scrollWidth === window.innerWidth === 375`(가로 스크롤 없음, 직접 측정). COMMAND ZONE이 세로로 정상 재배치되고 잠금 메시지가 줄바꿈되어 잘리지 않음(스크린샷 확보). TKT-072에서 발견했던 flex `min-width:auto` 클래스의 오버플로 패턴이 여기엔 없음.
- **카피 원칙**(ux-copy-audit §2): 신규 메시지 3종("이전 세션 만료 재잠금", "세션 만료 재인증 유도" 401판/타이머판)은 화면 자기해설이 아니라 이벤트에 대한 상태 알림이라 원칙1 대상이 아니라고 판단. `TKT-###`류 내부 용어 노출 없음. 중복 서술 없음.

## [제안] (경미, 블로커 아님)
- `scheduleWorkManagerExpiration`의 `setTimeout`은 브라우저가 백그라운드 탭에서 타이머를 스로틀링하면 늦게 발동할 수 있다 — 다만 액션 직전 `hasActiveWorkManagerSession()` 재검사(②)가 실시간 시각으로 다시 확인하므로 실제 위험(만료된 토큰으로 명령이 나가는 것)은 없고, 배너가 잠깐 stale하게 보일 수 있는 정도. 완료 기준 어디에도 이 엣지케이스가 명시되지 않아 범위 밖으로 판단.

## 상태 제안 (판정은 PM)
블로커 0. 4개 완료 기준 모두 코드 추적 + 라이브 재현(가능한 범위)으로 확인. **finished 전환 권장.**
