문서 상태: 작성완료

# UX-TKT-186-r1 — TKT-186·187 소급 UX 검수

- 작성: codex-9, 2026-10-25. 인박스 지정 묶음 1건. **PM 판정 초안**이며 기존 finished·커밋을 변경하지 않는다.
- 대상: `codex/v0.8.0-live`의 `a2ef6d5cf7e981449f8677ae87179ff3b5174675` 제품 코드로 만든 Pages-base 산출물. 검수 시작 시 추적 파일 변경 없음(`.DS_Store`만). 작업 중 PM/dev의 TKT-188·보드·App.vue·E2E 변경이 나타났으며 해당 변경은 보존했다.
- 초안 결과: **[블로커] 0 / [중요] 1 / [제안] 1**. 중요 항목은 밥상 마지막 칩의 포커스 링 가림. 티커 줄 분할·레이아웃 안정성은 확인했다.
- 인박스 갱신 반영: 초기 요청의 속도 3안 비교는 **PO 확정 1.5초(TKT-188)**의 읽기 체감 의견으로 대체했다. 1.3초 구현 기준 E2E와 1.5초 브라우저 진단 미리보기를 구분한다.

## 근거·재현 환경

- 작업 디렉터리: `/Users/imjeonghan/newProject/workaround.co.kr-platform`.
- 실제 빌드: `npm --prefix /Users/imjeonghan/newProject/workaround.co.kr-platform/frontend run build -- --base=/workaround.co.kr-platform/` → **56 modules, 성공**. 파일: `index-CPOZApi0.js`, `index-Z_R2_6OM.css`.
- 기존 회귀: `NODE_PATH=/Users/imjeonghan/newProject/workaround.co.kr-platform/services/advisor/frontend/node_modules node --test /Users/imjeonghan/newProject/workaround.co.kr-platform/frontend/src/splashTone.e2e.mjs /Users/imjeonghan/newProject/workaround.co.kr-platform/frontend/src/components/Pantry.e2e.mjs` → **21/21(스플래시 13·밥상 8)**. 테스트 시작 시 기준은 1.3초였다. 후속 188의 게이트 결과로 전용하지 않는다.
- 실렌더: Chromium **151.0.7922.34**, `ko-KR`, `Asia/Seoul`. 스플래시 375/390/414/430×844 및 1440×900, 각 다크/라이트. 밥상 375×812·1440×900, 각 다크/라이트.
- 재현 스크립트: [capture.cjs](UX-TKT-186-r1-assets/capture.cjs). `node /Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-186-r1-assets/capture.cjs` → 로컬 정적 서버 4193, 완료 시 서버·브라우저 종료. 최초 sandbox의 `listen EPERM`은 실행 권한 승인 뒤 해소됐다.
- 원자료: [measurements.json](UX-TKT-186-r1-assets/measurements.json). **39문구×10환경=390회 Range 줄 측정**, 스크린샷 **43장**, 브라우저 pageerror 0. 문구 주입은 브라우저 DOM 진단이며 제품 소스·콘텐츠를 바꾸지 않았다.
- 한계: 실제 휴대전화·Safari·VoiceOver는 실행하지 않았다. 390~430 결과는 휴대전화 폭의 Chromium 렌더에 대한 판단이다. 읽기 속도 의견은 디자이너의 판단이며 사용자 묵독 실험 결과가 아니다.

## ① 1.5초 읽기 속도 — PO 결정 유지, 긴 문구는 빠르게 느껴질 여지

**[제안] S1. 1.5초는 1.3초보다 읽을 틈이 늘지만, 2줄의 긴 농담을 끝까지 읽는 데 여유롭다고 보기는 어렵다.** 특히 스플래시는 플랩·브랜드·자동 전환 안내가 함께 보여 처음부터 티커만 응시한다는 전제가 맞지 않는다. 반면 짧은 문구는 한눈에 들어오고 회전하는 장난스러운 분위기는 잘 유지된다. PO의 1.5초 결정을 다시 고르는 질문으로 돌리지 않는다.

풀은 공백·문장부호 포함 15~26자, 평균 19.13자다(`frontend/src/data/splashTicker.js:3`). 최대 26자를 1.5초 안에 읽는 데 필요한 약 17.3자/초는 단순 산술이며, 이를 일반 독자의 읽기 능력 기준이나 실패 판정으로 쓰지 않는다.

브라우저 내부에서 **1,300ms 타이머만 1,500ms로 치환**한 진단 미리보기는 0/1,500/3,000/4,500ms 교체를 확인했다(`measurements.json`의 `cadence1500Diagnostic`). 앱 소스는 수정하지 않았으며 **TKT-188 실제 구현 검증이 아니다**. [1.5초 미리보기 4,500ms](UX-TKT-186-r1-assets/cadence1500-preview-4500ms.png).

