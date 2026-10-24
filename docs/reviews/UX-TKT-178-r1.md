문서 상태: 작성완료

# TKT-178 UX 검수 초안 r1

- 작성: codex-8, 2026-10-05 KST. **최종 판정은 PM**.
- 범위: 첫 방문 5초·재방문 2.5초로 단축한 스플래시, 세 문구 정착·읽기 구간·반쪽 플랩·티커. **[블로커] 0 / [중요] 0 / [제안] 0.** 아래 검증한 스냅샷에서 새 UX 결함을 발견하지 못했다.
- 고정본: `/private/tmp/codex8-178-b7kmk2ct/frontend`, `codex/v0.8.0-live` 작업 중 소스 복사. [source-sha.json](UX-TKT-178-r1-assets/source-sha.json). App.vue SHA `404cd55b023af830c6cb70e0ccb2fca5d9bd61b37f2776679349512bb5db1e96`.

## 실제 시간 관찰

새 Chromium 컨텍스트에서 375×812·1440×900 × 다크/라이트, 첫 방문과 재방문을 각각 실행했다. Math.random·타이머를 대체하지 않은 실제 시간 계측이다. 상·하단 정적 글자가 모두 목표 문구이고 `.flap-cell.run` 0·플랩 하위 실행 CSS animation 0인 첫 프레임을 완전 정착으로 보았다. 다음 문구 시작 또는 `.fade-leave-active` 시작까지를 읽기 구간으로 계산했으며, 제거까지 남는 약0.47초 페이드는 읽기 시간에 넣지 않았다.

시간 원점은 DOM에서 스플래시가 처음 관측된 프레임이다. 앱 타이머 시작과 프레임 표본 차이가 있으므로 2.490초 관측을 2.5초 계약 위반으로 보지 않는다. 정확한 타이머 경계는 별도 가상 시계 E2E로 확인했다. 재방문 초기 ARIA 기본값 WORKING AROUND가 약6ms 관측되지만 미정착 상태이므로 읽기 시간은 null로 기록하고 아래 표에서 제외했다.

| 화면 | 방문 | 페이드 시작(초) | 문구별 정지 노출(초, 표시 순서) |
|---|---|---:|---|
| 375 dark | 첫 방문 | 4.978 | 0.766 / 0.935 / 0.868 |
| 375 dark | 재방문 | 2.490 | 1.884 |
| 375 light | 첫 방문 | 4.993 | 0.850 / 0.900 / 0.863 |
| 375 light | 재방문 | 2.495 | 1.860 |
| 1440 dark | 첫 방문 | 4.993 | 0.860 / 0.835 / 0.933 |
| 1440 dark | 재방문 | 2.491 | 1.842 |
| 1440 light | 첫 방문 | 4.992 | 0.790 / 0.909 / 0.902 |
| 1440 light | 재방문 | 2.496 | 1.859 |

첫 방문 각 문구 **0.766~0.935초 ≥0.7초**, 재방문 DOORS OPENING **1.842~1.884초 ≥1초**. 재방문 정착은 **0.606~0.650초**로 1.6초 제한 안이었다. 첫 방문 페이드 시작은 4.978~4.993초(5초±50ms 안). 8회 모두 overflow 0·pageerror 0이며 홈 전환을 관찰했다.

- 구현 근거: `frontend/src/App.vue:31` 시간 상수, `:1472` 시퀀스 2~4, `:1540` 최종 정착180ms, `:1551` 재방문 정착+읽기 시간, `:1580` 셀 지연·속도, `:1617` 재방문 강제 정착 상한.
- [측정 원문](UX-TKT-178-r1-assets/wall-clock.json), [재현 스크립트](UX-TKT-178-r1-assets/capture.cjs). 스크립트는 snapshot 루트에 놓고 Pages-base 빌드 후 실행한다(distRoot는 스크립트 옆 `frontend/dist`). Playwright는 프로젝트 의존성 또는 NODE_PATH로 제공한다.

## 실렌더 근거

플랩의 두 반쪽, 셀별 시차, 세 문구·세 티커, 순환선 심볼을 보존했다. 정착한 모든 문구의 상·하단이 일치하고 글자 잘림·가로 넘침이 없었다. 밝은 테마에서도 플랩 글자·티커·재생 제어가 구별된다. 변경 범위에서 새 정보 카드나 영어 섹션 간판은 없다.

