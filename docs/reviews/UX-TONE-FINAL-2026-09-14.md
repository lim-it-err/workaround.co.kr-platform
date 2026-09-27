문서 상태: 작성완료

# TKT-137 톤 브랜치 전 화면 최종 UX 검수

- 작성: codex-8 · 2026-09-14 · **검수 초안, 최종 판정은 PM Claude**.
- 대상: `codex/v0.7.0-tone` 메인·Advisor 실제 빌드. 홈은 TKT-136 **r16 세 노선 직선 통과** 이식본이다. 검수 중 PM이 finished 처리한 판정을 보존한다.
- 결과: **[블로커] 1개 유형·2곳, [중요] 3건, [제안] 1건**. 병합 전 필수 제안은 B1만이다. I3은 공개 범위 정합을 확인할 사항이며 새 구현 결함으로 단정하지 않는다.
- 앱·목업·티켓·보드·원칙 문서 무수정. 커밋·push 없음. 기존 finished 티켓을 다시 판정하지 않는다.

## 검증 기준과 환경

메인은 `base=/workaround.co.kr-platform/`, Advisor는 `base=/workaround.co.kr-platform/advisor/`로 각각 빌드한 뒤 **메인 dist 아래 advisor/를 합친 병합 dist**를 로컬 정적 서버에서 렌더했다. 메인 49 modules, Advisor 110 modules 빌드 성공. Advisor의 약 506kB 청크 경고는 남아 있다. Chromium, 375×900·1440×900 각각 다크·라이트의 4환경이다.

Pages 정적 모드가 격납고·엘리베이터·택시·Work·Runtime 진입을 막으므로 이 5화면은 동일 소스를 `base=/`로 추가 빌드해 **레이아웃만 보충 관찰**했다. 이 보충 결과로 공개 Pages 경로나 실제 백엔드 동작을 통과했다고 주장하지 않는다. I3 참조.

원칙 1~6과 조작부 경계 각주, 40px, 접근 이름, 펼친 상세의 렌더된 영어 간판을 기준으로 삼았다. 원칙 문서의 이전 방사형 문구보다 최신 TKT-136의 직선 통과 지시를 적용했다. 스플래시의 지정 영어 플랩 문구·제품명·코드/API 표기는 제거 대상 영어 eyebrow와 구분했다.

검수 소스 **134개 SHA-256**과 원문을 assets에 보존했다. 보고서 작성 시 원본 134개가 모두 검수본과 일치했다. 이후 다른 작업자의 수정은 이 보고서의 검증 범위에 포함되지 않는다. [manifest](UX-TONE-FINAL-2026-09-14-assets/manifest.json), [소스 SHA](UX-TONE-FINAL-2026-09-14-assets/source-sha.json), [전체 스크린샷 색인](UX-TONE-FINAL-2026-09-14-assets/INDEX.md).

## 우선순위 상위 5

| 순위 | 분류 | 발견 | 사용자에게 생기는 일 | 후속 방향 |
|---|---|---|---|---|
| 1 | [블로커] B1 | 오프라인 추천 카드와 Runtime 배포 단계의 읽기용 면 | 콘텐츠가 다시 박스 단위로 동급 강조됨 | 읽기·이동 행을 hairline으로, 실제 값 변경 조작부만 면 유지 |
| 2 | [중요] I1 | 오늘의 특정 독서 카드 CTA가 전체 연습 목록으로 이동 | 추천된 책을 다시 찾아야 함 | 카드 식별 query와 출발 화면 문맥 보존 |
| 3 | [중요] I2 | 상단바·스튜디오·Advisor 복귀 링크의 40px 미달 | 작은 화면에서 정확히 눌러야 함 | 시각적 무게를 늘리지 않고 실제 클릭 영역 확보 |
| 4 | [중요] I3 | 요청된 5화면이 병합 Pages에서 정적 차단 | 노선도에 보이는 목적지와 공개 접근 범위가 다름 | PM이 공개 범위와 검수 완료 조건 정렬 |
| 5 | [제안] S1 | 배우기 초기 30행과 긴 총시간 표시 | 처음 할 짧은 활동을 찾는 부담 | 다음 회차 시간과 전체 코스 시간의 위계 분리 검토 |

