문서 상태: 작성완료

# TKT-191 `[INFRA]` LLM 게이트 Worker 골격 — 모드·등급·기능 표·속도 제한·예산 차단기·캐시 (DRY_RUN, 실키 없음)

- 상태: ready(**D-032 확정 뒤 디스패치**) · **P1** · 담당: dev 서브에이전트(Sonnet) · 설계 `docs/llm-gate.md` §2~§9. 브랜치 `codex/v0.8.0-live`.
- scope: `infra/llm-gate/**` 신규(Worker 소스·`wrangler.toml`·테스트·README·환경변수 문서). 다른 폴더 금지.

## 완료 조건
1. [ ] `POST /api/llm/:feature` — ①KV `LLM_MODE`(off·t0·t1·on) ②등급 판정(Access JWT 검증·서비스 토큰·서명 세션 쿠키·익명) ③T1 만 Turnstile 검증 ④기능 표(§5) 조회·입력 상한·모델 허용 목록·`max_tokens` 강제 ⑤KV 캐시 ⑥Workers Rate Limiting(등급·세션 키) ⑦Durable Object 일일 예산 차단기(KST 자정 리셋, `usage` × 단가) 순서.
2. [ ] Anthropic 호출은 어댑터 하나로, 기본 `DRY_RUN=true`(목 응답 + 가짜 usage). 실키는 이 티켓에서 쓰지 않는다.
3. [ ] 응답은 텍스트/스키마 JSON 만. 오류는 상태 코드 + 짧은 한국어 사유(키·원문·스택 미노출). 로그는 §8 필드만(본문 저장 0).
4. [ ] 테스트(로컬 `wrangler dev`/Miniflare 또는 vitest pool): §9 의 1~4 항목 — 모드별 503/403, 표 밖 400, 429, 차단기 열림·자정 리셋, `max_tokens` 상한.
5. [ ] `infra/llm-gate/README.md`: 배포 절차(시크릿·KV·DO·Rate Limiting 바인딩), 킬 스위치, 알림 웹훅 자리(값 없음).

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
