import { PANTRY_DISHES, findDish } from './dishes.js'
import { PANTRY_SETS, findSet } from './sets.js'

export { PANTRY_DISHES, PANTRY_SETS, findDish, findSet }

// 태그 묶음 — 칩 행(TKT-180). 세트 tags 에 실제로 쓰인 것만 노출한다.
export const PANTRY_TAG_GROUPS = [
  { id: 'ingredient', label: '재료', tags: ['계란', '김치', '두부', '라면', '돼지고기', '삼겹살', '닭', '고등어', '회', '스팸', '소면', '콩나물', '순두부', '감자', '채소'] },
  { id: 'situation', label: '상황', tags: ['10분', '15분', '야식', '해장', '손님', '주말', '평일', '월급날', '비오는날', '더운날', '가을', '다이어트', '냉장고털이', '편의점', '한잔', '집밥'] },
  { id: 'drink', label: '술', tags: ['맥주', '소주', '막걸리', '하이볼', '와인', '사케', '무알코올'] },
]
export function pantryTags() {
  const used = new Set(PANTRY_SETS.flatMap((set) => set.tags || []))
  return PANTRY_TAG_GROUPS.map((group) => ({ ...group, tags: group.tags.filter((tag) => used.has(tag)) })).filter((group) => group.tags.length)
}
export function filterSetsByTags(sets, selected = []) {
  if (!selected.length) return sets
  return sets.filter((set) => selected.every((tag) => (set.tags || []).includes(tag)))
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
  const quick = ranked
    .filter((set) => set.id !== main.id && set.minutes <= 15)
    .sort((a, b) => a.cost - b.cost)[0] || ranked.find((set) => set.id !== main.id)
  // 야식·한잔: 늦은 밤 태그 우선, 없으면 페어링이 있는 것
  const rest = ranked.filter((set) => set.id !== main.id && set.id !== quick.id)
  const night = rest.find((set) => set.when.includes('late'))
    || rest.find((set) => set.pairing.type !== '무알코올')
    || rest[0]
  return { tags, main, quick, night }
}
