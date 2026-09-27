﻿# TKT-009

## ë©”íƒ€ë°ì´í„°

- ì œëª©: ì›Œì»¤ì™€ Ollama ì‚¬ì´ì˜ í—¬ìŠ¤ ì²´í¬ ë° ì €í•˜ ì‹¤í–‰ íë¦„
- ìš°ì„ ìˆœìœ„: P2
- ëŒ€ìƒ ë²„ì „: `infra`
- ìƒíƒœ: `finished`
- 문서 상태: `작성완료`
- ì§„í–‰ íŒì •: `ì§„í–‰ ê°€ëŠ¥`
- ì†Œìœ ìž ìœ í˜•: `worker`
- ê¶Œìž¥ ë¸Œëžœì¹˜: `codex/tkt-009-worker-ollama-health-flow`

## ëª©í‘œ

RTX5070 ëŸ°íƒ€ìž„ì´ ë‚´ë ¤ê°€ ìžˆì„ ë•Œ ëª¨ë¸ ì˜ì¡´ ìž‘ì—…ì´ ê¹”ë”í•˜ê²Œ ì €í•˜ ë™ìž‘í•˜ë„ë¡ ì›Œì»¤ ê²½ë¡œê°€ Ollama ìƒíƒœë¥¼ ì¸ì§€í•˜ê²Œ ë§Œë“ ë‹¤.

## ì´ë²ˆ ìž‘ì—… ê²°ê³¼

- `workers/ion2-worker/worker.py` ì— Ollama health probe ì™€ LLM í‹°ì¼“ íŒë³„, `waiting_llm` ë¶„ê¸°, `retryNotBefore` ê¸°ë°˜ ìž¬ì¡°íšŒ ë¡œì§ì„ ì¶”ê°€í–ˆë‹¤.
- `gateway` ì— `POST /api/tickets/{ticketId}/waiting-llm` endpoint ë¥¼ ì¶”ê°€í•´ gateway polling ëª¨ë“œë„ `waiting_llm` ìƒíƒœë¥¼ ì €ìž¥í•  ìˆ˜ ìžˆê²Œ í–ˆë‹¤.
- `workers/ion2-worker/smoke_ollama_degraded.py` ë¡œ Ollama `ok`, `response_error`, `timeout`, `connection_failed` ë¶„ë¥˜ì™€ ë¹„LLM/LLM í‹°ì¼“ ë¶„ê¸° smoke ë¥¼ ë‚¨ê²¼ë‹¤.
- ê´€ë ¨ ì •ì±…/ëŸ°íƒ€ìž„/worker/gateway ë¬¸ì„œë¥¼ ìƒˆ degraded íë¦„ ê¸°ì¤€ìœ¼ë¡œ ê°±ì‹ í–ˆë‹¤.

## ìž‘ì—… ë‚´ìš©

- ì›Œì»¤ê°€ `OLLAMA_BASE_URL` ë¡œ í—¬ìŠ¤ ì²´í¬í•˜ëŠ” ê²½ë¡œë¥¼ êµ¬í˜„í–ˆë‹¤.
- Ollama ì •ìƒ, ì§€ì—°, ì—°ê²° ì‹¤íŒ¨, ì‘ë‹µ ì˜¤ë¥˜ ì¼€ì´ìŠ¤ë¥¼ `ok`, `degraded`, `unavailable` ì™€ `category` ë¡œ êµ¬ë¶„í–ˆë‹¤.
- LLM ì˜ì¡´ í‹°ì¼“ì„ `waiting_llm` ìœ¼ë¡œ ë³´ë‚´ê³  `retryAfterSeconds`, `retryNotBefore` ë¥¼ í•¨ê»˜ ë‚¨ê¸°ëŠ” ê¸°ì¤€ì„ ì •ë¦¬í–ˆë‹¤.
- ë¹„LLM í‹°ì¼“ì´ Ollama ìž¥ì• ì™€ ë¬´ê´€í•˜ê²Œ ê³„ì† ë™ìž‘í•˜ëŠ” smoke ê·¼ê±°ë¥¼ ë‚¨ê²¼ë‹¤.
- ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„°ê°€ ìž¬í˜„í•  ìˆ˜ ìžˆëŠ” mock/smoke ì ˆì°¨ë¥¼ `smoke_ollama_degraded.py` ì™€ README ì— ê¸°ë¡í–ˆë‹¤.

