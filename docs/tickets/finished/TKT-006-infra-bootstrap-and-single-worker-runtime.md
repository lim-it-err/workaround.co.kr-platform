﻿# TKT-006

## ë©”íƒ€ë°ì´í„°

- ì œëª©: ì¸í”„ë¼ ë¶€íŠ¸ìŠ¤íŠ¸ëž©ê³¼ ë‹¨ì¼ ì›Œì»¤ ëŸ°íƒ€ìž„
- ìš°ì„ ìˆœìœ„: P1
- ëŒ€ìƒ ë²„ì „: `infra`
- ìƒíƒœ: `finished`
- 문서 상태: `작성완료`
- ì§„í–‰ íŒì •: `ì§„í–‰ ê°€ëŠ¥`
- ì†Œìœ ìž ìœ í˜•: `worker`
- ê¶Œìž¥ ë¸Œëžœì¹˜: `codex/tkt-006-infra-single-worker-runtime`

## ëª©í‘œ

ì›Œì»¤ 1ê°œë¥¼ ì‹¤í–‰í•˜ê³  ë‹¤ìŒ ë¡œì»¬ í”Œëž«í¼ ë£¨í”„ë¥¼ ë°›ì¹  ìµœì†Œ ì¸í”„ë¼ë¥¼ ì„¤ì¹˜í•˜ê³  ì—°ê²°í•œë‹¤.

## ì´ë²ˆ ìž‘ì—… ê²°ê³¼

- `workers/ion2-worker/worker.py` ë¥¼ `gateway-polling` ê³¼ `redis-streams` ë‘ ëŸ°íƒ€ìž„ ëª¨ë“œë¥¼ í•¨ê»˜ ì§€ì›í•˜ë„ë¡ í™•ìž¥í–ˆë‹¤.
- `workers/ion2-worker/redis_stream.py` ë¡œ ìµœì†Œ Redis Streams client ë¥¼ ì¶”ê°€í•´ `XGROUP`, `XREADGROUP`, `XADD`, `XACK` ë¥¼ ì§ì ‘ ì²˜ë¦¬í•  ìˆ˜ ìžˆê²Œ í–ˆë‹¤.
- `workers/ion2-worker/enqueue_mock_ticket.py` ë¥¼ ì¶”ê°€í•´ mock ticket ì„ `platform:tickets` stream ìœ¼ë¡œ ë„£ì„ ìˆ˜ ìžˆê²Œ í–ˆë‹¤.
- `workers/ion2-worker/smoke_redis_stream.py` ë¥¼ ì¶”ê°€í•´ ê°€ì§œ Redis/HTTP ì„œë²„ ê¸°ë°˜ìœ¼ë¡œ worker ì‹¤ì œ í”„ë¡œì„¸ìŠ¤ë¥¼ end-to-end smoke í•  ìˆ˜ ìžˆê²Œ í–ˆë‹¤.
- `infra/docker-compose.yml`, `infra/.env.example`, `infra/README.md`, `infra/redis/README.md`, `workers/README.md`, `workers/ion2-worker/README.md`, `docs/ticket-policy.md` ë¥¼ ìƒˆ ëŸ°íƒ€ìž„ê³¼ ì‹¤í–‰ ì ˆì°¨ì— ë§žê²Œ ê°±ì‹ í–ˆë‹¤.

## ìž‘ì—… ë‚´ìš©

