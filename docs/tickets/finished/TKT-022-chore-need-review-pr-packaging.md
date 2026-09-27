# TKT-022

## ë©”íƒ€ë°ì´í„°

- 제목: `need_review` 코드 묶음 PR 패키징과 원격 base 정렬
- ìš°ì„ ìˆœìœ„: P1
- ëŒ€ìƒ ë²„ì „: `chore`
- 상태: `finished`
- 문서 상태: `작성완료`
- ì§„í–‰ íŒì •: `ì§„í–‰ ê°€ëŠ¥`
- ì†Œìœ ìž ìœ í˜•: `orchestrator`
- ê¶Œìž¥ ë¸Œëžœì¹˜: `codex/tkt-022-need-review-pr-packaging`

## ëª©í‘œ

ë¡œì»¬ `need_review` í‹°ì¼“ ê²°ê³¼ê°€ ì›ê²© `main` ë³´ë‹¤ ì•žì„œ ìžˆì„ ë•Œ, ë¬¸ì„œ ë¹„ê³µê°œ ê·œì¹™ì„ ì§€í‚¤ë©´ì„œ ì•ˆì „í•œ draft PR ë¬¶ìŒì„ ë§Œë“ ë‹¤.

## ìž‘ì—… ë‚´ìš©

- ì›ê²© `main` ì— ì–´ë–¤ ì½”ë“œê°€ ì´ë¯¸ ë“¤ì–´ ìžˆëŠ”ì§€ GitHub ì»¤ë„¥í„°ë¡œ í™•ì¸í•œë‹¤.
- `TKT-011`, `TKT-020` ì²˜ëŸ¼ ì„œë¡œ ì˜ì¡´í•˜ëŠ” `need_review` í‹°ì¼“ì„ ë‹¨ë… PR ë¡œ ì—´ì–´ë„ ë˜ëŠ”ì§€ íŒë‹¨í•œë‹¤.
- worker ê°€ ìž¬ê°œí•  ë•ŒëŠ” ì´ í‹°ì¼“ì„ 1ìˆœìœ„ë¡œ ë³´ê³ , `TKT-011`, `TKT-020`, `TKT-021` ì˜ ë¯¸ê²€ì¦ í•­ëª©ê³¼ code-only PR íŒ¨í‚¤ì§•ì„ ì´ íë¦„ ì•ˆì—ì„œ í•¨ê»˜ í•´ì†Œí•œë‹¤.
- `docs/` ì•„ëž˜ í‹°ì¼“/ížˆìŠ¤í† ë¦¬ ë¬¸ì„œëŠ” PR í¬í•¨ ëŒ€ìƒì—ì„œ ì œì™¸í•œë‹¤. ì˜ˆì™¸ëŠ” í•„ìš”í•  ë•Œ `docs/releases.md` ë§Œ ê²€í† í•œë‹¤.
- ì½”ë“œ PR ì— í¬í•¨í•  í›„ë³´ íŒŒì¼ì„ ëª…ì‹œí•œë‹¤.
  - `frontend/` ì¤‘ ì‹¤ì œ ì•± ì†ŒìŠ¤ì™€ package íŒŒì¼
  - `gateway/` ì†ŒìŠ¤ì™€ ì„¤ì •
  - `services/elevator-service/`
  - í•„ìš”í•œ ê²½ìš° `infra/docker-compose.yml`
- ì›ê²© branch ë¥¼ ë§Œë“¤ ìˆ˜ ìžˆëŠ” ê²½ë¡œë¥¼ í™•ì¸í•œë‹¤.
  - ë¡œì»¬ `git` ì´ ìƒê¸°ë©´ ì¼ë°˜ branch/push/draft PR íë¦„ì„ ì‚¬ìš©í•œë‹¤.
  - ë¡œì»¬ `git` ì´ ê³„ì† ì—†ìœ¼ë©´ GitHub ì»¤ë„¥í„°ì˜ branch/tree/commit/PR ê²½ë¡œë¥¼ ì‚¬ìš©í•˜ë˜, í¬í•¨ íŒŒì¼ì„ ì½”ë“œ íŒŒì¼ë¡œ ì œí•œí•œë‹¤.
- draft PR ì œëª©, ë³¸ë¬¸, ê²€ì¦ ì²´í¬ë¦¬ìŠ¤íŠ¸ë¥¼ `TKT-011`, `TKT-020` ì˜ PR ì¤€ë¹„ ë©”ëª¨ì™€ ì¼ì¹˜ì‹œí‚¨ë‹¤.

## ë²”ìœ„

- ì´ í‹°ì¼“ì€ PR íŒ¨í‚¤ì§•ê³¼ base ì •ë ¬ë§Œ ë‹¤ë£¬ë‹¤.
- ìƒˆ ê¸°ëŠ¥ êµ¬í˜„, `VERSION` ìŠ¹ê²©, release tag, GitHub Release ìƒì„±ì€ í•˜ì§€ ì•ŠëŠ”ë‹¤.
- `docs/tickets/`, `docs/history/` ëŠ” ë¡œì»¬ ìš´ì˜ ë¬¸ì„œë¡œ ìœ ì§€í•˜ê³  PR ì— í¬í•¨í•˜ì§€ ì•ŠëŠ”ë‹¤.

## ì™„ë£Œ ê¸°ì¤€

