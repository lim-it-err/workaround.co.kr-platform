문서 상태: 작성완료

# Developer Advisor 시즌 수명주기 스펙 (TKT-122, 2026-09-14, PM)

근거: 감사 AS-R008 §5(현 구현 `seasonStats.js:28-46` 단일 `seasonStart`, 28일 경과 후 적립 조용히 거절, `seasonTiming` 은 `ended` 만 표시), D-013(노선=상설 공간, 정류장=인스턴스 → **기록은 상설, 시즌은 반복 인스턴스**), D-020(기록 표면).

## 1. 모델
```js
seasons: {
  activeId: 'season-2026-08-18' | null,
  byId: {
    'season-2026-08-18': { id, start: '2026-08-18', end: '2026-09-14', gains: [{date, stat, amount, source}], closedAt: '2026-09-15' | null, ending: { id, title } | null }
  }
}
```
- `SEASON_LENGTH_DAYS = 28` 유지. 시즌 id 는 `season-<start>`.
- `closedAt` 은 사용자가 결말을 확인하고 새 시즌을 시작하거나 명시적으로 닫은 시각. 종료(`ended`)와 닫힘(`closedAt`)은 다르다 — 종료됐지만 아직 안 닫힌 시즌은 결말 화면을 보여 준다.
- 저장: 기존 `advisor.learner.v1` 안의 `seasonStats` 자리를 `seasons` 로 교체. **마이그레이션**: `seasonStats{seasonStart,gains}` → `byId['season-'+seasonStart] = {start, end: start+27, gains, closedAt:null, ending:null}`, `activeId` = 그 id. 마이그레이션 전후 제출·프로젝트·게임·시즌 기록 수 동일(AS-R008 §9 TC).

## 2. 수명주기
1. **진행**: `activeId` 시즌이 `ended` 아님 → 적립 정상(현 규칙: 같은 날 같은 source 중복 금지).
2. **종료**: 28일 경과 → `ended`. 적립 시도는 **조용히 버리지 않는다** — `recordSeasonGain` 이 `{ ok: false, reason: 'ended' }` 를 돌려주고 UI 가 `시즌이 끝났습니다 · 새 시즌 시작` CTA 를 띄운다. 그 적립은 새 시즌 시작 직후 **재시도**되어 새 시즌 첫 적립이 된다(사용자 행동을 잃지 않는다).
3. **결말 확인**: 종료 시즌은 `selectSeasonEnding` 결과를 `ending` 에 고정 저장(불변). 기록 표면 `이번 시즌` 에 결말 카드 + `새 시즌 시작` 버튼.
4. **새 시즌 시작(명시적)**: 자동 롤오버 없음(한 사람의 학습 도구 — 공백이 자연스럽고 자동 생성은 빈 시즌을 쌓는다). 버튼 → 이전 시즌 `closedAt = now`, 새 시즌 `start = today`, gains 0 에서 시작, `activeId` 교체.
5. **재열람**: 닫힌 시즌은 `기록 › 지난 시즌` 행(기간·합계·결말 제목)에서 읽기 전용 상세로. 삭제 없음.
6. **이월 없음**: 스탯은 시즌마다 0. **평생 누적** = 모든 시즌 gains 합 — 기록 표면 상단 통계에 별도 표시.

## 3. 화면(기록 표면, D-020)
- `이번 시즌`(현 `SeasonPage embedded`): 진행 중이면 현재대로. 종료·미닫힘이면 결말 카드 + `새 시즌 시작`. active 없음(첫 방문 또는 모두 닫힘)이면 `새 시즌 시작` 하나만.
- `지난 시즌`: hairline 시각표 행 — `시즌 · 2026-08-18 → 09-14 · 합계 42 · 결말 "…"` → 클릭 시 읽기 전용 상세(결말 서사·스탯 합계·완벽한 날 수).
- 평생 누적: 기록 상단 통계 행에 `누적 스탯`(4축 합).

## 4. 수용 TC
1. 28일 종료 뒤 적립 시도 → 거절 사유 노출 + CTA, 새 시즌 시작 → 같은 적립이 새 시즌에 기록 → 과거 시즌 재열람에 이전 결말 그대로 — **E2E 1건**.
2. 마이그레이션: 구 `seasonStats` 데이터 로드 → `seasons.byId` 1건·`activeId` 일치·gains 수 동일 — unit.
3. 종료 시즌 `ending` 불변: 새 적립이 과거 시즌 합계를 바꾸지 않음 — unit.
4. 기존 seasonStats 단위 테스트의 "29일차 적립 거절" 은 "거절 + reason:'ended'" 로 갱신.

## 5. 티켓
- **TKT-135 `[FE]`** 구현(스토어·마이그레이션·기록 표면 UI·테스트). scope: `store/seasonStats.js`, `store/missions.js`(persist·migrate), `pages/{SeasonPage,RecordsPage}.vue`, 테스트. 콘텐츠 3파일 불가침.
