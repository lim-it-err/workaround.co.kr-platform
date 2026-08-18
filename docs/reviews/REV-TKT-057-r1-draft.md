# REV-TKT-057-r1-draft — 마크다운 렌더러 충실도 + XSS 가드 유지 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-08-17. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: `frontend/src/App.vue`(마크다운 렌더러/인라인 처리/URL 검증). 트렁크 `codex/v0.6.0-line` 공유 작업 트리(미커밋).
> 이 티켓은 **1순위 불변식이 XSS 안전성**이라고 스스로 명시했다 — 코드 추적과 실제 페이로드 주입 양쪽으로 평소보다 더 적대적으로 봤다.

## 요약 권고: **통과 — 6개 완료 기준 전부 코드 추적 + 실제 XSS 페이로드 7종 라이브 주입으로 확인, 블로커 없음**

## 실행 검증

- `npm --prefix frontend run build` — 통과(vite 6.4.3, 16 modules).
- **라이브 XSS 주입 테스트(핵심)**: dev 서버에서 Studio 본문에 아래 7개 공격 페이로드를 실제로 입력하고 Preview 렌더 결과의 DOM/innerHTML을 직접 검사.

## XSS 방어 코드 추적 (실행 전에 먼저 구조를 확인)

- **escape-before-tokenize 순서 유지**: `renderMarkdownToHtml`(`App.vue:2631-2632`)의 첫 줄이 `escapeHtml(String(markdown||'')).replace(...).split('\n')` — 전체 원문을 라인 분할 **전에** 이스케이프한다. 이후의 모든 블록/인라인 처리(리스트·헤딩·링크·강조)는 이미 `&lt;`/`&gt;`/`&quot;`/`&#39;`로 치환된 텍스트만 다룬다 — 원문의 리터럴 `<`/`>`/`"`가 이후 어떤 처리 단계에도 살아남을 수 없는 구조.
- **속성 싱크(href/src) 안전성**: `allowedMarkdownUrl()`(`:2788-2796`)이 문자열 접두어 검사가 아니라 **네이티브 `new URL()` 파서**로 `protocol`을 확인한다 — `java\tscript:`류의 공백주입 우회도 URL 스펙의 정규화 단계에서 걸러진다. 그리고 이 함수에 들어오는 `value` 자체가 이미 1단계에서 이스케이프된 텍스트에서 정규식으로 캡처된 것이므로, 설령 allowlist를 통과해도 결과 문자열엔 리터럴 `"`/`<`/`>`가 있을 수 없다 — attribute-breakout이 구조적으로 불가능함을 코드로 먼저 확인하고 아래에서 실측했다.
- **code-span-first**: `inlineMarkdown()`(`:2751-2780`)이 백틱 코드 스팬을 보호 토큰으로 제일 먼저 분리(`:2759`)한 뒤에야 이미지·링크·강조 정규식이 돈다 — 코드 스팬 내부의 `**`가 다른 인라인 처리에 노출되지 않는다.
- **XSS allowlist 스킴**: 링크는 `http/https/mailto`(`:2771`), 이미지는 `http/https`만(`:2762`, mailto 이미지 제외 — 합리적).

## 라이브 XSS 페이로드 테스트 (7종, 전부 무력화 확인)

