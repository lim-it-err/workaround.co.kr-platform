문서 상태: 작성완료

# 유로트럭 관제 — ETS2 라이브 화면 스펙 (TKT-166, 2026-09-27)

PO 2026-09-27: "유로트럭2를 2초마다 스크린샷을 띄우는(앱 녹화 스트리밍도 좋지만) 페이지. 유로트럭은 100번 서버에서 기동 예정. 구조가 어떻게 변해야 할까."

## 1. 전제와 제약

- 게임(Euro Truck Simulator 2)은 `.100` **Windows 호스트의 대화형 데스크톱 세션**에서 돈다. 컨테이너 안이 아니다 — 화면 캡처는 그 세션에 붙은 프로세스만 할 수 있다(RDP 를 끊으면 세션이 잠겨 검은 화면이 잡힌다 → 로컬 로그인 유지 또는 자동 로그인 + 화면 잠금 해제 정책 필요).
- 공개 사이트는 GitHub Pages **정적 공개본**이다(D-022). 브라우저가 집 서버(`.100`)에 직접 닿을 수 없고, 집 IP 인바운드 개방은 하지 않는다(D-011: 동적은 Cloudflare Tunnel 경유). Tunnel 은 TKT-085 가 Docker 이미지 pull 문제로 blocked.
- 톤 원칙: 페이지는 "관제 화면" 한 장면 — 큰 프레임 하나 + 신선도 한 줄 + 조작부 최소. 게임 UI 를 흉내내지 않는다.

## 2. 구조 선택지

| 안 | 흐름 | 지연 | 공개본에서 동작 | 필요한 것 | 판단 |
|---|---|---|---|---|---|
| **A. 스냅샷 푸시(권고, 1단계)** | `.100` 캡처 에이전트가 2초마다 창을 JPEG 로 잡아 **밖으로 업로드**(Cloudflare R2 S3 API) → 페이지가 공개 URL 을 2초마다 폴링 | 2~4초 | **된다** | R2 버킷(공개 읽기·CORS)·쓰기 토큰, `.100` Python 3 | 인바운드 포트 0. Tunnel 없이 오늘 가능. 대역폭 ≈ 80KB×0.5/s ≈ 40KB/s |
| B. 자가 서빙 + Tunnel | 에이전트가 `latest.jpg` 를 로컬 HTTP 로 서빙 → gateway `/api/ets2/*` → Tunnel | 2~4초 | Tunnel 뒤에만 | TKT-085 해소 | D-011 정석이지만 085 가 막혀 있다. A 의 폴링 URL 만 바꾸면 이관 가능 |
| C. 실시간 스트리밍 | OBS → RTMP → MediaMTX(Docker, `.100`) → WebRTC(WHEP)/HLS → 페이지 `<video>` | 0.5~3초 | Tunnel 뒤에만(UDP/WebRTC 는 Tunnel 제약, HLS 는 가능) | 085 + GPU 인코딩 설정 | 2단계(TKT-171). 화질·부드러움은 최고, 운영 부담 최대 |
| D. YouTube/Twitch 라이브 임베드 | OBS → 플랫폼 → iframe | 5~20초 | 된다 | 플랫폼 계정·공개 방송 | 인프라 0 이지만 플랫폼 종속·광고·계정 노출. 대안으로만 |

**권고: A 로 시작, C 를 2단계.** A 는 R2 로 향하는 아웃바운드만 있어 집 서버 노출이 없고, 게임이 꺼져 있으면 마지막 프레임 + "정지" 표시로 자연스럽게 퇴화한다. R2 무료 한도(Class A 쓰기 100만/월)는 하루 6시간 방송 × 2초 = 32만/월로 여유.

## 3. 저장소 구조 변화