- ì›ê²© `main` ê³¼ ë¡œì»¬ `need_review` ì½”ë“œ ì‚¬ì´ì˜ ì°¨ì´ê°€ PR ë‹¨ìœ„ë¡œ ì„¤ëª…ë˜ì–´ ìžˆë‹¤.
- ë‹¨ë… PR ë¡œ ì—´ë©´ ìœ„í—˜í•œ í‹°ì¼“ê³¼ ë¬¶ìŒ PR ë¡œ ì—´ì–´ì•¼ í•˜ëŠ” í‹°ì¼“ì´ êµ¬ë¶„ë˜ì–´ ìžˆë‹¤.
- draft PR ì„ ë§Œë“¤ì—ˆê±°ë‚˜, ë§Œë“¤ì§€ ëª»í–ˆë‹¤ë©´ ì–´ë–¤ íŒŒì¼/ë„êµ¬/ê¶Œí•œ ë•Œë¬¸ì— ë§‰í˜”ëŠ”ì§€ ê¸°ë¡ë˜ì–´ ìžˆë‹¤.
- PR ì„ ë§Œë“¤ì—ˆë‹¤ë©´ PR ë§í¬ì™€ draft ì—¬ë¶€ê°€ `TKT-011`, `TKT-020`, `TKT-018`, ížˆìŠ¤í† ë¦¬ì— ë‚¨ì•„ ìžˆë‹¤.
- PR ì„ ë§Œë“¤ì§€ ì•Šì•˜ë‹¤ë©´ ë‹¤ìŒ ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„°ê°€ ê·¸ëŒ€ë¡œ ì´ì–´ê°ˆ ìˆ˜ ìžˆëŠ” code-only íŒŒì¼ ëª©ë¡ì´ ë‚¨ì•„ ìžˆë‹¤.

## ì„ í–‰ ì¡°ê±´

- `TKT-011`, `TKT-020`, `TKT-021` ì¤‘ ì ì–´ë„ í•˜ë‚˜ê°€ `started` ë˜ëŠ” `need_review` ìƒíƒœì—¬ì•¼ í•œë‹¤.
- ì›ê²© GitHub ì €ìž¥ì†Œ ì ‘ê·¼ ê¶Œí•œì„ í™•ì¸í•œë‹¤.

## ì§ˆë¬¸/ê²°ì • ê¸°ë¡

- ê²°ì •: `TKT-020` ë‹¨ë… PR ì€ í˜„ìž¬ ì›ê²© `main` ì— `elevator-service` descriptor ê°€ ì—†ì–´ ìœ„í—˜í•˜ë‹¤.
- ê²°ì •: `TKT-020` ì€ `TKT-011` ì½”ë“œ ë¬¶ìŒ ìœ„ì— ì–¹ê±°ë‚˜ `TKT-011 + TKT-020` ë¬¶ìŒ draft PR ë¡œ ì—°ë‹¤.
- ê²°ì •: í‹°ì¼“/ížˆìŠ¤í† ë¦¬ ë¬¸ì„œëŠ” GitHub ê³µê°œ ëŒ€ìƒì´ ì•„ë‹ˆë¯€ë¡œ code-only PR íŒ¨í‚¤ì§•ì„ ê¸°ë³¸ê°’ìœ¼ë¡œ í•œë‹¤.
- ì—´ë¦° ì§ˆë¬¸: GitHub ì»¤ë„¥í„°ë¡œ code-only draft PR ì„ ë§Œë“¤ ë•Œ í¬í•¨í•  ì •í™•í•œ íŒŒì¼ ëª©ë¡ì„ ì–´ë””ê¹Œì§€ë¡œ ìž¡ì„ ê²ƒì¸ê°€?
- ê²°ì •: 2026-06-13 ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„°ê°€ ì›ê²© ë¸Œëžœì¹˜ `codex/tkt-011-tkt-020-elevator-preview` ë¥¼ `8761c47a73ffde0da07c9648c82af97284c29fb8` ê¸°ì¤€ìœ¼ë¡œ ì˜ˆì•½í–ˆë‹¤.
- ê²°ì •: ì¼ë¶€ íŒŒì¼ë§Œ ë“¤ì–´ê°„ PR ì€ ë¦¬ë·°ë¥¼ ì˜¤ë„í•  ìˆ˜ ìžˆìœ¼ë¯€ë¡œ ë§Œë“¤ì§€ ì•ŠëŠ”ë‹¤. draft PR ì€ ì•„ëž˜ code-only íŒŒì¼ ë¬¶ìŒì„ ëª¨ë‘ ì•ˆì „í•˜ê²Œ ë°˜ì˜í•  ìˆ˜ ìžˆì„ ë•Œë§Œ ì—°ë‹¤.
- ê²°ì •: í˜„ìž¬ í™˜ê²½ì—ëŠ” ë¡œì»¬ `git` ì´ ì—†ê³ , GitHub ì»¤ë„¥í„°ì˜ blob ê²½ë¡œëŠ” í° Vue/CSS/Java íŒŒì¼ì„ ìˆ˜ë™ base64 ë¡œ ì „ë‹¬í•´ì•¼ í•´ì„œ bulk ë°˜ì˜ ì•ˆì •ì„±ì´ ë‚®ë‹¤. ë‹¤ìŒ ë£¨í”„ì—ì„œëŠ” ë¡œì»¬ git/gh ê²½ë¡œ í™•ë³´ ë˜ëŠ” ìžë™í™” ê°€ëŠ¥í•œ íŒŒì¼ ì—…ë¡œë“œ ê²½ë¡œë¥¼ ë¨¼ì € í™•ë³´í•œë‹¤.
- ì •ì •: `git` ì€ PATH ì— ì—†ì—ˆì§€ë§Œ `C:\Program Files\Git\cmd\git.exe` ì— ì„¤ì¹˜ë˜ì–´ ìžˆì—ˆë‹¤.
- ê²°ì •: ê¸°ì¡´ ìž‘ì—…íŠ¸ë¦¬ëŠ” ë¬¸ì„œ ë³€ê²½ì´ ë§Žì´ ì„žì—¬ ìžˆìœ¼ë¯€ë¡œ PR ë¸Œëžœì¹˜ëŠ” ìž„ì‹œ worktree ì—ì„œ code-only íŒŒì¼ë§Œ ë³µì‚¬í•´ ë§Œë“ ë‹¤.
- ì •ì •: ì´í›„ ìž¬í™•ì¸ì—ì„œ `TKT-011`, `TKT-020`, `TKT-021` ì€ êµ¬í˜„ handoff ê¸°ì¤€ì´ ì¶©ë¶„í•˜ë‹¤ê³  ë³´ê³  ë‹¤ì‹œ `need_review` ë¡œ ì˜¬ë ¸ë‹¤. ì´ í‹°ì¼“ì€ ê·¸ ìƒíƒœë¥¼ ì „ì œë¡œ code-only PR íŒ¨í‚¤ì§•ê³¼ ì›ê²© base ì •ë ¬ì„ ë§ˆë¬´ë¦¬í•œë‹¤.
- ê²°ì •: 2026-06-14 GitHub connector ë¡œ code-only tree/commit/ref ë¥¼ ì§ì ‘ ìž¬êµ¬ì„±í•´ draft PR `#2` `feat: add elevator preview integration` ì„ ì—´ì—ˆë‹¤.

