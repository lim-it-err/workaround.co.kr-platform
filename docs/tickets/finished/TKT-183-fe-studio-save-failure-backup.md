문서 상태: 작성완료

# TKT-183 `[FE]` 글쓰기 — 저장 실패 중에도 백업(JSON 내려받기) 동선 열기

- 상태: finished (2026-10-25, PM r1 통과)· P3 · 담당: codex-1 · 의존: TKT-164 finished. 브랜치 `codex/v0.8.0-live`. **UX 1순위·[반박] 의무.**
- 근거: UX-TKT-164-r1 [중요] I1 — 저장 실패(저장 공간 부족 등) 상태에서 백업 버튼이 저장 성공을 전제로 해 입력 보존 동선이 막힌다.
- scope: `frontend/src/components/WritingStudio.vue`, `WritingStudio.e2e.mjs`.

## 완료 조건
1. [x] 저장 실패 상태에서도 `저장 안내와 백업` → 현재 편집 중 본문 포함 JSON 내려받기 가능, 실패 사유 한 줄 함께.
2. [x] E2E 1건(저장소 가득 참 모사 → 백업 가능), 기존 13/13.

## 질문/에스컬레이션
- [구체화 질문] 저장 실패 백업의 JSON 형식이 지정되지 않았다. 기존 여행·글 전체 백업으로 오인하지 않도록 `workaround-writing-emergency` 형식으로 현재 메모리 초안과 실패 사유를 담고, 저장이 정상일 때는 기존 통합 백업을 그대로 유지한다.

## 구현 내역
- 공유 파일: `frontend/src/components/WritingStudio.vue`, `frontend/src/components/WritingStudio.e2e.mjs` (TKT-105·164 미커밋 변경 위에 추가).
- 저장 실패일 때 안내 다이얼로그에 원인을 한 줄로 노출하고, 기존 localStorage 백업을 시도하지 않고 현재 편집기 메모리의 본문·표·메타데이터를 `workaround-writing-emergency` JSON으로 직접 내려받게 했다.
- 저장이 정상인 경우에는 기존 여행·글 통합 백업을 그대로 유지한다.

## 리뷰 기록
- root build 55 modules, Pages-base build 55 modules, Writing Studio E2E 14/14(기존 13 + 신규 1), `git diff --check` 통과.
- 신규 E2E는 localStorage 용량 초과를 모사해 저장된 본문은 빈 상태임을 확인한 뒤, 다운로드 JSON에 현재 화면 본문과 실패 코드·안내가 들어 있음을 검증한다.
- 2026-10-25 PM: **r1 통과 → finished** — `docs/reviews/REV-TKT-183-r1.md`.
