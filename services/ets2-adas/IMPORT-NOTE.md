문서 상태: 작성완료

# 편입 메모 (PM, 2026-09-27)

- 출처: PO 제공 PoC `ets2-adas-poc-without-cv2.zip`(2026-09-27) + 속도 제한 모드 `ets2_speed_limit_110.scs`. 저작은 PO(로컬 커스터마이즈).
- 제외: `bin/`(빌드 산출물 DLL·PDB — `BUILD.ps1` 로 재생성), `vendor/`(pip 휠 — THIRD_PARTY.md 대로 설치), `backups/`(게임 프로필 설정 백업 — 개인), `runtime/`(이벤트 로그·pid), `.build/`, `__pycache__`.
- 공개 저장소용 치환: 실명 프로필 → `<프로필 A>`·`<프로필 B>`, Steam 사용자 ID → `<STEAM_USER_ID>`, 프로필 폴더 hex → `<PROFILE_HEX>`, 사용자 홈 경로 → `C:\Users\<USER>`. 실행 시 `INSTALL.ps1 -ProfileConfig`·`START.ps1` 의 경로를 실제 값으로 바꾼다(커밋 금지).
- SCS SDK 헤더는 `native/sdk_license.txt`(MIT 계열) 대로 포함.
- 서비스 계약 예외: Dockerfile 없음(데스크톱 세션 필요). 마감은 TKT-167.
