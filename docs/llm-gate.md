문서 상태: 작성완료

# LLM 호출 게이트 — Claude Haiku/Sonnet API 를 공개 사이트에서 안전하게 쓰는 설계

- 작성: PM(Claude Opus 5.5), 2026-10-25 · 결정 D-032(제안됨) · PO 질문 ASK Q-023
- 요청: PO 2026-10-25 「workaround.co.kr는 haiku나 sonnet의 api콜을 해야돼. 이것을 제한할 수 있는 설계도 해줘. 사용자가 없는 상태에서 release하게 될 경우 문제가 될거잖아?」
- 관련: D-009(공개 LLM 은 정책 경로 경유), D-011(Cloudflare Pages + Tunnel), `services/advisor` 의 `claude` 프로필(Haiku 4.5, mock 폴백)

## 0. 결론 먼저

1. **API 키는 게이트 한 곳만 안다.** 브라우저·정적 번들·Advisor 서비스 어디에도 Anthropic 키를 두지 않는다. 모든 호출은 Cloudflare Worker `llm-gate` 를 지난다.
2. **릴리스 기본값은 "라이브 호출 0".** 로그인 없는 익명 방문자에게는 미리 만들어 둔 결과(일일 배치·캐시)만 보여 준다. 실시간 호출은 PO 가 켠 등급에서만 열린다.
3. **돈은 두 겹으로 막는다.** 바깥 겹은 Anthropic 콘솔의 **워크스페이스 월 지출 상한**(게이트에 버그가 있어도 넘을 수 없다). 안쪽 겹은 게이트의 **일일 예산 차단기**(넘기 전에 스스로 닫히고 화면은 "오늘 몫 소진"으로 퇴화).
4. **요청 모양을 서버가 정한다.** 클라이언트는 `기능 ID + 짧은 변수`만 보낸다. 프롬프트·모델·`max_tokens` 는 게이트의 기능 표가 정한다. 자유 프롬프트 엔드포인트는 만들지 않는다.
5. **아무도 안 볼 때를 기본으로 설계한다.** 꺼짐이 기본, 한도 도달 시 자동 차단, 50·80·100% 알림, 킬 스위치 한 번이면 전부 정지.

## 1. 왜 지금 구조로는 안 되나

- 공개본은 GitHub Pages(정적)라 **비밀값을 둘 서버가 없다.** 키를 프런트에 넣는 순간 누구나 꺼내 쓴다. 그래서 Pages 를 떠나기 전이라도 **Worker 하나는 필요**하다(`*.workers.dev` 로 시작 가능, DNS 이전과 무관).
- CORS·Origin 검사는 보호 수단이 아니다. 브라우저 밖(curl·봇)에서는 Origin 을 마음대로 쓴다. 보호는 **등급·예산·요청 모양**으로 한다.
- 로그인이 없는 사이트에서 "1인당 한도"는 쉽게 우회된다(IP·쿠키 교체). 그래서 익명 등급은 **전역 예산** 하나로 묶고, 실시간 호출은 신원이 있는 등급에만 준다.

## 2. 구조

```text
브라우저 ──(기능 ID + 변수)──▶ llm-gate (Cloudflare Worker)
                                 │ ① 킬 스위치·모드 확인 (KV: LLM_MODE)
                                 │ ② 등급 판정 (Access JWT / 초대 토큰 / 서비스 토큰 / 익명)
                                 │ ③ Turnstile 검증 (익명 데모 등급만)
                                 │ ④ 기능 표 조회 → 모델·max_tokens·템플릿·입력 상한
                                 │ ⑤ 캐시 조회 (KV, 같은 입력이면 재사용)
                                 │ ⑥ 속도 제한 (Workers Rate Limiting: 세션·등급 키)
                                 │ ⑦ 예산 차단기 (Durable Object: 일일 비용·호출 수, 엄격)
                                 ▼
                         Anthropic Messages API  ← 워크스페이스 `workaround-site` 키 1개
                                 │                  (월 지출 상한 · 속도 상한 · 사용량 알림)
                                 ▼
                         응답 정리(텍스트만) → 캐시 저장 → 사용량 기록 → 브라우저

Advisor 서비스(집 서버, Tunnel 뒤) ──(서비스 토큰)──▶ llm-gate   ← ANTHROPIC_API_KEY 대신
일일 배치 크론(Worker Cron) ──(Batch API, 50% 할인)──▶ 결과를 정적 JSON/KV 로 → 익명 방문자에게
```

## 3. 등급 — 누가 실시간 호출을 쓰나

