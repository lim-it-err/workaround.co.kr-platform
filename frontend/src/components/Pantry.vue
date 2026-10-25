<script setup>
import { computed, ref } from 'vue'
import {
  PANTRY_SETS,
  filterSetsByTags,
  findDish,
  nearestSetFor,
  pantryTags,
  pickPantrySets,
  setTags
} from '../data/pantry/index.js'

const SHOPPING_STORAGE_KEY = 'pantry:shopping'
const HISTORY_STORAGE_KEY = 'pantry:history'
const TAG_STORAGE_KEY = 'pantry:tags'
const tagGroups = pantryTags()
const PRIMARY_GROUP_IDS = ['time', 'when', 'purpose']
const primaryTags = ['무알코올', ...tagGroups.filter((group) => PRIMARY_GROUP_IDS.includes(group.id)).flatMap((group) => group.tags)]
const extraTagGroups = tagGroups.filter((group) => !PRIMARY_GROUP_IDS.includes(group.id))
const validTags = new Set(tagGroups.flatMap((group) => group.tags))
const drinkTags = new Set(tagGroups.find((group) => group.id === 'drink')?.tags || [])

const dateKey = localDateKey(new Date())
const selectedTags = ref(normalizeStoredTags(readArray(TAG_STORAGE_KEY)))
const tagsExpanded = ref(false)
const offset = ref(0)
const manualSetId = ref('')
const seenSetIds = ref([])
const shoppingState = ref(readObject(SHOPPING_STORAGE_KEY))
const history = ref(readArray(HISTORY_STORAGE_KEY))
const stampMessage = ref('')

const recentSetIds = computed(() => {
  const today = new Date(`${dateKey}T12:00:00`)
  return history.value
    .filter((entry) => {
      if (!entry?.date || !entry?.setId) return false
      const elapsedDays = (today - new Date(`${entry.date}T12:00:00`)) / 86400000
      return elapsedDays >= 0 && elapsedDays < 7
    })
    .map((entry) => entry.setId)
})

const matchingSets = computed(() => filterSetsByTags(PANTRY_SETS, selectedTags.value))
const noTagMatches = computed(() => selectedTags.value.length > 0 && matchingSets.value.length === 0)
const nearest = computed(() => nearestSetFor(PANTRY_SETS, selectedTags.value))
const nearestSet = computed(() => nearest.value.set)
const emptyMessage = computed(() => {
  const missing = nearest.value.missing
  return missing ? `${missing}${hasBatchim(missing) ? '이' : '가'} 들어간 상은 아직 없어요` : ''
})
const eligibleSets = computed(() => {
  if (matchingSets.value.length) return matchingSets.value
  return nearestSet.value ? [nearestSet.value] : PANTRY_SETS
})
const hiddenSelectedTagCount = computed(() => selectedTags.value.filter((tag) => (
  tag !== '무알코올' && extraTagGroups.some((group) => group.tags.includes(tag))
)).length)

const recommendation = computed(() => {
  const avoided = new Set(recentSetIds.value)
  const allowed = eligibleSets.value.filter((set) => !avoided.has(set.id))
  const pool = allowed.length ? allowed : eligibleSets.value
  const poolIds = new Set(pool.map((set) => set.id))
  const excluded = PANTRY_SETS.filter((set) => !poolIds.has(set.id)).map((set) => set.id)
  const picked = pool.length >= 2
    ? pickPantrySets(dateKey, {
        exclude: excluded,
        offset: offset.value,
        alcohol: selectedTags.value.includes('무알코올') ? false : undefined
      })
    : { main: pool[0] }
  const manualSet = PANTRY_SETS.find((set) => set.id === manualSetId.value)
  const main = manualSet || picked.main || pool[offset.value % Math.max(1, pool.length)] || PANTRY_SETS[0]
  const supportingPool = pool.filter((set) => set.id !== main.id)
  const supporting = manualSet && supportingPool.length >= 2
    ? pickPantrySets(dateKey, {
        exclude: [...new Set([...excluded, main.id])],
        offset: offset.value,
        alcohol: selectedTags.value.includes('무알코올') ? false : undefined
      })
    : picked
  const preferred = preferredAlternatives(main, supportingPool, avoided)
  const quickCandidates = preferred.filter((set) => set.minutes <= 15).sort((a, b) => a.cost - b.cost)
  const quick = validAlternative(supporting.quick, main)
    ? supporting.quick
    : quickCandidates[0] || [...preferred].sort((a, b) => a.minutes - b.minutes)[0]
  const nightCandidate = validAlternative(supporting.night, main, quick)
    ? supporting.night
    : preferred.find((set) => set.id !== quick?.id && set.when.includes('late'))
      || preferred.find((set) => set.id !== quick?.id && set.pairing.type !== '무알코올')
      || preferred.find((set) => set.id !== quick?.id)
  return {
    main,
    quick,
    night: nightCandidate,
    quickIsFallback: !supportingPool.some((set) => set.minutes <= 15)
  }
})

