<script setup>
import { reactive, toRefs } from 'vue'
import WorkNotes from '../WorkNotes.vue'

const props = defineProps({
  // useWorkManager() 의 반환값(상태·함수 묶음).
  manager: { type: Object, required: true },
  isStaticMode: { type: Boolean, default: false }
})

const WORK_ROADMAP_ITEMS = [
  {
    version: 'v0.4.0',
    title: '운영 포털 구조 복구',
    summary: 'Work Manager 메타데이터, command gate, 페이지 분리'
  },
  {
    version: 'v0.5.0',
    title: '시뮬레이션 포털 확장',
    summary: '택시 시뮬레이터 진입, worker 가시화, DB 준비'
  },
  {
    version: '인프라 / 잡무',
    title: '기반 정렬',
    summary: '툴체인, 호스팅, 문서/브랜치 정리'
  }
]

function formatTimestamp(value) {
  if (!value) {
    return ''
  }
  try {
    return new Date(value).toLocaleString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return value
  }
}

const {
  workToneRows,
  workVersionSummary,
  workVersionHeader,
  workWorkerSummary,
  workPriorityPolicy,
  workPersistence,
  workBoardColumns,
  workTargetVersionOptions,
  selectedWorkTicket,
  commandPresets,
  activityFeed,
  commandHistory,
  selectedCommand,
  commandNote,
  workManagerPassword,
  workManagerToken,
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
  selectWorkTicket,
  startTicketDrag,
  dropIntoReady,
  dropIntoBacklog,
  unlockWorkManager,
  logoutWorkManager,
  saveWorkTicketMetadata,
  submitPresetCommand
} = toRefs(reactive(props.manager))
</script>