## B1 [블로커] 읽기용 카드 면이 남아 있다

**주 근거 — Advisor 오늘 → ‘오프라인 세션 만들기’ 펼침 → ‘이번 비행 추천’.** 추천 3개가 라운드 박스로 표시되고 1440에서는 2열이다. 4환경 모두 `.flight-card`의 radius 14px, 배경은 다크 `rgb(26,33,45)`·라이트 `rgb(255,255,255)`였다. 책 제목과 소요 시간을 읽고 이동하는 항목이며, 값이 바뀌는 프리셋이나 실행 버튼이 아니다. 원칙 1과 조작부 경계 각주에 직접 걸린다.

- 파일: `services/advisor/frontend/src/modules/missions/pages/InflightPage.vue:114` 추천 링크의 `flight-card card`, `:144` 2열 스타일. `services/advisor/frontend/src/app/styles.css:64`의 `:is(a, button).card` 규칙이 링크에도 채움·외곽선·둥근 모서리를 다시 준다.
- 화면: [375 다크](UX-TONE-FINAL-2026-09-14-assets/offline-cards-375-dark.png), [1440 라이트](UX-TONE-FINAL-2026-09-14-assets/offline-cards-1440-light.png), [전체 문맥](UX-TONE-FINAL-2026-09-14-assets/advisor-today-expanded-375-dark.png). 측정: `focus.json`.
- 정정 제안: 제목·시간·화살표를 한 행으로 묶고 행 사이 hairline만 유지. 글자 크기·줄 간격·시간 프리셋 등 실제 조작부는 현재 구분을 유지한다.

**같은 유형의 보충 근거 — Runtime → ‘오프로드·배포 기준’ 펼침 → ‘배포 레일’.** UI/docs 정리부터 tag/release까지의 5개 읽기 단계가 pill 면으로 둘러싸인다. 다크에서 더 뚜렷하다. 이 화면은 `base=/` 보충 검수에만 해당한다.

- 파일: `frontend/src/App.vue:4620`의 `.path-steps` 읽기용 div 목록, `frontend/src/styles.css:1655` 배경·외곽선·radius 999px.
- 화면: [375 다크](UX-TONE-FINAL-2026-09-14-assets/root-runtime-expanded-375-dark.png), [1440 라이트](UX-TONE-FINAL-2026-09-14-assets/root-runtime-expanded-1440-light.png).
- 정정 제안: 순서·이름을 선과 타이포로 표시한다. Pages에서 제외돼 있다는 사실과 런타임 화면 자체의 원칙 위반은 구분한다. 수정 적용 범위는 PM이 확정한다.

입력 폼·프리셋·선택 버튼과 엘리베이터 단면·택시 메쉬는 원칙 각주의 예외이므로 이 지적에 포함하지 않는다.

## I1 [중요] 오늘 CTA가 추천한 독서 카드의 목적지를 잃는다

새 브라우저 상태에서 오늘의 주인공이 **‘정리하는 뇌’ / 저녁·카드 갈래 1장**으로 표시됐다. ‘오늘의 첫 판 시작’을 누르면 해당 카드가 아니라 **배우기 연습 131개 목록**으로 이동한다. 실제 링크는 `/advisor/games`이고 목적지는 `/advisor/learn#practice`였다. 카드 query가 없었다. 375/1440×다크/라이트 모두 재현했다.