const mainSet = computed(() => recommendation.value.main)
const dishRows = computed(() => {
  const set = mainSet.value
  return [
    { kind: '메인', dish: findDish(set.main) },
    ...set.sides.map((id) => ({ kind: '반찬', dish: findDish(id) })),
    ...(set.soup ? [{ kind: '국', dish: findDish(set.soup) }] : [])
  ].filter((row) => row.dish)
})
const alcoholFree = computed(() => selectedTags.value.includes('무알코올'))
const stampedToday = computed(() => history.value.some(
  (entry) => entry.date === dateKey && entry.setId === mainSet.value.id
))

function localDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 공간을 쓸 수 없어도 추천과 읽기 흐름은 유지한다.
  }
}

function normalizeStoredTags(tags) {
  const normalized = [...new Set(tags.filter((tag) => validTags.has(tag)))]
  if (!normalized.includes('무알코올')) return normalized
  return normalized.filter((tag) => tag === '무알코올' || !drinkTags.has(tag))
}

function hasBatchim(text) {
  const code = String(text).trim().charCodeAt(String(text).trim().length - 1)
  return code >= 0xAC00 && code <= 0xD7A3 && (code - 0xAC00) % 28 !== 0
}

function tagOverlap(set) {
  const tags = new Set(setTags(set))
  return selectedTags.value.reduce((count, tag) => count + Number(tags.has(tag)), 0)
}

function preferredAlternatives(main, preferredSets, avoided) {
  const candidates = [...preferredSets, ...PANTRY_SETS.filter((set) => !avoided.has(set.id))]
  const seen = new Set([main.id])
  return candidates
    .filter((set) => {
      if (seen.has(set.id)) return false
      seen.add(set.id)
      return true
    })
    .map((set, index) => ({ set, index, overlap: tagOverlap(set) }))
    .sort((a, b) => b.overlap - a.overlap || a.index - b.index)
    .map((entry) => entry.set)
}

function validAlternative(set, ...excludedSets) {
  return Boolean(set && excludedSets.every((excluded) => !excluded || excluded.id !== set.id))
}

function visibleTags(group) {
  if (group.id === 'drink') {
    if (alcoholFree.value) return []
    return group.tags.filter((tag) => tag !== '무알코올')
  }
  return group.tags
}

function chooseAnother() {
  manualSetId.value = ''
  const availableCount = Math.max(1, eligibleSets.value.length)
  const previousId = mainSet.value.id
  let attempts = 0
  do {
    offset.value = (offset.value + 1) % availableCount
    attempts += 1
  } while (
    attempts < availableCount
    && (mainSet.value.id === previousId || seenSetIds.value.includes(mainSet.value.id))
  )
  seenSetIds.value = [...seenSetIds.value, previousId].slice(-Math.max(0, availableCount - 1))
  stampMessage.value = ''
}

function clearTags() {
  selectedTags.value = []
  persist(TAG_STORAGE_KEY, selectedTags.value)
}

function toggleTag(tag) {
  if (selectedTags.value.includes(tag)) {
    selectedTags.value = selectedTags.value.filter((selected) => selected !== tag)
  } else if (tag === '무알코올') {
    selectedTags.value = [...selectedTags.value.filter((selected) => !drinkTags.has(selected)), tag]
  } else if (drinkTags.has(tag)) {
    selectedTags.value = [...selectedTags.value.filter((selected) => selected !== '무알코올'), tag]
  } else {
    selectedTags.value = [...selectedTags.value, tag]
  }
  persist(TAG_STORAGE_KEY, selectedTags.value)
  offset.value = 0
  manualSetId.value = ''
  seenSetIds.value = []
  stampMessage.value = ''
}

function chooseSet(set) {
  if (!set) return
  manualSetId.value = set.id
  stampMessage.value = ''
}

function shoppingKey(item) {
  return `${mainSet.value.id}:${item}`
}

function toggleShopping(item) {
  const key = shoppingKey(item)
  shoppingState.value = { ...shoppingState.value, [key]: !shoppingState.value[key] }
  persist(SHOPPING_STORAGE_KEY, shoppingState.value)
}

function stampMeal() {
  if (stampedToday.value) return
  manualSetId.value = mainSet.value.id
  history.value = [
    ...history.value.filter((entry) => !(entry.date === dateKey && entry.setId === mainSet.value.id)),
    { date: dateKey, setId: mainSet.value.id, eatenAt: new Date().toISOString() }
  ]
  persist(HISTORY_STORAGE_KEY, history.value)
  stampMessage.value = '오늘의 식탁에 기록했습니다.'
}
</script>

