문서 상태: 작성완료

# TKT-125 `[FE]` 경험↔배움 환승 — 여정 정차역 ↔ Advisor 미션 링크

- 상태: finished (2026-09-14, REV-TKT-125-r1 통과) · P1 (PO "환승시키기 마음에 들어") · 담당: codex-1 · 의존: TKT-109(여정 노선도), TKT-124(코스) — 둘 다 완료. 브랜치 codex/v0.7.0-tone.
- 스펙: `design/advisor-course-spec.md` §3, `design/voyage-route-map-spec.md` §4
- scope: `frontend/src/components/voyage/**`(정차역 행·시트), `frontend/src/data/voyages/**`(정차역 missions 필드), `services/advisor/frontend/src/modules/missions/pages/MissionPage.vue`(역링크 한 줄), 테스트

## 목표
V→A: 정차역에 `이걸로 미션 만들기 →`(코스/미션 딥링크). A→V: 미션 카드에 `이 미션의 정류장 ←`. 순환선 심볼 소형 아이콘, 면 없이. 정적 모드에서 두 앱이 다른 정적 번들이므로 **URL 딥링크**로만 연결(D-006).

## 완료 조건
벨베데레 정차역 → 비엔나 1900 코스 → 미션 → 정류장 복귀 왕복 E2E 1건, 링크 없는 정차역엔 표시 없음.

## 구현 내역 (2026-09-14, codex-1)

- 할슈타트·쇤브룬·벨베데레 정차역 데이터에만 `missions[]`와 안정적인 정차역 ID를 연결했다. 기존 1~4일차 독립 상세 세션 계약은 유지하고, 상세 세션이 없는 6·7일차는 기존 오전 계획 행에 정차역 메타만 결합한다.
- 정차역 시간표 행과 상세 시트에 소형 순환선 심볼 + `이걸로 미션 만들기 →`를 면 없이 표시하고, Pages base를 보존한 `/advisor/courses/vienna-1900` 정적 URL로 이동한다.
- 연결된 Advisor 코딩 미션에 `이 미션의 정류장 ←`를 추가했다. 역링크는 `/voyage#voyage-stop-*`을 거쳐 해당 일차를 선택하고 정차역 상세 시트를 바로 연 뒤 표준 `/voyage` URL로 정리된다.
- 잘못 인코딩된 정차역 hash는 조용히 무시하며, 연결 데이터가 없는 정차역에는 환승 링크 DOM을 만들지 않는다.

## 검증

- 메인 정적 단위 회귀: 20/20 통과(여행 콘텐츠 12/12, 독립 상세 세션 4개 계약, 정적 라우팅·저장 포함).
- Advisor unit: 14 files, 74/74 통과.
- Pages base build: 메인 48 modules, Advisor 110 modules 통과. 병합 스크립트에서 메인·Advisor 로컬 참조 및 fallback 검증 통과.
- 왕복 E2E: 375px dark·1440px light 2/2 통과. 벨베데레 → 비엔나 1900 → `v1900-f-belvedere-route` → 벨베데레 상세 복귀, 1일차 환승 링크 0개, 가로 overflow 0을 단언했다.
- 실렌더: 위 두 크기·테마의 Advisor 역링크와 여행 상세 시트 환승 링크를 직접 확인했다. `git diff --check` 통과. commit/push 없음.

## 남은 위험

- Safari/WebKit과 실제 GitHub Pages 배포는 미검증이다.
- Advisor 초기 청크 502.39kB 경고는 기존 성능 위험이며 이 티켓에서는 번들 경계를 바꾸지 않았다.

## PR 준비 메모

- 제목 초안: `[voyage] 여행 정차역과 Advisor 미션 왕복 환승 추가`
- 포함: 정차역 `missions[]`, Pages-base 코스 링크, 미션 역링크, hash 소비·상세 시트 복귀, 단위/왕복 E2E.
- 제외: 게임·시뮬 미션의 개별 역링크, 서버 API, 실제 Pages 배포.

## 리뷰 기록
- r1 (2026-09-14, PM): **통과 → finished**. `docs/reviews/REV-TKT-125-r1.md`. 병합 dist 왕복 E2E PM 직접 2/2.
