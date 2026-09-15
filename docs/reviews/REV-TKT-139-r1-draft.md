문서 상태: 작성완료

# REV-TKT-139-r1-draft — 홈 노선도 기지선·예정 역 흐림 + 같은 화면 토스트 (리뷰어 초안, 판정은 PM)

> 작성: 리뷰어(Claude Sonnet 5), 2026-09-15. **이 문서는 초안이다 — finished 전환·커밋은 PM 몫.**
> 대상: TKT-139(D-021, 기지선/예정 역 흐림 + 토스트). 의존 TKT-136 finished 확인.

## 요약 권고: **통과 (블로커 0)**

흐림·토스트 모두 자동 게이트와 라이브 조작으로 직접 확인했다. 딥링크는 그대로 열리고, 노선도·목록에서의 진입만 토스트로 막는 설계가 실제로 그렇게 동작한다.

## 실행 검증

- `pwd`/`git branch --show-current` = `codex/v0.7.0-tone` 확인 후 `frontend/`에서 실행.
- `git diff --stat`로 scope 확인: `lines.js`·`JunctionMap.vue`·`styles.css`·`JunctionMap.e2e.mjs`만 해당(styles.css는 TKT-138 hit-area 변경과 공존, 티켓 자기 진술과 일치).
- `frontend/src/data/lines.js`에서 `access:` 필드 직접 확인 — W·R(기지선) `access:'protected'`, D·P·화이트채플(실험선 예정) `access:'planned'`. 데이터 계약이 티켓 설명과 정확히 일치.
- 메인 Node unit 21/21, root/Pages-base build 각 49 modules — TKT-138 검증과 동일 스위트로 재확인, 그린.
- `JunctionMap.e2e.mjs`(Pages-base 자체 호스팅) — **4/4 통과**(375·1440 × 다크·라이트).
- **라이브 조작 확인**(`vite preview --outDir dist-base --base=/workaround.co.kr-platform/`, 375px): 환승 홀에서 기지선(Runtime·Work)·예정 역(발견·취향)이 시각적으로 흐리게 렌더링되면서도 이름·노선이 여전히 읽힘. `find`로 실제 접근성 이름 확인 — `button "Work Manager · 보호 구역 · 준비 중"`. 클릭 시:
  - 하단 고정 한 줄 토스트 `보호 구역 · 준비 중`이 표시됨(스크린샷으로 직접 확인).
  - `location.pathname`이 `/workaround.co.kr-platform/`로 **불변** — 페이지 이동이 일어나지 않음을 직접 확인.
  - 팝업/모달 없이 같은 화면 안에서 처리됨(스크린샷상 배경 지도·목록이 그대로 보임).

## 완료 조건 대조

1. **흐림 + 대비 유지, 375/1440×다크/라이트** — E2E 4/4가 자동으로 3:1/4.5:1 실측을 포함(코드 확인), 라이브에서 다크 테마 육안 확인 추가.
2. **클릭·Enter 시 URL 불변, 토스트 1개, 2.5초 제거** — E2E에 포함, 라이브에서 URL 불변·토스트 노출까지 직접 재현.
3. **기존 JunctionMap E2E·136 검사(겹침 0) 그린, build** — 4/4 안에 포함되어 통과, build 49 modules 확인.

## [참고] 배치 검증 중 발견한 무관 이슈

같은 검증 회차에서 `VoyageRouteMap.e2e.mjs` 2건이 날짜 종속 하드코딩("740km", 시계 미고정)으로 실패하는 것을 발견했다 — TKT-139의 diff와는 무관(voyage 파일 무수정 확인)하며, 상세 원인·재현은 `REV-TKT-138-r1-draft.md`의 [제안] 항목에 기록했다. 여기서는 중복 기술하지 않는다.

## 상태 제안 (판정은 PM)

블로커 0. 완료 조건 전부 코드+라이브 조작으로 확인. **finished 전환 권장.**
