# REV-TKT-094-r1-draft — 엘베 탑승 흡수 마이크로 애니메이션 (083 리뷰 [중요] 잔여) (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-08-18. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: `frontend/src/components/ElevatorCrossSection.vue`(탑승 흡수 로직 + CSS). 근거 `design/sim-elevator-spec.md` §2, `REV-TKT-083-r1.md`의 [중요] 지적("탑승 시점에 대기 도트가 줄어드는 것 자체에 대한 별도 트랜지션이나 흡수 애니메이션은 찾지 못했다"). scope: 엘리베이터 코어/API 비수정.

## 요약 권고: **통과 — 완료 게이트 전부 실측(실백엔드 라이브 관찰 포함) 확인, 블로커 없음**

이 티켓은 지난 라운드(TKT-083)에서 내가 직접 남긴 [중요] 지적의 후속이라, **그때와 동일한 방식(코드 훑기가 아니라 실제 시뮬레이터를 기동해 눈으로/코드로 관찰)으로 재검증**했다. 이번엔 한 걸음 더 나가 실제 백엔드가 만들어내는 진짜 탑승 이벤트를 폴링으로 붙잡아 애니메이션 속성을 직접 읽었다.

## 실행 검증 (백엔드까지 직접 기동)

- `npm --prefix frontend run build` — 통과(vite 6.4.3, **27 modules** — claim과 일치).
- **scope 준수**: `git status --short -- services/elevator-service/` 결과 없음 — "엘리베이터 코어와 API는 수정하지 않았다" claim 확인. `services/elevator-service/app.py`를 직접 읽어 `passenger["id"] = next_passenger_id()`로 안정적 승객 ID가 실제로 내려온다는 것도 확인(컴포넌트의 `passengerKey()`가 이 ID를 우선 사용하므로 폴백 합성 키 경로는 실제로 거의 안 쓰임).
- **실백엔드 기동**: `PORT=8003 python3 services/elevator-service/app.py` 직접 실행(순수 stdlib, 의존성 없음). 기존에 떠 있던 게이트웨이(2026-08-16 13:38 기동, TKT-083 리뷰 때와 동일 프로세스 — 다른 세션 소유로 보여 재기동하지 않고 그대로 사용)를 통해 `/api/services/elevator-service/api/state` 정상 응답 확인 후, dev 서버(포트 7011, 종료 후 정리)로 `/test?view=elevator` 진입.

## 완료 게이트 대조

### ① build
위 참조.

### ② 탑승 발생 시 도트 흡수 확인 — **실제 탑승 이벤트를 라이브로 포착**
코드만 읽지 않고, 900ms 폴링 주기에 맞춰 `.elevator-boarding-dot` DOM 등장을 실시간 감시하는 스크립트로 실제 시뮬레이터가 만들어내는 탑승을 12초간 관찰, **3건의 실제 탑승 이벤트를 포착**했다:

| 포착 시각(상대) | 동시 발생 수 | `animation-name` | `animation-duration` | `animation-timing-function` |
|---|---|---|---|---|
| t+0ms | 1건 | `passenger-boards-*` | **0.08s** | ease-in |
| t+5.3s | 1건 | `passenger-boards-*` | **0.08s** | ease-in |
| t+7.3s | **3건 동시** | `passenger-boards-*` | **0.08s** | ease-in |

스펙(§2 "80ms")과 정확히 일치. 세 번째 샘플에서 3개 도트가 동시에 존재한 것은 `boardingAbsorptions`가 배열이라 여러 car의 동시 탑승을 서로 지우지 않고 독립적으로 처리한다는 것도 실증. `ElevatorCrossSection.vue:71-87`(`showBoardingAbsorption`)의 120ms 정리 타이머(80ms 애니메이션보다 40ms 여유)가 DOM 제거 전 애니메이션이 끝까지 재생되도록 하는 설계도 코드로 확인.

