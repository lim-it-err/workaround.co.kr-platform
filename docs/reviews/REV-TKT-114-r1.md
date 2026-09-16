문서 상태: 작성완료

# REV-TKT-114-r1 — 스튜디오 정합 + 격납고·Work·Runtime 톤 전환 (PM 판정: **반려 → started**, 블로커 2)

- 판정자: PM(Claude), 2026-09-14. PM 재실행: Pages base build 그린(48 modules), node unit 20/20. 구현자 ToneTools Chromium 8/8·WritingStudio 9/9 인정. 게이트는 그린이나 **카피가 목업과 어긋나 반려** (판정 1순위 UX·가시성, 완료 조건 "카피는 목업 문구 그대로·영어 간판 0").
- 실화면(localhost:7010, 390·1440) 통과 수준: **스튜디오** — `.writer-page` x358·w720 중앙, 우측 `글 도구`(사진·H1·H2·H3·표 삽입) hairline 메뉴 x1098, 모바일은 `＋`/`⋯` 시트, 인라인 표 유지. **Work** — `검토 대기 0건` 히어로 + 검토·진행·대기 3행 + `보호 구역` 우측 한 마디, 상세 2개 접힘, overflow 0. 세 화면 모두 대문자 영어 간판 0.
- **[블로커 1] Runtime 상태 열이 API raw 값 그대로** — `degraded`·`unavailable`·`online`·`unknown` 이 4행 전부의 상태 열에 노출. 목업(`mockups/runtime.html`)은 `정상`/`지연` 한글 + 응답 시간(`82 ms`). 근거: `frontend/src/App.vue:874`(`status: runtimeState.value.ollama?.status || 'unknown'`)·`:881`(`status: node.availability`) → `:4537`(`{{ row.status }}` 직접 렌더). 재작업: 매핑 online/available/ok/healthy→`정상`, degraded→`지연`, unavailable/offline→`중단`, 그 외→`확인 중`; 응답 시간이 있으면 `정상 · 82 ms`, 없으면 상태만. 보조 줄의 소문자 식별자(`gateway`·`Ollama`·`local-control`)는 허용.
- **[블로커 2] 격납고 카피가 목업과 다름 — 영어 제품명 히어로** — 실화면 히어로 `Elevator Station`(34px 영어 간판)·행 `Taxi District Lab`. D-012(PO "제목명은 기믹으로")와 목업 행 문구(`멈춘 엘리베이터`·`심야 택시`)를 두고 영어 원명을 썼다. 목업 r1 의 히어로 "미스터리 트레인 시나리오"·행 "사라진 수하물"은 존재하지 않는 기능(부관 초안 오류)이라 그대로 못 쓰는 게 맞지만, 그 경우 **[구체화 질문]을 남겨야지 말없이 대체하면 안 된다**(AGENTS 규칙 8). PM 이 목업을 r2 로 정정했다(`mockups/simhub.html`): 히어로 = `멈춘 엘리베이터`(태그 `시스템 설계`, "재시도와 상태 복구를 설계합니다.", 버튼 `시작`), 행 = `심야 택시`(태그 `제품 판단`, "제한된 정보로 안전한 선택을 만듭니다.", 버튼 `시작`). 화이트채플 합류(TKT-107) 시 히어로 교체. 데이터의 `name`(`Elevator Station` 등)·딥링크 `/elevator` `/taxi`·Line 라벨은 건드리지 않고 **격납고 표시 카피만** 매핑한다. 시뮬 내부 화면 제목은 TKT-120 에서 같은 기믹명으로.
- [중요] Work 접힌 상세(`App.vue:4288` `tone-work-manager-details`) 내부는 구 보드 그대로라 `VERSION HEADER` 류 영어 눈썹 라벨이 펼치면 나온다. 첫 화면 밖이고 기능 보존 판단은 타당 → 이 티켓에서 손대지 않고 **TKT-128** 로 분리.
- [제안] 스튜디오 모바일 표 블록의 전폭 `표 삭제` 버튼 — 조작부라 허용하나 `⋯` 메뉴로 접으면 원칙 1 에 더 가깝다. 후속 선택.
- 재작업 범위: 블로커 1·2 + `ToneTools.e2e.mjs` 단언 갱신. 스튜디오·Work 는 재검증만. r2 는 need_review 로.