- 파일: `services/advisor/frontend/src/modules/missions/pages/TodayPage.vue:38` 추천 목적지, `:43` `surfaceLink(path)`가 `{path,state}`를 만들고 `:58` CTA에 전달한다. `services/advisor/frontend/src/modules/missions/store/missions.js:350`은 원래 `/games?card=...`를 만든다. `services/advisor/frontend/src/modules/missions/routes.js:47` games 리다이렉트와 함께 확인해야 한다. 라이브러리 내부 원인은 별도 구현 검증이 필요하다.
- 화면: [추천 문맥](UX-TONE-FINAL-2026-09-14-assets/advisor-today-expanded-375-dark.png), [375 도착](UX-TONE-FINAL-2026-09-14-assets/today-cta-destination-375-dark.png), [1440 도착](UX-TONE-FINAL-2026-09-14-assets/today-cta-destination-1440-light.png). URL·타깃 기록: `settled.json`.
- 정정 제안: path/query/hash와 ‘오늘’ 출발 문맥을 모두 보존한다. 검증 기준은 경로가 열린다는 것에 그치지 않고 **추천한 카드 1개와 제목이 맞는지**까지 확인한다. 재선택은 가능하므로 블로커로 올리지 않는다.

## I2 [중요] 실제 누르는 영역이 40px보다 작다

| 화면·조작 | 관찰한 실제 크기 | 파일 근거 | 스크린샷 |
|---|---|---|---|
| 메인 상단바 환승 홀·테마 | 높이 약 35.78px | `frontend/src/styles.css:4266` | [블로그 375](UX-TONE-FINAL-2026-09-14-assets/blog-hub-375-dark.png) |
| 모바일 스튜디오 발행·글 도구 | 너비 약 37.59·37.92px, 높이 40px | `frontend/src/components/WritingStudio.vue:645` | [스튜디오 375](UX-TONE-FINAL-2026-09-14-assets/studio-375-dark.png) |
| 스튜디오 저장 안내와 백업 | 28×28px | `frontend/src/components/WritingStudio.vue:648` | [스튜디오 375](UX-TONE-FINAL-2026-09-14-assets/studio-375-dark.png) |
| Advisor 미션 복귀 링크 | 높이 16px | `services/advisor/frontend/src/modules/missions/pages/MissionPage.vue:559` | [미션 375](UX-TONE-FINAL-2026-09-14-assets/advisor-draft-restored-375-light.png) |
| Advisor 코스 게임 복귀 링크 | 높이 약 20.8px | `services/advisor/frontend/src/modules/missions/pages/PracticeGamePage.vue:189` | [코스 게임 375](UX-TONE-FINAL-2026-09-14-assets/course-game-settled-375-dark.png) |

글자와 여백으로 실제 hit area를 최소 40×40으로 넓히는 방향을 제안한다. 박스를 추가할 필요는 없다. raw DOM 측정의 숨은 파일 input, 닫힌 details의 빈 innerText, label이 대신 조작하는 작은 checkbox, 39.984px 반올림 오차는 결함 집계에서 제외했다. 공개 블로그 제목 hit area는 감사 후속 TKT-138의 기존 범위이므로 별도 신규 건으로 중복 발행하지 않는다.

## I3 [중요] 병합 Pages와 요청된 공개 검수 경로의 범위가 다르다

`/workaround.co.kr-platform/{sim,elevator,taxi,work,runtime}` 진입은 모두 환승 홀로 돌아온다. 이는 현재 `staticMode`의 명시적 정책이다. `frontend/src/App.vue:31`의 정적 모드와 제외 집합, `:2219`의 진입 차단, `:2933`·`:3044` 초기 경로 처리가 관련된다. [Work 진입 결과 375](UX-TONE-FINAL-2026-09-14-assets/work-375-dark.png), [Runtime 진입 결과 1440](UX-TONE-FINAL-2026-09-14-assets/runtime-1440-light.png).

따라서 원래 파일명의 `simhub-*`, `elevator-*`, `taxi-*`, `work-*`, `runtime-*` 캡처는 **해당 화면이 아니라 정적 차단 후 환승 홀**이다. 실제 화면의 보충 검수는 `root-*` 캡처에만 해당한다. 신규 톤 결함이나 차단 해제 요청으로 해석하지 않는다. PM이 병합 릴리스에 포함하는 화면 범위와 TKT-137의 완료 범위를 맞춰야 한다. 보호 구역을 임의로 공개하는 수정은 제안하지 않는다.

