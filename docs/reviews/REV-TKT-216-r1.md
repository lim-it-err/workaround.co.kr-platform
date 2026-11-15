문서 상태: 작성완료

# REV-TKT-216-r1 — 접근성 패치 (PM 판정: **통과**)

- 판정: PM(Claude Opus 5.5), 2026-11-15 · 구현: dev 서브에이전트(Sonnet 5.5) · 브랜치 `codex/v0.8.4`.

## PM 직접 실행
- unit `node --test` 46 pass / 0 fail.
- `npm --prefix frontend run e2e:all` **104 pass / 18 skip / 0 fail**(기준선 99 + 신규 5: Voyage 2·Pantry 3). 로그는 PM 스크래치(재현: 같은 명령, Advisor `node_modules` 링크 필요).
- `git diff --check` 통과. 캡처 375/1440 다크 4장 실확인(`/private/tmp/tkt216/`): 지도 점·라벨·색 변화 없음, 밥상 끝 칩 `한잔` 글자 전부 보임.

## 완료 조건 대조
1. I1 — `VoyageRouteMap.vue:1035`·`:1197` 숨은 입력 `tabindex="-1" aria-hidden="true"`. 버튼 클릭 → filechooser E2E. 충족.
2. I2 — 375 도시 hit 다각형 세로 45.6~50.7px, 이등분선 클리핑으로 겹침 0, ≥900 은 기존 bounding-box 유지(`display:none`). 충족.
3. I3 — `Pantry.vue` `@focusin` 에서 `:focus-visible` 일 때만 `scrollLeft` 보정. E2E 가 Tab/Shift+Tab 전 칩을 「칩 ⊂ 행」+ 중심 hit 로 판정(mask 단언 없음). 충족.
4. S2 — `Pantry.vue` 루트 `main` → `section`, main 1개 E2E. 충족.
5. 게이트 — 위와 같음. 충족.

## 지적
- [중요] 375 에서 도시 hit 가 짧은 구간 선(DAY 4 할슈타트→잘츠부르크)을 덮어 손가락으로 구간을 직접 누르기 어렵다. 일차 탭·키보드로는 같은 구간에 도달하므로 이번 통과를 막지 않는다. → v0.9 블랙 디자인에서 노선도 자체를 다시 그릴 때 「지도 아래 구간 목록」과 함께 정리(후속, 티켓은 v0.9 스펙에서 발행).
- [제안] 375 끝 칩 `한잔` 의 노란 포커스 링 오른쪽 몇 px 가 행 경계에서 잘린다(글자·칩 본체는 다 보임). 보정 여백 `inset` 6px → 링 두께만큼 키우면 해소. v0.9 칩 재설계 때.

## [PM 의문]
- 프라하 점 한가운데를 누르면 「프라하 복귀」가 열린다(기존과 같음). 같은 좌표 두 역은 v0.9 노선도에서 한 점 + 선택 목록으로 바꾸는 편이 자연스럽다.
