문서 상태: 작성완료

# TKT-073

## 메타데이터

- 제목: UI 재구현 S3 - 블로그 페이지 시안 A 처리 + 상태 배지
- 우선순위: P2
- 대상 버전: `chore`
- 상태: `finished`
- 문서 상태: `작성완료`
- 진행 판정: `진행 가능`
- 소유자 유형: `worker`
- 권장 브랜치: `codex/tkt-073-ui-rebuild-s3-blog-signage`

## 목표

슬라이스 S3을 구현한다. `StatusBadge.vue`(slate/green/bronze)를 만들고, bloghub/blogArchive/blogPost 를 시안 A 문서형 문법(`blog-primary`/`archive-item`/`post-detail`)으로 정제한다. 공개 목록·상세에는 `published`(공개)만 노출하고, `draft`/`archived` 배지는 Writing Studio 안에서만 쓴다.

## 작업 내용

스펙 근거: `design/implementation-spec-2026-07-06.md` §1.4(상태 토큰), §3.4(StatusBadge), §4(bloghub/blogArchive/blogPost), §6(S3), §7. 색 근거: `design/blog-district-ui-system-2026-06-26.md` §6.

1. StatusBadge 구현 (스펙 §3.4). `frontend/src/components/StatusBadge.vue` 를 신설한다. 구조는 시안 A `.badge` 이식: `span.badge.badge-pub` "공개"(published) / `span.badge.badge-draft` "초안"(draft) / `span.badge.badge-arch` "보관"(archived). CSS:
   - `.badge { display:inline-flex; align-items:center; gap:6px; padding:3px 10px; border-radius:6px; font-size:0.72rem; font-weight:800; letter-spacing:0.04em; border:1px solid transparent; }`
   - `.badge-pub { color:var(--line-w-text); border-color:color-mix(in srgb, var(--status-pub) 45%, transparent); background:color-mix(in srgb, var(--status-pub) 12%, transparent); }`
   - `.badge-draft { color:var(--text-2); border-color:var(--line-strong); background:var(--panel-soft); }`
   - `.badge-arch { color:#DCBB7E; border-color:color-mix(in srgb, var(--status-arch) 45%, transparent); background:color-mix(in srgb, var(--status-arch) 12%, transparent); }`
   상태 토큰(`--status-draft`/`--status-pub`/`--status-arch`)은 S1(TKT-071)에서 정의됨. Props: `status`. 라벨 매핑 published→공개/draft→초안/archived→보관 유지.
2. 기존 배지 교체 (스펙 §3.4). App.vue 가 `BLOG_STATUS_LABELS[post.status]` 를 `.status-chip` 으로 렌더 중인 지점(약 L3643/L3704/L3727)을 `StatusBadge`(status prop)로 교체한다. 규칙: 공개 아카이브·글 상세에는 `badge-pub` 만 등장, `badge-draft`/`badge-arch` 는 Writing Studio 내부에서만. 배지 문구는 짧게(공개/초안/보관) — 본문 리듬 보호.
3. bloghub 정제 (스펙 §4 bloghub, 현재 App.vue L3612). StationHeader(code `B01`, band `--line-b`)는 S1에서 적용됨. 본체를 시안 A 환승 홀 `.blog-primary`(본선 대형 카드) 문법으로: 좌측 `.blog-primary-main`(본선 소개 + 통계 공개 n편/초안 n편/최근 발행 + CTA: 아카이브 들어가기=`btn-exit`, Writing Studio=`btn-ghost`), 우측 `.blog-primary-list`(최근 발행 3건 + 전체 보기). 상태 배지는 StatusBadge, 공개만.
4. blogArchive 정제 (스펙 §4 blogArchive, 현재 App.vue L3691). `archive-list`/`archive-card` 를 시안 A `.archive-item`(제목→요약→발행일→태그→상태 배지 순서 고정) 또는 시안 C `.archive-list`(좌측 날짜 시각표 칸 + 우측 제목/요약/태그)로 교체한다. 문서형 폭/타이포 우선(피드 아님). `.tag`, `time.num`, StatusBadge(공개). 하단 `.badge-legend` 로 상태 체계 안내(공개만 노출, 초안·보관은 Studio 관리 명시).
5. blogPost 정제 (스펙 §4 blogPost, 현재 App.vue L3718). `reading-shell post-shell` 을 시안 A `.post-detail`(상단 5px `--line-b` 보더 + max-width 720px 문서폭)로. 순서: `.post-meta-line`(발행/수정/읽기, `.num`) → `h1` → `.post-lead` → `.post-tags` + StatusBadge → `.post-body`(markdown). 본문 타이포: `h2`(상단 hairline + 2.2em), 코드블록 `--code-bg` + 좌측 `--safety` 4px, 인용 좌측 `--line-b` + `--quote-bg`, `li::marker { color:var(--safety); }`. 하단 `.post-foot-nav`(이전/아카이브로/다음).
6. 공개 경계 준수 (스펙 §0). 블로그 공개 목록/상세에는 `published` 만 노출한다. `draft`/`archived` 는 Writing Studio 안에서만(이 슬라이스는 공개면만 다루고, Studio 상태 흐름 마감은 S6/TKT-076).

시안 재사용 포인터(스펙 §7): StatusBadge 는 시안 A `.badge`/`.badge-pub`/`.badge-draft`/`.badge-arch`(L201~209) + legend DOM(L1041~1047), 색 근거 `design/blog-district-ui-system-2026-06-26.md` L208~234. bloghub 본선 카드는 시안 A `.blog-primary`/`.blog-primary-main`/`.blog-primary-list`(CSS L375~421, DOM L873~911). 아카이브는 시안 A `.archive-item`(L465~487) 또는 시안 C `.archive-list`/`.archive-item`(L403~416). 글 상세는 시안 A `.post-detail`~`.post-foot-nav`(CSS L496~549, DOM L1050~1120).