### ③ reduced-motion 즉시 처리 — **소스가 아니라 실제 서빙된 CSSOM에서 확인**
`document.styleSheets`를 순회해 `@media (prefers-reduced-motion: reduce)` 규칙 안의 `.elevator-boarding-dot[data-v-*]` 선택자를 직접 찾아 `cssText`를 읽었다: `animation: ...none...; opacity: 0;` — 빌드 파이프라인을 거친 실제 스타일시트에 규칙이 살아있음을 확인(단순히 소스 파일을 읽고 믿은 게 아니라 CSSOM 조회로 재현). 이 도구가 OS 레벨 reduced-motion 에뮬레이션 자체는 지원하지 않아 실제 애니메이션이 꺼지는 것을 스크린 녹화로 보진 못했지만, 규칙이 파싱·적용 가능한 형태로 존재함은 확인했다.

### ④ 진입 직후 거짓 애니메이션 방지 (티켓 claim, 게이트 목록엔 없지만 회귀 위험이 커서 직접 확인)
`ElevatorCrossSection.vue:89-108`의 `watch(() => props.cars, ..., {deep:true, immediate:true})`를 추적: `immediate:true`로 첫 실행이 마운트 시점에 바로 도는데, 그 시점엔 `hasOnboardSnapshot`이 아직 `false`라 `if (hasOnboardSnapshot && ...)` 조건이 전부 거짓이 되어 **이미 탑승 중인 승객들에 대해 애니메이션이 전혀 트리거되지 않는다** — 첫 실행이 끝나야 `hasOnboardSnapshot = true`로 바뀌어 그 다음 폴링부터 진짜 신규 탑승만 잡는다. 실제로 화면 진입 직후(당시 8명 이미 탑승 중 상태)에도 확인 스크립트가 즉시 도트를 잡지 않았고, 이후 자연 발생한 탑승에서만 잡힌 것으로 이 가드가 실동작함을 간접 확인.

### ⑤ 다크/라이트
`.app-shell`(테마 속성이 실제로 걸리는 요소) 기준 `--line-e` 값이 다크 `#3FC1FF`/라이트 `#0090C8`로 정상 구분(탑승 도트 배경색이 이 토큰을 그대로 씀). **자체 정정 기록**: 처음엔 `document.documentElement`에서 읽어 다크/라이트가 같은 값으로 나와 당황했는데, 이 사이트가 테마를 `.app-shell[data-theme]`에 건다는 걸 놓친 내 측정 실수였다 — `.app-shell` 기준으로 다시 재보니 정상.

### ⑥ 모바일 375px
`document.documentElement.scrollWidth === clientWidth === 375`(오버플로 0), car 4대·23개 층 전부 렌더 확인, 스크린샷 확보(4대 위치·탑승 인원 실시간 값 ▲1/▲3/▲3/▲14 등 실제 상태 반영).

### ⑦ 콘솔 에러
`/api/runtime`·`/api/work-manager/board` 404뿐 — 이 리뷰가 elevator-service만 기동해서 발생(무관한 다른 백엔드), `elevator-service` 관련 요청은 전부 200 OK. 새 에러 없음.

## [정보] 게이트웨이 재확인 — TKT-083 때와 동일 이슈, 여전히 미해결

이번에도 사용 가능했던 게이트웨이 프로세스가 **2026-08-16 13:38 기동된 사전 빌드 jar**(오늘 변경분 이전)였다. 이 티켓은 프런트 전용이라 게이트웨이 신선도와 무관하게 통과 판정에 영향 없지만, [BE]/[INFRA] 레인의 그 리스크는 여전히 별개로 열려 있는 것으로 취급해야 한다(TKT-083 리뷰에서와 동일한 코멘트).

## 상태 제안 (판정은 PM)

블로커 0, [중요] 0(지난 라운드 지적 완전 해소), [제안] 0 — 스펙과 정확히 일치하는 깔끔한 구현. 완료 게이트 전부 실측(실백엔드 라이브 탑승 3건 포착 포함)으로 확인했다. **finished 전환 권장.**


---
## PM 최종 판정 (claude, 2026-09-08)

**통과 → finished.** 리뷰어 실측 수용. 089 는 여행 당일(9/8) 실화면에서 DAY 1 프라하 자동 인식·3단 안내·운전 없는 날 표시를 PM 이 직접 재확인.
