# 워크플로 메모

## 메인 E2E 한 명령 (TKT-159)

```sh
npm --prefix frontend run e2e:all      # 전체 (약 3분)
npm --prefix frontend run e2e:pages    # Pages-base 스위트만 (WritingStudio 제외)
npm --prefix frontend run e2e:studio   # WritingStudio 만
npm --prefix frontend run e2e:root     # root-base 스위트만 (ToneTools·SimTone·taxiDispatch)
npm --prefix frontend run e2e:all -- --skip-build VoyageSettlement   # 빌드 재사용 + 파일명 필터
```

- 러너(`frontend/scripts/run-e2e.mjs`)가 Advisor·Pages-base·root-base 를 `/private/tmp/tkt159/` 에 빌드하고(작업 트리 `frontend/dist` 는 쓰지 않는다), 스위트마다 맞는 base 로 `node --test` 를 돌린 뒤 요약 표(파일·pass/skip/fail·소요)를 낸다. 실패가 있으면 exit 1 과 실패 테스트명을 출력한다. `NODE_PATH` 는 자동.
- SimTone·taxiDispatch 는 root-base preview 를 포트 **4175** 에 띄운다. 이미 점유돼 있으면 즉시 실패한다.
- 파일별 로그: `/private/tmp/tkt159/logs/<파일>.log`.
- Advisor Playwright 는 범위 밖이다. 릴리스 전 순서: ① `npm --prefix frontend run e2e:all` ② `cd services/advisor/frontend && npx playwright test`.