<template>
  <section class="feature-shell tone-page tone-work-page line-w">
    <WorkNotes />
    <!-- D-033: 정적 공개본엔 백엔드가 없어 실행 영역을 접는다(API 요청 0). 라이브에서는 기존 영역이 비밀번호 게이트와 함께 그대로. -->
    <p v-if="isStaticMode" class="work-ops-collapsed">집 PC 연결 시 사용</p>
    <template v-else>
    <div class="tone-page-intro">
      <section class="tone-page-hero line-w">
        <div class="tone-hero-topline">
          <small>지금 볼 것</small>
          <span>보호 구역</span>
        </div>
        <h2>검토 대기 {{ workToneRows[0].count }}건</h2>
        <p>결정이 필요한 작업만 앞에 둡니다.</p>
      </section>

      <div class="tone-status-list" aria-label="작업 상태 요약">
        <div v-for="item in workToneRows" :key="item.status" class="tone-status-row">
          <span class="tone-status-dot" :class="{ wait: item.status !== 'started' }" aria-hidden="true"></span>
          <div>
            <strong>{{ item.label }} {{ item.count }}건</strong>
            <small>{{ item.helper }}</small>
          </div>
          <span>{{ item.shortStatus }}</span>
        </div>
      </div>
    </div>

    <details class="tone-support-details">
      <summary>버전·작업자·저장 기준</summary>
      <div class="tone-support-details__body">
    <section class="section-block">
      <div class="section-head">
        <div>
          <p class="eyebrow">목표 버전</p>
          <h3>목표 버전과 로드맵 요약</h3>
        </div>
        <span>`v0.4.0` 레일 안의 작업과 이후 후보 버전을 한 화면에서 읽습니다.</span>
      </div>

      <div class="version-strip">
        <article v-for="[version, count] in workVersionSummary" :key="version" class="version-chip-card">
          <strong>{{ version }}</strong>
          <small>티켓 {{ count }}건</small>
        </article>
      </div>

      <div class="version-strip version-focus-strip">
        <article class="version-chip-card version-focus-card">
          <strong>{{ workVersionHeader.focusVersion }}</strong>
          <small>현재 집중</small>
        </article>
        <article class="version-chip-card">
          <strong>{{ workVersionHeader.developmentCeiling }}</strong>
          <small>개발 상한</small>
        </article>
        <article class="version-chip-card">
          <strong>{{ workVersionHeader.activeRange }}</strong>
          <small>활성 범위</small>
        </article>
        <article class="version-chip-card">
          <strong>{{ workVersionHeader.selectedPriority }}</strong>
          <small>선택 티켓 우선순위</small>
        </article>
      </div>

      <div class="roadmap-summary-grid">
        <article v-for="item in WORK_ROADMAP_ITEMS" :key="item.version" class="roadmap-summary-card">
          <span>{{ item.version }}</span>
          <strong>{{ item.title }}</strong>
          <p>{{ item.summary }}</p>
        </article>
      </div>
    </section>

    <section class="section-block split-layout">
      <article class="surface-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">담당 현황</p>
            <h3>진행 중 담당</h3>
          </div>
          <span>Ready 이후 실제 worker 소유 구간을 카드로 분리해 보여줍니다.</span>
        </div>

        <div class="crew-grid">
          <article v-for="crew in workWorkerSummary" :key="crew.workerId" class="crew-card line-w">
            <div class="fleet-top">
              <strong>{{ crew.workerId }}</strong>
              <span>{{ crew.status }}</span>
            </div>
            <p>{{ crew.focus }}</p>
            <small>{{ (crew.currentTicketIds || []).join(', ') || '현재 선점 없음' }}</small>
          </article>
        </div>
      </article>

      <article class="surface-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">우선순위 정책</p>
            <h3>자동/수동 경계</h3>
          </div>
        </div>

        <div class="prototype-rule-list">
          <article class="prototype-rule-card">
            <strong>큐 출처</strong>
            <p>{{ workPriorityPolicy.queueSource }}</p>
          </article>
          <article class="prototype-rule-card">
            <strong>자동</strong>
            <p>{{ (workPriorityPolicy.automaticRange || []).join(', ') }}</p>
          </article>
          <article class="prototype-rule-card">
            <strong>수동</strong>
            <p>{{ (workPriorityPolicy.manualRange || []).join(', ') }}</p>
          </article>
        </div>
      </article>
    </section>

    <section class="section-block split-layout">
      <article class="surface-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">저장 방식</p>
            <h3>파일 저장과 DB 전환 기준</h3>
          </div>
        </div>

        <div class="info-stack">
          <article>
            <span>방식</span>
            <strong>{{ workPersistence.mode }}</strong>
          </article>
          <article>
            <span>감사 파일</span>
            <strong>{{ workPersistence.filePath }}</strong>
          </article>
          <article>
            <span>대상 DB</span>
            <strong>{{ workPersistence.targetDatabase }}</strong>
          </article>
          <article>
            <span>감사 기록</span>
            <strong>{{ workPersistence.auditEventCount }}</strong>
          </article>
        </div>

        <p class="status-copy">
          마지막 감사 시각 {{ formatTimestamp(workPersistence.lastAuditAt) || '없음' }}
        </p>
      </article>

      <article class="surface-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">다음 작업 예상</p>
            <h3>우선순위 반응 예상</h3>
          </div>
        </div>

        <ul class="check-list">
          <li v-for="item in workPriorityPolicy.nextCandidates || []" :key="item">{{ item }}</li>
        </ul>
      </article>
    </section>

      </div>
    </details>

    <details class="tone-work-manager-details">
      <summary>전체 작업 보드·지시</summary>
      <section class="section-block work-layout tone-work-layout">
      <div class="work-board">
        <article
          v-for="column in workBoardColumns"
          :key="column.status"
          class="lane-card"
          @dragover.prevent
          @drop.prevent="column.status === 'ready' ? dropIntoReady() : column.status === 'backlog' ? dropIntoBacklog() : null"
        >
          <div class="lane-head">
            <div>
              <strong>{{ column.label }}</strong>
              <small>티켓 {{ column.tickets.length }}건</small>
            </div>
            <span class="lane-status">{{ column.helper }}</span>
          </div>

          <div class="lane-body">
            <button
              v-for="ticket in column.tickets"
              :key="ticket.id"
              type="button"
              class="ticket-card"
              :class="{ active: selectedWorkTicket?.id === ticket.id }"
              :draggable="column.status === 'backlog' || column.status === 'ready'"
              @dragstart="startTicketDrag(ticket.id)"
              @click="selectWorkTicket(ticket.id)"
            >
              <div class="ticket-top">
                <strong>{{ ticket.id }}</strong>
                <span>{{ ticket.priority }}</span>
              </div>
              <p>{{ ticket.title }}</p>
              <small>{{ ticket.targetVersion }} · {{ ticket.progressDecision }}</small>
            </button>
          </div>
        </article>
      </div>

      <aside class="detail-panel">
        <div class="section-head">
          <div>
            <h3>{{ selectedWorkTicket?.id || '선택 없음' }}</h3>
          </div>
        </div>

        <div v-if="selectedWorkTicket" class="detail-stack">
          <article>
            <span>레인</span>
            <strong>{{ selectedWorkTicket.lane }}</strong>
          </article>
          <article>
            <span>목표 버전</span>
            <strong>{{ selectedWorkTicket.targetVersion }}</strong>
          </article>
          <article class="detail-editor">
            <span>목표 버전 수정</span>
            <select v-model="metadataTargetVersion" class="select-input" aria-label="목표 버전 수정">
              <option v-for="version in workTargetVersionOptions" :key="version" :value="version">
                {{ version }}
              </option>
            </select>
          </article>
          <article>
            <span>우선순위</span>
            <strong>{{ selectedWorkTicket.priority || '없음' }}</strong>
          </article>
          <article class="detail-editor">
            <span>우선순위 수정</span>
            <select v-model="metadataPriority" class="select-input" aria-label="우선순위 수정">
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
              <option value="P4">P4</option>
              <option value="P5">P5</option>
            </select>
          </article>
          <article>
            <span>진행 판정</span>
            <strong>{{ selectedWorkTicket.progressDecision || '없음' }}</strong>
          </article>
          <article>
            <span>목표</span>
            <p>{{ selectedWorkTicket.goal || '없음' }}</p>
          </article>
          <article>
            <span>작업 항목</span>
            <p>{{ selectedWorkTicket.workItems || '없음' }}</p>
          </article>
          <article>
            <span>산출물</span>
            <p>{{ selectedWorkTicket.deliverables || '없음' }}</p>
          </article>
          <article>
            <span>선행 조건</span>
            <p>{{ selectedWorkTicket.prerequisites || '없음' }}</p>
          </article>
          <article>
            <span>의존성</span>
            <p>{{ selectedWorkTicket.dependencies || selectedWorkTicket.prerequisites || '없음' }}</p>
          </article>
          <article class="detail-editor detail-editor-wide">
            <span>의존성 수정</span>
            <textarea
              v-model="metadataDependencies"
              class="textarea-input"
              rows="4"
              aria-label="의존성 수정"
              placeholder="TKT-039 또는 선행 티켓/의존성 메모를 적습니다."
            ></textarea>
          </article>
          <article>
            <span>질문</span>
            <p>{{ selectedWorkTicket.questions || '없음' }}</p>
          </article>
          <article>
            <span>검토 메모</span>
            <p>{{ selectedWorkTicket.reviewMemo || '없음' }}</p>
          </article>
          <article>
            <span>PR 준비 메모</span>
            <p>{{ selectedWorkTicket.prPreparationMemo || '없음' }}</p>
          </article>
          <article>
            <span>메모</span>
            <p>{{ selectedWorkTicket.notes || '없음' }}</p>
          </article>
        </div>

        <div v-if="selectedWorkTicket" class="detail-actions">
          <p class="status-copy" :class="{ ok: !!workManagerToken, error: !workManagerToken }">
            {{ workManagerToken ? 'command gate 가 열려 있어 메타데이터를 저장할 수 있습니다.' : '메타데이터 저장은 command gate 를 연 뒤에만 가능합니다.' }}
          </p>
          <div class="command-actions">
            <button type="button" class="primary-button" :disabled="isSavingMetadata || !workManagerToken" @click="saveWorkTicketMetadata">
              {{ isSavingMetadata ? '저장 중...' : '메타데이터 저장' }}
            </button>
          </div>
          <p v-if="metadataMessage" class="status-copy ok">{{ metadataMessage }}</p>
          <p v-if="metadataError" class="status-copy error">{{ metadataError }}</p>
        </div>
      </aside>

      <aside class="command-panel">
        <div class="section-head">
          <div>
            <h3>작업 지시</h3>
          </div>
        </div>

        <div class="auth-panel">
          <label class="input-block">
            <span>공유 비밀번호</span>
            <input
              v-model="workManagerPassword"
              class="text-input"
              type="password"
              placeholder="command gate 비밀번호"
            />
          </label>
          <div class="command-actions">
            <button type="button" class="primary-button" :disabled="isUnlockingWorkManager" @click="unlockWorkManager">
              {{ isUnlockingWorkManager ? '확인 중...' : 'gate 열기' }}
            </button>
            <button v-if="workManagerToken" type="button" class="ghost-button" @click="logoutWorkManager">
              잠그기
            </button>
          </div>
          <p v-if="workManagerMessage" class="status-copy ok">{{ workManagerMessage }}</p>
          <p v-if="workManagerError" class="status-copy error">{{ workManagerError }}</p>
        </div>

        <div class="preset-column">
          <button
            v-for="preset in commandPresets"
            :key="preset.action"
            type="button"
            class="command-card"
            :class="{ active: selectedCommand === preset.action }"
            @click="selectedCommand = preset.action"
          >
            <strong>{{ preset.label }}</strong>
            <p>{{ preset.description }}</p>
          </button>
        </div>

        <label class="input-block">
          <span>메모</span>
          <textarea
            v-model="commandNote"
            class="textarea-input"
            rows="4"
            placeholder="지금까지 사용자와 AI가 합의한 맥락을 짧게 남깁니다."
          ></textarea>
        </label>

        <div class="command-actions">
          <button
            type="button"
            class="primary-button"
            :disabled="isRunningCommand || !selectedCommand || !workManagerToken"
            @click="submitPresetCommand"
          >
            {{ isRunningCommand ? '큐 등록 중...' : '미리 정한 명령 전송' }}
          </button>
        </div>

        <div class="feed-block">
          <strong>활동 기록</strong>
          <article v-for="entry in activityFeed.slice(0, 6)" :key="entry.id" class="activity-entry">
            <div class="feed-meta">
              <span>{{ entry.type }}</span>
              <small>{{ formatTimestamp(entry.timestamp) }}</small>
            </div>
            <p>{{ entry.title }}</p>
            <small>{{ entry.summary }}</small>
          </article>
          <article v-for="entry in commandHistory.slice(0, 3)" :key="entry.id" class="activity-entry">
            <div class="feed-meta">
              <span>명령</span>
              <small>{{ formatTimestamp(entry.createdAt) }}</small>
            </div>
            <p>{{ entry.label }}</p>
            <small>{{ entry.note || entry.message }}</small>
          </article>
        </div>
      </aside>
      </section>
    </details>
    </template>
  </section>
</template>