## ë²”ìœ„

- ì›Œì»¤ê°€ Ollama ê°€ìš©ì„±ì„ í™•ì¸í•˜ëŠ” ë°©ì‹ì„ ì •ì˜í•œë‹¤.
- Ollamaê°€ ì •ìƒì¼ ë•Œì˜ ëŸ°íƒ€ìž„ ë™ìž‘ì„ ì •ì˜í•œë‹¤.
- Ollamaë¥¼ ì‚¬ìš©í•  ìˆ˜ ì—†ì„ ë•Œì˜ ëŸ°íƒ€ìž„ ë™ìž‘ì„ ì •ì˜í•œë‹¤.
- ì›Œì»¤ ìƒíƒœ ì²˜ë¦¬ë¥¼ `waiting_llm`, ì €í•˜ ìƒíƒœ, ìž¬ì‹œë„ ìƒíƒœì™€ ë§žì¶˜ë‹¤.
- ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„°ê°€ ê²€í†  ì¤‘ ì´ ê²½ë¡œë¥¼ í™•ì¸í•  ìˆ˜ ìžˆëŠ” ì ˆì°¨ë¥¼ ë¬¸ì„œí™”í•œë‹¤.

## ì™„ë£Œ ê¸°ì¤€ ì ê²€

- [x] ì›Œì»¤ ì¸¡ í—¬ìŠ¤ ì²´í¬ ê²½ë¡œê°€ ê²€í† í•  ìˆ˜ ìžˆì„ ë§Œí¼ ë¶„ëª…í•˜ê²Œ ë¬¸ì„œí™”ë˜ê±°ë‚˜ êµ¬í˜„ë˜ì–´ ìžˆë‹¤.
- [x] ì €í•˜ ì‹¤í–‰ ë™ìž‘ì´ ëª…ì‹œì ì´ë‹¤.
- [x] íë¦„ì´ ê¸°ì¡´ í‹°ì¼“ ì •ì±…ê³¼ Ollama ì •ì±… ë¬¸ì„œì™€ ë§žëŠ”ë‹¤.
- [x] ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„°ê°€ ë¬¸ì„œí™”ëœ ì ˆì°¨ë¡œ ë™ìž‘ì„ ê²€ì¦í•  ìˆ˜ ìžˆë‹¤.

## ì„ í–‰ ì¡°ê±´

- `TKT-004` ëŸ°íƒ€ìž„ ê³„ì•½ì„ ë¨¼ì € í™•ì¸í•œë‹¤.
- ì‹¤ì œ Ollama ì—°ê²° ê²€ì¦ì€ `TKT-008` ì™„ë£Œ í›„ ìˆ˜í–‰í•œë‹¤.
- `TKT-008` ì „ì—ëŠ” mock ë˜ëŠ” ì„¤ì • ê¸°ë°˜ degraded íë¦„ê¹Œì§€ë§Œ ì§„í–‰í•œë‹¤.

## ì§ˆë¬¸/ê²°ì • ê¸°ë¡

- ê²°ì •: Ollama unavailableì€ í”Œëž«í¼ ì „ì²´ ìž¥ì• ê°€ ì•„ë‹ˆë‹¤.
- ê²°ì •: LLM ìž‘ì—…ì€ ë°”ë¡œ ì‹¤íŒ¨ë³´ë‹¤ `waiting_llm` ë¥¼ ìš°ì„  ê³ ë ¤í•œë‹¤.
- ê²°ì •: ê¸°ë³¸ retry backoff ížŒíŠ¸ëŠ” `OLLAMA_RETRY_AFTER_SECONDS=30` ì´ˆë¡œ ë‘”ë‹¤.
- ê²°ì •: í˜„ìž¬ LLM í‹°ì¼“ í‘œì‹ì€ `job.llm.*`, `payload.requiresLlm=true`, `payload.inferenceProvider=ollama`, `payload.targetRuntime=ollama` ë‹¤.

