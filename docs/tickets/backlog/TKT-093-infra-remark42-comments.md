# TKT-093
## 메타데이터
- 제목: 블로그 댓글 — Remark42 자가 호스팅 (로그인 기반)
- 우선순위: P2 / 상태: `backlog` (TKT-085 공개 ingress 뒤) / 담당: `[INFRA]`
- scope: `infra/**`, `frontend/src/**`(임베드 스니펫 위치만)
- 근거: 부관 보고 `reports/2026-08-18-comments-options.md` + PO 확정 "로그인은 맞아" (2026-08-18)
## 목표
Remark42 컨테이너를 compose 에 추가, Caddy 가 같은 오리진 `/comments/*` 프록시. **익명 비활성 — 로그인(이메일 또는 OAuth) 기반만.** 데이터·백업 호스트 볼륨. 블로그 글 상세에 임베드.
## 완료 게이트
- 로컬 compose 기동 → 로그인 후 댓글 작성/표시 왕복, 익명 차단 확인, 백업 파일 생성 확인. 비밀값 저장소 미포함
