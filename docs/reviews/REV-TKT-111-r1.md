문서 상태: 작성완료

# REV-TKT-111-r1 — 홈(환승 홀) 노선도·목록 (PM 판정: **통과 → finished**, r14 기준)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: Pages base build 그린(56 modules), node 16/16 + junction 2/2. 구현자 브라우저 회귀 22/22 인정.
- 실화면(localhost:7010 → 환승 홀, 390/1440): `lines.js` 3노선(기록선 B·V / 실험선 A·S·D·P / 기지선 W·R)·8역 구조, 방사형 SVG(C 심볼 환승 홀, 노선 3색, 큰 역 배지, 데스크톱 작은 역·이름, D·P 점선), 모바일 라벨 최소 11.8px·overflow 0, 좌 지도·우 목록 2단, 목록 = 노선 룰·hairline·인라인 서브링크. 중복 안내 문단 제거로 지도가 주인공. r14 목업 = 스펙 충족.
- 기준 변동 대응(r13→r14) 정확 — `[구체화 질문][해결]` 인정.
- 조건: D-015 안 F(r14)는 PO 최종 확인 대기 — 형태가 바뀌면 후속 티켓. 노선명은 잠정(기록선·실험선·기지선), 데이터 한 곳(lines.js)이라 교체 비용 최소.
- 커밋 범위: `App.vue`, `components/JunctionMap.vue`, `data/lines.js`, `styles.css`, `components/JunctionMap.e2e.mjs`, `data/junction.test.mjs`.