| 화면 | 첫 문구 | 둘째 문구 | 마지막 문구 | 재방문 |
|---|---|---|---|---|
| 375 dark | [캡처](UX-TKT-178-r1-assets/375-dark-first-settled-1.png) | [캡처](UX-TKT-178-r1-assets/375-dark-first-settled-2.png) | [캡처](UX-TKT-178-r1-assets/375-dark-first-settled-3.png) | [캡처](UX-TKT-178-r1-assets/375-dark-return-settled-1.png) |
| 375 light | [캡처](UX-TKT-178-r1-assets/375-light-first-settled-1.png) | [캡처](UX-TKT-178-r1-assets/375-light-first-settled-2.png) | [캡처](UX-TKT-178-r1-assets/375-light-first-settled-3.png) | [캡처](UX-TKT-178-r1-assets/375-light-return-settled-1.png) |
| 1440 dark | [캡처](UX-TKT-178-r1-assets/1440-dark-first-settled-1.png) | [캡처](UX-TKT-178-r1-assets/1440-dark-first-settled-2.png) | [캡처](UX-TKT-178-r1-assets/1440-dark-first-settled-3.png) | [캡처](UX-TKT-178-r1-assets/1440-dark-return-settled-1.png) |
| 1440 light | [캡처](UX-TKT-178-r1-assets/1440-light-first-settled-1.png) | [캡처](UX-TKT-178-r1-assets/1440-light-first-settled-2.png) | [캡처](UX-TKT-178-r1-assets/1440-light-first-settled-3.png) | [캡처](UX-TKT-178-r1-assets/1440-light-return-settled-1.png) |

`frontend/src/App.vue:3455` 스플래시 구조·`:3467` 접근 이름·`:3493` 재생 버튼, `frontend/src/styles.css:469` 반쪽 플랩 실행·`:5440` 투명 패널·`:5471` hairline 티커. [375 플립 중](UX-TKT-178-r1-assets/375-dark-first-flipping.png)·[1440 플립 중](UX-TKT-178-r1-assets/1440-light-first-flipping.png). 총32캡처(정착16·플립8·홈8)를 보존했다.

## 고정 UX 체크리스트

| 기준 | 이번 변경 범위 확인 |
|---|---|
| 3초 안에 주인공 1개 | 역명·플랩이 중심이며 첫 완성 문구가 0.793~0.869초에 정착. 인지 실험은 아님. |
| 면은 조작부에만 | TKT-178은 기존 승인 플랩·배경 구조를 보존. 패널 계산 배경 투명, 새 정보 카드 없음. |
| 영어 섹션 간판 0 | 새 간판 없음. 세 영어 플랩 문구는 승인된 인트로 카피. |
| 노선색은 선·배지 | 순환선 심볼·티커 표시 유지, 새 색상 면 없음. |
| 375 overflow 0·터치 ≥40px | 8회 overflow0. 유일한 재생 버튼 97.39×53.81px. |
| 카피 정합 | 5초/2.5초 후 자동 전환·다시 재생·세 티커 일치. App.vue:313 안내는 실제 duration에 연동. |
| 지하철 배지·스플래시 10초 유지 | 심볼 유지. **시간은 최신 PO TKT-178의 첫5초·재방문2.5초를 적용**, 옛10초 체크리스트는 이번 기준이 아니다. |
| 라이트 테마 | 375/1440에서 완성 문구·티커·제어 직접 확인. |

## 검증·PM 인계

- 격리 Pages-base production build 성공(Vite6.4.3,55 modules). 같은 빌드의 `splashTone.e2e.mjs` **8/8 통과**, 첫5초·재방문·재생5초·만료/저장불가·reduced-motion·키보드 재생 포커스·파비콘 회귀 포함. 기존 E2E는 가상 시계이며 위 실제 시간 계측과 별개다.
- E2E 이름의 worst random=0.99는 동일 Z 연속 입력이 `App.vue:1504`에서 건너뛰어지므로 전체 시간의 최악 조건을 증명하지 않는다. 이번 판단은 별도 일반 난수 실렌더를 근거로 한다. 저사양 실기기·백그라운드 탭·WebKit·실제 VoiceOver·라이브 Pages는 미검증이다.
- **[디자이너 의견]** 티켓의 기존 `[구체화 질문]`에 동의한다. 단축 자체는 최신 PO 요구이며 기존 정체성을 유지했다. `docs/feature-definition.md`·톤 원칙·검수 체크리스트에 남은10초는 PM이 최신 계약으로 정합화할 사항이다. 디자이너가 직접 바꾸지 않았다.
- **동시 변경 경계**: 종료 시 App.vue·styles.css가 후속 TKT-182 작업으로 바뀌었다([비교](UX-TKT-178-r1-assets/source-comparison.json)). 새 문 열림 시간을 종료 타이머에서 차감하는 진행 중 코드가 보인다. 이 보고서의 정상 읽기 시간은 **위178 고정본에만 적용**하며 182의 완료본을 검증한 결과가 아니다. 182 검수에서는 총시간뿐 아니라 DOORS OPENING 정착→문에 가려지는 시점의 읽기 시간(첫≥0.7초·재방문≥1초)을 다시 계측해야 한다. 500ms를 단순 차감하면178에서 확인한 첫 방문 마지막 문구0.863~0.933초의 여유가 줄 수 있다. 작성 중182 문서를 확정 스펙으로 채택하거나 지금 결함으로 판정하지 않았다.
- 앱·목업·티켓·보드·원칙·스펙 수정 및 commit/push 없음. 캡처 서버·브라우저 종료. PM 수신함과 history에 인계한다. 한 실행 한 작업 유지, 다음 실행은 새로운 need_review를 먼저 확인하고 없으면 미완164의 소급 검수를 재개한다.