## ì„ í–‰ ì½ê¸°

- `README.md`
- `docs/ticket-policy.md`
- `docs/tickets/board.md`
- `docs/tickets/need_review/TKT-011-v0.3.0-elevator-simulator-integration.md`
- `docs/tickets/need_review/TKT-020-v0.1.4-remove-sample-python-ticket-default.md`
- `docs/tickets/need_review/TKT-021-v0.3.0-elevator-control-loop.md`
- `docs/tickets/backlog/TKT-018-v0.2.0-release-candidate-gate.md`
- `docs/history/README.md`
- ìµœì‹  ê´€ë ¨ ížˆìŠ¤í† ë¦¬ í•­ëª©

## ìž‘ì—…ìž ì‚°ì¶œë¬¼

- PR í¬í•¨ í›„ë³´ íŒŒì¼ ëª©ë¡
- ë‹¨ë…/ë¬¶ìŒ PR íŒë‹¨
- draft PR ë§í¬ ë˜ëŠ” ë³´ë¥˜ ì‚¬ìœ 
- ë¯¸ê²€ì¦ í•­ëª©
- í›„ì† ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„° Notes

## ê²€í†  ë©”ëª¨

- 2026-06-13 ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„° í™•ì¸:
  - ì›ê²© `main` ì€ ë¡œì»¬ `TKT-011`/`TKT-020` ì½”ë“œë³´ë‹¤ ì˜¤ëž˜ëœ ê¸°ì¤€ì„ ì´ë‹¤.
  - ì›ê²© ë¸Œëžœì¹˜ì—ëŠ” `codex/v0.1.0-worker-node` ì™¸ì— `TKT-011`, `TKT-020`, `elevator` ê´€ë ¨ ë¸Œëžœì¹˜ê°€ ì—†ë‹¤.
  - ë¡œì»¬ `git` ì´ PATH ì— ì—†ì–´ ì¼ë°˜ branch/push íë¦„ì€ ì‚¬ìš©í•  ìˆ˜ ì—†ë‹¤.
  - ì›ê²© ë¸Œëžœì¹˜ `codex/tkt-011-tkt-020-elevator-preview` ë¥¼ ìƒì„±í–ˆë‹¤.
  - GitHub ì»¤ë„¥í„°ë¡œ ìž‘ì€ blob ì¼ë¶€ëŠ” ë§Œë“¤ ìˆ˜ ìžˆì—ˆì§€ë§Œ, í° `frontend/src/App.vue`, `frontend/src/styles.css`, `gateway/src/main/java/com/workaround/platform/gateway/PlatformGatewayApplication.java` ë¥¼ ìˆ˜ë™ìœ¼ë¡œ ì•ˆì „í•˜ê²Œ ëª¨ë‘ ë°˜ì˜í•˜ê¸° ì „ì—ëŠ” commit/PR ì„ ë§Œë“¤ì§€ ì•Šê¸°ë¡œ í–ˆë‹¤.
  - ì—´ë¦° PR ì€ ì•„ì§ ì—†ë‹¤.
  - code-only PR í›„ë³´ íŒŒì¼ì€ ì•„ëž˜ë¡œ ê³ ì •í•œë‹¤.
    - `frontend/src/App.vue`
    - `frontend/src/styles.css`
    - `frontend/vite.config.js`
    - `gateway/src/main/java/com/workaround/platform/gateway/PlatformGatewayApplication.java`
    - `gateway/src/main/resources/application.yml`
    - `gateway/README.md`
    - `infra/docker-compose.yml`
    - `services/elevator-service/app.py`
    - `services/elevator-service/Dockerfile`
    - `services/elevator-service/README.md`
  - `docs/tickets/`, `docs/history/`, `docs/steering.md` ê°™ì€ ë¡œì»¬ ìš´ì˜ ë¬¸ì„œëŠ” ì´ PR ì— í¬í•¨í•˜ì§€ ì•ŠëŠ”ë‹¤.