- í˜„ìž¬ `infra/docker-compose.yml`, `infra/redis/`, `workers/ion2-worker/` ì˜ ì‹¤í–‰ ê²½ë¡œë¥¼ ë‹¤ì‹œ í™•ì¸í–ˆë‹¤.
- Redis Streams ê¸°ë°˜ í‹°ì¼“ íë¥¼ ë¡œì»¬ì—ì„œ ë‹¤ë£¨ëŠ” ìµœì†Œ êµ¬ì„±ê³¼ consumer group íë¦„ì„ êµ¬í˜„í–ˆë‹¤.
- `ion2-worker` ê°€ ë¡œì»¬ ì„¤ì •ìœ¼ë¡œ ì‹œìž‘ë˜ëŠ” ì ˆì°¨ë¥¼ `gateway-polling` / `redis-streams` ë‘ ê²½ë¡œë¡œ ë¶„ë¦¬í•´ ì •ë¦¬í–ˆë‹¤.
- ìƒ˜í”Œ ë˜ëŠ” ëª¨ì˜ í‹°ì¼“ì„ ì²˜ë¦¬í•˜ëŠ” smoke ì ˆì°¨ë¥¼ ì‹¤ Redis ê²½ë¡œì™€ ê°€ì§œ Redis ê²½ë¡œë¡œ ê°ê° ë¬¸ì„œí™”í–ˆë‹¤.
- ì‹¤í–‰ ì¤‘ í•„ìš”í•œ í™˜ê²½ ë³€ìˆ˜ ì˜ˆì‹œë¥¼ `.env.example` ê³¼ worker README ì— ë°˜ì˜í–ˆë‹¤.

## ë²”ìœ„

- ë¡œì»¬ í”Œëž«í¼ ì‹¤í–‰ì— í•„ìš”í•œ ìµœì†Œ ì¸í”„ë¼ ì„¤ì •ì„ ì¶”ê°€í•œë‹¤.
- í‹°ì¼“ íë¦„ì„ ìœ„í•œ ë¡œì»¬ Redis ëŸ°íƒ€ìž„ ì§€ì›ì„ ì •ì˜í•˜ê±°ë‚˜ êµ¬í˜„í•œë‹¤.
- `workers/ion2-worker/` ì•„ëž˜ì— ì²« ì‹¤ìš© ì›Œì»¤ ëŸ°íƒ€ìž„ì„ ì¶”ê°€í•œë‹¤.
- í”Œëž«í¼ í‹°ì¼“ íë¦„ì„ ìƒëŒ€ë¡œ ì›Œì»¤ 1ê°œë¥¼ ë¡œì»¬ì—ì„œ ì‹¤í–‰í•  ìˆ˜ ìžˆê²Œ í•œë‹¤.
- ì›Œì»¤ì™€ ì§€ì› ì¸í”„ë¼ì˜ ë¡œì»¬ ì‹¤í–‰ ì ˆì°¨ë¥¼ ë¬¸ì„œí™”í•œë‹¤.
- ì„¤ê³„ê°€ ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„° ê²€í†  ë£¨í”„ì™€ ê¸°ì¡´ í‹°ì¼“ ìˆ˜ëª…ì£¼ê¸°ì™€ í˜¸í™˜ë˜ë„ë¡ ìœ ì§€í•œë‹¤.

## ì™„ë£Œ ê¸°ì¤€ ì ê²€

- [x] ì›Œì»¤ 1ê°œë¥¼ ë¡œì»¬ì—ì„œ ì‹œìž‘í•  ìˆ˜ ìžˆë‹¤.
- [x] ì›Œì»¤ì˜ ëŸ°íƒ€ìž„ ê²½ë¡œê°€ ë¬¸ì„œí™”ë˜ì–´ ìžˆë‹¤.
- [x] ë¡œì»¬ ì„¤ì •ì— ì›Œì»¤ ë™ìž‘ì— í•„ìš”í•œ ì¸í”„ë¼ê°€ í¬í•¨ë˜ì–´ ìžˆë‹¤.
- [x] ì›Œì»¤ê°€ ìƒ˜í”Œ í‹°ì¼“ ì‹¤í–‰ ê²½ë¡œ ë˜ëŠ” ì¶©ë¶„ížˆ ë¬¸ì„œí™”ëœ ëª¨ì˜ ê²½ë¡œë¥¼ ë³´ì—¬ì¤„ ìˆ˜ ìžˆë‹¤.
- [x] êµ¬í˜„ì´ í‹°ì¼“ ì •ì±…, ì•„í‚¤í…ì²˜ ë¬¸ì„œ, ì›Œì»¤ ì—­í•  ë¬¸ì„œì™€ ë§žëŠ”ë‹¤.

## ì„ í–‰ ì¡°ê±´

- ì—†ìŒ

