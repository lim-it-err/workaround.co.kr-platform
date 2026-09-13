문서 상태: 작성완료

# TKT-125 `[FE]` 경험↔배움 환승 — 여정 정차역 ↔ Advisor 미션 링크

- 상태: ready · P1 (PO "환승시키기 마음에 들어") · 담당: codex-1 · 의존: TKT-109(여정 노선도), TKT-124(코스) — 둘 다 need_review 시. 브랜치 codex/v0.7.0-tone.
- 스펙: `design/advisor-course-spec.md` §3, `design/voyage-route-map-spec.md` §4
- scope: `frontend/src/components/voyage/**`(정차역 행·시트), `frontend/src/data/voyages/**`(정차역 missions 필드), `services/advisor/frontend/src/modules/missions/pages/MissionPage.vue`(역링크 한 줄), 테스트

## 목표
V→A: 정차역에 `이걸로 미션 만들기 →`(코스/미션 딥링크). A→V: 미션 카드에 `이 미션의 정류장 ←`. 순환선 심볼 소형 아이콘, 면 없이. 정적 모드에서 두 앱이 다른 정적 번들이므로 **URL 딥링크**로만 연결(D-006).

## 완료 조건
벨베데레 정차역 → 비엔나 1900 코스 → 미션 → 정류장 복귀 왕복 E2E 1건, 링크 없는 정차역엔 표시 없음.