- 2026-06-13 ì¶”ê°€ ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„° í™•ì¸:
  - `git` ì‹¤í–‰ íŒŒì¼ì€ `C:\Program Files\Git\cmd\git.exe` ì— ìžˆì—ˆë‹¤.
  - `git fetch origin` ì„ ìŠ¹ì¸ ê¶Œí•œìœ¼ë¡œ ì‹¤í–‰í•´ `origin/main` ì„ `7d0997e718c856f443340b34cc179973e57b4606` ê¹Œì§€ ìµœì‹ í™”í–ˆë‹¤.
  - ê¸°ì¡´ ì›ê²© ë¸Œëžœì¹˜ `origin/codex/tkt-011-tkt-020-elevator-preview` ëŠ” `main` ë³´ë‹¤ ë’¤ì²˜ì§„ `8761c47a73ffde0da07c9648c82af97284c29fb8` ê¸°ì¤€ì´ì—ˆë‹¤.
  - ìž„ì‹œ worktree `C:\Users\user\AppData\Local\Temp\workaround-tkt-011-020-pr` ë¥¼ `origin/main` ê¸°ì¤€ìœ¼ë¡œ ë§Œë“¤ì—ˆë‹¤.
  - ìœ„ code-only í›„ë³´ 9ê°œ íŒŒì¼ë§Œ ìž„ì‹œ worktree ì— ë³µì‚¬í•˜ê³  staged í–ˆë‹¤.
  - `services/elevator-service/app.py` syntax check ì™€ `git diff --cached --check` ë¥¼ í†µê³¼í–ˆë‹¤.
  - ë¡œì»¬ code-only ì»¤ë°‹ `ead4ab64231774bec8a1a6945156134883449af0` (`feat: add elevator preview integration`) ì„ ë§Œë“¤ì—ˆë‹¤.
  - ì»¤ë°‹ ë‚´ìš©ì€ 9ê°œ íŒŒì¼, 467 insertions / 110 deletions ì´ë‹¤.
  - `git push origin codex/tkt-011-tkt-020-elevator-preview` ëŠ” ì¸ì¦/credential ëŒ€ê¸°ë¡œ ë³´ì´ë©° timeout ì´ ë°œìƒí–ˆë‹¤.
  - `gh` CLI ëŠ” PATH ì— ì—†ì—ˆë‹¤.
  - ì›ê²© ë¸Œëžœì¹˜ëŠ” ì•„ì§ ì—…ë°ì´íŠ¸ë˜ì§€ ì•Šì•˜ê³ , GitHub ê¸°ì¤€ ì—´ë¦° PR ë„ ì—†ë‹¤.
  - `TKT-021` ì„ ìž‘ì—…ì„ ê°™ì€ ìž„ì‹œ worktree ë¸Œëžœì¹˜ì— ì–¹ì–´ code-only ì»¤ë°‹ `deb51d8` (`feat: add elevator control loop`) ì„ ì¶”ê°€í–ˆë‹¤.
  - `deb51d8` ì»¤ë°‹ì€ 6ê°œ íŒŒì¼, 365 insertions / 34 deletions ë¡œ êµ¬ì„±ëœë‹¤.
  - `GIT_TERMINAL_PROMPT=0`, `GCM_INTERACTIVE=Never`, `GIT_ASKPASS=echo` ë¡œ ë¹„ëŒ€í™”í˜• push ë¥¼ ë‹¤ì‹œ ì‹œë„í–ˆê³ , ì´ë²ˆì—ëŠ” `Invalid username or token` ì¸ì¦ ì‹¤íŒ¨ê°€ ëª…í™•ížˆ í™•ì¸ëë‹¤.
  - í˜„ìž¬ PR ë¸Œëžœì¹˜ í›„ë³´ì˜ ë¡œì»¬ HEAD ëŠ” `deb51d8` ì´ë©°, ì›ê²©ì—ëŠ” ì•„ì§ push ë˜ì§€ ì•Šì•˜ë‹¤.