## ì§ˆë¬¸/ê²°ì • ê¸°ë¡

- ê²°ì •: MVP í‹°ì¼“ íëŠ” Redis Streamsë¥¼ ê¸°ë³¸ìœ¼ë¡œ í•œë‹¤.
- ê²°ì •: ì›Œì»¤ëŠ” PRì„ ë§Œë“¤ì§€ ì•Šê³  `need_review` handoffê¹Œì§€ë§Œ ë‹´ë‹¹í•œë‹¤.
- ê²°ì •: ì‹¤ Redis ì—†ì´ë„ worker end-to-end ê²½ë¡œë¥¼ í™•ì¸í•  ìˆ˜ ìžˆë„ë¡ ì €ìž¥ì†Œ ì•ˆì— ê°€ì§œ Redis/HTTP ê¸°ë°˜ smoke ìŠ¤í¬ë¦½íŠ¸ë¥¼ ë‚¨ê¸´ë‹¤.

## ì„ í–‰ ì½ê¸°

- `README.md`
- `docs/architecture.md`
- `docs/ticket-policy.md`
- `docs/network.md`
- `docs/tickets/README.md`
- `docs/tickets/worker.md`
- `docs/history/README.md`
- ìµœì‹  ê´€ë ¨ ížˆìŠ¤í† ë¦¬ í•­ëª©

## ìž‘ì—…ìž ì‚°ì¶œë¬¼

- ë¸Œëžœì¹˜ ì´ë¦„
- êµ¬í˜„ ìš”ì•½
- ë¡œì»¬ ì‹¤í–‰ ì ˆì°¨
- í…ŒìŠ¤íŠ¸ ìš”ì•½
- ì¸í”„ë¼ ê°€ì •
- ë‚¨ì€ ìœ„í—˜

## ë¡œì»¬ ì‹¤í–‰ ì ˆì°¨

Gateway polling ê¸°ë³¸ ê²½ë¡œ:

```text
cd infra
copy .env.example .env
docker compose up --build
```

Redis Streams ëª¨ë“œ:

```text
cd infra
copy .env.example .env
set WORKER_RUNTIME_MODE=redis-streams
docker compose up --build
```

ë³„ë„ í„°ë¯¸ë„ì—ì„œ mock ticket enqueue:

```text
cd workers/ion2-worker
set REDIS_HOST=127.0.0.1
python enqueue_mock_ticket.py
```

ì‹¤ Redis ì—†ì´ worker ì „ì²´ ê²½ë¡œë§Œ smoke:

```text
cd workers/ion2-worker
python smoke_redis_stream.py
```

## ê²€ì¦

- [x] `C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m py_compile workers/ion2-worker/worker.py workers/ion2-worker/redis_stream.py workers/ion2-worker/enqueue_mock_ticket.py workers/ion2-worker/smoke_redis_stream.py`
- [x] `C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe workers/ion2-worker/smoke_redis_stream.py`
  - ê°€ì§œ Redis/HTTP ì„œë²„ë¥¼ ë„ìš´ ë’¤ `enqueue_mock_ticket.py` ì™€ `worker.py` ë¥¼ ì‹¤ì œ í”„ë¡œì„¸ìŠ¤ë¡œ ì‹¤í–‰í–ˆë‹¤.
  - ê²°ê³¼ stream `platform:tickets:results` ì— ê²°ê³¼ 1ê±´ì´ ê¸°ë¡ë˜ê³  ì›ë³¸ ticket ì´ `XACK` ë˜ì–´ pending ì´ ë¹„ëŠ” ê²ƒì„ í™•ì¸í–ˆë‹¤.
- [ ] ì‹¤ì œ Docker Compose ì „ì²´ ê¸°ë™
- [ ] ì‹¤ Redis ì»¨í…Œì´ë„ˆ ì—°ê²° smoke

## ê²€í†  ë©”ëª¨