## ì„ í–‰ ì½ê¸°

- `README.md`
- `docs/ticket-policy.md`
- `docs/ollama-policy.md`
- `docs/agent-runtime.md`
- `docs/history/README.md`
- ìµœì‹  ê´€ë ¨ ížˆìŠ¤í† ë¦¬ í•­ëª©

## ìž‘ì—…ìž ì‚°ì¶œë¬¼

- ë¸Œëžœì¹˜ ì´ë¦„
- êµ¬í˜„ ìš”ì•½
- í—¬ìŠ¤ ì²´í¬ ë° ì €í•˜ íë¦„ ìš”ì•½
- í…ŒìŠ¤íŠ¸ ìš”ì•½
- ë‚¨ì€ ìœ„í—˜

## í—¬ìŠ¤ ì²´í¬ ë° ì €í•˜ íë¦„ ìš”ì•½

- `OLLAMA_BASE_URL` ì´ ë¹„ì–´ ìžˆìœ¼ë©´ `unavailable/config_missing`
- `OLLAMA_HEALTH_PATH` (`/api/tags` ê¸°ë³¸ê°’) ê°€ 2xx ì‘ë‹µì„ ì£¼ë©´ `ok`
- timeout, 5xx, ì˜ˆê¸°ì¹˜ ì•Šì€ ì˜ˆì™¸ëŠ” `degraded`
- ì—°ê²° ì‹¤íŒ¨ëŠ” `unavailable/connection_failed`
- gateway polling ëª¨ë“œ:
  - ë¹„LLM í‹°ì¼“ì€ ê¸°ì¡´ëŒ€ë¡œ claim -> service probe -> complete/fail
  - LLM í‹°ì¼“ì€ Ollama ê°€ `ok` ê°€ ì•„ë‹ˆë©´ claim ì „ì— `waiting_llm` ìœ¼ë¡œ ë³´ë‚¸ë‹¤.
  - `retryNotBefore` ì‹œê°ì´ ì§€ë‚˜ê¸° ì „ì—ëŠ” ë‹¤ì‹œ ì§‘ì§€ ì•ŠëŠ”ë‹¤.
- Redis Streams ëª¨ë“œ:
  - LLM í‹°ì¼“ì—ì„œ Ollama ê°€ `ok` ê°€ ì•„ë‹ˆë©´ ê²°ê³¼ stream ì— `waiting_llm` ê²°ê³¼ë¥¼ ë‚¨ê¸°ê³  ì›ë³¸ entry ë¥¼ ack í•œë‹¤.
  - ìžë™ ìž¬ì£¼ìž…ì€ ì•„ì§ í›„ì† í‹°ì¼“ ë²”ìœ„ë‹¤.

## ê²€ì¦

- [x] `C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m py_compile workers/ion2-worker/worker.py workers/ion2-worker/enqueue_mock_ticket.py workers/ion2-worker/redis_stream.py workers/ion2-worker/smoke_redis_stream.py workers/ion2-worker/smoke_ollama_degraded.py`
- [x] `C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe workers/ion2-worker/smoke_ollama_degraded.py`
  - `ok`, `response_error`, `timeout`, `connection_failed` probe ë¶„ë¥˜ë¥¼ í™•ì¸í–ˆë‹¤.
  - gateway polling ê²½ë¡œì—ì„œ ë¹„LLM í‹°ì¼“ì€ `completed`, LLM í‹°ì¼“ì€ `waiting_llm` ì´ ë˜ëŠ” ê²ƒì„ í™•ì¸í–ˆë‹¤.
- [x] `C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe workers/ion2-worker/smoke_redis_stream.py`
  - ê¸°ì¡´ Redis Streams healthcheck ì™„ë£Œ ê²½ë¡œê°€ ìƒˆ Ollama ë¡œì§ ì´í›„ì—ë„ ìœ ì§€ë˜ëŠ” ê²ƒì„ ìž¬í™•ì¸í–ˆë‹¤.
- [ ] gateway Java/Maven compile
- [ ] gateway Docker build
- [ ] ì‹¤ì œ ì™¸ë¶€ Ollama ì—°ê²° smoke

## ê²€í†  ë©”ëª¨

