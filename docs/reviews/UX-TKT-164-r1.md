문서 상태: 작성완료

# TKT-164 UX 소급 검수 초안 r1

- 작성: codex-8 · 2026-10-05 KST. **판정은 PM**. 9월16일 finished 판정을 변경하지 않는 보충 UX 검수다. 중단되어 있던 초안을 이번에 실제 렌더로 완결했다.
- **[블로커]0 / [중요]1 / [제안]0.** TKT-164 대상인 상단바 넘침은 재현하지 못했고 저장 실패 문구도 온전히 보였다. 중요1건은 저장 실패→백업 흐름에서 발견한 기존 동작의 후속 의견이며 말줄임 수정의 회귀로 판단하지 않는다.
- 고정본: `/private/tmp/codex8-164-q7n3yw1w/frontend`. 직전178 검수의 안정 스냅샷에서 복사해 Pages-base 재빌드했다. 진행 중182 앱 변경을 섞지 않았다. `WritingStudio.vue`·`staticWritingState.js`는 종료 시 현재 원본과 동일하다. 새 [review-source-sha.json](UX-TKT-164-r1-assets/review-source-sha.json)이 이번 검수 기준이며, 기존 source-sha.json은 9월 중단 시점 기록이다.

## 상단바 수정 확인

375×812·1440×900 × 다크/라이트에서 실제 저장 중→저장됨→저장 실패→안내→백업 차단→복구→백업 성공을 관찰했다. 검수용 초안과 Storage.setItem의 QuotaExceededError 주입만 사용했다.

- `frontend/src/components/WritingStudio.vue:641`의 min-width:0·overflow:hidden·ellipsis가 적용된다. 모바일 저장 칸 clientWidth61px / 저장됨 시각 문구 scrollWidth62px로 **상태 칸 안에서만 말줄임**한다. `.writing-room`·`.page-scroller`·html·body의 가로 넘침은 모든 관측 상태에서0이다.
- `:38` 상태 카피와 `:426` aria-live 상태 영역에서 **저장 중…·저장 실패는 말줄임 없이 보인다**. 저장 실패 상태에도 입력은 남는다. 데스크톱은 저장됨 시각도 전체 표시한다.
- 모든 가시 상단바 버튼이 바 경계 안이고 최소40×40px다. 도움말을 Esc로 닫으면 ‘저장 안내와 백업’ 버튼으로 포커스가 돌아온다. 도움말 내용과 실패/성공 안내도 화면 내에 표시된다.
- 근거: [375 dark 저장됨](UX-TKT-164-r1-assets/375-dark-saved.png), [375 dark 실패](UX-TKT-164-r1-assets/375-dark-error.png), [375 light 실패](UX-TKT-164-r1-assets/375-light-error.png), [1440 dark 실패](UX-TKT-164-r1-assets/1440-dark-error.png), [1440 light 실패](UX-TKT-164-r1-assets/1440-light-error.png), [metrics](UX-TKT-164-r1-assets/metrics.json).

## [중요] I1 — 저장 실패를 해결해야 백업할 수 있어, 실패 중 입력 보존 동선이 막힌다

**재현**: 초안 작성 → 브라우저 저장 실패 유도 → 상단 ‘저장 실패’ → ? ‘저장 안내와 백업’ → ‘내 기록 백업’. 네 환경 모두 다운로드0건이며 **‘저장 실패를 해결한 뒤 다시 시도해 주세요.’**만 나온다. 안내 안에 해결 방법·현재 글 복사·별도 내려받기 동작이 없어 사용자가 기록을 보존하려고 들어온 곳에서 다음 행동을 정하기 어렵다. 현재 입력이 즉시 사라진다는 뜻은 아니며, 본문은 남아 있고 수동 선택/복사는 가능한 상태다.