주의할 점은 **4개가 모두 1.5초 보이는 것은 아니라는 것**이다. `frontend/src/App.vue:2619`는 5,500ms 중 마지막 500ms를 문 열림에 쓰므로, 4,500ms에 나온 네 번째는 5,000ms까지 **500ms만 가림 없이** 보인다. 문이 열리는 추가 500ms를 정상 읽기 시간으로 합산하지 않는다. 188에 명시된 4개 관측 자체와는 모순이 없지만, 마지막 문구까지 충분히 읽힌다는 설명은 피하는 것이 좋다. 후속 사용자 관찰에서 불편이 나타나면 마지막 틱을 제한하거나 콘텐츠 길이별 체류를 검토할 수 있다(새 스펙은 PM 판단).

## ② 390~430px 두 줄 예약 — 수용 가능한 여백

**디자이너 의견: 현재 여백은 어색한 빈 행보다 한 줄 안내판의 숨 쉴 공간으로 보인다. 유지 권고.** 위·아래 hairline 사이에 한 줄을 세로 가운데 놓아 빈 둘째 줄처럼 느껴지지 않는다. 무엇보다 문구마다 제목·플랩이 움직이지 않는 이점이 크다. 추가 약 24px를 줄이기 위해 동적 높이를 다시 도입할 이유는 확인하지 못했다.

`frontend/src/styles.css:5757`의 최소 높이 **47.61px**, line-height **23.808px**로 한 줄일 때 추가 여백은 약 **23.80px(위·아래 약 11.90px씩)**이다. strip 총 높이 73.61px는 모든 모바일 폭·문구에서 같다.

| 폭 | 한 줄/두 줄 문구 수(39개, 테마별 동일) | 제목 y 변동 | 가로 넘침 |
|---|---:|---:|---:|
| 375 | 37 / 2 | 0px | 0px |
| 390 | 37 / 2 | 0px | 0px |
| 414 | 38 / 1 | 0px | 0px |
| 430 | 39 / 0 | 0px | 0px |
| 1440 | 39 / 0 | 0px | 0px |

모바일 390~430은 844 높이로 비교했고, 기본 375×812의 다시 재생 하단 783px는 기존 E2E에서 별도로 확인했다. 1440은 1줄 strip 50.56px다.

근거: [390 다크·짧은 문구](UX-TKT-186-r1-assets/splash-390-dark-short.png), [430 라이트·짧은 문구](UX-TKT-186-r1-assets/splash-430-light-short.png), [1440 라이트·긴 문구](UX-TKT-186-r1-assets/splash-1440-light-long2.png).

## ③ [중요] I1 — 마지막 칩에도 페이드가 남아 포커스 링·글자가 흐려짐

**375/1440 × 다크/라이트 네 환경 모두 재현.** `frontend/src/styles.css:5176`·`:5177`은 스크롤 위치·키보드 포커스와 무관하게 28px 마스크를 유지한다. 폭 제한만으로 포커스 링 보존이 보장되지 않는다. 이는 TKT-187 완료 조건 2의 “칩 조작·포커스 링이 가려지지 않게”와 어긋난다. focus-visible은 남아 있고 조작은 가능하므로 블로커로 분류하지 않는다.

재현:

1. 새 브라우저 컨텍스트에서 `/workaround.co.kr-platform/pantry` 진입.
2. Tab 키로 기본 칩 행을 순회해 마지막 `집밥`으로 이동한다(스크립트는 실제 Tab 키 사용).
3. 자동 가로 스크롤 뒤 `집밥` 오른쪽 테두리·포커스 링이 페이드 속으로 사라지고 글자 오른쪽도 옅어진다.
4. 진단용 DevTools에서 해당 행의 `mask-image`만 `none`으로 바꾸면 오른쪽 링과 글자가 선명하게 돌아온다. 소스는 변경하지 않는다.

375 측정: 행 x=25~248.34, 마지막 칩 x=192.94~247.64, 크기 **54.70×40px**, scrollLeft=974. 칩 오른쪽 **27.30px(너비의 약 절반)**이 마스크 구간에 들어간다. 칩 우측 경계의 마스크 불투명도는 선형식상 약 **2.5%**다. 1440에서도 동일하게 마지막 칩 27.30px가 페이드와 겹친다. 실제 `:focus-visible=true`, outline **2px**, offset **2px** 확인. 모든 칩 위·아래 링의 scrollport 잘림은 마스크 해제 뒤에도 남는 별도 기존 조건이므로 이번 마스크 회귀와 구분한다.

