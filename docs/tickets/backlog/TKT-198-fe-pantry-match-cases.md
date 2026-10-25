문서 상태: 작성완료

# TKT-198 `[FE]` 자취 밥상 조합 판정 다양화 — 어울리지 않아요·아직 없어요·조건 많아요

- 상태: backlog · 대상 **v2.0**(D-034) · 담당: dev 서브에이전트(Sonnet) · 스펙 `design/pantry-requests-spec.md` §2·§3.
- 선행(PM 콘텐츠): `frontend/src/data/pantry/` 에 `PANTRY_MISMATCHES`·판정 문구·닭 + 사케 세트 추가.
- scope: `frontend/src/components/Pantry.vue`·`Pantry.e2e.mjs`, `frontend/src/data/pantry/index.js`(판정 함수만 — 콘텐츠 배열은 PM), `styles.css`.

## 완료 조건
1. [ ] 케이스 A~F 판정 함수(단위 테스트 각 1건 이상) — 가까운 상은 고른 재료를 담은 상에서만.
2. [ ] 화면: C 이유 + 바꿀 칩, D 뺄 칩, E·F 문구 구분. 요청 버튼은 v2 게이트 전까지 숨김(플래그).
3. [ ] E2E: `닭+사케`(F 또는 콘텐츠 추가 후 A), `해장+소주`(C), `도시락+회`(C), 태그 4개 0건(D), 없는 재료(E). 375/1440 × 다크/라이트, 술 이름 0(무알코올) 회귀 없음.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- 없음.
