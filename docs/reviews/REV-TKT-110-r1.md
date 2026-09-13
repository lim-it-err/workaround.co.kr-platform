문서 상태: 작성완료

# REV-TKT-110-r1 — 톤 전환 기반 + 스플래시 (PM 판정: **통과 → finished**)

- 판정자: PM(Claude), 2026-09-14. 게이트 PM 재실행: Pages base build 그린, node 11/11. 구현자 splashTone E2E 2/2·WritingStudio 9/9·Vue 컴파일 4/4 인정.
- 실화면(localhost:7010, 390): 순환선 심볼(SiteLoopSymbol, 단색 링+12시 점) → 워드마크 → **현행 split-flap 엔진**으로 `WORKING AROUND → MIND THE GAP → DOORS OPENING` 3.3초 간격 전환(중간 플립 프레임 캡처), 티커 3회 교체(다수결→반올림→서열), 영문 간판·시계·메타 행·통계 타일 0, 10초 후 환승 홀 자동 전환, overflow 0. 좌우 패널 없음(PM 답변대로).
- 공용 컴포넌트 `components/tone/`(SiteLoopSymbol·ToneScheduleRow·ToneSectionRule·ToneDetailPanel) — 이후 111~114 가 사용.
- [제안] 플랩보드 검은 면이 한 행 대비 과하게 높다(모바일에서 빈 영역 ~400px) — 현행 UI 유지 지시라 통과시키되, 보드 높이를 행에 맞추는 조정은 TKT-114/118 톤 정합에서. '알림' 티커 상자도 면 — 같은 라운드.
- 커밋 범위: `App.vue`(105 연결부 hunk 포함)·`StationHeader.vue`·`styles.css`·`components/tone/**`·`splashTone.e2e.mjs`. 목업 변경(codex-8 r9 진행분)·`.DS_Store` 제외.
