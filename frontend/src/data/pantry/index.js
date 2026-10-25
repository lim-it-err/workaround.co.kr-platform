import { PANTRY_DISHES, findDish } from './dishes.js'
import { PANTRY_SETS, findSet } from './sets.js'

export { PANTRY_DISHES, PANTRY_SETS, findDish, findSet }

// 태그 묶음 — 칩 6묶음 36개(TKT-212). 세트 tags 에는 칩에 있는 태그만 둔다.
// 시간 태그는 tags 에 쓰지 않고 minutes 로 계산한다(setTags).
export const PANTRY_TAG_GROUPS = [
  { id: 'ingredient', label: '재료', tags: ['돼지고기', '닭', '생선·회', '계란', '두부', '김치', '면', '채소', '국물'] },
  { id: 'time', label: '시간', tags: ['15분 이내', '25분 이내', '30분 이상'] },
  { id: 'when', label: '때·날씨', tags: ['평일', '주말', '야식', '비오는날', '더운날', '추운날'] },
  { id: 'purpose', label: '목적', tags: ['해장', '다이어트', '손님', '월급날', '한잔'] },
  { id: 'life', label: '자취', tags: ['한그릇', '설거지적음', '도시락', '냉동가능', '냉장고털이', '편의점'] },
  { id: 'drink', label: '술', tags: ['맥주', '소주', '막걸리', '하이볼', '와인', '사케', '무알코올'] },
]
export function timeTagOf(minutes) {
  if (minutes <= 15) return '15분 이내'
  if (minutes <= 25) return '25분 이내'
  return '30분 이상'
}
// 세트가 가진 모든 태그(직접 쓴 태그 + minutes 로 계산한 시간 태그)
export function setTags(set) {
  return [...(set.tags || []), timeTagOf(set.minutes)]
}
export function pantryTags() {
  const used = new Set(PANTRY_SETS.flatMap((set) => setTags(set)))
  return PANTRY_TAG_GROUPS.map((group) => ({ ...group, tags: group.tags.filter((tag) => used.has(tag)) })).filter((group) => group.tags.length)
}
export function filterSetsByTags(sets, selected = []) {
  if (!selected.length) return sets
  return sets.filter((set) => {
    const tags = setTags(set)
    return selected.every((tag) => tags.includes(tag))
  })
}
/**
 * AND 결과가 0건일 때 보여 줄 가까운 상. 고른 재료 태그를 하나 이상 담은 세트에서만 겹침 최대(동률은 기존 순서)로 고른다.
 * 그런 세트가 없으면 set 은 null, missing 은 첫 재료.
 */
export function nearestSetFor(sets, selected = []) {
  const ingredientTags = PANTRY_TAG_GROUPS.find((group) => group.id === 'ingredient').tags
  const picked = selected.filter((tag) => ingredientTags.includes(tag))
  const overlap = (set) => { const tags = setTags(set); return selected.reduce((n, tag) => n + Number(tags.includes(tag)), 0) }
  const pool = picked.length ? sets.filter((set) => picked.some((tag) => setTags(set).includes(tag))) : sets
  if (!pool.length) return { set: null, missing: picked[0] }
  const best = pool.map((set, index) => ({ set, index, n: overlap(set) })).sort((x, y) => y.n - x.n || x.index - y.index)[0]
  return { set: best.set, missing: null }
}

// 날짜 시드 — 같은 날에는 같은 추천 (design/pantry-spec.md §2)
function seedFromKey(key) {
  let h = 2166136261
  for (const ch of String(key)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0 }
  return h
}
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) >>> 0
    let t = seed
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function contextTags(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`)
  const month = date.getMonth() + 1
  const day = date.getDay()
  const tags = [day === 0 || day === 6 ? 'weekend' : 'weekday']
  if (month >= 9 && month <= 11) tags.push('autumn', 'cold')
  else if (month === 12 || month <= 2) tags.push('cold')
  else if (month >= 6 && month <= 8) tags.push('hot')
  if (date.getDate() >= 24 && date.getDate() <= 27) tags.push('payday')
  return tags
}

function score(set, tags, options) {
  let s = set.when.filter((w) => tags.includes(w)).length
  if (options.mood && set.when.includes(options.mood)) s += 3
  if (options.budget && set.cost > options.budget) s -= 2
  if (options.alcohol === false && set.pairing.type !== '무알코올') s -= 0 // 술 정보는 대안만 보여 주므로 감점 없음
  return s
}

/**
 * 오늘의 한 상 1 · 10분 대안 1 · 야식/한잔 1 을 고른다.
 * @param {string} dateKey YYYY-MM-DD
 * @param {{ mood?: string, budget?: number, alcohol?: boolean, exclude?: string[], offset?: number }} options
 */
export function pickPantrySets(dateKey, options = {}) {
  const tags = contextTags(dateKey)
  const rand = mulberry32(seedFromKey(dateKey))
  const exclude = new Set(options.exclude || [])
  const ranked = PANTRY_SETS
    .filter((set) => !exclude.has(set.id))
    .map((set) => ({ set, score: score(set, tags, options) + rand() * 0.9 }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.set)
  const offset = Math.max(0, options.offset || 0)
  const main = ranked[offset % ranked.length]
  // 10분 대안: 15분 이내 중 가장 싼 것 (순위 동률이면 랭킹 순)
  const quickCandidates = ranked.filter((set) => set.id !== main.id && set.minutes <= 15).sort((a, b) => a.cost - b.cost)
  const quick = quickCandidates[0] || ranked.filter((set) => set.id !== main.id).sort((a, b) => a.minutes - b.minutes)[0]
  const quickIsFallback = !quickCandidates.length // true 면 화면 라벨은 '빠른 대안' 으로(UX-170 I3)
  // 야식·한잔: 늦은 밤 태그 우선, 없으면 페어링이 있는 것
  const rest = ranked.filter((set) => set.id !== main.id && set.id !== quick.id)
  const night = rest.find((set) => set.when.includes('late'))
    || rest.find((set) => set.pairing.type !== '무알코올')
    || rest[0]
  return { tags, main, quick, night, quickIsFallback }
}
