문서 상태: 작성완료

# TKT-215 `[콘텐츠]` 자취 밥상 메뉴 늘리기 — 세트 13 → 30 안팎 (TKT-212 뒤)

- 상태: finished · **P1 · v0.8.3** · 담당: dev 서브에이전트(Sonnet, 콘텐츠 위임 U-37) · 의존: **TKT-212 finished**(새 태그 체계로 작성) · 브랜치 `codex/v0.8.3`.
- 근거: PO 2026-10-25 「이참에 메뉴 좀 다양하게 넣어줘」(앞선 TKT-206 의 "개수" 해석을 이번엔 PO 가 직접 요청).
- scope: `frontend/src/components/Pantry.vue`(대안 라벨 한 곳), `frontend/src/data/pantry/sets.js`·`dishes.js`(추가만 — 기존 문구 수정 금지), 필요 시 `Pantry.e2e.mjs`·`pantry.test.mjs` 기대값(계산 근거와 함께).

## 완료 조건
1. [x] 세트 17개 이상 추가(합 30 안팎), 요리는 필요한 만큼. 스키마·톤 그대로. **태그는 TKT-212 체계(36칩)만**, 시간 태그는 자동 계산이라 쓰지 않는다.
2. [x] 다양성: 한식 외 양식·일식·중식·동남아·분식 각 2세트 이상 / 15분 이내 5+ · 30분 이상 3+ / 3천원 이하 3+ · 1만원 이상 2+ / 재료 태그(돼지고기·닭·생선·회·계란·두부·김치·면·채소·국물) 각 3세트 이상 / 목적(해장·다이어트·손님·월급날·한잔)·때·날씨 각 2세트 이상 / 술 7종 각 2세트 이상. **닭 + 사케 세트 1개**(닭꼬치·닭구이 등).
3. [x] 문구 규칙: mood·quip 한 줄, 출처 없는 사실 단정 금지, `alt` 술 이름 0, 가격은 2026 한국 마트 기준 대략값.
4. [x] 태그 2개 조합 일치 비율 전/후 기록(212 직후 값 대비). 다양성 기준 표 자체 점검.
5. [x] 대안 줄 라벨 `10분 대안` → `빠른 대안`(시간 칩이 `15분 이내` 로 바뀜, REV-212 PM 의문) — `Pantry.vue` 문구 한 곳 + 해당 E2E.
6. [x] `npm --prefix frontend run e2e:all` 그린, unit(참조 무결성·칩 밖 태그 0·해장+술 0 포함), `git diff --check`, 375 캡처 2장(날짜를 바꿔 새 세트가 오늘의 한 상으로) `/private/tmp/tkt215/`.

## 구현 내역
- 세트 18개 추가(합 31), 요리 20개 추가(합 45). 기존 13세트·요리 문구 수정 0(추가만). 시간 태그는 tags 에 쓰지 않음.
  - aglio-olio 알리오올리오 15분(양식·면·와인·15분·3500) / steak-payday 월급날 팬 스테이크(양식·와인·30분·14000) / buta-don 부타동(일식·돼지고기·하이볼·20분) / yakitori-sake 닭꼬치와 사케(일식·닭·사케·25분) / salmon-don 연어 덮밥(일식·생선·회·하이볼·10분·11000) / jaru-soba 자루소바(일식·면·더운날·사케·15분)
  - mapo-tofu-bowl 마파두부 덮밥(중식·두부·하이볼) / tomato-egg-light 토마토 계란볶음(중식·다이어트·무알코올·12분·3000)
  - pad-thai-night 볶음쌀국수(동남아·맥주) / pho-hangover 쌀국수 한 그릇(동남아·닭·해장·무알코올)
  - tteokbokki-night 야식 떡볶이(분식·맥주) / eomuk-tang-night 어묵탕(분식·소주·3000) / egg-toast-5min 계란 토스트(분식·무알코올·10분·2500)
  - jjambbong-hangover 해장 짬뽕라면(해장·무알코올·10분·3000) / kimchi-bokkeum-night 김치볶음밥 야식(맥주·12분·2500) / dakdoritang-sunday 닭도리탕(닭·소주·40분) / kimchi-jjim-rain 돼지고기 김치찜(막걸리·40분) / curry-sunday 일요일 카레 한 솥(맥주·35분·도시락)