## S1 [제안] 배우기의 첫 선택을 더 짧게 만든다

375에서 배우기 초기 30행이 포함된 전체 문서가 약 4,999px로 길다. 코스의 큰 총 소요시간과 짧은 독서·연습 시간이 같은 행 체계에 섞여 있어, 지금 잠깐 할 것을 찾을 때 읽는 부담이 남는다. 검색·4축 필터·초기화는 정상 동작했다.

- 파일: `services/advisor/frontend/src/modules/missions/pages/LearnPage.vue:128` 필터, `:182` 통합 인덱스, `:262` 이후 행 스타일.
- 화면: [375 다크](UX-TONE-FINAL-2026-09-14-assets/advisor-learn-375-dark.png), [1440 라이트](UX-TONE-FINAL-2026-09-14-assets/advisor-learn-1440-light.png).
- 제안: 전체 코스 시간과 다음 회차 시간을 구분하고, 처음 보이는 행 수·필터 접근 방식을 검토한다. 현재 스펙을 바꾸는 결정은 PM 소관이며 병합 필수 사항은 아니다.

## 화면별 검수 기록

아래 대표 링크 외에도 색인에 4환경을 모두 보존했다. ‘추가 발견 없음’은 해당 관찰 흐름에서 새로운 문제를 찾지 않았다는 뜻이며 전 기능 무결점 판정이 아니다.