- 2026-06-13 ì»¤ë„¥í„° ê¸°ë°˜ PR ìž¬êµ¬ì„± ê²½ë¡œ í™•ì¸:
  - ì›ê²© `main` ê¸°ì¤€ tree SHA ëŠ” `9bf3c85971c58e4c8254108e02a39c0bb5b04254` ë¡œ í™•ì¸í–ˆë‹¤.
  - GitHub ì»¤ë„¥í„° `create_tree` ê°€ `content` í•„ë“œë¥¼ ë°›ëŠ”ì§€ `gateway/README.md` ë‹¨ì¼ íŒŒì¼ë¡œ ì‹œí—˜í–ˆê³  tree `635b939352ef0a303ca349f155aa43d6070fd3bc` ìƒì„±ì— ì„±ê³µí–ˆë‹¤.
  - ì´ ì‹œí—˜ tree ëŠ” branch/ref/PR ì— ì—°ê²°í•˜ì§€ ì•Šì•˜ìœ¼ë¯€ë¡œ ì›ê²© ì½”ë“œ ìƒíƒœëŠ” ë°”ë€Œì§€ ì•Šì•˜ë‹¤.
  - GitHub ì»¤ë„¥í„° `create_blob` ë¡œ `frontend/src/styles.css` blob `26b7f95b480b8ceda564ecf77e742834c8b864a9` ë¥¼ ë§Œë“¤ì—ˆë‹¤.
  - GitHub ì»¤ë„¥í„° `create_blob` ë¡œ `services/elevator-service/app.py` blob `d3fcf9ca3ebeadbd4a5a85ca85b11d077f896956` ë¥¼ ë§Œë“¤ì—ˆë‹¤.
  - GitHub ì»¤ë„¥í„° `create_blob` ë¡œ `frontend/vite.config.js` blob `43fb63767b7623a44c5adcb9faf7df48f60d8943` ë¥¼ ë§Œë“¤ì—ˆë‹¤.
  - GitHub ì»¤ë„¥í„° `create_blob` ë¡œ `gateway/src/main/resources/application.yml` blob `9804431931a4dea60054ea9d36d4a6c90218d8f8` ë¥¼ ë§Œë“¤ì—ˆë‹¤.
  - GitHub ì»¤ë„¥í„° `create_blob` ë¡œ `services/elevator-service/Dockerfile` blob `38b346cd7484dd03817e0359a5665cb7f4b565d7` ë¥¼ ë§Œë“¤ì—ˆë‹¤.
  - GitHub ì»¤ë„¥í„° `create_blob` ë¡œ `gateway/README.md` blob `8b835ef54dba4bc66d709c9fa04dab1c6ae88850` ë¥¼ ë§Œë“¤ì—ˆë‹¤.
  - GitHub ì»¤ë„¥í„° `create_blob` ë¡œ `infra/docker-compose.yml` blob `7be25a19bb7966d0f956066aa4fc3640b2b04010` ë¥¼ ë§Œë“¤ì—ˆë‹¤.
  - GitHub ì»¤ë„¥í„° `create_blob` ë¡œ `services/elevator-service/README.md` blob `56d97dc0023482bad82eddcdd4ec09b92195c451` ë¥¼ ë§Œë“¤ì—ˆë‹¤.
  - ì „ì²´ 10ê°œ PR í›„ë³´ íŒŒì¼ ì¤‘ 8ê°œ blob ìƒì„±ì´ ëë‚¬ê³ , ë‚¨ì€ íŒŒì¼ì€ `frontend/src/App.vue`, `gateway/src/main/java/com/workaround/platform/gateway/PlatformGatewayApplication.java` 2ê°œë‹¤.
  - ì•„ì§ ì „ì²´ tree/commit/ref/PR ìƒì„±ì€ ì™„ë£Œí•˜ì§€ ì•Šì•˜ë‹¤.
- 2026-06-13 heartbeat ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„° ìž¬í™•ì¸:
  - í˜„ìž¬ sandbox ì‚¬ìš©ìžì™€ ìž„ì‹œ worktree ì†Œìœ ìžê°€ ë‹¬ë¼ ì¼ë°˜ `git -C` í˜¸ì¶œì€ `dubious ownership` ìœ¼ë¡œ ë§‰ížŒë‹¤.
  - ì „ì—­ git ì„¤ì •ì„ ë°”ê¾¸ì§€ ì•Šê³  `git -c safe.directory=C:/Users/user/AppData/Local/Temp/workaround-tkt-011-020-pr -C ...` í˜•íƒœë¡œ ì½ìœ¼ë©´ ìƒíƒœ í™•ì¸ì´ ê°€ëŠ¥í•˜ë‹¤.
  - ìž„ì‹œ worktree ëŠ” ê¹¨ë—í•˜ê³  í˜„ìž¬ ë¸Œëžœì¹˜ëŠ” `codex/tkt-011-tkt-020-elevator-preview`, HEAD ëŠ” `deb51d8` ì´ë‹¤.
  - ë¡œì»¬ ë¸Œëžœì¹˜ì—ëŠ” `deb51d8 feat: add elevator control loop`, `ead4ab6 feat: add elevator preview integration` ë‘ code-only ì»¤ë°‹ì´ `origin/main` ìœ„ì— ìžˆë‹¤.
  - GitHub ì»¤ë„¥í„° ê¸°ì¤€ ì—´ë¦° PR ì€ ì•„ì§ ì—†ë‹¤.
  - GitHub ì»¤ë„¥í„° ê¸°ì¤€ ì›ê²© ë¸Œëžœì¹˜ `codex/tkt-011-tkt-020-elevator-preview` ëŠ” ì¡´ìž¬í•˜ì§€ë§Œ, ë¡œì»¬ git ê¸°ì¤€ ì›ê²© ì¶”ì  ë¸Œëžœì¹˜ HEAD ëŠ” ì˜¤ëž˜ëœ `8761c47` ì´ë‹¤.
  - ë¡œì»¬ HEAD ëŠ” ì›ê²© ì¶”ì  ë¸Œëžœì¹˜ë³´ë‹¤ 28 commits ahead ë¡œ í‘œì‹œë˜ë©°, push ì¸ì¦ ë˜ëŠ” ì»¤ë„¥í„° tree ìž¬êµ¬ì„±ì´ ëë‚˜ê¸° ì „ê¹Œì§€ PR ì„ ì—´ì§€ ì•ŠëŠ”ë‹¤.
