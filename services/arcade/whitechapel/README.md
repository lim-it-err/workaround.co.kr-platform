# 화이트채플 (Whitechapel Shadow)

잭 더 리퍼 추리 보드게임의 웹 구현. 순수 JS(ESM) **정적 자산 서비스**로, `docs/service-policy.md`의 정적 자산 계약(D-005)을 따른다.

- 편입: 2026-08-16, `bitter_sweet_testbed` 레포에서 `git subtree`로 이력 보존 흡수 (D-003·D-004)
- 게임 코드 개요·개발 레인 규칙: [AGENTS.md](AGENTS.md), [docs/works/README.md](docs/works/README.md)

## 정적 자산 계약 (D-005)

| 항목 | 값 |
|---|---|
| 빌드 명령 | `npm run build` (`build/bundle.mjs`) |
| 빌드 산출물 | `whitechapel/standalone.html` (단일 파일, ~99KB) / 개발용 멀티파일 `whitechapel/` |
| 라우트 prefix | `/arcade/whitechapel` (Caddy 정적 서빙, D-006) |
| `/health` | 정적 서버(Caddy) 컨테이너가 대신 응답 |
| 출처·권리 | 자작 게임 (보드게임 「Letters from Whitechapel」에서 규칙 영감, 자산·코드 전부 자체 제작) |

## 개발·검증

```bash
npm test        # node --test, 규칙 엔진·AI·보드 37+ 케이스
npm run sim     # 밸런스 시뮬레이션 (200판 매트릭스)
npm run bench   # AI 결정 시간 벤치마크
npm run e2e     # Playwright 브라우저 테스트
npm run build   # standalone.html 번들
```

`whitechapel/js/board.js`·`game.js`·`ai.js`는 DOM 무의존 — Node로 직접 import해 헤드리스 검증한다. 밸런스 주장은 시뮬레이션 수치로 뒷받침할 것.

## 환경 변수

없음 (순수 정적, 런타임 외부 의존 0).
