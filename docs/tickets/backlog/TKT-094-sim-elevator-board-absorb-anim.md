# TKT-094
## 메타데이터
- 제목: 엘베 탑승 흡수 마이크로 애니메이션 (083 리뷰 [중요] 잔여)
- 우선순위: P3 / 상태: `ready` / 담당: `[SIM]`
- scope: `frontend/src/**` 엘리베이터 모듈
- 근거: `design/sim-elevator-spec.md` §2 — 승객 탑승 시 대기 도트가 car 쪽으로 흡수(80ms, reduced-motion 시 즉시). REV-TKT-083-r1 [중요].
## 완료 게이트
- build + 탑승 발생 시 도트 흡수 확인 + reduced-motion 즉시 처리