- 2026-06-13 heartbeat íŒŒì¼ í¬ê¸° í™•ì¸:
  - ë‚¨ì€ í° íŒŒì¼ í¬ê¸°ëŠ” `frontend/src/App.vue` ì•½ 14KB, `gateway/src/main/java/com/workaround/platform/gateway/PlatformGatewayApplication.java` ì•½ 17KB ì´ë‹¤.
  - íŒŒì¼ í¬ê¸° ìžì²´ëŠ” ì»¤ë„¥í„° blob ìƒì„±ì˜ ê·¼ë³¸ ì°¨ë‹¨ ìš”ì†Œê°€ ì•„ë‹ˆë‹¤.
  - ë‹¤ë§Œ í˜„ìž¬ ì»¤ë„¥í„° í˜¸ì¶œì€ ë¡œì»¬ íŒŒì¼ ê²½ë¡œë¥¼ ì§ì ‘ ë°›ì§€ ì•Šìœ¼ë¯€ë¡œ, ëŒ€í˜• íŒŒì¼ ë³¸ë¬¸ì„ ìˆ˜ë™ JSON ìœ¼ë¡œ ì˜®ê¸°ëŠ” ê³¼ì •ì—ì„œ ëˆ„ë½/ì´ìŠ¤ì¼€ì´í”„ ì˜¤ë¥˜ê°€ ìƒê¸°ë©´ ë¶€ë¶„ PR ì´ ë§Œë“¤ì–´ì§ˆ ìˆ˜ ìžˆë‹¤.
  - ë”°ë¼ì„œ ì•ˆì „í•œ ë‹¤ìŒ ê²½ë¡œëŠ” GitHub ì¸ì¦ì„ í™•ë³´í•´ ìž„ì‹œ worktree `deb51d8` ì„ push í•˜ê±°ë‚˜, íŒŒì¼ ë³¸ë¬¸ì„ ìžë™ìœ¼ë¡œ ì»¤ë„¥í„°ì— ì „ë‹¬í•  ìˆ˜ ìžˆëŠ” í™•ì‹¤í•œ ê²½ë¡œë¥¼ í™•ë³´í•œ ë’¤ ì „ì²´ tree ë¥¼ í•œ ë²ˆì— ë§Œë“œëŠ” ê²ƒì´ë‹¤.
- 2026-06-13 heartbeat í›„ë³´ ëª©ë¡ ì •ì •:
  - ìžë™í™” í”„ë¡¬í”„íŠ¸ì™€ blob ê¸°ë¡ì€ PR í›„ë³´ íŒŒì¼ì„ 10ê°œë¡œ ë³´ê³  ìžˆì—ˆì§€ë§Œ, ì´ í‹°ì¼“ì˜ ê³ ì • í›„ë³´ ëª©ë¡ì—ëŠ” `gateway/README.md` ê°€ ë¹ ì ¸ ìžˆì—ˆë‹¤.
  - `gateway/README.md` ëŠ” ì´ë¯¸ blob `8b835ef54dba4bc66d709c9fa04dab1c6ae88850` ê°€ ìƒì„±ëœ PR í›„ë³´ íŒŒì¼ì´ë¯€ë¡œ ê³ ì • í›„ë³´ ëª©ë¡ì— ì¶”ê°€í–ˆë‹¤.
  - í˜„ìž¬ PR í›„ë³´ íŒŒì¼ì€ ì´ 10ê°œì´ë©°, ë‚¨ì€ blob ëŒ€ìƒì€ ê³„ì† `frontend/src/App.vue`, `gateway/src/main/java/com/workaround/platform/gateway/PlatformGatewayApplication.java` 2ê°œë‹¤.
- 2026-06-14 ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„° ìž¬ì‹œë„:
  - ìž„ì‹œ worktree `C:\Users\user\AppData\Local\Temp\workaround-tkt-011-020-pr` ì˜ `codex/tkt-011-tkt-020-elevator-preview` ëŠ” ê¹¨ë—í•˜ê³  `origin/main` ëŒ€ë¹„ `ahead 2`, HEAD `deb51d84ad743859bb9379fb61ef1cd850a3339b` ìƒíƒœìž„ì„ ë‹¤ì‹œ í™•ì¸í–ˆë‹¤.
  - ê°™ì€ HEAD ê¸°ì¤€ code-only í›„ë³´ 10ê°œ blob SHA ë¥¼ ë‹¤ì‹œ ëŒ€ì¡°í•œ ê²°ê³¼, `frontend/src/styles.css` ëŠ” ì˜ˆì „ ë©”ëª¨ì˜ `26b7...` ì´ ì•„ë‹ˆë¼ `9b73d8fc4ef6b0ad2a5630668e0203604d8616ae` ì˜€ë‹¤.
  - GitHub connector `create_tree` ë¡œ í˜„ìž¬ `origin/main` tree `c6221dd9355afa9fb33cb08e77a6b7cc37af80c5` ìœ„ì— 10ê°œ blob SHA ë¥¼ ë°”ë¡œ ì¡°ë¦½í•´ ë³´ë ¤ í–ˆì§€ë§Œ, `frontend/src/App.vue` blob `62c75f643de706b007834851acc3c87fc7f8ad78` ê°€ ì›ê²©ì— ì—†ì–´ `422 tree.sha ... is not a valid blob` ìœ¼ë¡œ ì‹¤íŒ¨í–ˆë‹¤.
  - ë¹„ëŒ€í™”í˜• `git push` ë„ ë‹¤ì‹œ í™•ì¸í–ˆê³ , ì´ë²ˆì—ëŠ” `Invalid username or token. Password authentication is not supported for Git operations.` ì¸ì¦ ì‹¤íŒ¨ê°€ ëª…í™•ížˆ ë“œëŸ¬ë‚¬ë‹¤.
  - ë”°ë¼ì„œ í˜„ìž¬ ë‚¨ì€ ì§ì ‘ blocker ëŠ” ë‘˜ì´ë‹¤.
    - GitHub HTTPS push ì¸ì¦ ë³µêµ¬
    - ë˜ëŠ” connector ê²½ë¡œë¡œ `frontend/src/App.vue`, `frontend/src/styles.css`, `gateway/src/main/java/com/workaround/platform/gateway/PlatformGatewayApplication.java` blob ì„ ì •í™•í•œ HEAD ê¸°ì¤€ìœ¼ë¡œ ë‹¤ì‹œ ì˜¬ë¦° ë’¤ tree/commit/ref/PR ì„ ìž¬êµ¬ì„±

