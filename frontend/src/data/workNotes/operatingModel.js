// 운영 노트 — Work Manager 공개 화면 콘텐츠 (PM 작성, TKT-195). 공개 전제: 비밀값·개인정보·내부 IP 없음.
// status: '확정' | '제안' | '할 일'

export const OPERATING_NOTES_UPDATED = '2026-10-25'

export const OPERATING_NOTES = [
  {
    id: 'overview',
    title: '한눈에 보는 구조',
    status: '확정',
    lead: '코드는 GitHub 한 곳, 개발은 맥북, 실행은 Cloudflare 와 집 PC 로 나뉜다.',
    flow: ['맥북에서 개발·판정·커밋', 'GitHub 작업 브랜치', 'main 병합', '공개 사이트 배포'],
    points: [
      '맥북은 집이든 카페든 어디서나 쓴다. 워킹트리는 하나뿐이다.',
      '집 PC(RTX 5070)는 유로트럭 2 자율주행, 로컬 LLM, 서버 기능을 돌리는 배포 대상이다. 코드는 두지 않는다.',
      'Cloudflare 는 정적 화면 배포·요청 게이트·파일 저장·집 PC 로 가는 통로를 맡는다. 지금 공개본은 임시로 GitHub Pages 다.',
    ],
  },
  {
    id: 'people',
    title: '누가 일하나',
    status: '확정',
    lead: '구현과 판정은 Claude, 다른 계열의 검수는 Codex 하나가 맡는다.',
    points: [
      'PO: 방향과 결정, main 배포, 집 PC 설정.',
      'PM 세션(Claude Opus 5.5): 티켓 발행, 판정, 커밋.',
      '구현(Claude Sonnet·Haiku): PM 세션 안의 서브에이전트가 티켓 단위로 구현한다. 단순한 건 Haiku.',
      '교차검증(codex-9, GPT-6.1 Sol): 실화면 UX 검수, 릴리스 감사, 조사. 코드는 고치지 않는다.',
      '리뷰어 레인은 없앴다. 판정은 PM 이 빌드·테스트·실화면을 직접 돌려 내린다.',
    ],
  },
  {
    id: 'ticket-flow',
    title: '티켓이 배포되기까지',
    status: '확정',
    flow: ['PO 요청', 'PM 티켓', '서브에이전트 구현', '검토 요청', '(codex-9 UX 초안)', 'PM 판정·커밋', 'main 병합', '자동 배포'],
    points: [
      '반려되면 같은 서브에이전트가 이어서 고친다. 두 번 반려되면 codex-9 가 두 번째 의견을 낸다.',
      '버전 태그 전에는 codex-9 감사를 반드시 거친다.',
    ],
  },
  {
    id: 'request-path',
    title: '방문자 요청이 집 PC 에 닿는 길',
    status: '제안',
    lead: '방문자는 Cloudflare 까지만 온다. 집 PC 와의 연결은 Cloudflare 가 대신 맺는다.',
    flow: ['방문자 브라우저', 'Cloudflare 엣지(정적 화면 + 게이트)', 'Cloudflare Tunnel', '집 PC 의 cloudflared', 'Spring gateway', '로컬 LLM(내부망)'],
    points: [
      '집 PC 가 먼저 바깥으로 연결을 맺어 둔다. 공유기 포트를 열지 않고 집 IP 도 드러나지 않는다.',
      '정적 화면은 Cloudflare 에서 끝난다. 집 PC 가 꺼져도 사이트는 열린다.',
      '집까지 가는 건 /api 요청뿐이고, 그것도 게이트(등급·속도 제한·킬 스위치)를 먼저 지난다.',
    ],
  },
  {
    id: 'where-compute',
    title: '데이터 처리는 어디서',
    status: '확정',
    lead: '무거운 처리는 거의 다 집 PC 에서 한다. Cloudflare 는 문지기와 진열장이다.',
    points: [
      '집 PC: LLM 추론, 유로트럭 실행·캡처, gateway 와 서비스 로직, 앞으로의 DB.',
      'Cloudflare: 정적 화면, 요청 게이트, 유로트럭 최신 프레임 저장, 캐시·카운터, Tunnel.',
      '장점은 클라우드 비용이 거의 0이라는 것, 약점은 집 PC 가 꺼지면 동적 기능이 같이 멈춘다는 것.',
      'Cloudflare 에는 EC2 같은 상시 VM 이 없다. 필요해지면 gateway 만 Containers(유료)로 옮기는 안을 검토한다.',
    ],
  },
  {
    id: 'llm',
    title: 'LLM 호출 원칙',
    status: '제안',
    lead: '출시 기본값은 실시간 호출 0이다. 열 때도 게이트 한 곳을 지난다.',
    points: [
      '공급자는 집 PC 의 로컬 LLM(RTX 5070)을 기본으로, Claude API 는 예비로 둔다. 로컬 LLM 과 유로트럭은 같이 돌려도 된다.',
      '익명 방문자에게는 미리 만든 결과만 보여 주고, 실시간 호출은 PO 가 켠 등급에서만 연다.',
      '클라이언트는 기능 이름과 짧은 값만 보낸다. 모델·출력 길이·프롬프트는 서버가 정한다.',
      'Claude API 를 쓸 때는 Anthropic 워크스페이스 월 상한과 게이트의 일일 차단기 두 겹으로 막는다.',
      '아무도 안 볼 때를 기본으로: 꺼짐이 기본, 한도 도달 시 자동 차단, 알림, 킬 스위치 한 줄.',
    ],
  },
  {
    id: 'offline',
    title: '집 PC 가 꺼졌을 때',
    status: '할 일',
    lead: 'Spring 이 꺼져 있으면 Spring 은 응답하지 못한다. 쉬는 중 표시는 게이트와 화면이 만든다.',
    points: [
      '이미 있음: 헬스 실패 시 화면 퇴화, 정적 공개본의 준비 중 표시, 유로트럭 샘플 화면, Advisor 의 mock 대체.',
      '할 일: 게이트가 Tunnel 너머 무응답을 쉬는 중으로 돌려주고, 동적 화면이 사용 가능·쉬는 중·잠김 세 상태를 공통으로 갖는다.',
      '운영 조건: 집 PC 절전 끄기, 정전 후 자동 켜짐, 자동 로그인.',
    ],
  },
  {
    id: 'deploy',
    title: '집 PC 로 배포하는 법',
    status: '제안',
    points: [
      '서비스별 Docker 이미지를 GitHub Actions 가 만들어 GitHub Container Registry 하나에 올린다. 별도 Artifactory 는 두지 않는다.',
      '집 PC 는 새 이미지를 받아 재시작한다. 맥에서 SSH 한 줄로 실행한다.',
      '유로트럭 PoC 는 화면 캡처 때문에 Docker 밖에서 돈다. 파일을 SSH 로 동기화하고 작업 스케줄러로 띄운다.',
    ],
  },
  {
    id: 'remote',
    title: '카페에서 집 PC 에 들어가는 법',
    status: '제안',
    points: [
      '개인 통로는 Tailscale(개인 무료). 맥과 집 PC 를 같은 계정에 묶으면 카페에서도 집 LAN 처럼 SSH 가 된다. 아무것도 공개되지 않는다.',
      '공개 통로는 Cloudflare Tunnel(무료). 방문자 요청은 이쪽만 쓴다.',
      'ngrok 은 무료 한도(월 1GB·2만 요청)가 작아 이 프로젝트에는 쓰지 않는다.',
      '터널은 꺼진 PC 를 깨우지 못한다. 집 PC 가 켜져 있어야 한다.',
    ],
  },
  {
    id: 'pending',
    title: '결정 대기와 PO 할 일',
    status: '할 일',
    points: [
      '결정: LLM 공급자를 로컬 LLM 기본으로 확정할지, 익명 실시간 호출을 열지, 도메인을 Cloudflare 로 옮길 시점.',
      'PO 할 일: 집 PC 절전 끄기·자동 로그인, 맥과 집 PC 에 Tailscale, 집 PC 에 OpenSSH 와 맥 공개키.',
      '진행 중: 블로그 본선 운행 중단, 밥상 칩 포커스 수정, 이 운영 노트 공개.',
    ],
  },
]