| 화면 | 현재 | 마스크만 제거한 진단 비교 |
|---|---|---|
| 375 다크 | [현재](UX-TKT-186-r1-assets/pantry-375-dark-last-focus.png) | [비교](UX-TKT-186-r1-assets/pantry-375-dark-last-focus-unmasked-diagnostic.png) |
| 375 라이트 | [현재](UX-TKT-186-r1-assets/pantry-375-light-last-focus.png) | [비교](UX-TKT-186-r1-assets/pantry-375-light-last-focus-unmasked-diagnostic.png) |
| 1440 다크 | [현재](UX-TKT-186-r1-assets/pantry-1440-dark-last-focus.png) | [비교](UX-TKT-186-r1-assets/pantry-1440-dark-last-focus-unmasked-diagnostic.png) |
| 1440 라이트 | [현재](UX-TKT-186-r1-assets/pantry-1440-light-last-focus.png) | [비교](UX-TKT-186-r1-assets/pantry-1440-light-last-focus-unmasked-diagnostic.png) |

대안: **키보드 포커스가 행 내부에 있는 동안 마스크 해제**를 우선 검토하고, 가능하면 스크롤 끝에서도 해제해 더 갈 곳이 있는 것처럼 보이지 않게 한다. 28px 이하라는 수치만으로 검증하지 말고 마지막 칩 Tab 진입·끝 스크롤·양 테마의 실제 포커스 표시를 완료 기준으로 삼는 것을 권고한다. 적용 방식·후속 티켓은 PM 결정이다.

기존 `frontend/src/components/Pantry.e2e.mjs:140` 이후 검증은 40px·한 줄·가로 스크롤 가능 여부를 확인하지만 마스크와 키보드 포커스의 상호작용을 검증하지 않는다. **기존 8/8 그린과 이번 I1은 동시에 성립한다.**

## ④ 긴 두 문구의 실제 행 텍스트

Range로 문자별 y를 모아 얻은 텍스트이며 다크/라이트 결과가 같다. 단어 중간 분할·`중…` 고아 줄은 이번 렌더에서 나타나지 않았다.

| 문구·폭 | 1행 | 2행 |
|---|---|---|
| 긴 문구 1 · 375/390 | 갈아타기 최단경로가 | 삐지지 않게 계산하는 중… |
| 긴 문구 2 · 375/390/414 | 승객들의 한숨을 열차 | 추진력으로 재활용하는 중… |
| 긴 문구 1 · 414/430/1440 | 갈아타기 최단경로가 삐지지 않게 계산하는 중… | 없음 |
| 긴 문구 2 · 430/1440 | 승객들의 한숨을 열차 추진력으로 재활용하는 중… | 없음 |

근거: [375 다크 긴 문구 1](UX-TKT-186-r1-assets/splash-375-dark-long1.png), [375 다크 긴 문구 2](UX-TKT-186-r1-assets/splash-375-dark-long2.png), [375 라이트 긴 문구 1](UX-TKT-186-r1-assets/splash-375-light-long1.png), [414 라이트 긴 문구 2](UX-TKT-186-r1-assets/splash-414-light-long2.png). 관련 CSS `frontend/src/styles.css:5763`~`:5765`.

## 공통 UX 확인·PM 인계

- 밥상은 오늘의 한 상이 주인공으로 읽히고 대안 2행은 hairline 아래로 내려간다. 면은 칩·버튼에 쓰이며 본문 카드 그리드는 없다. [375 기본](UX-TKT-186-r1-assets/pantry-375-dark.png), [1440 라이트](UX-TKT-186-r1-assets/pantry-1440-light.png).
- 기본 칩 접근 이름은 표시 텍스트, 선택은 `aria-pressed`, 펼침은 `aria-expanded`로 노출된다(`frontend/src/components/Pantry.vue:243`). 높이 40px. 키보드 접근은 가능하나 I1의 시각 가림이 남는다.
- 검수 대상 화면의 영어 섹션 간판은 발견하지 못했다(브랜드·합의된 플랩 세 문구 제외). 노선색은 선·배지 중심. 가로 넘침 0. 스플래시 5.5초·문 전환·모션 감소·티커 타이머 정리는 기존 13건에서 회귀 없음.
- **PM 요청:** I1의 후속 처리·수용 여부 결정. S1은 1.5초 확정 유지 아래 사용자 관찰 참고 의견이다. 기존 finished 판정·티켓 상태는 유지했다.
- AS-R011 라이브 감사는 인박스에 `배포됨 · SHA`가 없어 미착수. 이번 결과를 배포본 감사로 보지 않는다.
