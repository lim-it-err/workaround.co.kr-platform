// TKT-211: App.vue 에서 떼어낸 서버 무응답 대비 정지 화면 상태. 순수 상수 — SimTone·taxiDispatch E2E 가 이 모듈을 직접 import 한다.

export const fallbackHealth = {
  status: 'degraded',
  services: [],
  tickets: {
    queued: 0,
    running: 0,
    waiting_llm: 0,
    retrying: 0,
    completed: 0
  }
}

export const fallbackRuntime = {
  nodes: [
    {
      nodeId: 'ion2',
      role: 'local-control',
      availability: 'online',
      handles: ['gateway', 'worker execution'],
      defaultFor: ['light services', 'fallback control path']
    },
    {
      nodeId: 'rtx5070',
      role: 'external-inference',
      availability: 'degraded',
      handles: ['ollama inference', 'heavy model jobs'],
      defaultFor: ['llm tickets', 'gpu-backed inference']
    }
  ],
  routingRules: [],
  ollama: {
    status: 'unavailable'
  }
}

export const fallbackWorkBoard = {
  columns: [
    { status: 'backlog', label: 'Backlog', tickets: [] },
    { status: 'started', label: 'Started', tickets: [] },
    { status: 'need_review', label: 'Need Review', tickets: [] },
    { status: 'finished', label: 'Finished', tickets: [] }
  ],
  activityFeed: [],
  commandHistory: [],
  actions: {
    authRequired: true,
    commandBridgeReady: false,
    commandPresets: []
  }
}

export const fallbackElevatorState = {
  service: 'elevator-service',
  mode: 'live-traffic-loop',
  building: {
    minFloor: 1,
    maxFloor: 23,
    totalFloors: 23
  },
  elevators: [
    {
      id: 'E1',
      currentFloor: 2,
      position: 2,
      direction: 'up',
      status: 'idle',
      queue: [],
      passengers: [],
      capacity: 20,
      currentLoad: 0,
      nextTarget: null
    },
    {
      id: 'E2',
      currentFloor: 8,
      position: 8,
      direction: 'idle',
      status: 'idle',
      queue: [],
      passengers: [],
      capacity: 20,
      currentLoad: 0,
      nextTarget: null
    },
    {
      id: 'E3',
      currentFloor: 14,
      position: 14,
      direction: 'idle',
      status: 'idle',
      queue: [],
      passengers: [],
      capacity: 20,
      currentLoad: 0,
      nextTarget: null
    },
    {
      id: 'E4',
      currentFloor: 20,
      position: 20,
      direction: 'down',
      status: 'idle',
      queue: [],
      passengers: [],
      capacity: 20,
      currentLoad: 0,
      nextTarget: null
    }
  ],
  waitingPassengers: [],
  completedPassengers: [],
  completedCalls: [],
  floorQueues: [],
  demand: {
    preset: 'normal',
    presetLabel: '보통',
    intensity: 55,
    autoMode: true,
    stepSeconds: 0.35
  },
  summary: {
    activeHallCalls: 0,
    movingElevators: 0,
    idleElevators: 4,
    waitingPassengers: 0,
    onboardPassengers: 0,
    loadRatio: 0
  }
}
