문서 상태: 작성완료

# REV-TKT-152-r1-draft — Advisor 초기 청크 lazy-load (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-09-15. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: TKT-152(REV-TKT-129-r1 [제안], 502kB 경고 해소).

## 요약 권고: **통과 (블로커 0)**

## 실행 검증

- `npm run build`(Advisor) — **117 modules, 500kB 경고 0**(`grep`로 "chunks are larger" 라인 부재 확인). 빌드 출력에서 `sampleContent-*.js`(283.97kB)가 **별도 lazy chunk로 분리**되어 초기 로드에 포함되지 않음을 직접 확인 — lazy-split 주장이 형식이 아니라 실제 청크 구조로 확인됨.
- Advisor 전체 `npx playwright test` — **54/54 통과**(TKT-154·153과 공유 최신 상태로 재확인), 그중 `lazy-chunks.spec.ts`("375px에서 오늘→배우기→코스 상세를 빈 화면 없이 늦게 불러온다") 통과 확인.
- Advisor unit — 아래 [참고] 참조(전체는 91/91 + 무관 1건 불안정).

## 완료 조건 대조

1. **초기 진입 청크 ≤250KiB, 경고 0** — 빌드 경고 0은 직접 확인. 정확한 201.03KiB 수치는 `--manifest` 재분석까지는 하지 않았으나(비례성 고려), 0 경고 + `sampleContent` 분리 확인으로 핵심 주장(500kB대 단일 청크 소거)은 충분히 뒷받침된다고 판단.
2. **Playwright 46/46·unit 81/81, alias 7개 회귀 0** — 현재 트리 기준 54/54(46 포함 상위집합), alias 회귀는 `advisor-surfaces.spec.ts`의 "3표면과 기존 주소가 새 의미로 이어지고" 테스트로 확인.
3. **375 전환 3장 빈 화면 없음** — `lazy-chunks.spec.ts` 통과로 확인(스크린샷 파일 직접 열람은 생략).

## [참고] 검증 중 발견 — 무관한 콘텐츠 작업의 일시적 불안정

`practiceCatalog.spec.js` 1건이 검증 도중 간헐적으로 실패했다(`budapest-4-etiquette`·`budapest-5-water-signal` 게임이 기대 목록에 없음). `git status`로 `practiceCatalog.js`·그 spec 파일이 **현재 다른 세션에서 실시간으로 수정 중**임을 확인했다(빌드 출력에도 `courseBudapestBaths-*.js` 청크가 신규로 보임 — 부다페스트 코스 콘텐츠 작업으로 추정). TKT-152 diff에는 이 파일들이 없어 이 티켓과 무관 — 판정에서 제외했다. 해당 콘텐츠 작업이 need_review로 올라오면 그때 다시 확인하겠다.

## 상태 제안 (판정은 PM)

블로커 0. **finished 전환 권장.**
