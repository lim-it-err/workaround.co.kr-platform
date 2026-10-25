문서 상태: 작성완료

# REV-TKT-177-r1 — Pages 깊은 주소 200 — 경로별 index.html 복제 (PM 판정: **통과 → finished**)
- 판정자: PM(Claude Opus 5.5), 2026-10-25. 브랜치 `codex/v0.8.2`.
- 게이트(PM 직접): `npm run e2e:all`(TKT-159 러너) **97 pass / 18 skip(D-031 블로그·Studio) / 0 fail**, 185.6s · unit 29/29 · `git diff --check`.(staticRouting 5 — 200 단언 신규 1)
- 확인: Advisor 경로 복제본은 Advisor index(`<title>Developer Advisor`)로, 메인 경로는 메인 index 로. 잠금(`/runtime`·`/ets2/dev`)·운행 중단(`/blog*`·`/studio`)은 복제하지 않아 404 셸 폴백 유지.
- [제안] 경로 추출을 소스 정규식으로 하고 있어 라우팅 파일 형식이 바뀌면 깨진다 — 지금은 수용, 실패 시 빌드가 멈추므로(throw) 조용한 오류는 아님.
