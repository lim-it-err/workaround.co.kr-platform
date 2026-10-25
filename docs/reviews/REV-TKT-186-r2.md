문서 상태: 작성완료

# REV-TKT-186-r2 — 스플래시 티커 멘트 복원 r2 (PM 판정: **통과 → finished**, [제안] 1)
- 판정자: PM(Claude), 2026-10-25. 구현자: dev 서브에이전트(Claude Sonnet, r1 과 같은 에이전트 재개). r1 지적 B1·I1 의 `→ 반영:` 확인.
- 게이트(직접 재실행): Pages-base build 56 · splashTone E2E **13/13**(12 + r2 신규 "문구 길이와 무관하게 제목·플랩 y·strip 높이 동일, 라벨 1줄, 다시 재생 ≤ 뷰포트") · unit 27/27 · `git diff --check` 통과.
- 실화면(직접): `r2-long1-375-dark.png` — 긴 문구 2줄, `알림` 라벨 1줄, 제목·플랩 위치가 `r2-short-375-light.png`(짧은 문구, 2줄 높이 안 세로 가운데)와 동일. r1 의 12px 점프 해소. 1440 은 1줄 유지.
- 범위 확인: `styles.css` 변경은 `.splash-ticker-strip .ticker-label`(flex none·nowrap) 과 480px 이하 `.splash-ticker-strip .ticker-copy`(2줄 높이 예약·세로 가운데) 두 선택자뿐. 풀 39개 = `01a4554^` 와 diff 0.
- 수용: 브레이크포인트 480(파일 관례) — 430~480px 에서 1줄 문구에 2줄 높이가 예약되는 24px 여백은 실기기 폭(390~430)에서 체감이 적어 수용.
- **[제안] S1 — 고아 줄**: 375 긴 문구 둘째 줄에 `중…` 만 남는다. `.splash-ticker-strip .ticker-copy { text-wrap: balance }` 1줄로 균형 분할 가능 → **TKT-187**(CSS 잔손질, Haiku 레인)에 REV-185 S1(자취 밥상 칩 행 스크롤 단서)과 묶음.
- `[PM 의문]`(PO): 티커 1.3초 — (a) 1.3초·첫 방문 4개(현재) (b) 1.5초·4개 (c) 플랩 박자 1.66초·3개+짧은 4번째. 권고 (a)/(b). 상수 1개라 언제든 바꿀 수 있다.
