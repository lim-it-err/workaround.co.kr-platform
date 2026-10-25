<script setup>
// 운영 노트 — Work Manager 첫 화면 (TKT-195 · D-033). 콘텐츠는 data/workNotes/operatingModel.js (PM 작성).
import { OPERATING_NOTES, OPERATING_NOTES_UPDATED } from '../data/workNotes/operatingModel.js'

const STATUS_CLASS = { 확정: 'is-confirmed', 제안: 'is-proposed', '할 일': 'is-todo' }
</script>

<template>
  <section class="work-notes line-w" aria-labelledby="work-notes-title">
    <header class="work-notes-head">
      <h1 id="work-notes-title">운영 노트</h1>
      <small>갱신 {{ OPERATING_NOTES_UPDATED }}</small>
    </header>

    <article v-for="note in OPERATING_NOTES" :key="note.id" class="work-note" :data-note-id="note.id">
      <div class="work-note-titleline">
        <h2>{{ note.title }}</h2>
        <span class="work-note-badge" :class="STATUS_CLASS[note.status]">{{ note.status }}</span>
      </div>
      <p v-if="note.lead" class="work-note-lead">{{ note.lead }}</p>
      <ol v-if="note.flow?.length" class="work-note-flow" :aria-label="`${note.title} 흐름`">
        <li v-for="step in note.flow" :key="step">{{ step }}</li>
      </ol>
      <ul class="work-note-points">
        <li v-for="point in note.points" :key="point">{{ point }}</li>
      </ul>
    </article>
  </section>
</template>