## 범위

- 포함: `StatusBadge.vue`(§3.4 slate/green/bronze), App.vue 블로그 배지 교체, bloghub `blog-primary`/blogArchive `archive-item`/blogPost `post-detail` 시안 A 처리, 문서폭·타이포·코드/인용 스타일, 공개면 published-only.
- 제외: 색 토큰/타이포/StationHeader 자체(→ TKT-071/S1 선행), 환승 홀 노선도(→ TKT-072/S2), 시뮬레이터/운영(→ TKT-074/S4), 컴포넌트 전면 분해(→ TKT-075/S5), Writing Studio 상태 흐름 마감(→ TKT-076/S6). 상태 값(draft/published/archived) 자체의 이름/의미 변경 금지.

## 완료 기준

- `tools/run-frontend-build.ps1` 빌드가 통과한다.
- 블로그 상태 배지 3종(공개/초안/보관)이 슬레이트/그린/브론즈로 서로 시각 구분되고, 3상태가 동일 회색이 아니다. archived 가 위험/삭제 색과 같지 않다.
- 공개 아카이브·글 상세에는 `published`(공개)만 노출되고, draft/archived 는 공개면에 나타나지 않는다.
- bloghub/blogArchive/blogPost 가 시안 A 문서형 문법(blog-primary/archive-item/post-detail)으로 정제되고, 글 상세가 720px 문서폭 + 지정 타이포로 읽힌다.

## 선행 조건

- `TKT-071`(S1: 토큰/타이포/StationHeader) 선행. 상태 토큰(`--status-draft`/`--status-pub`/`--status-arch`)과 `--code-bg`/`--quote-bg`/노선 틴트가 있어야 배지·본문 스타일이 성립한다.

## 질문/결정 기록

- 결정(디자인 §6): 상태 배지는 슬레이트(draft)/그린(published)/브론즈(archived)로 구분. archived 는 삭제/위험 색과 다르게, draft·archived 를 회색 하나로 퉁치지 않는다.
- 결정(스펙 §0): 공개면은 published 만. draft/archived 는 Writing Studio 안에서만.
- 결정: 상태 값 자체는 바꾸지 않고 UI/배지/동선만 정합.

## 선행 읽기

- `design/implementation-spec-2026-07-06.md` (특히 §1.4/§3.4/§4 blog*/§6/§7)
- `design/mockups/2026-07-05/variant-a-seoul-signage.html`
- `design/mockups/2026-07-05/variant-c-night-line.html`
- `docs/feature-definition.md`
- `design/blog-district-ui-system-2026-06-26.md` (§6 상태 배지 색 근거)

## 작업자 산출물

- 브랜치: `codex/v0.6.0-line`
- `StatusBadge.vue`를 신설하고 상태를 draft→슬레이트(초안), published→그린(공개), archived→브론즈(보관)로 매핑했다. Studio의 기존 상태 칩도 같은 컴포넌트를 재사용한다.
- bloghub는 `blog-primary` 본선 카드와 최근 발행 목록으로, archive는 문서형 `archive-item` 목록으로, post는 720px `post-detail` 문서 레이아웃으로 정제했다. 본문 heading hairline·안전색 목록 marker·코드/인용 강조와 하단 글 내비게이션을 포함한다.
- 공개 허브·아카이브·상세 데이터는 모두 published만 사용하며, draft/archived 배지는 Writing Studio에서만 렌더됨을 런타임으로 확인했다.
- 연재 태그 규약은 `series:<표시명>`이다. 공개 글만 연재별로 묶고 제어용 series 태그는 화면 태그 목록에서 숨긴다. `series:Line V`를 주입한 런타임 검증에서 Line V 섹션과 글 1건이 생성됨을 확인한 뒤 원래 태그로 복구했다.
- 검증: 프런트 빌드 통과(Vite 6.4.3, 17 modules, 655ms), 데스크톱 양 테마와 375px 허브/아카이브/상세 overflow 0, 상세 폭 720px·상단 Line B 5px, 공개면 비공개 배지 0건, Studio 3상태 색 구분, 브라우저 console error/warning 0.

## 검토 메모

- 구현과 완료 게이트를 마쳤다. 실제 Line V 콘텐츠는 TKT-090에서 들어오며 현재는 `series:<표시명>` 경량 태그 계약만 제공한다.
- Writing Studio 상태 흐름의 최종 UX 마감은 범위대로 TKT-076에 남긴다.

## Notes

- 이 티켓은 `TKT-056`(블로그 아카이브 상태 모델 + 상태 배지)과 배지 부분이 겹친다. **상태 배지 색 구분(§6 슬레이트/그린/브론즈)은 본 티켓(S3)이 흡수/대체**한다. TKT-056 의 "보관+복원" 상태 모델(아카이브 되돌리기 동선)은 배지와 별개 범위이므로 TKT-056 에 남는다. 두 티켓이 배지를 이중 구현하지 않도록, TKT-056 착수 시 본 티켓의 StatusBadge 를 재사용한다.
- Writing Studio 의 draft/archived 배지 노출과 상태 흐름 강조는 S6(TKT-076)에서 마감한다.


## 추가 수용 기준 (R2 승인, 2026-08-18)

- 아카이브에 **연재(시리즈) 뷰** 지원: 글에 시리즈 태그가 있으면 묶어서 표시. 첫 사례 = Line V 동유럽 연재 (여행 기록 → 블로그 크로스포스트, TKT-090 연계).