| 화면·흐름 | 분류·관찰 결과 | 대표 증거(375 다크 / 1440 라이트) |
|---|---|---|
| 스플래시 → 문 열림 → 홈 | 추가 발견 없음. 약 10초 유지 후 실제 퇴장, 순환선 심볼·지정 플랩 문구 유지 | [시작](UX-TONE-FINAL-2026-09-14-assets/splash-start-375-dark.png) / [문 열림](UX-TONE-FINAL-2026-09-14-assets/splash-opening-1440-light.png) |
| 환승 홀 | [중요] I2·I3. r16 직선 3노선·8지선과 3묶음 목록, 1440 좌우 배치 확인 | [375](UX-TONE-FINAL-2026-09-14-assets/home-ready-375-dark.png) / [1440](UX-TONE-FINAL-2026-09-14-assets/home-viewport-1440-light.png) |
| 블로그 허브·보관함·상세 | [중요] I2. 검증용 글 진입·새로고침 유지. 제목 hit area는 TKT-138 참조 | [허브](UX-TONE-FINAL-2026-09-14-assets/blog-hub-375-dark.png) / [상세](UX-TONE-FINAL-2026-09-14-assets/blog-post-1440-light.png) |
| 글쓰기 | [중요] I2. 본문 편집→저장→새로고침 보존. 모바일 글 도구 시트·데스크톱 인라인 도구·발행 설정 열기/취소 확인 | [도구](UX-TONE-FINAL-2026-09-14-assets/studio-tools-375-dark.png) / [발행 설정](UX-TONE-FINAL-2026-09-14-assets/studio-publish-sheet-1440-light.png) |
| 여행 단일 노선도·정차역 | 추가 발견 없음. TKT-127의 단일 진입 기준. 7일차 벨베데레 → Advisor 미션 → 같은 정차역 시트 복귀·Esc 닫힘 | [시트](UX-TONE-FINAL-2026-09-14-assets/voyage-sheet-375-dark.png) / [환승 미션](UX-TONE-FINAL-2026-09-14-assets/advisor-voyage-mission-1440-light.png) |
| 여행 회고 제어 | 추가 발견 없음. 현재 boarding 데이터에서 재생/일시정지 비노출. arrived용 가짜 데이터로 현재 여행을 바꾸지 않음 | [375](UX-TONE-FINAL-2026-09-14-assets/voyage-375-dark.png) / [1440](UX-TONE-FINAL-2026-09-14-assets/voyage-1440-light.png) |
| 격납고 | [중요] I3. base=/ 보충 화면에서 행·주인공·펼친 상세 관찰 | [375](UX-TONE-FINAL-2026-09-14-assets/root-simhub-expanded-375-dark.png) / [1440](UX-TONE-FINAL-2026-09-14-assets/root-simhub-expanded-1440-light.png) |
| 멈춘 엘리베이터 | [중요] I3. 보충 화면에서 단면 그림·지표 행·조작부 구분 유지 | [375](UX-TONE-FINAL-2026-09-14-assets/root-elevator-expanded-375-dark.png) / [1440](UX-TONE-FINAL-2026-09-14-assets/root-elevator-expanded-1440-light.png) |
| 심야 택시 | [중요] I3. 보충 화면에서 메쉬·조작부 관찰. 실제 서버 운행 검증 제외 | [375](UX-TONE-FINAL-2026-09-14-assets/root-taxi-expanded-375-dark.png) / [1440](UX-TONE-FINAL-2026-09-14-assets/root-taxi-expanded-1440-light.png) |
| Work | [중요] I3. 보충 화면의 fallback·펼친 상세만 검수, 실제 티켓 전이 미실행 | [375](UX-TONE-FINAL-2026-09-14-assets/root-work-expanded-375-dark.png) / [1440](UX-TONE-FINAL-2026-09-14-assets/root-work-expanded-1440-light.png) |
| Runtime | [블로커] B1·[중요] I3. 읽기용 배포 레일 면 잔존 | [375](UX-TONE-FINAL-2026-09-14-assets/root-runtime-expanded-375-dark.png) / [1440](UX-TONE-FINAL-2026-09-14-assets/root-runtime-expanded-1440-light.png) |
| Advisor 오늘·기내 | [블로커] B1·[중요] I1. 오늘 주인공은 보이나 목적지가 연결되지 않음 | [375](UX-TONE-FINAL-2026-09-14-assets/advisor-today-expanded-375-dark.png) / [1440](UX-TONE-FINAL-2026-09-14-assets/advisor-today-expanded-1440-light.png) |
| 배우기 | [제안] S1. 검색 0건→초기화→30행 복구를 4환경에서 확인 | [0건](UX-TONE-FINAL-2026-09-14-assets/learn-empty-375-dark.png) / [초기 목록](UX-TONE-FINAL-2026-09-14-assets/advisor-learn-1440-light.png) |
| 코스·비엔나 1900 | 추가 발견 없음. 12미션·형식 구분, 게임에서 코스 복귀 확인 | [코스 목록](UX-TONE-FINAL-2026-09-14-assets/advisor-courses-375-dark.png) / [비엔나](UX-TONE-FINAL-2026-09-14-assets/advisor-vienna-1440-light.png) |
| 코딩 미션·게임·Probe·Boundary | [중요] I2. 작성 초안 새로고침·왕복 보존, 코스 게임의 복귀 이름/목적지 정상 | [초안](UX-TONE-FINAL-2026-09-14-assets/advisor-draft-restored-375-dark.png) / [게임 복귀](UX-TONE-FINAL-2026-09-14-assets/course-game-settled-1440-light.png) |
| 사건 파일·스와이프·프로젝트·리뷰 | 추가 발견 없음. 페이지 진입·읽기/조작 구분과 리뷰 빈 상태 확인. 실제 AI 제출 제외 | [사건](UX-TONE-FINAL-2026-09-14-assets/advisor-case-375-dark.png) / [프로젝트](UX-TONE-FINAL-2026-09-14-assets/advisor-project-1440-light.png) |
| 코스 시뮬 | 추가 발견 없음. 10시 재실행 결과 도착172·시간 내 처리172·미처리0. 조건 변경 안내→재실행 후 현재 조건 표시 정상 | [변경 안내](UX-TONE-FINAL-2026-09-14-assets/advisor-simulation-stale-375-dark.png) / [재실행](UX-TONE-FINAL-2026-09-14-assets/advisor-simulation-rerun-1440-light.png) |
| 기록·지난 시즌 | 추가 발견 없음. 종료→명시적 새 시즌→대기 적립→지난 시즌 재열람. 이전 값45 보존·읽기 전용 확인 | [지난 시즌](UX-TONE-FINAL-2026-09-14-assets/advisor-season-past-375-dark.png) / [새 시즌](UX-TONE-FINAL-2026-09-14-assets/advisor-season-new-1440-light.png) |

