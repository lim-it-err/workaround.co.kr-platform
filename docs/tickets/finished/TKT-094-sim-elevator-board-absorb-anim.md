# TKT-094
## 메타데이터
- 문서 상태: 작성완료
- 제목: 엘베 탑승 흡수 마이크로 애니메이션 (083 리뷰 [중요] 잔여)
- 우선순위: P3 / 상태: `finished` / 담당: `[SIM]`
- 진행 판정: `진행 가능`
- scope: `frontend/src/**` 엘리베이터 모듈
- 근거: `design/sim-elevator-spec.md` §2 — 승객 탑승 시 대기 도트가 car 쪽으로 흡수(80ms, reduced-motion 시 즉시). REV-TKT-083-r1 [중요].
## 완료 게이트
- build + 탑승 발생 시 도트 흡수 확인 + reduced-motion 즉시 처리

## 작업자 산출물
- `ElevatorCrossSection.vue`가 car별 탑승 승객 ID를 추적하고 새 탑승을 감지하면 출발층 대기열에서 해당 car 샤프트로 도트를 흡수한다.
- 흡수 도트는 `passenger-boards` 80ms 애니메이션으로 이동·축소·소멸하며, `prefers-reduced-motion: reduce`에서는 애니메이션 없이 즉시 숨긴다.
- 초기 화면에 이미 탑승 중인 승객은 기준 스냅샷으로만 등록해 진입 직후 거짓 애니메이션을 만들지 않는다. 엘리베이터 코어와 API는 수정하지 않았다.

## 검증
- `npm run build`: 통과(Vite 6.4.3, 27 modules).
- 실제 서비스 탑승 관찰: `.elevator-boarding-dot` 생성, `animation-name=passenger-boards`, `animation-duration=0.08s` 확인.
- reduced-motion CSSOM: `(prefers-reduced-motion: reduce)`에서 `animation: none`, `opacity: 0` 확인.
- 다크/라이트 육안 확인, 375×812에서 `scrollWidth=clientWidth=375`, car 4대·23개 층 확인.
- 30초 방치: car 4대 위치 전부 변경, 11개 층 대기 수 변화, 최근 운행 티커 갱신 확인. 브라우저 오류 로그 없음.
- `git diff --check`: 통과.
