import { computed, onBeforeUnmount, ref, watch } from 'vue'

// TKT-209: App.vue 에서 떼어낸 기지선(Work Manager·Runtime) 상태와 인증 세션.
// 토큰 저장·만료·잠금(TKT-060 하드닝)은 동작 그대로다. 만료 타이머는 onBeforeUnmount 에서 정리한다.
// fetchJson 과 fallbackHealth/Runtime/WorkBoard 는 App 이 소유한다 — SimTone·taxiDispatch E2E 가 App.vue 소스에서 이 상수를 문자열로 잘라 읽는다.

const BOARD_READY_STORAGE_KEY = 'workaround-ready-lane'
export const TOKEN_STORAGE_KEY = 'workaround-work-manager-token'
export const TOKEN_EXPIRY_STORAGE_KEY = 'workaround-work-manager-token-expires-at'
const TARGET_VERSION_OPTIONS = ['v0.4.0', 'v0.5.0', 'v0.5.1', 'v0.6.0', 'infra', 'chore']

function readReadyTicketIds() {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const raw = window.localStorage.getItem(BOARD_READY_STORAGE_KEY)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : []
  } catch (error) {
    return []
  }
}

function persistReadyTicketIds(ticketIds) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(BOARD_READY_STORAGE_KEY, JSON.stringify(ticketIds))
  } catch (error) {
    // 조회 화면의 임시 Ready 상태 저장 실패는 정적 화면을 막지 않는다.
  }
}

export function readStoredWorkManagerSession() {
  if (typeof window === 'undefined') {
    return { token: '', expiresAt: '', expired: false }
  }

  try {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY) || ''
    const expiresAt = window.localStorage.getItem(TOKEN_EXPIRY_STORAGE_KEY) || ''
    if (token && !isExpiredWorkManagerSession(expiresAt)) {
      return { token, expiresAt, expired: false }
    }

    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY)
    return { token: '', expiresAt: '', expired: Boolean(token) }
  } catch (error) {
    return { token: '', expiresAt: '', expired: false }
  }
}

export function persistWorkManagerSession(token, expiresAt) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    if (token && !isExpiredWorkManagerSession(expiresAt)) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
      window.localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, expiresAt)
      return
    }

    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY)
  } catch (error) {
    // 정적 공개본에서는 저장소가 막혀도 여행·글쓰기 읽기를 유지한다.
  }
}

export function resolveWorkManagerAuthSession(response) {
  const token = response?.token || ''
  const directExpiresAt = response?.expiresAt || ''
  const directExpiresAtMs = Date.parse(directExpiresAt)
  if (token && Number.isFinite(directExpiresAtMs) && directExpiresAtMs > Date.now()) {
    return { token, expiresAt: new Date(directExpiresAtMs).toISOString() }
  }

  const ttlMinutes = Number(response?.sessionTtlMinutes)
  if (token && Number.isFinite(ttlMinutes) && ttlMinutes > 0) {
    return {
      token,
      expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString()
    }
  }
  return null
}

export function isExpiredWorkManagerSession(expiresAt) {
  const expiresAtMs = Date.parse(expiresAt)
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()
}