## 공통 체크리스트와 검증 한계

- **주인공·면·노선색:** 홈은 노선도, 글쓰기는 편집 본문, 여행은 지도, Advisor 오늘은 다음 활동으로 읽힌다. B1에서 읽기용 면이 남는다. 시뮬 캔버스와 지정 스플래시 배경은 예외로 구분했다.
- **375 넘침:** 측정한 html/body/주 스크롤 컨테이너에서 가로 overflow 0. 실제 상세를 펼친 보충 경로도 0이다. 작은 hit area는 I2에 별도로 남겼다.
- **영어 간판:** 펼친 상세를 포함해 렌더된 `.eyebrow`/eyebrow 클래스의 innerText에서 대문자 영어 간판 0. 임의의 모든 DOM 텍스트를 대상으로 한 언어 자동 판정은 아니며, 제품명·운영 코드·스플래시 지정 문구는 유지 대상으로 구분했다.
- **접근 이름·복귀:** 관찰한 주요 버튼·입력에 이름이 있고, 여행 시트 Esc 닫힘과 역방향 복귀를 확인했다. raw unnamed 배열의 숨은 요소는 그대로 결함으로 세지 않았다. VoiceOver·WebKit·전체 키보드 경로는 미검증이다.
- **라이트:** 4환경에서 동일 주요 흐름을 확인했다. 배경 대비 때문에 B1 카드 면은 라이트에서도 분명하다. 전체 텍스트 대비 수치 감사를 새로 수행한 것은 아니다.
- **데이터:** 독립 브라우저 저장소에 검증용 글·미션 초안·시즌 fixture만 사용했다. 공개 발행, 실제 사용자 데이터, 외부 AI 호출·실제 서버 전이는 수행하지 않았다.
- **자동화 근거:** `results.json`·`extra.json`은 흐름 관찰 및 DOM 측정 기록이며 전체 E2E 통과율을 뜻하지 않는다. uncaught pageerror는 두 기록 모두 0이다. 네트워크/console error 0을 주장하지 않는다. root 빌드의 API 부재는 제한 사항이다.
- **재확인 정정:** 초기 홈 캡처는 페이드 중이므로 `home-ready`/`home-viewport`를 기준으로 했다. 초기 검색 selector와 데스크톱 ‘글 도구’ 버튼 탐색 실패는 검증 스크립트 가정 오류였고 실제 검색·인라인 도구로 재확인했다. `focus.json`의 코스 복귀 count 0은 비동기 렌더 대기 부족이었으며 `settled.json`에서 4환경 모두 정상 복귀 확인했다. 이 셋은 제품 결함이 아니다.
- 빌드와 사용자 흐름 검수는 수행했다. 저장소 전체 unit/E2E·보안·릴리스 게이트는 codex-5 AS-R009의 별도 범위다. 실제 배포 Pages의 동작은 미검증이다.

## 병합 전 필수 제안 — 블로커만

1. **B1 Advisor 기내 추천**: 읽기·이동 카드의 면과 카드 그리드를 걷고 hairline 행으로 표시하는지 375/1440×다크/라이트에서 재검수한다.
2. **B1 Runtime 배포 레일**: 읽기 단계의 pill 면을 정정하고 `base=/` 화면을 재검수한다. 정적 Pages 제외와 별개인 런타임 적용 범위는 PM이 확정한다.

I1·I2는 후속 우선 수정 제안, I3은 공개 범위 결정 사항, S1은 개선 제안이다. 이 문서는 병합 승인이나 반려 판정이 아니며 PM이 감사 결과와 함께 결정한다.