| 등급 | 신원 | 실시간 호출 | 모델 | 한도(권고 시작값) |
|---|---|---|---|---|
| T0 익명(기본) | 없음 | **없음** — 사전 생성·캐시 결과만 | — | 0 |
| T1 익명 데모(선택) | Turnstile + 서명 세션 쿠키 | 기능 표의 데모 허용 기능만 | Haiku 4.5 | 세션당 하루 3회, 전역 하루 100회 |
| T2 PO·초대 | Cloudflare Access(이메일 OTP) | 허용 | Haiku 기본, Sonnet 5.5 는 기능 표가 허용할 때 | 사람당 하루 50회 |
| T3 서비스 | 서비스 토큰(Advisor 백엔드·배치 크론) | 허용 | 기능 표대로 | 서비스별 일일 상한 |

- **릴리스는 T0 만 켠 채로 한다.** T1 은 PO 가 "데모 열어"라고 할 때 켠다. T2 초대 명단은 Access 설정에만 두고 저장소·문서에는 적지 않는다.
- 등급은 게이트가 판정한다. 클라이언트가 보낸 "나는 T2" 같은 값은 믿지 않는다.

## 4. 한도 — 다섯 겹

| 겹 | 어디서 | 무엇을 | 넘으면 |
|---|---|---|---|
| ① 월 지출 상한 | Anthropic 콘솔 워크스페이스 | 이 사이트 전용 키의 월 지출(권고 $10) | Anthropic 이 거절 → 게이트는 "오늘 몫 소진" 화면 |
| ② 일일 예산 차단기 | 게이트 Durable Object | 하루 추정 비용(권고 $0.30)·호출 수 | 차단기 열림 → 자정(KST)까지 사전 생성 결과만 |
| ③ 속도 제한 | Workers Rate Limiting | 등급·세션 키별 분당·일일 횟수 | 429 + 화면 안내 |
| ④ 요청 모양 | 기능 표 | 입력 글자 상한, `max_tokens`, 모델 허용 목록, 도구 사용 금지 | 400(입력 거절) |
| ⑤ 캐시·사전 생성 | KV·일일 배치 | 같은 입력은 재호출 안 함, 익명 화면은 배치 결과만 | — |

- 비용 추정은 응답의 `usage`(입력·출력 토큰)에 모델 단가를 곱해 DO 카운터에 더한다. 단가는 기능 표 옆 상수로 둔다(아래 §6).
- Workers Rate Limiting 은 지역별 근사치라 짧게 초과할 수 있다. 그래서 **돈과 직결된 ②는 Durable Object(전역 단일 카운터)** 로 엄격하게 센다.
- ①은 게이트가 망가져도 남는 마지막 안전판이다. 계정 전체(조직) 상한도 별도로 걸어 둔다.

## 5. 기능 표 — 요청 모양을 서버가 정한다

```js
// infra/llm-gate/src/features.js (예시)
export const FEATURES = {
  'advisor.review': { tiers: ['T2', 'T3'], model: 'claude-haiku-4-5-20251001', maxTokens: 700, inputMaxChars: 4000, template: 'advisor-review-v1', cacheTtlSec: 86400 },
  'advisor.chat':   { tiers: ['T2'],       model: 'claude-haiku-4-5-20251001', maxTokens: 500, inputMaxChars: 800,  template: 'advisor-chat-v1',   cacheTtlSec: 0 },
  'advisor.daily':  { tiers: ['T3'],       model: 'claude-sonnet-5-5',         maxTokens: 1200, inputMaxChars: 0,   template: 'advisor-daily-v1',  batch: true },
}
```

- 클라이언트 요청: `POST /api/llm/advisor.review { "vars": { "missionId": "...", "answer": "..." } }`. 프롬프트 본문은 게이트(또는 서비스)의 고정 템플릿에서 만든다 — 사용자 입력은 변수로만 들어간다(D-009 ②).
- 표에 없는 기능 ID·모델·도구 요청은 전부 400. 시스템 프롬프트·키·내부 메타데이터는 응답에 싣지 않는다. 응답은 텍스트(또는 기능 표가 정한 JSON 스키마)로만 돌려주고 화면은 HTML 로 렌더하지 않는다.

## 6. 비용 감각 (2026-10 공개 단가)

단가는 백만 토큰당이다.

| 모델 | 입력 | 출력 | Batch 입력 | Batch 출력 |
|---|---|---|---|---|
| Claude Haiku 4.5 | $1 | $5 | $0.50 | $2.50 |
| Claude Sonnet 5.5 | $2 | $10 | $1 | $5 |

