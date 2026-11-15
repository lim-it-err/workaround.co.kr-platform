문서 상태: 작성완료

# UX-TKT-188-r1 — 티커 1.5초 실제 산출물 검수

- 작성: codex-9, 2026-10-25. 실행 중 need_review 도착으로 일괄 검수에 포함. 작성 도중 PM이 finished로 판정한 기록도 확인했으며 상태·판정을 변경하지 않는다.
- 범위: `frontend/src/App.vue:34`의 주기 1,300→1,500ms와 관련 E2E 변경. 검수 시작 시 App.vue diff는 상수 1줄뿐이었고 5.5초·플랩 1,660ms·문 열림 500ms는 그대로다.
- **새 차단 지적 없음: [블로커] 0 / [중요] 0.** 읽기 체감 [제안] 1은 [186·187 묶음 초안 S1](UX-TKT-186-r1.md)의 동일 의견을 참조한다. 코드·스펙·최종 판정은 PM 소관이다.

## 실제 빌드·검증

작업 디렉터리 `/Users/imjeonghan/newProject/workaround.co.kr-platform`. 다른 구현자의 빌드와 섞이지 않도록 별도 산출물 `/private/tmp/codex9-188.GUCTkF`를 만들었다. 제품 기준은 `a2ef6d5` 위 TKT-188 작업분이며, 앱 변경은 위 상수 1줄이었다. **이 문서는 타이머 치환 진단이 아니라 실제 1.5초 빌드의 검수다.**

```sh
npm --prefix /Users/imjeonghan/newProject/workaround.co.kr-platform/frontend run build -- --base=/workaround.co.kr-platform/ --outDir=/private/tmp/codex9-188.GUCTkF
npm --prefix /Users/imjeonghan/newProject/workaround.co.kr-platform/frontend run preview -- --host=127.0.0.1 --port=4194 --strictPort --base=/workaround.co.kr-platform/ --outDir=/private/tmp/codex9-188.GUCTkF
SPLASH_TEST_URL=http://127.0.0.1:4194/workaround.co.kr-platform/ NODE_PATH=/Users/imjeonghan/newProject/workaround.co.kr-platform/services/advisor/frontend/node_modules node --test /Users/imjeonghan/newProject/workaround.co.kr-platform/frontend/src/splashTone.e2e.mjs
```

- Pages-base build **56 modules 성공**, JS `index-kS6raU32.js`, CSS `index-Z_R2_6OM.css`. CSS 파일명은 186·187 검수 산출물과 동일하다. outDir이 프로젝트 밖이라 자동 비우기를 하지 않는 Vite 안내 1건은 새로 만든 빈 디렉터리 사용에 따른 것이다.
- 해당 독립 산출물에서 스플래시 E2E **13/13 성공**. 첫 방문·재방문·다시 재생·모션 감소·5.5초·문 전환·목업·파비콘을 포함한다.
- Chromium 151.0.7922.34, 한국어·서울 시간, **375×844·1440×900 × 다크/라이트**. 문구 39개×4환경 **156회** 줄·좌표 측정, pageerror **0**. 기본 375×812의 다시 재생 위치는 별도 버튼 측정 및 E2E로 확인했다.
- [측정 JSON](UX-TKT-188-r1-assets/measurements.json)의 `splash[].rotation`은 브라우저 타이머를 바꾸지 않은 실제 관측이다. 뒤의 `cadence1500Diagnostic`은 재사용 스크립트의 부가 항목이며 본 문서의 1.5초 입증에는 사용하지 않았다.
- 스크린샷 **25장** 중 스플래시 12장·진단 비교 1장, 나머지 밥상 12장은 재사용 캡처 루틴의 부가 관측이다. 밥상 문제는 이미 186·187의 I1로 제출했으므로 188 신규 결함으로 세지 않는다.
- 캡처 재현은 [공용 스크립트](UX-TKT-186-r1-assets/capture.cjs)에 `UX_DIST_ROOT=/private/tmp/codex9-188.GUCTkF`, `UX_CAPTURE_OUT=/Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-188-r1-assets`, `UX_WIDTHS=375,1440`을 주어 실행한다. 4193 캡처 서버·4194 preview는 검수 후 종료한다.

