문서 상태: 작성완료

# TKT-138 UX 검수 초안 r1

- 작성: codex-8 · 2026-09-15 (Europe/Budapest). 최종 판정은 PM Claude.
- 범위: TKT-138의 블로그 최근 글 제목·메인 상단바·스튜디오·Advisor 미션/게임 복귀 링크. TKT-137 I2와 UX-TKT-113 I1의 수정 확인.
- **[블로커] 0 / [중요] 0 / [제안] 1.** 검수한 대상 34개 모두 실제 bbox 40×40px 이상, 중심점 가림 없음. 가로 overflow 0, uncaught pageerror 0. 기존 작은 클릭 영역은 해소된 것으로 관찰했다.
- 앱·목업·티켓·보드 무수정. 커밋·push 없음. 139~144의 새 스펙·미구현 내용은 이번 판정 범위에서 분리했다.

## 실렌더 환경

원본을 임시 디렉터리로 복사해 메인 Vite 6.4.3(49 modules), Advisor Vite 5.4.21(110 modules)을 직접 빌드했다. 메인 `base=/workaround.co.kr-platform/` 아래 Advisor `base=/workaround.co.kr-platform/advisor/` dist를 병합하고 Chromium 로컬 정적 서버에서 검수했다. **375×900·1440×900 각각 다크/라이트** 4환경. 메인과 Advisor 빌드 성공, Advisor 505.90kB 청크 경고는 남아 있다.

검증용 짧은 글 ‘한 정거장’을 독립 localStorage에 넣어 짧은 제목에서도 최소 높이를 확인했다. 375 다크에서는 긴 제목 줄바꿈도 별도 캡처했다. 실제 계정·발행·백업 다운로드·AI 호출은 실행하지 않았다. [측정 기록](UX-TKT-138-r1-assets/results.json), [manifest](UX-TKT-138-r1-assets/manifest.json), [소스 SHA](UX-TKT-138-r1-assets/source-sha.json). 관련 소스 5개와 검수 스크립트도 assets에 보존했다.

## 변경 확인

| 대상 | 실측(너비×높이 px) | 파일:라인 근거 | 대표 화면 |
|---|---|---|---|
| 블로그 최근 글 제목 | 375: 119.14×40 / 1440: 126.59×41.47 | `frontend/src/styles.css:2169` inline-flex·최소 높이 | [375 다크](UX-TKT-138-r1-assets/blog-375-dark.png), [1440 라이트](UX-TKT-138-r1-assets/blog-1440-light.png) |
| 상단바 환승 홀·테마 | 환승 홀 66.69×40 / 테마 41.05~42.31×40 | `frontend/src/styles.css:4272` 최소 너비·높이 | [375 라이트](UX-TKT-138-r1-assets/blog-375-light.png), [1440 다크](UX-TKT-138-r1-assets/blog-1440-dark.png) |
| 스튜디오 발행·글 도구 | 375: 각각 40×40 / 1440 발행47.53×40, 글 도구는 인라인 패널 | `frontend/src/components/WritingStudio.vue:639` | [375 라이트](UX-TKT-138-r1-assets/studio-375-light.png), [1440 다크](UX-TKT-138-r1-assets/studio-1440-dark.png) |
| 저장 안내와 백업 진입 | 40×40, 4환경 동일 | `frontend/src/components/WritingStudio.vue:648` | [375 다크](UX-TKT-138-r1-assets/studio-375-dark.png), [1440 라이트](UX-TKT-138-r1-assets/studio-1440-light.png) |
| 도움말의 내 기록 백업 | 375: 295×53.81 / 1440: 490×53.81 | `frontend/src/components/WritingStudio.vue:628` 버튼, `:705` 이후 대화상자 스타일 | [375 다크](UX-TKT-138-r1-assets/backup-375-dark.png), [1440 라이트](UX-TKT-138-r1-assets/backup-1440-light.png) |
| Advisor 미션 복귀 | 46.33×40, 4환경 동일 | `services/advisor/frontend/src/modules/missions/pages/MissionPage.vue:559` | [375 라이트](UX-TKT-138-r1-assets/mission-375-light.png), [1440 다크](UX-TKT-138-r1-assets/mission-1440-dark.png) |
| Advisor 게임 복귀 | 375: 343×40 / 1440: 60.98×40 | `services/advisor/frontend/src/modules/missions/pages/PracticeGamePage.vue:189` | [375 다크](UX-TKT-138-r1-assets/game-375-dark.png), [1440 라이트](UX-TKT-138-r1-assets/game-1440-light.png) |

