<script setup>
import StationHeader from '../StationHeader.vue'

defineProps({
  session: { type: Object, required: true },
  dayNumber: { type: Number, required: true }
})

defineEmits(['back', 'exit'])

const checklistLabels = {
  airport: '공항에서',
  hotel: '숙소에서',
  rental: '차량 인수',
  night: '야경 전에'
}
</script>

<template>
  <section class="feature-shell line-v voyage-day-session">
    <StationHeader
      line-class="line-v"
      :station-code="`V02-${dayNumber}`"
      :title="`${dayNumber}일차 상세`"
      title-en="FIELD SESSION"
      :status="session.title"
      status-tone="ok"
      summary="시간표 · 체크 · 상황별 대응"
      @exit="$emit('exit')"
    >
      <template #actions>
        <button type="button" class="btn btn-ghost" @click="$emit('back')">같은 날짜로 돌아가기</button>
      </template>
    </StationHeader>

    <section class="section-block session-success" aria-labelledby="session-success-title">
      <p class="eyebrow">SUCCESS CONDITION</p>
      <h3 id="session-success-title">오늘의 성공 조건</h3>
      <p>{{ session.success }}</p>
    </section>

    <section class="section-block session-timeline" aria-labelledby="session-timeline-title">
      <div class="section-head">
        <div>
          <p class="eyebrow">TIMELINE</p>
          <h3 id="session-timeline-title">현장 시간표</h3>
        </div>
        <span class="num">{{ session.date.slice(5).replace('-', '/') }}</span>
      </div>

      <ol>
        <li v-for="item in session.timeline" :key="`${item.time}-${item.title}`">
          <time>{{ item.time }}</time>
          <div>
            <strong>{{ item.title }}</strong>
            <p>{{ item.detail }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="session-check-grid" aria-label="현장 체크리스트">
      <article v-for="(items, group) in session.checklist" :key="group" class="section-block">
        <p class="eyebrow">CHECK</p>
        <h3>{{ checklistLabels[group] || group }}</h3>
        <ul>
          <li v-for="item in items" :key="item">{{ item }}</li>
        </ul>
      </article>
    </section>

    <section class="section-block session-branches" aria-labelledby="session-branches-title">
      <div class="section-head">
        <div>
          <p class="eyebrow">IF / THEN</p>
          <h3 id="session-branches-title">상황별 대응</h3>
        </div>
      </div>
      <dl>
        <div v-for="branch in session.branches" :key="branch.situation">
          <dt>{{ branch.situation }}</dt>
          <dd>{{ branch.action }}</dd>
        </div>
      </dl>
    </section>

    <aside v-if="session.optional || session.reverify" class="section-block session-note">
      <p class="eyebrow">LAST CHECK</p>
      <h3>{{ session.reverify ? '현장에서 다시 확인' : '선택 분기' }}</h3>
      <p>{{ session.reverify || session.optional }}</p>
    </aside>
  </section>
</template>

<style scoped>
.voyage-day-session,
.voyage-day-session > * {
  min-width: 0;
}

.session-success {
  border-left: 4px solid var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, var(--panel));
}

.session-success h3,
.session-timeline h3,
.session-check-grid h3,
.session-branches h3,
.session-note h3 {
  margin: 0;
  color: var(--text);
}

.session-success > p:last-child,
.session-note > p:last-child {
  margin: 10px 0 0;
  color: var(--text-2);
  line-height: 1.65;
}

.session-timeline ol {
  display: grid;
  gap: 0;
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
}

.session-timeline li {
  position: relative;
  display: grid;
  grid-template-columns: minmax(94px, 0.28fr) minmax(0, 1fr);
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}

.session-timeline li:last-child {
  border-bottom: 0;
}

.session-timeline time {
  color: var(--accent-text);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.session-timeline strong {
  color: var(--text);
}

.session-timeline p {
  margin: 5px 0 0;
  color: var(--text-2);
  line-height: 1.55;
}

.session-check-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.session-check-grid ul {
  display: grid;
  gap: 8px;
  margin: 14px 0 0;
  padding-left: 18px;
  color: var(--text-2);
}

.session-check-grid li::marker {
  color: var(--accent);
}

.session-branches dl {
  display: grid;
  gap: 8px;
  margin: 16px 0 0;
}

.session-branches dl > div {
  display: grid;
  grid-template-columns: minmax(110px, 0.26fr) minmax(0, 1fr);
  gap: 14px;
  padding: 11px 12px;
  border-radius: 10px;
  background: var(--panel-2);
}

.session-branches dt {
  color: var(--accent-text);
  font-weight: 800;
}

.session-branches dd {
  margin: 0;
  color: var(--text-2);
}

.session-note {
  border-style: dashed;
}

@media (max-width: 760px) {
  .session-timeline li,
  .session-check-grid,
  .session-branches dl > div {
    grid-template-columns: minmax(0, 1fr);
  }

  .session-timeline li {
    gap: 5px;
  }
}
</style>
