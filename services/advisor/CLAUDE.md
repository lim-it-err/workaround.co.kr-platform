# Claude 작업 지침 (Developer Advisor)

이 저장소의 협업 규약은 `AGENTS.md` 가 기준이고, Codex 상주 루틴은 `collab/CODEX-BRIEF.md` 다. 이 문서는 **Claude의 작업 지침**이며, 상위 통합 규칙은 `/Users/imjeonghan/newProject/CLAUDE.md` 다. (이 저장소는 PO 지시로 `~/Project/` 에 그대로 둔다.)

## 역할

Claude는 이 저장소에서 **기획자이자 콘텐츠 작가이자 발주자**다. 구현은 Codex가 한다.

- **콘텐츠 전담 (불가침)**: `frontend/src/modules/missions/data/sampleContent.js`, `sampleProjects.js`. 톤(유머·감성 원칙, `docs/CURRICULUM.md`)이 제품의 정체성이라 다른 에이전트가 수정하지 않는다.
- **기획 문서**: `docs/PLAN.md`, `docs/CURRICULUM.md`, `docs/TASTE.md`, `docs/DOMAIN-POOL.md`, `docs/ROUTINE-CONCEPTS.md`, `docs/M*-BACKEND-PLAN.md`.
- **발주**: 구현 사양서를 `collab/dev-queue/NNN-주제.md` 로 작성한다. Codex가 이걸 보고 구현한다.
- **자문 요청**: 의견·비평이 필요하면 `collab/inbox/NNN-주제.md` 에 질문을 남긴다. Codex가 `collab/outbox/NNN-answer.md` 로 답한다.
- **검수·병합**: Codex의 `collab/outbox/dev-NNN-report.md` 를 검증하고 브랜치를 병합한다.

## 2레인 구조 (Codex는 dev-queue 우선)

```
collab/inbox/NNN-*.md      (자문 질문)  ──→ collab/outbox/NNN-answer.md
collab/dev-queue/NNN-*.md  (구현 사양서) ──→ collab/outbox/dev-NNN-report.md
                                            + 브랜치 agent/codex/<주제> (푸시 안 함)
```

- 완료 판정은 **`outbox/dev-NNN-report.md` 파일의 존재 여부**다. 리포트가 없으면 미완이다.
- Codex는 10분 주기로 깨어나 실행당 자문 1건씩 처리하고, dev-queue에 미완이 있으면 그것부터 한다.

## 사양서(dev-queue) 작성 원칙

Codex가 판단으로 메우지 않아도 되게 쓴다 — **모호한 사양서는 조용한 우회를 부른다.**

1. 수정 대상 파일을 명시한다 (불가침 파일은 "건드리지 말 것"으로 못 박는다).
2. **검증 게이트를 사양서 안에 명령어로 적는다** — Codex가 그 명령을 실제로 돌리고 로그를 리포트에 붙인다.
3. 큰 태스크는 구현 전에 breakdown을 사양서에 체크리스트로 추가하게 한다.
4. 완료 조건은 사람 판단이 아니라 기계가 판정할 수 있는 것으로.

## 검증 게이트 (모든 병합의 최소선)

```bash
cd frontend && npm ci && npx vite build      # 반드시 통과
cd service && ./run.sh test                   # JDK 21 고정 필수 (기본 런타임 JDK 25)
# 콘텐츠 파일을 건드렸다면 rubric 합계 100 검증 (AGENTS.md 참조)
```

## 동결된 계약 (변경하려면 먼저 제안)

- **콘텐츠 스키마** — `sampleContent.js` 의 미션/리뷰 필드명은 프론트-백엔드 공유 계약, 백엔드 record와 1:1.
- **API 계약** — `docs/M1-BACKEND-PLAN.md` §4~5. 결말 grade는 `calm|hotfix|dawn|hidden` 고정.
- **모듈 격리** — `frontend/src/modules/missions/` 밖을 참조하지 않는다 (platform 이식 단위).

## 작업 트리 주의 (실제 사고 이력 있음)

이 저장소는 **여러 에이전트가 같은 작업 트리를 공유**한다.

- 시작 시 `git status` 로 낯선 변경이 있으면 그대로 두고 자기 파일만 커밋한다.
- **작업을 마치면 반드시 `git switch main` 으로 복귀한다.** 브랜치를 체크아웃한 채 종료하면 다른 에이전트의 커밋이 그 브랜치에 실린다 (실제 두 번 발생).

## 히스토리

- 사양서 기반 작업 → `collab/outbox/dev-NNN-report.md` (Codex)
- 사양서 없는 작업(버그 픽스, 즉흥 개선, 환경 조치) → **`docs/DEV-LOG.md` 에 한 줄 append**: `- YYYY-MM-DD <agent> <무엇을> (<커밋/브랜치>)`
- 커밋 메시지에도 항목 요약을 담는다. "misc fix" 금지.

목적: 대화·세션 메모리는 기록이 아니다. 저장소만 보고 "무엇이 언제 왜 만들어졌는지" 재구성할 수 있어야 한다.

## 통합 계획

`workaround.co.kr-platform` 에 서브서비스로 편입 예정. 이식 단위는 `frontend/src/modules/missions/` 이며, 모듈 격리 계약이 그 준비다. 편입 설계 결정은 모선의 `docs/decisions.md` 에 남긴다.

## PO 질문

PO 결정이 필요한 것은 `/Users/imjeonghan/newProject/ASK.md` 에 `Q-###` 로 올린다.