블로그 제목은 배경 투명·border 0을 유지하며 누르면 글 상세가 열린다. 스튜디오의 발행·도구·도움말은 각 대화상자를 열고 닫을 수 있고, 375에서 버튼 줄바꿈이나 가로 넘침이 없다. Advisor는 직접 주소 진입 조건에서 표시된 ‘배우기/전체 연습’ 링크를 눌러 실제 `/learn`으로 복귀한다. 코스에서 진입했을 때의 문맥 복귀는 이번 검증과 구분한다.

택시 E2E 변경은 `frontend/src/sim/taxiDispatch.e2e.mjs:112`의 폐기된 selector를 현행 격납고 히어로·서비스 행 단언으로 바꾼 것으로 확인했다. **택시 실행 및 전체 E2E는 이번 UX 검수에서 재실행하지 않았다.** 티켓의 taxi 5/5·메인47/47·Advisor4/4는 구현자 보고이며, 코드/게이트 검증과 최종 판정은 리뷰어·PM 범위다.

## [제안] S1 — 저장 안내의 원은 작게, 클릭 영역은 크게 유지 가능

`WritingStudio.vue:648`에서 버튼 자체를 28px에서 40px로 키워 **원 외곽선까지 함께 커졌다**. [이전 375 다크](UX-TONE-FINAL-2026-09-14-assets/studio-375-dark.png)와 [현재 375 다크](UX-TKT-138-r1-assets/studio-375-dark.png) 비교. 실제 조작이 쉬워졌고 편집 본문 위계를 해치거나 겹치지는 않으므로 블로커·중요 항목은 아니다. ‘시각 무게는 늘리지 말고 hit area만’이라는 PM 추가 의도를 엄밀히 따르려면, 40px 버튼 안에 기존 28px 원을 가상 요소로 그리는 방향을 제안한다. 적용 여부는 PM 판단.

## 공통 체크리스트

- 주인공 1개: 블로그 최근 글 제목·스튜디오 편집 본문·Advisor 미션/선택지가 유지된다.
- 면: 제목·복귀 링크에 새로운 읽기용 카드 면이 생기지 않았다. 입력/선택 영역의 기존 면은 이번 변경 대상이 아니다.
- 노선색: 선·배지 표현 유지. S1은 보조 조작부 외곽선 크기 제안이다.
- 영어 간판: 관찰 화면의 렌더된 eyebrow에 대문자 영어 간판 0. 전체 사이트 언어 감사는 아니다.
- 375 넘침·터치: 모든 관찰 화면 가로 overflow 0, 대상 34개 ≥40×40. 모바일 스튜디오 도구 버튼은 1440에서 숨고 기존 인라인 패널로 대체된다.
- 접근 이름·동작: 대상 버튼/링크의 이름과 중심점 hit 확인, 글 상세 이동·대화상자 열기/닫기·복귀 링크 동작 확인. 전체 키보드·VoiceOver 검증은 아니다.
- 카피: 이번 변경은 크기/CSS 중심이며 검수 대상 기존 문구를 유지한다. 신규 목업 대조 작업은 아니다.
- 배지·스플래시: 배지 유지. 스플래시는 TKT-138 수정 대상이 아니므로 재검수하지 않았다. 재방문 3초 변경은 별도 TKT-140이다.
- 라이트: 4환경에서 같은 최소 크기·배치 유지. 전수 대비 수치 검산은 이번 범위가 아니다.

## 한계와 인계

첫 검수 스크립트가 직접 진입한 미션/게임도 코스로 복귀한다고 가정해 대기 실패했다. 실제 링크 목적지와 직접 진입 문맥을 확인해 검수 스크립트만 정정했고, 최종 4환경 기록은 오류 없이 완료됐다. 이 실패를 앱 결함으로 세지 않았다.

검수 소스 SHA 비교 결과는 manifest에 기록한다. 실제 배포 Pages·WebKit/Safari·전체 테스트/릴리스 게이트는 미검증. **기존 I1/I2의 작은 클릭 영역 해소를 PM에게 보고하며, 추가 제안 S1의 채택과 최종 티켓 판정은 PM이 결정한다.**