- í˜„ìž¬ gateway ëŠ” ì¸ë©”ëª¨ë¦¬ ticket API ë¥¼ ê¸°ë³¸ìœ¼ë¡œ ìœ ì§€í•˜ë¯€ë¡œ, `redis-streams` ê²½ë¡œëŠ” worker/infra ìµœì†Œ ëŸ°íƒ€ìž„ê³¼ smoke ì ˆì°¨ë¥¼ ìš°ì„  êµ¬í˜„í•œ ìƒíƒœë‹¤.
- ì‹¤ì œ Docker/Redis ì»¨í…Œì´ë„ˆ ê²€ì¦ì€ ì´ í™˜ê²½ì— `docker` ê°€ ì—†ì–´ ë‚¨ê²¨ ë‘ì—ˆë‹¤.

## PR ì¤€ë¹„ ë©”ëª¨

PR ì œëª© ì´ˆì•ˆ:

```text
TKT-006 infra ë‹¨ì¼ worker Redis Streams ëŸ°íƒ€ìž„ ë¶€íŠ¸ìŠ¤íŠ¸ëž©
```

PR ë³¸ë¬¸ ì´ˆì•ˆ:

```markdown
## ìš”ì•½

- `ion2-worker` ì— `gateway-polling` ê³¼ `redis-streams` ë‘ ëŸ°íƒ€ìž„ ëª¨ë“œë¥¼ ì •ë¦¬í–ˆìŠµë‹ˆë‹¤.
- ìµœì†Œ Redis Streams client, mock ticket enqueue, ê°€ì§œ Redis ê¸°ë°˜ smoke ìŠ¤í¬ë¦½íŠ¸ë¥¼ ì¶”ê°€í–ˆìŠµë‹ˆë‹¤.
- compose/env/worker ë¬¸ì„œë¥¼ ìƒˆ ëŸ°íƒ€ìž„ ì ˆì°¨ì— ë§žì¶° ê°±ì‹ í–ˆìŠµë‹ˆë‹¤.

## í‹°ì¼“

- TKT-006

## ê²€ì¦

- [x] `C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe -m py_compile workers/ion2-worker/worker.py workers/ion2-worker/redis_stream.py workers/ion2-worker/enqueue_mock_ticket.py workers/ion2-worker/smoke_redis_stream.py`
- [x] `C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe workers/ion2-worker/smoke_redis_stream.py`
- [ ] ì‹¤ì œ Docker Compose ì „ì²´ ê¸°ë™

## ë¦´ë¦¬ìŠ¤ ë©”ëª¨

- ì´ PR ì€ `infra` íŠ¸ëž™ ìž‘ì—…ìž…ë‹ˆë‹¤.
- gateway ì˜ Redis Streams ë°œí–‰ ê²½ë¡œ ì—°ê²°ì€ í›„ì† í‹°ì¼“ì—ì„œ ì´ì–´ì§‘ë‹ˆë‹¤.
```

## Notes

- ê²°ì •: `redis-streams` ëŠ” ì •ì±…ìƒ ê¸°ë³¸ íì´ì§€ë§Œ, í˜„ìž¬ êµ¬í˜„ ë‹¨ê³„ì—ì„œëŠ” ê²Œì´íŠ¸ì›¨ì´ ì¸ë©”ëª¨ë¦¬ ticket API ì™€ ë³‘í–‰ ê°€ëŠ¥í•œ ê³¼ë„ê¸° ëŸ°íƒ€ìž„ìœ¼ë¡œ ë‘”ë‹¤.
- ë‹¤ìŒ ì¸í”„ë¼/ê²Œì´íŠ¸ì›¨ì´ í‹°ì¼“ì—ì„œëŠ” ì‹¤ì œ Redis ë°œí–‰ ê²½ë¡œì™€ Docker Compose ì‹¤ê¸°ë™ ê²€ì¦ì„ ì´ì–´ì„œ ë§žì¶”ëŠ” ê²ƒì´ ìžì—°ìŠ¤ëŸ½ë‹¤.


## ?? ??

- ??????? ?? ??, worker/Redis Streams ?? ???? ?? Redis ?? end-to-end smoke ? ??? ??? ????? ?? ??? `finished` ? ???. ?? Docker Compose / ? Redis smoke ? ?? ??? ???? ???.