<template>
  <main class="pantry-page line-p" aria-labelledby="pantry-title">
    <nav class="pantry-tag-picker" aria-label="한 상 태그">
      <div class="pantry-filter-primary">
        <div class="pantry-filters" aria-label="무알코올과 상황 태그">
          <button
            v-for="tag in primaryTags"
            :key="tag"
            type="button"
            class="pantry-chip"
            :class="{ active: selectedTags.includes(tag) }"
            :aria-pressed="selectedTags.includes(tag)"
            @click="toggleTag(tag)"
          >{{ tag }}</button>
        </div>
        <button
          type="button"
          class="pantry-tags-toggle"
          :class="{ active: hiddenSelectedTagCount > 0 }"
          :aria-expanded="tagsExpanded"
          @click="tagsExpanded = !tagsExpanded"
        >
          {{ tagsExpanded ? '태그 접기' : '태그 더 보기' }}
          <small v-if="!tagsExpanded && hiddenSelectedTagCount">{{ hiddenSelectedTagCount }}</small>
        </button>
      </div>
      <div v-if="tagsExpanded" class="pantry-tag-groups">
        <section
          v-for="group in extraTagGroups"
          v-show="visibleTags(group).length"
          :key="group.id"
          class="pantry-tag-group"
        >
          <h2>{{ group.label }}</h2>
          <div class="pantry-filter-list" :aria-label="`${group.label} 태그`">
            <button
              v-for="tag in visibleTags(group)"
              :key="tag"
              type="button"
              class="pantry-chip"
              :class="{ active: selectedTags.includes(tag) }"
              :aria-pressed="selectedTags.includes(tag)"
              @click="toggleTag(tag)"
            >{{ tag }}</button>
          </div>
        </section>
      </div>
    </nav>

    <p v-if="noTagMatches" class="pantry-empty-result" role="status">
      <template v-if="nearestSet">이 조합은 아직 없어요 — 가까운 상: <strong>{{ nearestSet.title }}</strong></template>
      <template v-else>
        {{ emptyMessage }}
        <button type="button" class="pantry-chip pantry-empty-clear" @click="clearTags">태그 지우기</button>
      </template>
    </p>

    <section class="pantry-hero" aria-live="polite">
      <p class="pantry-kicker">오늘의 한 상</p>
      <h1 id="pantry-title">{{ mainSet.title }}</h1>
      <p class="pantry-mood">{{ mainSet.mood }}</p>
      <p class="pantry-quip" :title="mainSet.quip">{{ mainSet.quip }}</p>
      <dl class="pantry-facts">
        <div><dt>시간</dt><dd>{{ mainSet.minutes }}분</dd></div>
        <div><dt>한 끼</dt><dd>약 {{ mainSet.cost.toLocaleString('ko-KR') }}원</dd></div>
      </dl>
      <p class="pantry-pairing">
        <strong>{{ alcoholFree ? '곁들임' : '페어링' }}</strong>
        {{ alcoholFree ? mainSet.pairing.alt : mainSet.pairing.drink }}
      </p>
      <button type="button" class="pantry-next" @click="chooseAnother">다른 상 보기</button>
    </section>

    <section class="pantry-alternatives" aria-label="빠른 대안">
      <button type="button" class="pantry-alternative" @click="chooseSet(recommendation.quick)">
        <span>{{ recommendation.quickIsFallback ? '빠른 대안' : '10분 대안' }}</span>
        <strong>{{ recommendation.quick?.title }}</strong>
        <small>{{ recommendation.quick?.minutes }}분 · 약 {{ recommendation.quick?.cost.toLocaleString('ko-KR') }}원</small>
      </button>
      <button type="button" class="pantry-alternative" @click="chooseSet(recommendation.night)">
        <span>야식·한잔</span>
        <strong>{{ recommendation.night?.title }}</strong>
        <small>{{ recommendation.night?.minutes }}분 · 약 {{ recommendation.night?.cost.toLocaleString('ko-KR') }}원</small>
      </button>
    </section>

    <details class="pantry-detail">
      <summary>상 펼치기</summary>
      <p class="pantry-quip pantry-detail-quip" :title="mainSet.quip">{{ mainSet.quip }}</p>
      <p class="pantry-note">{{ mainSet.note }}</p>

      <section class="pantry-dishes" aria-labelledby="pantry-dishes-title">
        <h2 id="pantry-dishes-title">차림</h2>
        <details v-for="row in dishRows" :key="row.dish.id" class="pantry-dish-row">
          <summary><span>{{ row.kind }}</span><strong>{{ row.dish.name }}</strong><small>{{ row.dish.minutes }}분</small></summary>
          <div class="pantry-dish-body">
            <section>
              <h3>재료</h3>
              <ul><li v-for="ingredient in row.dish.ingredients" :key="ingredient">{{ ingredient }}</li></ul>
            </section>
            <section>
              <h3>순서</h3>
              <ol><li v-for="step in row.dish.steps" :key="step">{{ step }}</li></ol>
            </section>
          </div>
        </details>
      </section>

      <section class="pantry-shopping" aria-labelledby="pantry-shopping-title">
        <h2 id="pantry-shopping-title">장보기 목록</h2>
        <label v-for="item in mainSet.shopping" :key="item">
          <input
            type="checkbox"
            :checked="Boolean(shoppingState[shoppingKey(item)])"
            @change="toggleShopping(item)"
          >
          <span>{{ item }}</span>
        </label>
      </section>

      <footer class="pantry-stamp">
        <button type="button" :disabled="stampedToday" @click="stampMeal">
          {{ stampedToday ? '오늘 기록됨' : '오늘 먹었음' }}
        </button>
        <p v-if="stampMessage" role="status">{{ stampMessage }}</p>
      </footer>
    </details>
  </main>
</template>