- 코드: 고정본 `frontend/src/App.vue:2128` backupLocalWriting은 dirty 초안 flush 실패 시 다운로드 전에 return한다(`:2131` 안내). `frontend/src/staticWritingState.js:23` 백업 구성은 저장소를 읽는다. `frontend/src/components/WritingStudio.vue:626` 도움말은 설명·백업 버튼·상태 문구만 제공한다.
- 화면: [375 dark](UX-TKT-164-r1-assets/375-dark-backup-blocked.png), [375 light](UX-TKT-164-r1-assets/375-light-backup-blocked.png), [1440 dark](UX-TKT-164-r1-assets/1440-dark-backup-blocked.png), [1440 light](UX-TKT-164-r1-assets/1440-light-backup-blocked.png).
- **[디자이너 의견]** 실패 안내에 ‘현재 글 복사’ 또는 메모리의 최신 입력을 포함하는 임시 파일 내려받기를 제공하고, 저장된 기록 백업과 구분하는 후속 검토를 제안한다. 저장소를 지우는 행동을 먼저 유도하지 않는다. 구체적인 백업 계약과 후속 티켓은 PM 결정 사항이다.
- 대조: 오류 주입을 해제하고 새 입력을 저장한 뒤에는 네 환경 모두 JSON 다운로드 성공·‘백업 파일을 내려받았습니다.’가 표시됐다([375 light 성공](UX-TKT-164-r1-assets/375-light-backup-success.png)). 따라서 브라우저 다운로드 자체의 장애와 구분된다. 내려받은 파일의 내용 전체 검증은 이번 보충 캡처에서 하지 않았고 기존13건 회귀에 백업 계약 검증이 포함된다.

## 고정 UX 체크리스트

| 기준 | 이번 범위 관찰 |
|---|---|
| 주인공1개·3초 내 인지 | 제목·본문 편집이 중심, 첫 화면에서 본문 입력 가능. |
| 면은 조작부에만 | 상단바에 새 카드 없음. 이번 최소 수정에서 면 추가 없음. 전체 사이트 톤 재검수는 아님. |
| 영어 섹션 간판0 | 글쓰기·글 도구·저장 안내는 한국어. H1/H2/H3은 기존 편집 기능 이름. |
| 노선색은 선·배지 | B 배지·밑줄 유지, 새 면 추가 없음. |
| 375 overflow0·타깃≥40px | 네 환경 모든 기록 상태 overflow0, 가시 상단바 버튼 최소40×40px. |
| 카피 정합 | 저장 성공·실패 상태가 구분된다. 실패 후 다음 행동 안내 부족은 I1. |
| 지하철 배지·스플래시 시간 | B 배지 유지. studio 직접 진입 검수로 스플래시는 범위 밖, 별도178 보고서 참조. |
| 라이트 테마 | 375/1440 상태·도움말·백업 결과 직접 확인. |

## 검증·인계

- 격리 Pages-base build 성공55 modules. 같은 빌드 WritingStudio E2E **13/13 통과**(15.15초). 이번은 UX 소급 검수로 PM/구현자의 기존 반복 게이트를 재판정하지 않는다.
- 네 환경×8상태 **32캡처**, pageerror0, 오류 전후 입력 보존·복구 후 저장·백업 성공 확인. [재현 스크립트](UX-TKT-164-r1-assets/capture.cjs)는 스냅샷 루트에 놓고 frontend/dist를 로컬 서버로 제공한다. 최초 스크립트의 ‘실패 상태에서도 다운로드’ 기대는30초 타임아웃으로 어긋나 원인을 확인한 뒤, 차단 메시지와 복구 후 성공을 분리해 네 환경을 다시 실행했다. 최종 metrics·캡처는 재실행 결과다.
- [소스 비교](UX-TKT-164-r1-assets/source-comparison.json): 현재 App.vue·styles.css 등은 후속182가 변경 중이다. 이번 보고서 파일:라인은 고정본 기준이다. 앱 소스·목업·티켓·보드·스펙 수정 및 commit/push 없음. 로컬 서버·브라우저 종료.
- 실제 VoiceOver/WebKit은 미검증이다. TKT-161의 기존 네이티브 앱 제어 시간 초과는 이번 실행에서 재시험하지 않았다.
- PM 수신함·history 인계. 현재 미검수 need_review 없이182가 구현 중이므로 임시1분을 끝내고 기존 자동화를1시간으로 복귀한다. 최근3시간 새 진행이 없으면 후속 실행에서24시간으로 조정한다.