- í˜„ìž¬ ìž‘ì—…ì€ `TKT-008` ì´ì „ ë²”ìœ„ë¼ mock / ì„¤ì • ê¸°ë°˜ degraded íë¦„ê¹Œì§€ë§Œ êµ¬í˜„í–ˆë‹¤.
- `waiting_llm` gateway ìƒíƒœ ì €ìž¥ì€ ë„£ì—ˆì§€ë§Œ, Redis Streams ìª½ ìžë™ resume ì „ëžµì€ ì•„ì§ í›„ì† ë²”ìœ„ë‹¤.
- ì´ í™˜ê²½ì—ëŠ” `java`, `mvn`, `docker` ê°€ ì—†ì–´ gateway compile / Docker build ëŠ” ì—¬ì „ížˆ ë¯¸ê²€ì¦ì´ë‹¤.

## PR ì¤€ë¹„ ë©”ëª¨

PR ì œëª© ì´ˆì•ˆ:

```text
TKT-009 infra worker Ollama health and degraded flow
```

PR ë³¸ë¬¸ ì´ˆì•ˆ:

```markdown
## ìš”ì•½

- `ion2-worker` ì— Ollama health probe, LLM í‹°ì¼“ íŒë³„, `waiting_llm` degraded íë¦„ì„ ì¶”ê°€í–ˆìŠµë‹ˆë‹¤.
- gateway polling ê²½ë¡œë¥¼ ìœ„í•´ `POST /api/tickets/{ticketId}/waiting-llm` endpoint ë¥¼ ì¶”ê°€í–ˆìŠµë‹ˆë‹¤.
- Ollama probe ë¶„ë¥˜ì™€ ë¹„LLM/LLM ë¶„ê¸° smoke ë¥¼ ì €ìž¥ì†Œ ì•ˆì—ì„œ ìž¬í˜„í•  ìˆ˜ ìžˆëŠ” `smoke_ollama_degraded.py` ë¥¼ ì¶”ê°€í–ˆìŠµë‹ˆë‹¤.

## í‹°ì¼“

- TKT-009

## ê²€ì¦

- [x] `C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m py_compile workers/ion2-worker/worker.py workers/ion2-worker/enqueue_mock_ticket.py workers/ion2-worker/redis_stream.py workers/ion2-worker/smoke_redis_stream.py workers/ion2-worker/smoke_ollama_degraded.py`
- [x] `C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe workers/ion2-worker/smoke_ollama_degraded.py`
- [x] `C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe workers/ion2-worker/smoke_redis_stream.py`
- [ ] gateway Java/Maven compile

## ë¦´ë¦¬ìŠ¤ ë©”ëª¨

- ì´ PR ì€ `infra` íŠ¸ëž™ ìž‘ì—…ìž…ë‹ˆë‹¤.
- ì‹¤ì œ ì™¸ë¶€ Ollama ì—°ê²° ê²€ì¦ê³¼ stream resume ì „ëžµì€ í›„ì† í‹°ì¼“ì—ì„œ ì´ì–´ì§‘ë‹ˆë‹¤.
```

## Notes

- `TKT-008` ì—ì„œ ì‹¤ì œ RTX5070 Ollama ê²½ë¡œê°€ ì¤€ë¹„ë˜ë©´ `OLLAMA_BASE_URL` ê¸°ì¤€ ì‹¤ ì—°ê²° smoke ë¥¼ ë‹¤ì‹œ ëŒë¦¬ëŠ” ê²ƒì´ ìžì—°ìŠ¤ëŸ½ë‹¤.
- `TKT-004` ê³„ì•½ ë¬¸ì„œì—ëŠ” ì§€ê¸ˆ ì¶”ê°€í•œ LLM í‹°ì¼“ í‘œì‹ê³¼ `waiting_llm` retry ížŒíŠ¸ë¥¼ ë°˜ì˜í•´ë„ ì¢‹ë‹¤.


## ?? ??

- ??????? ?? ??, `waiting_llm` ??, health probe, mock degraded smoke ? ??? ??? ????? ?? ??? `finished` ? ???. ?? ?? Ollama ?? smoke ? `TKT-008` ?? ???? ??.