## Notes

- ì´ í‹°ì¼“ì€ `TKT-018` ì˜ PR ìˆ˜ìš© ê²Œì´íŠ¸ë¥¼ ë³´ì¡°í•œë‹¤.
- worker ê°€ ì´ ë¼ì¸ì„ ìž¬ê°œí•  ë•Œì˜ ì²« ìš°ì„ ìˆœìœ„ëŠ” ì´ í‹°ì¼“ì´ë©°, ì´ë¯¸ `need_review` ì¸ `TKT-011`, `TKT-020`, `TKT-021` ì˜ ê²€ì¦/íŒ¨í‚¤ì§• ë¶€ì¡±ë¶„ì„ ì—¬ê¸°ì„œ í•¨ê»˜ ì •ë¦¬í•œë‹¤.
- PR ì„ ë§Œë“¤ë”ë¼ë„ `v0.2.0` ë°°í¬ ìŠ¹ì¸ì´ë‚˜ `VERSION` ìŠ¹ê²©ìœ¼ë¡œ í•´ì„í•˜ì§€ ì•ŠëŠ”ë‹¤.
- `TKT-011 + TKT-020` ë¬¶ìŒ draft PR ì€ ê²Œì´íŠ¸ì›¨ì´ Java/Maven ì»´íŒŒì¼ ë¯¸ê²€ì¦ ìƒíƒœë¥¼ ë³¸ë¬¸ì— ë°˜ë“œì‹œ ë‚¨ê¸´ë‹¤.
- ì´ë¯¸ ìƒì„±ëœ ì›ê²© ë¸Œëžœì¹˜ëŠ” ë¹„ì–´ ìžˆëŠ” ì˜ˆì•½ ë¸Œëžœì¹˜ì— ê°€ê¹ë‹¤. ë‹¤ìŒ ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„°ëŠ” ê°™ì€ ë¸Œëžœì¹˜ë¥¼ ìž¬ì‚¬ìš©í•˜ë˜, ì¼ë¶€ íŒŒì¼ë§Œ ë‹´ì€ PR ì„ ì—´ì§€ ì•ŠëŠ”ë‹¤.
- ë‹¤ìŒ ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„°ëŠ” ë¨¼ì € push ì¸ì¦ ë¬¸ì œë¥¼ í•´ê²°í•´ì•¼ í•œë‹¤. ê°€ëŠ¥í•œ ê²½ë¡œëŠ” GitHub ì»¤ë„¥í„°ë¡œ ë¡œì»¬ ì»¤ë°‹ê³¼ ë™ì¼í•œ tree ë¥¼ ìž¬ìƒì„±í•˜ê±°ë‚˜, Git credential/gh ì¸ì¦ì„ í™•ë³´í•œ ë’¤ ìž„ì‹œ worktree ì˜ `deb51d8` HEAD ë¥¼ push í•˜ëŠ” ê²ƒì´ë‹¤.
- ì¸ì¦ ì‹¤íŒ¨ ë©”ì‹œì§€ëŠ” `Invalid username or token` ì´ë©°, `gh` CLI ëŠ” ì•„ì§ ì—†ë‹¤.
- ì»¤ë„¥í„° ê²½ë¡œëŠ” ì‹¤ì œë¡œ ë™ìž‘í•œë‹¤. ë‹¤ìŒ ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„°ëŠ” ë‚¨ì€ í° íŒŒì¼ 2ê°œì˜ blob ì„ ë§Œë“¤ê³ , base tree `9bf3c85971c58e4c8254108e02a39c0bb5b04254` ìœ„ì— ì „ì²´ tree ë¥¼ ë§Œë“  ë’¤ commit/ref/ draft PR ì„ ìƒì„±í•˜ë©´ ëœë‹¤.
- ë‚¨ì€ ë‘ íŒŒì¼ì€ ì•½ 14KB/17KB ë¡œ í¬ê¸° ìžì²´ëŠ” ê°€ëŠ¥í•˜ì§€ë§Œ, ë¡œì»¬ íŒŒì¼ì„ ì§ì ‘ ë„˜ê¸°ëŠ” ê²½ë¡œê°€ ì—†ìœ¼ë©´ ìˆ˜ë™ JSON ì „ì†¡ ë¬´ê²°ì„± ìœ„í—˜ì´ ìžˆë‹¤. ì¼ë¶€ íŒŒì¼ë§Œ ë‹´ê¸´ PR ì€ ê³„ì† ê¸ˆì§€í•œë‹¤.
- 2026-06-13 ìž¬ì‹œë„ì—ì„œ ë‚¨ì€ í° íŒŒì¼ 2ê°œë¥¼ base64 ë¡œ ì¶”ì¶œí•´ ì»¤ë„¥í„° blob ìƒì„±ì„ ì´ì–´ê°€ë ¤ í–ˆì§€ë§Œ, ë„êµ¬ ì¶œë ¥ì´ ìž˜ë ¤ ì „ì²´ ë³¸ë¬¸ ë¬´ê²°ì„±ì„ í™•ì¸í•  ìˆ˜ ì—†ì—ˆë‹¤.
- ë”°ë¼ì„œ ì¶”ê°€ blob, commit, ref update, draft PR ìƒì„±ì€ ì§„í–‰í•˜ì§€ ì•Šì•˜ë‹¤. ë‹¤ìŒ ì•ˆì „ ê²½ë¡œëŠ” GitHub push ì¸ì¦ì„ í™•ë³´í•˜ê±°ë‚˜, ë¡œì»¬ íŒŒì¼ ë³¸ë¬¸ì„ ìž˜ë¦¼ ì—†ì´ ì»¤ë„¥í„°ì— ì „ë‹¬í•  ìžë™í™” ê²½ë¡œë¥¼ ë¨¼ì € í™•ë³´í•˜ëŠ” ê²ƒì´ë‹¤.
- 2026-06-14 ì¶”ê°€ ì§„í–‰:
  - ë¡œì»¬ git object database ì—ì„œ ì •í™•í•œ blob bytes ë¥¼ ë‹¤ì‹œ ì¶”ì¶œí•´ `frontend/src/App.vue`, `frontend/src/styles.css`, `gateway/src/main/java/com/workaround/platform/gateway/PlatformGatewayApplication.java` blob ì„ ì›ê²©ì— ìž¬ì—…ë¡œë“œí–ˆë‹¤.
  - 10ê°œ code-only í›„ë³´ íŒŒì¼ ì „ì²´ë¥¼ ê¸°ì¤€ìœ¼ë¡œ tree `d16bc7d148440ca87291b79d90f40293933a19c5`, commit `cfc2453d1664553c8eb14dd39baceceb36108047` ë¥¼ ë§Œë“¤ì—ˆë‹¤.
  - ì›ê²© ë¸Œëžœì¹˜ `codex/tkt-011-tkt-020-elevator-preview` ë¥¼ ìœ„ commit ìœ¼ë¡œ ê°•ì œ ì •ë ¬í–ˆë‹¤.
  - draft PR `#2` ë¥¼ ìƒì„±í–ˆë‹¤: `https://github.com/lim-it-err/workaround.co.kr-platform/pull/2`
  - PR ë³¸ë¬¸ì—ëŠ” `TKT-011`, `TKT-020`, `TKT-021`, `TKT-022` ë¬¶ìŒê³¼ ë¯¸ê²€ì¦ í•­ëª©(`gateway` Java/Maven compile, Docker build, ì—˜ë¦¬ë² ì´í„° ì œì–´ API ë³´ì•ˆ/ê¶Œí•œ ì •ì±…)ì„ í•¨ê»˜ ë‚¨ê²¼ë‹¤.
