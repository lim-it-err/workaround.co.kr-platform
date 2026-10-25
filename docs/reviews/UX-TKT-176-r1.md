문서 상태: 작성완료

# TKT-176 UX 검수 범위 확인 r1

- codex-8, 2026-10-05. `codex/v0.8.0-live`, need_review r1.
- **[블로커]0 / [중요]0 / [제안]0. 이 티켓의 별도 실렌더 게이트는 해당 없음.** 화면 전체가 무결하다는 판정이 아니라 테스트 전용 변경에 대한 UX 범위 확인이다. 최종 판정·기능 테스트 게이트는 PM/리뷰어 소관이다.

## 확인 근거

1. `frontend/src/e2eContext.mjs:1`~9는 Playwright의 테스트 컨텍스트에 Asia/Seoul·ko-KR을 전달한다. viewport/reduced-motion 등 기존 옵션을 합성하며 앱 시간대·로케일을 바꾸는 코드가 아니다. 이를 import하는16파일은 모두 `*.e2e.mjs`이며 제품 소스의 import는0이다. [참조 목록](UX-TKT-176-r1-assets/import-references.json).
2. `services/advisor/frontend/playwright.config.ts:12`~13의 timezoneId/locale은 테스트 use 설정이다. Advisor4개 spec의 diff는 고정 시각/의도 슬롯 주석의 변경이었다. `core-flows.spec.ts:103`, `:152`, `:203`, `:323`, `advisor-flow-defects.spec.ts:22`, `final-ux-b1-i1.spec.ts:67`, `season-lifecycle.spec.ts:16`은 명시적 +09:00 출근길 시각을 사용한다.
3. 두 frontend를 격리 복사하여 테스트를 포함한 빌드와 테스트 파일/설정을 제외한 빌드를 비교했다. **메인 JS/CSS2개, Advisor JS/CSS50개가 경로와 SHA-256 모두 동일**했다. 메인에서는16 E2E+컨텍스트 헬퍼17파일, Advisor에서는 e2e15파일+Playwright 설정16파일만 임시 복사본에서 제외했다. 원본 파일은 건드리지 않았다. 이는 테스트 변경이 제품 번들에 들어가지 않음을 확인하는 비교이며, 다른 티켓이 섞인 전체 워킹트리의 제품 diff가0이라는 뜻이 아니다.

| 격리 빌드 | 모듈 | JS/CSS 비교 | 증거 |
|---|---:|---|---|
| 메인 Pages base | 55 | 2/2 동일 | [이전 로그](UX-TKT-176-r1-assets/main-before.log), [테스트 제외 로그](UX-TKT-176-r1-assets/main-without-test-files.log) |
| Advisor Pages base | 119 | 50/50 동일 | [이전 로그](UX-TKT-176-r1-assets/advisor-before.log), [테스트 제외 로그](UX-TKT-176-r1-assets/advisor-without-test-files.log) |

[비교 원자료](UX-TKT-176-r1-assets/bundle-comparison.json), [검수 소스 SHA·격리 경로](UX-TKT-176-r1-assets/source-sha.json), [종료 시 원본 비교: 변경0](UX-TKT-176-r1-assets/source-comparison.json).

## 검수 범위와 제한

티켓 자체에 ‘제품 시각 변경이 없어 별도 시각 캡처 게이트는 해당 없음’이 명시되어 있다. 위 의존/산출물 비교로 근거를 확인했으므로 375/1440·양테마 스크린샷을 이 테스트 티켓용으로 중복 생성하지 않았다. 기능별 현재 실렌더는 [179 홈](UX-TKT-179-r1.md), [172 결산](UX-TKT-172-r1.md), [182 문 전환](UX-TKT-182-r1.md), [178 스플래시](UX-TKT-178-r1.md), [170 밥상](UX-TKT-170-r1.md), [174 개발자 화면](UX-TKT-174-r1.md)에 분리되어 있다. 각 보고서의 지적은176으로 해소되지 않는다.

체크리스트의 주인공·조작부 면·영어 간판·노선색·375 넘침·40px·카피·배지/스플래시·라이트 테마 모두 **이번 변경에 적용할 새 시각 차이 없음**으로 기록한다. 기존 화면 전체에 대한 통과 표시는 아니다.

구현자의 Advisor61/61·메인80/80 ×두TZ, unit/build 기록은 티켓 및 `docs/history/2026-10-05.md`에서 확인했다. 이 실행에서 그 전체 테스트를 재수행했다고 주장하지 않는다. 이번 독립 검증은 테스트 의존 범위 및 네 번의 제품 빌드/해시 비교다. 직전172/179/182의 관련 E2E 검증은 각 보고서에 있다.

## 인계

현재 need_review7건 모두 UX 초안 또는 해당 없음 근거가 제출되었다. Advisor 전면 검토도 기존 제출본을 유지한다. TKT-161 실제 VoiceOver 검수는 네이티브 앱 제어 도구 응답 실패 제약이 남아 있으며 완료로 세지 않는다. 오늘 finished 소급 검수164는 이미 수행했다.

앱·목업·원칙·스펙·티켓·보드 무수정, commit/push 없음. 기존 heartbeat의 이름·프롬프트·대상·ACTIVE를 보존하면서 임시1분→1시간으로 복귀한다. 최근 자기 레인 need_review 도착이3시간 이내이므로1시간이며, 새 진행 없이3시간 경과하면24시간으로 줄인다. 검수 산출물 자체를 새 진행으로 계산하지 않는다.
