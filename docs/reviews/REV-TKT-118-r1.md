문서 상태: 작성완료

# REV-TKT-118-r1 — 라이트 테마 톤 토큰 매핑 (PM 판정: **통과 → finished**, [중요] 1 → TKT-119)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: Pages base build 그린(48 modules), node unit 20/20. 구현자 Chromium 10/10·9/9·8/8·4/4 인정.
- 실화면(localhost:7010, `data-theme=light`, 1440·390): 여행 노선도·환승 홀·블로그 허브·Work·스튜디오 — 바탕 off-white(rgb 237,241,246), hairline 만으로 구분, 면은 조작부만, 노선색은 선. 가로 overflow 0. 토큰 대비 실측(바탕 대비): `--text` 14.46 · `--muted` 5.06 · `--safety` 5.00 · `--line-t-text` 5.17 · `--line-p-text` 5.08 — 완료 조건(보조 글자·배지 4.5:1) 충족.
- **[중요] W 노선색이 글자로 쓰인 곳 4.13:1** — 환승 홀 `기지선` 라벨(SVG 15px·목록 12.8px)과 `junction-route-badge` `W`(11.2px)가 `--line-w`(#00863E) 를 글자색으로 써서 4.5 미달. 텍스트 변형 토큰 `--line-w-text`(#00793A) 가 이미 있으므로 `styles.css:1144` 류의 `color: var(--line-w)` 를 `--line-w-text` 로 바꾸면 해소. 완료 조건(배지 4.5)은 충족했고 큰 글자 기준(3:1)은 넘으므로 반려 대신 **TKT-119(접근성)** 에 항목 추가.
- [제안] 블로그 목록의 `roundel line-b` 흰 글자는 붉은 배지 위라 정상(계산기 오탐).
- 커밋 범위: `frontend/src/styles.css`.