```
services/ets2-capture/            ← 신규 서비스 (TKT-167, codex-2)
  README.md                        계약: 실행 방법·환경변수·/health·한계(대화형 세션 필요)
  capture.py                       mss 로 ETS2 창(제목 매칭) 2초 캡처 → 1280px JPEG q70 → latest.jpg + meta.json
  publisher.py                     R2(S3 호환) 업로드: latest.jpg, meta.json, 재시도·백오프, 실패 시 로컬만 갱신
  requirements.txt · run.ps1       Windows 작업 스케줄러 등록 스크립트 (로그온 시 시작)
  .env.example                     R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, PUBLIC_BASE_URL, CAPTURE_INTERVAL=2
frontend/src/components/Ets2Live.vue   ← 페이지 (TKT-168, codex-1)
frontend/src/data/lines.js             실험선 S 에 소역 `유로트럭` 추가 (page: 'ets2', 정적 공개 OK)
frontend/src/staticRouting.js          `/ets2`
```

- 서비스 계약(D-005) 예외: **Dockerfile 없음** — 화면 캡처는 호스트 데스크톱 세션이 필요해 컨테이너화가 불가하다. README 에 명시하고 `/health` 는 로컬 `http://127.0.0.1:8010/health`(마지막 캡처 시각·업로드 성공 시각) 로 제공.
- 비밀값은 `.env`(gitignore) 에만. 공개 번들에는 **공개 읽기 URL 만** 들어간다(`VITE_ETS2_FRAME_URL`).

## 4. 데이터 계약

- `latest.jpg` — 최신 프레임. 캐시 무효화는 쿼리 `?t=<epoch>` 로.
- `meta.json` — `{ "capturedAt": ISO, "uploadedAt": ISO, "width": 1280, "height": 720, "window": "Euro Truck Simulator 2", "seq": n, "telemetry": null }`. `telemetry` 는 후속(ETS2 텔레메트리 SDK: 속도·연료·도시) 자리.
- 신선도: 페이지는 `now - capturedAt` 을 계산해 `n초 전`. **30초 이상이면 "정지"** 상태(마지막 프레임 흐림 + hairline 안내 `마지막 화면 · n분 전`), 폴링은 10초로 늦춘다. 5분 이상이면 폴링 30초.

## 5. 페이지 (TKT-168)

- 경로 `/ets2`, 실험선 S 소역 `유로트럭`(격납고 옆). 홈 노선도·격납고 목록에서 진입.
- 화면: 상단 제목 `유로트럭 관제` + 신선도 한 줄(`2초 전 · 1280×720`) / 프레임(16:9, 최대 폭 960, 면 없음) / 하단 hairline 행: `다시 불러오기`, 폴링 간격 표시. 프레임 전환은 깜빡임 없이(새 이미지 로드 완료 후 교체 — 더블 버퍼).
- 접근성: 프레임 `alt="유로트럭 화면, n초 전"`, 신선도는 `role=status`(변경 시 낭독 과다 방지: 30초마다만 갱신 낭독).
- 오프라인·차단: 이미지 로드 실패 3회면 "관제 신호 없음" 상태. D-022 문법(흐림 + 같은 화면 안내), 페이지 이동 없음.
- 정적 공개본에서 동작(외부 R2 URL 폴링). 개발 환경은 `VITE_ETS2_FRAME_URL` 미설정 시 `public/mockups/ets2-sample/` 의 샘플 3장을 순환(E2E 도 이걸 씀).

## 6. 위험

- `.100` 세션 잠금·절전 시 검은 프레임 — 에이전트가 "검은 화면 비율 > 95%" 를 감지하면 업로드를 멈추고 meta 에 `blank: true`.
- 게임 창이 전체화면 독점 모드면 mss 가 못 잡을 수 있다 → 창모드(borderless) 권장, README 에 기록.
- 개인정보: 프레임에 채팅·프로필이 찍히지 않도록 게임 내 UI 설정 안내. 업로드 전 하단 HUD 마스킹 옵션(`MASK_REGIONS`).

## 7. PO 확인 (ASK Q-018)

R2 버킷·토큰 생성(PO 계정), `.100` Python 3 설치 여부, ETS2 창모드 실행 가능 여부, 방송 시간대(항상 vs 게임 중만).