- ìž„ì‹œ worktree git í™•ì¸ì€ ì „ì—­ ì„¤ì • ë³€ê²½ ëŒ€ì‹  `-c safe.directory=C:/Users/user/AppData/Local/Temp/workaround-tkt-011-020-pr` ë¥¼ ë¶™ì—¬ ìˆ˜í–‰í•œë‹¤.
- ì´ë¯¸ ë§Œë“  blob ì€ ì•„ëž˜ì™€ ê°™ë‹¤.
  - `frontend/src/styles.css` = `9b73d8fc4ef6b0ad2a5630668e0203604d8616ae`
  - `frontend/vite.config.js` = `43fb63767b7623a44c5adcb9faf7df48f60d8943`
  - `gateway/README.md` = `8b835ef54dba4bc66d709c9fa04dab1c6ae88850`
  - `gateway/src/main/resources/application.yml` = `9804431931a4dea60054ea9d36d4a6c90218d8f8`
  - `infra/docker-compose.yml` = `7be25a19bb7966d0f956066aa4fc3640b2b04010`
  - `services/elevator-service/Dockerfile` = `38b346cd7484dd03817e0359a5665cb7f4b565d7`
  - `services/elevator-service/README.md` = `56d97dc0023482bad82eddcdd4ec09b92195c451`
  - `services/elevator-service/app.py` = `d3fcf9ca3ebeadbd4a5a85ca85b11d077f896956`
  - `frontend/src/App.vue` = `62c75f643de706b007834851acc3c87fc7f8ad78` (ì›ê²© blob ë¶€ìž¬ í™•ì¸)
  - `gateway/src/main/java/com/workaround/platform/gateway/PlatformGatewayApplication.java` = `e1730f304579d716729ee6d1a0037f060af9b262`
- ì´ í‹°ì¼“ì˜ code-only draft PR íŒ¨í‚¤ì§• ëª©í‘œëŠ” ë‹¬ì„±ëìœ¼ë¯€ë¡œ, ë‹¤ìŒ ì˜¤ì¼€ìŠ¤íŠ¸ë ˆì´í„°ëŠ” ì¼ë¶€ íŒŒì¼ë§Œ ë‹´ê¸´ ëŒ€ì²´ PR ì„ ìƒˆë¡œ ë§Œë“¤ì§€ ì•ŠëŠ”ë‹¤.
- ë‹¤ìŒ ê²€í†  ì´ˆì ì€ `gateway` Java/Maven compile, `gateway` Docker build, ì—˜ë¦¬ë² ì´í„° ì œì–´ API ë³´ì•ˆ/ê¶Œí•œ ì •ì±… ì •ë¦¬ ì—¬ë¶€ë‹¤.