- 새 요리: aglio-olio·green-salad·pan-steak·grilled-veg·buta-don·miso-soup·yakitori·salmon-don·jaru-soba·mapo-tofu·tomato-egg-stirfry·pad-thai·pho-style·tteokbokki·eomuk-tang·egg-toast·gyeran-jjim·dakdoritang·kimchi-jjim·curry-rice(20개).
- `Pantry.vue`: 대안 라벨을 `빠른 대안` 고정(삼항 제거, 한 곳). E2E 기대 `10분 대안`→`빠른 대안` 1곳. 닭+사케 세트가 생겨 0건 테스트 조합을 `닭+막걸리`(닭 세트 중 막걸리 없음)로 교체, unit 도 같은 이유로 갱신 + 닭+사케 ≥1 단언·다양성 하한 테스트 추가.
- 가을(오늘 10-25) 점수: 날짜 점수가 `when` 태그 일치 수라 기존 세트만 `autumn` 을 가지면 가을철 새 세트가 한 번도 안 뽑힌다. 새 따뜻한 세트 6개(pho·dakdoritang·kimchi-jjim·curry·eomuk·mapo)의 `when` 에 `autumn` 추가. 10~11월 60일 중 새 세트 오늘의 한 상 약 34일(전엔 0일).
- 공유 파일: 없음(App.vue·시뮬은 다른 작업자 변경, 건드리지 않음). design/pantry-spec.md 의 `10분 대안` 표기 2곳은 불가침이라 미수정 — PM 갱신 필요.

## 다양성 자체 점검 (31세트, 시간 태그 자동)
- 요리 계통(새 세트): 양식 2(알리오올리오·스테이크) / 일식 4 / 중식 2(마파두부·토마토계란) / 동남아 2(팟타이·쌀국수) / 분식 3(떡볶이·어묵탕·계란토스트) — 기준 각 2 이상 충족.
- 시간: 15분 이내 14 / 25분 이내 11 / 30분 이상 6 (기준 5+/3+). 가격: 3천원 이하 8 / 1만원 이상 3 (기준 3+/2+).
- 재료: 돼지고기 9·닭 5·생선·회 3·계란 11·두부 6·김치 6·면 8·채소 25·국물 12 (각 3+). 목적: 해장 3·다이어트 3·손님 6·월급날 5·한잔 20. 때: 비오는날 5·더운날 4·추운날 11·야식 11. 술: 맥주 8·소주 10·막걸리 4·하이볼 4·와인 3·사케 4·무알코올 5 (각 2+). 닭+사케 = yakitori-sake 1.
- `alt` 술 이름 0: unit(`alt` 정규식 전수) 통과.

## 검증
- `E2E_WORK_DIR=/private/tmp/tkt215-e2e npm run e2e:all`: pass 99 / skip 18 / fail 0, Pantry.e2e 10/0. 로그 `/private/tmp/tkt215-e2e.log`. (`autumn` 점수 조정 뒤 Pantry.e2e 만 재실행 10/0.)
- unit `node --test $(find src -name "*.test.mjs")`: 40 pass / 0 fail. `git diff --check` 클린.
- 태그 2개 조합 일치 비율(630쌍 중 1세트 이상, 저장소 밖 스크립트 `/private/tmp/claude-501/s215/stats.mjs`): 212 직후 387/630 = 61.4% → 이번 445/630 = 70.6%.
- 캡처(375): `/private/tmp/tkt215/pantry-curry-375-dark.png`(2026-10-25 → 일요일 카레 한 솥, 빠른 대안 `10분 계란 볶음밥`), `/private/tmp/tkt215/pantry-eomuk-375-light.png`(2026-11-05 → 어묵탕 한 냄비, 빠른 대안 `계란 토스트`). 가로 overflow 0(스크립트 측정), 대안 라벨 `빠른 대안` 확인.
- 관찰(UX): 빠른 대안 행의 부제는 `10분 · 약 2,500원`(실제 분) 이라 라벨과 어긋나지 않음. 15분 이내 칩 + 라벨 `빠른 대안` 정합.

## 질문/에스컬레이션
- 없음.

## 리뷰 기록
- r1 **통과 → finished** (PM, 2026-10-25) — `docs/reviews/REV-TKT-215-r1.md`.
- 없음.
