문서 상태: 작성완료

# REV-TKT-143-r1-draft — 최종 UX B1(카드 면 제거)+I1(오늘 CTA 목적지 보존) (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-09-15. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: TKT-143(UX-TONE-FINAL B1-a/B1-b/I1, codex-8 지적 반영).

## 요약 권고: **통과 (블로커 0)**

## 실행 검증

- `pwd`/branch(`codex/v0.7.0-tone`) 확인.
- Advisor `npx vitest run` — **81/81 통과**(14 files). `npm run build`(root)/Pages-base(`/workaround.co.kr-platform/advisor/`) — **각 110 modules 통과**.
- `npx playwright test e2e/final-ux-b1-i1.spec.ts` — **5/5 통과**: 375/1440×다크/라이트 `.flight-card` 면 제거(한 줄 행) 4건 + 오늘 독서 CTA 목적지·문맥 보존 1건.
- Advisor 전체 `npx playwright test`(46개 spec 전부) — **46/46 통과**(TKT-138 검증과 공유 재확인).
- 메인 `ToneTools.e2e.mjs`(root 빌드, 자체 호스팅) — **12/12 통과**: 기존 10개 회귀 + Runtime 배포 레일 신규 2조합(375/1440) 포함.
- 메인 unit 21/21, root/Pages-base build 각 49 modules — 공유 스위트 재확인.
- 콘텐츠 불가침 파일(`sampleContent.js`·`sampleProjects.js`·`courseVienna1900.js`) — `git diff --stat`에 나타나지 않음, 무수정 확인.

## 완료 조건 대조

1. **`.flight-card`·`.path-steps` 면/외곽선/radius 0, 4환경** — `final-ux-b1-i1.spec.ts`의 4개 서브테스트(375/1440×다크/라이트)가 정확히 이 computed 값들을 단언, 전부 통과.
2. **오늘 CTA → 추천 카드 제목 일치, `from` 보존** — 해당 스펙의 5번째 테스트("오늘의 독서 CTA는 추천 제목과 출발 문맥을 그대로 연습 판에 전달한다") 통과. `TodayPage.surfaceLink()`가 `/games/practice/reading/<cardId>` 직접 링크로 바뀐 것을 `git diff`로 코드 레벨 확인 — 기존 `/games?card=…` → `/learn#practice` 리다이렉트의 query 소실 경로를 우회하는 설계가 실제로 그렇게 구현됨.
3. **기존 Advisor E2E·ToneTools 그린, build** — 위 46/46, 12/12로 확인.

## Runtime 배포 레일(B1-b) 육안 확인

`ToneTools.e2e.mjs`가 자동으로 번호(01~05)·hairline·overflow 0을 확인하므로 별도 스크린샷 없이 코드+테스트 결과로 갈음했다 — pill 제거 후 순서 목록으로 바뀐 것은 `git diff`상 `styles.css`의 `.deploy-rail` 관련 규칙 변경으로 확인.

## 상태 제안 (판정은 PM)

블로커 0. **finished 전환 권장.** (같은 회차에서 검증한 TKT-138에 [블로커] 1건 있음 — 공유 파일(`styles.css`) 커밋 시 TKT-138 재작업분과 함께 묶이는 범위인지 PM 확인 필요.)