- Haiku 한 번(입력 1,500 + 출력 400 토큰) ≈ **$0.0035**. 월 $10 이면 약 2,800번, 하루 $0.30 이면 약 85번.
- Sonnet 은 같은 크기에 약 2배. 그래서 Sonnet 은 T2·T3·배치에만 둔다.
- 일일 배치(Batch API 50% 할인)로 "오늘의 미션" 같은 공용 콘텐츠를 하루 한 번 만들면, 방문자가 몇 명이든 비용은 고정이다.

## 7. 아무도 안 볼 때 — 무인 운영 규칙

- **꺼짐이 기본**: 배포 직후 `LLM_MODE=off`. PO 가 KV 값을 `t0`(사전 생성만)·`t1`(데모)·`on` 으로 올린다.
- **자동 차단**: ② 차단기가 열리면 자정까지 닫히지 않는다. 같은 날 세 번 열리면 `LLM_MODE` 를 `t0` 로 스스로 내리고 PO 확인 전까지 올리지 않는다.
- **알림**: 일일·월 예산 50·80·100% 와 차단기 열림을 PO 에게(이메일 또는 디스코드 웹훅 — Q-023 ④).
- **킬 스위치**: KV `LLM_MODE=off` 한 줄(대시보드에서 1분), 최후 수단은 콘솔에서 워크스페이스 키 폐기.
- **화면 퇴화**: 모든 LLM 화면은 세 상태를 갖는다 — `사용 가능` / `오늘 몫 소진`(사전 생성 결과로 대체) / `잠김`(등급 밖). 에러 화면을 보여 주지 않는다.

## 8. 기록과 개인정보

- 게이트 로그: 시각·기능 ID·등급·모델·토큰·비용·캐시 여부·결과 코드. **입력·출력 본문은 저장하지 않는다**(디버그가 필요하면 PO 가 하루 한정으로 켠다).
- IP 는 해시로만, 7일 보관. Access 이메일은 로그에 남기지 않고 Access 의 사용자 ID 해시만.
- 키·토큰은 Worker 시크릿에만. 저장소·문서·채팅에 붙이지 않는다(기존 규칙 그대로). 개발용 Claude Code 사용량과 사이트 키는 **다른 워크스페이스**로 분리한다.

## 9. 릴리스 게이트(codex-9 감사 항목에 추가)

1. 정적 번들·소스맵에 `sk-ant`·`x-api-key`·`api.anthropic.com` 0건.
2. 익명으로 `/api/llm/*` 호출 → `LLM_MODE=off` 에서 503(꺼짐), `t0` 에서 403(등급 밖).
3. 기능 표 밖 기능·모델·과대 입력 → 400. `max_tokens` 가 표 값을 넘지 않음(Anthropic 목 서버로 검증).
4. 속도 제한 초과 → 429, 예산 차단기 → 일일 상한 도달 시 열림(DRY_RUN 비용 주입으로 검증).
5. PO 확인 사항(스크린샷): Anthropic 워크스페이스 월 상한 설정됨, 알림 채널 수신 확인.

## 10. 구현 순서(티켓)

| 티켓 | 내용 | 선행 |
|---|---|---|
| TKT-191 `[INFRA]` | `infra/llm-gate/` Worker 골격 — 모드·등급·기능 표·입력 검증·속도 제한·DO 예산 차단기·KV 캐시·Anthropic 목 서버 테스트. **DRY_RUN 기본, 실키 없음** | D-032 확정 |
| TKT-192 `[BE]` | Advisor `claude` 프로필이 Anthropic 대신 게이트(T3 토큰)를 부르도록 — 키를 서비스에서 제거 | 191 |
| TKT-193 `[INFRA]` | 일일 배치 크론(Batch API) → `advisor.daily` 결과를 정적 JSON/KV 로 | 191 |
| TKT-194 `[FE]` | LLM 화면 3상태(사용 가능·오늘 몫 소진·잠김) 공용 컴포넌트 | 191 계약 |
| PO 계정 작업 | Anthropic 워크스페이스·월 상한·키, Cloudflare Worker·Access·Turnstile·알림 | Q-023 |

## 출처

- Anthropic 가격(Haiku 4.5·Sonnet 5.5·Batch 50%): https://platform.claude.com/docs/en/about-claude/pricing
- Anthropic 워크스페이스(워크스페이스별 키·월 지출 상한·속도 상한): https://support.claude.com/en/articles/9796807-creating-and-managing-workspaces-in-the-claude-console
- Cloudflare Workers Rate Limiting(기간 10·60초, 지역별 근사치 — 엄격한 전역 한도는 Durable Objects 권고): https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- Cloudflare AI Gateway 속도 제한(게이트웨이 단위, 429): https://developers.cloudflare.com/ai-gateway/features/rate-limiting/