## 타이밍 기대값을 독립 계산한 결과

문 열림 시작 전 티커 예약을 정리하는 시점은 **5,500−500=5,000ms**다(`frontend/src/App.vue:2619`). 일반 첫 방문에서 `0≤1,500n<5,000`을 만족하는 정수 n은 **0·1·2·3**이므로 0/1,500/3,000/4,500ms **4개**가 맞다. `splash[].rotation` 네 환경 모두 정확히 이 네 시각을 기록했다. 단순 `5500/1500`이 아니라 문 전환 경계를 포함해 확인했다.

재방문은 0/1,500ms **2개**, 다시 재생은 첫 방문처럼 **4개**, 모션 감소 E2E는 4,500ms 진행 시 **4개**다. 모션 감소는 500ms 문 연출이 없어도 다음 6,000ms 틱이 5,500ms 전환 뒤이므로 첫 방문 전체 역시 4개다. 기존 `maxCount=5`를 4로 바꾼 근거가 이 계산과 일치한다. 플랩 정착 시간과 티커 노출 시간을 혼동하지 않았다.

## 실화면·카피·조작 영역

| 항목 | 실제 확인 |
|---|---|
| 주인공·면 | 브랜드/플랩이 중심, 티커는 아래 hairline 한 행. 기존 면·위계 변화 없음 |
| 카피 | PO 확정 1.5초, 39개 풀 유지. 영어 섹션 간판 없음(브랜드·기존 플랩 3문구 제외) |
| 가로 넘침 | 4환경×39문구 모두 0px |
| 레이아웃 | 제목 y 변동 0px. strip 375=73.61px, 1440=50.56px |
| 다시 재생 | 표시 텍스트가 접근 이름, native button. **97.39×53.81px**(375·1440), 40px 하한 충족 |
| 기본 높이 내 버튼 | 375×812에서 하단 783px, 1440×900에서 하단 857px |
| 접근성·전환 | aria-live off·모션 감소·키보드 포커스 복귀·5.5초/문 상태 회귀는 13건 E2E에서 통과 |

375에서 긴 문구의 실제 두 줄은 다음과 같다(양 테마 동일).

| 문구 | 1행 | 2행 |
|---|---|---|
| 긴 문구 1 | 갈아타기 최단경로가 | 삐지지 않게 계산하는 중… |
| 긴 문구 2 | 승객들의 한숨을 열차 | 추진력으로 재활용하는 중… |

1440에서는 두 문구 모두 한 줄이다. [375 다크 긴 문구 1](UX-TKT-188-r1-assets/splash-375-dark-long1.png), [375 라이트 긴 문구 2](UX-TKT-188-r1-assets/splash-375-light-long2.png), [1440 다크](UX-TKT-188-r1-assets/splash-1440-dark-short.png), [1440 라이트](UX-TKT-188-r1-assets/splash-1440-light-long2.png).

## 읽기 의견·남은 범위

**[제안]** 1.5초는 짧은 농담을 훑는 흐름에 맞지만 긴 2줄은 빠르게 느껴질 수 있다. 특히 네 번째가 4,500ms에 나타나 문 열림 시작까지 **500ms만 온전히 보이는 점**은 그대로다. PO의 1.5초·4개 결정을 준수한 구현이므로 반려 사유로 제시하지 않는다. 사용자 관찰 때 “문구 4개가 각각 1.5초 읽힌다”는 식의 설명을 피하자는 의견이다.

실제 휴대전화·Safari·스크린리더와 사용자 묵독 실험은 수행하지 않았다. 앱 코드는 수정하지 않았으며 동시 진행 중인 PM/dev 변경을 보존했다. 최종 수용은 PM 판단이다.