export function useWorkManager({ fetchJson, fallbacks }) {
  const { health: fallbackHealth, runtime: fallbackRuntime, workBoard: fallbackWorkBoard } = fallbacks

  const selectedWorkTicketId = ref('')
  const selectedCommand = ref('')
  const commandNote = ref('')
  const workManagerPassword = ref('')
  const initialWorkManagerSession = readStoredWorkManagerSession()
  const workManagerToken = ref(initialWorkManagerSession.token)
  const workManagerTokenExpiresAt = ref(initialWorkManagerSession.expiresAt)
  const workManagerMessage = ref('')
  const workManagerError = ref(
    initialWorkManagerSession.expired
      ? '이전 command gate 세션이 만료되어 다시 잠갔습니다. 재인증해 주세요.'
      : ''
  )
  const metadataTargetVersion = ref('v0.4.0')
  const metadataPriority = ref('P2')
  const metadataDependencies = ref('')
  const metadataMessage = ref('')
  const metadataError = ref('')
  const isUnlockingWorkManager = ref(false)
  const isRunningCommand = ref(false)
  const isSavingMetadata = ref(false)
  const dragTicketId = ref('')
  const readyTicketIds = ref(readReadyTicketIds())
  const healthState = ref(fallbackHealth)
  const runtimeState = ref(fallbackRuntime)
  const servicesState = ref([])
  const workBoardState = ref(fallbackWorkBoard)

  let workManagerExpiryTimer

  function runtimeStatusMeta(value) {
    const status = String(value || '').trim().toLowerCase()
    if (['online', 'available', 'ok', 'healthy'].includes(status)) {
      return { label: '정상', warning: false }
    }
    if (status === 'degraded') {
      return { label: '지연', warning: true }
    }
    if (['unavailable', 'offline'].includes(status)) {
      return { label: '중단', warning: true }
    }
    return { label: '확인 중', warning: true }
  }

  function runtimeMetric(source) {
    const responseTime = [source?.responseTimeMs, source?.latencyMs, source?.durationMs]
      .map(Number)
      .find(value => Number.isFinite(value) && value >= 0)
    return responseTime === undefined ? '' : `${Math.round(responseTime)} ms`
  }

  function runtimeToneRow({ key, label, detail, source, status }) {
    const meta = runtimeStatusMeta(status)
    const metric = runtimeMetric(source)
    return {
      key,
      label,
      detail,
      status: metric ? `${meta.label} · ${metric}` : meta.label,
      warning: meta.warning
    }
  }

  const runtimeToneRows = computed(() => [
    runtimeToneRow({
      key: 'gateway',
      label: '웹 화면',
      detail: 'gateway',
      source: healthState.value,
      status: healthState.value.status
    }),
    runtimeToneRow({
      key: 'ollama',
      label: '인공지능 응답',
      detail: 'Ollama',
      source: runtimeState.value.ollama,
      status: runtimeState.value.ollama?.status
    }),
    ...(runtimeState.value.nodes || []).map((node) => runtimeToneRow({
      key: node.nodeId,
      label: node.nodeId,
      detail: node.role,
      source: node,
      status: node.availability
    }))
  ])
  const runtimeNeedsAttention = computed(() => runtimeToneRows.value.some((row) => row.warning))

  const workWorkerSummary = computed(() => {
    const summary = workBoardState.value.workerSummary
    if (Array.isArray(summary) && summary.length > 0) {
      return summary
    }

    const startedTickets = workBoardColumns.value.find((column) => column.status === 'started')?.tickets || []
    return [
      {
        workerId: 'ion2-worker',
        status: startedTickets.length > 0 ? 'active' : 'idle',
        currentTicketIds: startedTickets.map((ticket) => ticket.id),
        focus: startedTickets.length > 0 ? 'Started lane ownership' : 'Ready pick 대기'
      }
    ]
  })

  const workPriorityPolicy = computed(() => {
    return (
      workBoardState.value.priorityPolicy || {
        queueSource: 'docs/tickets/board.md backlog',
        automaticRange: ['우선순위 힌트 계산', 'Started owner 표시'],
        manualRange: ['실제 착수 결정', 'Need Review 이후 종료 판정'],
        nextCandidates: readyColumnTickets.value
          .concat(workBoardColumns.value.find((column) => column.status === 'backlog')?.tickets || [])
          .slice(0, 4)
          .map((ticket) => `${ticket.id} ${ticket.priority}`)
      }
    )
  })

  const workPersistence = computed(() => {
    return (
      workBoardState.value.persistence || {
        mode: 'memory-fallback',
        filePath: 'gateway/data/work-manager-store.json',
        auditEventCount: 0,
        lastAuditAt: '',
        targetDatabase: 'embedded-h2'
      }
    )
  })

  const workBoardColumns = computed(() => {
    const normalized = new Map(
      (workBoardState.value.columns || []).map((column) => [column.status, column])
    )

    const backlogSource = normalized.get('backlog')?.tickets || []
    const safeReadyIds = readyTicketIds.value.filter((ticketId) =>
      backlogSource.some((ticket) => ticket.id === ticketId)
    )
    if (safeReadyIds.length !== readyTicketIds.value.length) {
      readyTicketIds.value = safeReadyIds
      persistReadyTicketIds(safeReadyIds)
    }

    const readySet = new Set(safeReadyIds)
    const backlogTickets = backlogSource.filter((ticket) => !readySet.has(ticket.id))
    const readyTickets = backlogSource.filter((ticket) => readySet.has(ticket.id))

    return [
      {
        status: 'backlog',
        label: 'Backlog',
        helper: '아직 선점되지 않은 작업',
        tickets: backlogTickets
      },
      {
        status: 'ready',
        label: 'Ready',
        helper: '다른 작업이 끝나기를 기다림',
        tickets: readyTickets
      },
      {
        status: 'started',
        label: 'Started',
        helper: '담당자가 수행 중',
        tickets: normalized.get('started')?.tickets || []
      },
      {
        status: 'need_review',
        label: 'Need Review',
        helper: 'PM 확인 대기',
        tickets: normalized.get('need_review')?.tickets || []
      },
      {
        status: 'finished',
        label: 'Finished',
        helper: '검수 완료 및 히스토리 반영',
        tickets: normalized.get('finished')?.tickets || []
      }
    ]
  })

  const readyColumnTickets = computed(() =>
    workBoardColumns.value.find((column) => column.status === 'ready')?.tickets || []
  )

  const workToneRows = computed(() => [
    { status: 'need_review', label: '검토 대기', shortStatus: '검토' },
    { status: 'started', label: '진행 중', shortStatus: '진행' },
    { status: 'ready', label: '다음 작업', shortStatus: '대기' }
  ].map((item) => {
    const column = workBoardColumns.value.find((candidate) => candidate.status === item.status)
    return {
      ...item,
      count: column?.tickets.length || 0,
      helper: column?.helper || ''
    }
  }))

  const allWorkTickets = computed(() => workBoardColumns.value.flatMap((column) => column.tickets))

  const selectedWorkTicket = computed(() => {
    const ticket =
      allWorkTickets.value.find((candidate) => candidate.id === selectedWorkTicketId.value) ||
      allWorkTickets.value[0] ||
      null
    if (!ticket) {
      return null
    }

    const lane = workBoardColumns.value.find((column) =>
      column.tickets.some((candidate) => candidate.id === ticket.id)
    )

    return {
      ...ticket,
      lane: lane?.label || ticket.status
    }
  })

  const workVersionSummary = computed(() => {
    const versionCount = new Map()
    for (const ticket of allWorkTickets.value) {
      const key = ticket.targetVersion || 'unknown'
      versionCount.set(key, (versionCount.get(key) || 0) + 1)
    }
    return Array.from(versionCount.entries()).sort(([left], [right]) => left.localeCompare(right))
  })

  const workTargetVersionOptions = computed(() => {
    const values = new Set(TARGET_VERSION_OPTIONS)
    if (selectedWorkTicket.value?.targetVersion) {
      values.add(selectedWorkTicket.value.targetVersion)
    }
    return Array.from(values)
  })

  const workVersionHeader = computed(() => ({
    focusVersion: selectedWorkTicket.value?.targetVersion || 'v0.4.0',
    developmentCeiling: 'v0.5.0',
    activeRange: 'v0.4.0 -> v0.5.0',
    selectedPriority: selectedWorkTicket.value?.priority || 'P?'
  }))

  const commandPresets = computed(() => workBoardState.value.actions?.commandPresets || [])
  const activityFeed = computed(() => workBoardState.value.activityFeed || [])
  const commandHistory = computed(() => workBoardState.value.commandHistory || [])

  watch(
    [workManagerToken, workManagerTokenExpiresAt],
    ([nextToken, nextExpiresAt]) => {
      persistWorkManagerSession(nextToken, nextExpiresAt)
      scheduleWorkManagerExpiration()
    },
    { immediate: true }
  )

  watch(
    () => allWorkTickets.value.map((ticket) => ticket.id).join(','),
    () => {
      if (!selectedWorkTicketId.value && allWorkTickets.value.length > 0) {
        selectedWorkTicketId.value = allWorkTickets.value[0].id
        selectedCommand.value = commandPresets.value[0]?.action || ''
        return
      }

      if (
        selectedWorkTicketId.value &&
        !allWorkTickets.value.some((ticket) => ticket.id === selectedWorkTicketId.value)
      ) {
        selectedWorkTicketId.value = allWorkTickets.value[0]?.id || ''
      }
    },
    { immediate: true }
  )

  watch(
    () => [
      selectedWorkTicket.value?.id || '',
      selectedWorkTicket.value?.targetVersion || '',
      selectedWorkTicket.value?.priority || '',
      selectedWorkTicket.value?.dependencies || selectedWorkTicket.value?.prerequisites || ''
    ].join('|'),
    () => {
      metadataTargetVersion.value = selectedWorkTicket.value?.targetVersion || 'v0.4.0'
      metadataPriority.value = selectedWorkTicket.value?.priority || 'P2'
      metadataDependencies.value =
        selectedWorkTicket.value?.dependencies || selectedWorkTicket.value?.prerequisites || ''
      metadataMessage.value = ''
      metadataError.value = ''
    },
    { immediate: true }
  )

  watch(
    () => commandPresets.value.map((preset) => preset.action).join(','),
    () => {
      if (!selectedCommand.value && commandPresets.value.length > 0) {
        selectedCommand.value = commandPresets.value[0].action
      }
    },
    { immediate: true }
  )

  async function loadHealthState() {
    try {
      healthState.value = await fetchJson('/api/health')
    } catch (error) {
      healthState.value = fallbackHealth
    }
  }

  async function loadRuntimeState() {
    try {
      runtimeState.value = await fetchJson('/api/runtime')
    } catch (error) {
      runtimeState.value = fallbackRuntime
    }
  }

  async function loadServicesState() {
    try {
      const response = await fetchJson('/api/services')
      servicesState.value = response.services || []
    } catch (error) {
      servicesState.value = []
    }
  }

  async function loadWorkBoardState() {
    try {
      workBoardState.value = await fetchJson('/api/work-manager/board')
    } catch (error) {
      workBoardState.value = fallbackWorkBoard
    }
  }

  async function unlockWorkManager() {
    if (!workManagerPassword.value.trim()) {
      workManagerError.value = '비밀번호를 입력해야 합니다.'
      return
    }

    isUnlockingWorkManager.value = true
    workManagerError.value = ''
    workManagerMessage.value = ''
    try {
      const response = await fetchJson('/api/work-manager/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: workManagerPassword.value
        })
      })
      const session = resolveWorkManagerAuthSession(response)
      if (!session) {
        throw new Error('인증 응답에 유효한 세션 만료 시각이 없습니다.')
      }
      workManagerToken.value = session.token
      workManagerTokenExpiresAt.value = session.expiresAt
      workManagerPassword.value = ''
      workManagerMessage.value = response.message || 'Command gate unlocked'
      await loadWorkBoardState()
    } catch (error) {
      workManagerError.value = error.message || '비밀번호 확인에 실패했습니다.'
    } finally {
      isUnlockingWorkManager.value = false
    }
  }

  async function saveWorkTicketMetadata() {
    if (!selectedWorkTicket.value?.id) {
      metadataError.value = '먼저 수정할 티켓을 선택해야 합니다.'
      return
    }

    if (!hasActiveWorkManagerSession()) {
      metadataError.value = '먼저 command gate 를 열어야 메타데이터를 저장할 수 있습니다.'
      return
    }

    isSavingMetadata.value = true
    metadataError.value = ''
    metadataMessage.value = ''
    try {
      const response = await fetchJson(`/api/work-manager/tickets/${selectedWorkTicket.value.id}/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Work-Manager-Token': workManagerToken.value
        },
        body: JSON.stringify({
          targetVersion: metadataTargetVersion.value,
          priority: metadataPriority.value,
          dependencies: metadataDependencies.value
        })
      })
      metadataMessage.value = response.message || '티켓 메타데이터를 저장했습니다.'
      if (response.board) {
        workBoardState.value = response.board
      } else {
        await loadWorkBoardState()
      }
    } catch (error) {
      if (handleWorkManagerAuthorizationError(error, 'metadata')) {
        return
      }
      metadataError.value = error.message || '티켓 메타데이터 저장에 실패했습니다.'
    } finally {
      isSavingMetadata.value = false
    }
  }

  async function submitPresetCommand() {
    if (!selectedCommand.value) {
      workManagerError.value = '프리셋 액션을 선택해야 합니다.'
      return
    }

    if (!hasActiveWorkManagerSession()) {
      workManagerError.value = '먼저 command gate 를 열어야 합니다.'
      return
    }

    isRunningCommand.value = true
    workManagerError.value = ''
    workManagerMessage.value = ''
    try {
      const response = await fetchJson('/api/work-manager/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Work-Manager-Token': workManagerToken.value
        },
        body: JSON.stringify({
          action: selectedCommand.value,
          note: commandNote.value,
          relatedTicketId: selectedWorkTicket.value?.id || ''
        })
      })
      workManagerMessage.value = response.message || 'Preset command was queued'
      commandNote.value = ''
      await loadWorkBoardState()
    } catch (error) {
      if (handleWorkManagerAuthorizationError(error, 'command')) {
        return
      }
      workManagerError.value = error.message || '명령 실행에 실패했습니다.'
    } finally {
      isRunningCommand.value = false
    }
  }

  function logoutWorkManager() {
    clearWorkManagerSession()
    workManagerMessage.value = 'Command gate 를 잠갔습니다.'
  }

  function hasActiveWorkManagerSession() {
    if (!workManagerToken.value) {
      return false
    }
    if (isExpiredWorkManagerSession(workManagerTokenExpiresAt.value)) {
      lockWorkManagerSession('Command gate 세션이 만료되었습니다. 다시 인증해 주세요.')
      return false
    }
    return true
  }

  function handleWorkManagerAuthorizationError(error, target) {
    if (error?.status !== 401) {
      return false
    }

    const message = 'Command gate 세션이 만료되었거나 유효하지 않습니다. 다시 인증해 주세요.'
    lockWorkManagerSession(message)
    if (target === 'metadata') {
      metadataError.value = message
    }
    return true
  }

  function lockWorkManagerSession(message) {
    clearWorkManagerSession()
    workManagerMessage.value = ''
    workManagerError.value = message
  }

  function clearWorkManagerSession() {
    workManagerToken.value = ''
    workManagerTokenExpiresAt.value = ''
    if (typeof window !== 'undefined') {
      window.clearTimeout(workManagerExpiryTimer)
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      window.localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY)
    }
  }

  function scheduleWorkManagerExpiration() {
    if (typeof window === 'undefined') {
      return
    }

    window.clearTimeout(workManagerExpiryTimer)
    if (!workManagerToken.value) {
      return
    }

    const expiresAtMs = Date.parse(workManagerTokenExpiresAt.value)
    const remainingMs = expiresAtMs - Date.now()
    if (!Number.isFinite(expiresAtMs) || remainingMs <= 0) {
      lockWorkManagerSession('Command gate 세션이 만료되었습니다. 다시 인증해 주세요.')
      return
    }

    workManagerExpiryTimer = window.setTimeout(() => {
      lockWorkManagerSession('Command gate 세션이 만료되었습니다. 다시 인증해 주세요.')
    }, remainingMs)
  }

  function countWorkTicketsByStatus(status) {
    return (
      workBoardColumns.value.find((column) => column.status === status)?.tickets.length || 0
    )
  }

  function selectWorkTicket(ticketId) {
    selectedWorkTicketId.value = ticketId
  }

  function startTicketDrag(ticketId) {
    dragTicketId.value = ticketId
  }

  function dropIntoReady() {
    if (!dragTicketId.value) {
      return
    }
    if (!readyTicketIds.value.includes(dragTicketId.value)) {
      readyTicketIds.value = [...readyTicketIds.value, dragTicketId.value]
      persistReadyTicketIds(readyTicketIds.value)
    }
    dragTicketId.value = ''
  }

  function dropIntoBacklog() {
    if (!dragTicketId.value) {
      return
    }
    readyTicketIds.value = readyTicketIds.value.filter((ticketId) => ticketId !== dragTicketId.value)
    persistReadyTicketIds(readyTicketIds.value)
    dragTicketId.value = ''
  }

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.clearTimeout(workManagerExpiryTimer)
    }
  })

  return {
    selectedWorkTicketId,
    selectedCommand,
    commandNote,
    workManagerPassword,
    workManagerToken,
    workManagerTokenExpiresAt,
    workManagerMessage,
    workManagerError,
    metadataTargetVersion,
    metadataPriority,
    metadataDependencies,
    metadataMessage,
    metadataError,
    isUnlockingWorkManager,
    isRunningCommand,
    isSavingMetadata,
    dragTicketId,
    readyTicketIds,
    healthState,
    runtimeState,
    servicesState,
    workBoardState,
    workWorkerSummary,
    workPriorityPolicy,
    workPersistence,
    workBoardColumns,
    readyColumnTickets,
    workToneRows,
    allWorkTickets,
    selectedWorkTicket,
    workVersionSummary,
    workTargetVersionOptions,
    workVersionHeader,
    commandPresets,
    activityFeed,
    commandHistory,
    runtimeToneRows,
    runtimeNeedsAttention,
    loadHealthState,
    loadRuntimeState,
    loadServicesState,
    loadWorkBoardState,
    unlockWorkManager,
    saveWorkTicketMetadata,
    submitPresetCommand,
    logoutWorkManager,
    hasActiveWorkManagerSession,
    handleWorkManagerAuthorizationError,
    lockWorkManagerSession,
    clearWorkManagerSession,
    scheduleWorkManagerExpiration,
    countWorkTicketsByStatus,
    selectWorkTicket,
    startTicketDrag,
    dropIntoReady,
    dropIntoBacklog
  }
}