Studio 본문에 아래를 그대로 입력 후 Preview 렌더:
```
<script>window.__xss1=1</script>
<img src=x onerror="window.__xss2=1">
[click me](javascript:window.__xss3=1)
![img](javascript:window.__xss4=1)
<svg onload="window.__xss5=1">
[quote break](http://evil.com/" onmouseover="window.__xss6=1)
<a href="x" onclick="window.__xss7=1">raw anchor</a>
```
**결과 (DOM/전역 스코프 직접 검사)**:
- `window.__xss1` ~ `__xss7` 전부 `false` — 어떤 스크립트/핸들러도 실행되지 않음.
- `.markdown-body` 안에 `<script>` **0개**, `on*` 속성을 가진 엘리먼트 **0개**, `<svg>` **0개**.
- 렌더된 실제 HTML 소스: `<p>&lt;script&gt;window.__xss1=1&lt;/script&gt; &lt;img src=x onerror="window.__xss2=1"&gt; ... &lt;a href="x" onclick="window.__xss7=1"&gt;raw anchor&lt;/a&gt;</p>` — 전부 escaped 텍스트로 화면에 "글자 그대로" 노출될 뿐, 태그로 파싱되지 않음.
- 따옴표 breakout 시도(`quote break` 링크)는 URL에 공백이 포함돼 애초에 링크 정규식(`[^)\s]+`)에 매치조차 안 되고, 설령 매치됐어도 위 구조적 이유로 안전했을 것 — 이중으로 막힘.
- `javascript:` 링크/이미지 2건 모두 `<a>`/`<img>` 엘리먼트 자체가 생성되지 않고 라벨/alt 텍스트만 남음(`allowedMarkdownUrl`이 빈 문자열 반환 → 코드의 `if (!safeUrl) return label` 분기).

## 완료 기준 대조 (정상 기능, 같은 세션에서 함께 확인)

- **중첩/순서 목록**: 같은 입력에 3단 중첩 `-` 목록 + 순서 목록을 섞어 넣었더니 렌더 HTML이 `<ul><li>top level<ul><li>nested one<ul><li>nested two</li></ul></li></ul></li></ul><ol><li>ordered first</li><li>ordered second</li></ol>` — 정확한 재귀 중첩 구조로 확인.
- **code-span-first**: `` `a**b**c` `` → `<code>a**b**c</code>`로 렌더(내부 `**`가 strong으로 오염 안 됨), 뒤이은 "홀로 있는 `*`"도 짝 없는 별표라 `<em>`으로 변환되지 않고 리터럴 유지 — 두 finding(#8) 항목 모두 실측 확인.
- **정상 링크/이미지**: `https://example.com/path`, `mailto:test@example.com`, `https://example.com/pic.png` 3건 모두 정상적으로 `<a>`/`<img>` 생성, `rel="noopener noreferrer"`/`loading="lazy"`까지 확인(요구사항 이상의 견고화).
- **중복 key 제거**: 태그 리스트 3곳(`App.vue:4144,4205,4226`) 전부 `` `${id}-${tag}-${tagIndex}` `` 형태로 index를 포함 — 같은 태그 값이 반복돼도 key 충돌 불가.
- **crypto.randomUUID**: `createEntityId()`(`:2598-2608`)가 `crypto.randomUUID` → `crypto.getRandomValues` → 카운터 기반 순으로 폴백 체인 확인.
- **production build**: 통과(위 참조).

## UI 실검수 (다크/라이트 + 375px + 카피)
- **375px**: XSS 페이로드가 실제로 렌더된 상태에서 `document.documentElement.scrollWidth === innerWidth === 375`(오버플로 0) 확인, 스크린샷 확보.
- **다크 테마**로 전체 테스트 진행, 렌더 깨짐 없음.
- **콘솔 에러**: `Uncaught|TypeError|ReferenceError|Vue warn` 0건.
- **카피**: 이 티켓은 사용자 대면 카피 변경이 거의 없음(렌더러/내부 로직 위주) — 해당 없음.

## [제안] (경미, 블로커 아님)
- 티켓 자체가 이미 명시했듯 이번 렌더러는 "티켓 범위의 경량 마크다운"이지 CommonMark 완전 호환이 아니다. 상대경로 링크(`new URL()`이 base 없이 파싱을 시도해 상대경로는 항상 거부됨)는 미지원인데, 이건 안전성 우선 설계로 보이고 사용자가 절대경로/https만 쓰는 현재 콘텐츠 정책과도 맞는다 — 의도적 트레이드오프로 판단, 지적 아님.
- Notes가 스스로 권고한 "서버 공유 전 검증된 sanitizer 도입"은 이번 티켓 범위가 아니라고 명시돼 있으므로 별도 언급 안 함(PM이 이미 인지 중인 사항).

## 상태 제안 (판정은 PM)
블로커 0. 보안이 1순위인 티켓답게 실제 공격 페이로드로 검증했고 전부 무력화됨을 확인했다. **finished 전환 권장.**
