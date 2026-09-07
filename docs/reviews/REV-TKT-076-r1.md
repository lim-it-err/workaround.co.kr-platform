# REV-TKT-076-r1-draft — UI 재구현 S6: 모바일 재배치 + Writing Studio 마감 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-08-18. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: `frontend/src/App.vue`(Studio 상태 흐름 마크업 + 하단 빠른 환승 nav, 65줄), `frontend/src/components/StatusBadge.vue`(+`preview` 상태, 4줄), `frontend/src/styles.css`(128줄 추가). S1~S3(TKT-071/072/073) 선행 완료 후 착수, S1~S5 마감 후 진행하는 선택 슬라이스(P3)의 잔여분(모바일 1차는 2026-08-16에 이미 완료).

## 요약 권고: **통과 — 완료 기준 4개 전부 실측 확인, 블로커 없음**

## 실행 검증

- `npm --prefix frontend run build` — 통과(vite 6.4.3, **27 modules**).
- **scope 준수**: `JunctionMap.vue`는 diff에 없음(노선도 구현 자체는 TKT-072 소관, 미침범). 스플래시/플랩 CSS·JS도 diff 밖(TKT-070 소관, "본 티켓은 플랩 CSS/JS를 건드리지 않는다" claim과 일치). 변경 파일이 App.vue(Studio+nav 마크업)·StatusBadge.vue(상태 1개 추가)·styles.css(신규 규칙)로 티켓이 선언한 범위와 정확히 일치.
- 격리된 dev 서버(포트 7011, 종료 후 정리), 375px 뷰포트로 root(`/`) → 블로그 → Writing Studio 실제 클릭 이동 후 검증(Writing Studio는 `/test` 화이트리스트에 없어 스플래시를 실제로 통과해야 함).

## 완료 기준 대조

### ① build
위 참조.

### ② 모바일 "재배치"(축소 아님) — 하단 빠른 환승
Writing Studio 페이지(가장 복잡한 화면)에서 375px 실측: `document.documentElement.scrollWidth === clientWidth`(오버플로 0). `.mobile-quick-nav` 버튼 3개(노선도/아카이브/승강장) **전부 정확히 48px 높이**(`min-height:48px` CSS 그대로 반영, 터치 타깃 기준 충족)로 렌더. 현재 페이지(writingStudio)에 맞춰 "아카이브" 버튼만 `.active`(다른 두 개는 비활성)임을 확인 — `:class="{ active: [...].includes(page) }"` 바인딩이 정확히 동작. **"노선도" 버튼 실제 클릭 → 환승 홀로 정상 이동 확인**(코드 읽기가 아니라 클릭 후 페이지 내용 변화로 재현). `v-if="!isTestRoute"` 가드로 `/test` QA 하네스에서는 이 nav가 안 뜨는 것도 App.vue 코드로 확인(QA 패널 자체 "빠른 이동"과 중복 방지, 스코프 경계를 스스로 지킨 설계).

### ③ Writing Studio 상태 흐름 (draft/preview/published/archived)
`StatusBadge.vue` diff: `validator`에 `'preview'` 추가, 라벨 "미리보기", 클래스 `badge-preview` — 4줄짜리 깔끔한 확장. 실브라우저에서 초기 상태(draft 글) 진입 시 상태 흐름 4배지 중 **"초안"만 `.active`**임을 확인. **"미리보기" 뷰 모드 버튼을 실제로 클릭**하니 "초안"+"미리보기" 배지가 **동시에** `.active`로 바뀜을 확인 — 코드 추적(`studioState.status==='draft'` vs `studioViewMode==='preview'`, 서로 다른 소스) 결과와 정확히 일치하며, 티켓의 "작업자 산출물" 주장("미리보기와 현재 저장 상태 공개가 함께 활성화")과도 일치. 이는 버그가 아니라 "지금 보고 있는 모드"와 "실제 저장 상태"를 동시에 보여주는 의도된 설계다(아래 [제안] 참고).
- **발행(공개) = 가장 강한 액션**: `.studio-publish-button`에 `box-shadow`(다크 테마에서 `--exit` 녹색 글로우) 적용 확인, 스크린샷상으로도 다른 버튼과 명확히 구분되는 강조.
- **보관 = 브론즈, 위험색과 구분**: `.studio-archive-button` computed color가 **다크 `rgb(220,187,126)` / 라이트 `rgb(124,90,36)`** — 작업자가 산출물에 적은 수치와 정확히 일치(`#DCBB7E`/`#7C5A24` 소스와도 일치). `--danger` 토큰은 어디에도 참조되지 않음을 CSS 소스로 확인.

