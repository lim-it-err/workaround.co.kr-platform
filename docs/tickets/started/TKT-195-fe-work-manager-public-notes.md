문서 상태: 작성완료

# TKT-195 `[FE]` Work Manager 잠금 해제 + 공개 "운영 노트" 화면

- 상태: ready · **P1** · 담당: dev 서브에이전트(**Sonnet**) · 의존: **TKT-189 finished 뒤 착수**(같은 `App.vue`·`lines.js`·`JunctionMap`). 브랜치 `codex/v0.8.0-live`. **UX 1순위.**
- 근거: PO 2026-10-25 「현재 이 얘기들을 홈페이지 관리창에다가 내용 올려. 누가 봐도 되니까 그냥 올려도 돼. 기존에 잠금은 풀어.」 → D-033.
- 콘텐츠: `frontend/src/data/workNotes/operatingModel.js`(PM 작성, **불가침** — 문구 수정 금지, 이상하면 `[반박]`).
- scope: `frontend/src/App.vue`(work 페이지), `frontend/src/staticRouting.js`(정적 잠금 목록에서 `work` 제거 — 이 한 줄만), `frontend/src/data/lines.js`(기지선 W 역 상태 문구·잠금 표시), `frontend/src/components/JunctionMap.vue`(잠금 판정이 W 를 막지 않게, 필요 시), 신규 `frontend/src/components/WorkNotes.vue` + `WorkNotes.e2e.mjs`, 영향받는 기존 E2E 기대값, `frontend/src/styles.css`(새 컴포넌트 스타일).

## 완료 조건
1. [ ] **잠금 해제**: 정적 공개본(Pages base)에서 환승 홀 W 역·노선 목록 `Work Manager` 행이 흐림·`보호 구역`·접근 토스트 없이 열린다. W 상태 문구는 `운영 노트`. Runtime Board 는 기존 잠금 유지(이 티켓 범위 밖).
2. [ ] **운영 노트가 주인공**: `/work` 첫 화면은 `OPERATING_NOTES` 를 렌더 — 절마다 제목·상태 배지(`확정`/`제안`/`할 일`)·한 줄 요지·흐름(`flow` 가 있으면 화살표로 이어진 한 줄, 375 에서는 세로)·요점 목록. 맨 위에 갱신일(`OPERATING_NOTES_UPDATED`). 톤 원칙: 면은 조작부에만, 주인공 1, 노선색(W)은 선·배지에만, 영어 간판 0(제품·서비스명 `Cloudflare`·`GitHub`·`Tailscale` 등 고유명사는 허용).
3. [ ] **실행 기능은 그대로 보호**: 기존 검토 대기·버전·명령 실행·인증 영역은 운영 노트 **아래**로 내린다. 정적 공개본에서는 백엔드가 없으므로 그 영역은 `집 PC 연결 시 사용` 한 줄로 접힌다(데이터 요청 0, 오류 0). 라이브(root base, gateway 있음)에서는 기존 동작·비밀번호 게이트 유지 — **명령 실행 권한은 풀지 않는다.**
4. [ ] **주소**: `/work` 직접 진입·새로고침이 정적 공개본에서 환승 홀로 튕기지 않고 운영 노트를 연다.
5. [ ] **E2E**: `WorkNotes.e2e.mjs` — 375/1440 × 다크/라이트에서 절 10개 제목 렌더, 상태 배지, 가로 overflow 0, 정적 모드 API 요청 0, W 역 클릭 → `/work`. 기존 E2E 중 W 잠금을 전제한 기대값(JunctionMap·staticRouting·ToneTools 등)은 새 상태에서 계산한 값으로(이유 기록).
6. [ ] 게이트: root/Pages-base build, 메인 E2E 전체(블로그 skip 포함 현재 기준), unit, `git diff --check`, 375/1440 × 다크/라이트 캡처 `/private/tmp/tkt195/`.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