### ④ 반응형/접근성 (reduced-motion / focus-visible / 터치 타깃 / 복귀 CTA)
- **reduced-motion**: `document.styleSheets`를 순회해 실제 서빙된 CSSOM에서 `@media (prefers-reduced-motion:reduce)` 안에 `.fade-enter-active,.fade-leave-active,.route-row,.studio-view-controls .ghost-button,.mobile-quick-nav button { transition:none; }` 규칙이 살아있음을 확인(소스만 읽은 게 아니라 빌드 결과물에서 재확인).
- **focus-visible**: 전역 규칙(`styles.css:152`, `:focus-visible { outline:2px solid var(--safety); outline-offset:2px; }`)이 **이 티켓 이전부터 있던 사이트 공통 규칙**(diff에 없음, S1 산출물)임을 확인했고, 새로 추가된 `.mobile-quick-nav button`/Studio 버튼들에 이 규칙을 무력화하는 `outline` 재정의가 없음을 CSS로 확인 — 즉 충돌 없이 그대로 적용될 구조다. **다만 이 도구의 자동화 브라우저 환경에서 `element.focus()`로 프로그래밍 포커스를 줘도 `:focus-visible`은커녕 `:focus` 의사 클래스 자체가 매칭되지 않아**(`document.activeElement`는 맞는데 `matches(':focus-visible')`/`matches(':focus')` 둘 다 false) 실제 키보드 탭 시 아웃라인이 눈에 보이는지까지는 라이브로 재현하지 못했다 — 코드상 충돌 없음은 확인했으나 최종 시각 확인은 도구 한계로 못했음을 명시한다(추정으로 통과 처리하지 않음).
- **터치 타깃**: 위 ② 참조(48px 확인).
- **복귀 CTA**: `StationHeader`의 "환승 홀로 나가기"는 이 티켓 이전부터 모든 화면에 상시 노출(기존 계약, Studio도 예외 아님을 페이지 텍스트로 확인).
- **양 테마**: 다크/라이트 둘 다 archive 색상 실측(위 ③), 스크린샷은 다크 기준 확보.

### 콘솔 에러
새 에러 없음(이 리뷰 환경이 백엔드 없이 프런트 단독 기동이라 발생하는 기존 502/404뿐, 이전 리뷰들과 동일 원인).

## [제안] (경미, 블로커 아님)

- 상태 흐름 배지가 "초안"(저장 상태)과 "미리보기"(현재 보기 모드)를 동시에 활성 표시할 수 있다(위 ③). "흐름"이라는 이름이 단계별 배타적 진행을 암시하기 쉬운데 실제로는 두 축(저장 상태 vs 뷰 모드)이 섞여 있어, 처음 보는 사용자는 "왜 두 개가 동시에 켜져 있지"라고 잠깐 헷갈릴 수 있다. 기능 결함은 아니고 완료 기준 위반도 아니므로 PM 재량 — 후속 라운드에서 라벨/설명을 한 번 더 다듬으면 좋겠다는 정도.
- `:focus-visible` 키보드 탭 시 실제 시각 확인은 이 리뷰 도구의 한계로 못 했다(위 참조). 코드상 리스크는 낮다고 판단하지만, PM 또는 다음 세션에서 실제 키보드로 한 번 눈으로 확인해두는 걸 권장.

## 상태 제안 (판정은 PM)

블로커 0, [제안] 2건(둘 다 경미, 기능 결함 아님). 완료 기준 4개 전부(빌드/모바일 재배치/Studio 상태 흐름/접근성 대부분) 실측 확인했다. **finished 전환 권장.**


---
## PM 최종 판정 (claude, 2026-09-08)

**통과 → finished.** 리뷰어 실측 수용. 089 는 여행 당일(9/8) 실화면에서 DAY 1 프라하 자동 인식·3단 안내·운전 없는 날 표시를 PM 이 직접 재확인.
