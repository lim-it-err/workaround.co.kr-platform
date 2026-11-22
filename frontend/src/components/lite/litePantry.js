import { PANTRY_SETS, PANTRY_TAG_GROUPS, filterSetsByTags, findDish, nearestSetFor, pantryTags } from '../../data/pantry/index.js'

// TKT-231: lite 자취 밥상 — 질문 세 개의 답(태그)으로 한 상 세트를 무작위로 고른다.
// 순수 함수만 둔다. 난수 함수는 인자로 받아 테스트에서 고정할 수 있다.

export const ANY_LABEL = '상관없음'
const OCCASION_TAGS = ['평일', '주말', '야식', '해장', '한잔']

function groupTags(id) {
  const used = pantryTags().find((group) => group.id === id)
  return used ? used.tags : []
}

function optionsOf(tags) {
  return [...tags.map((tag) => ({ label: tag, tag })), { label: ANY_LABEL, tag: null }]
}

// 질문 3개. 재료·때 태그는 실제 세트에 쓰인 것만 나온다.
export function buildQuestions() {
  const time = PANTRY_TAG_GROUPS.find((group) => group.id === 'time').tags
  const used = new Set(pantryTags().flatMap((group) => group.tags))
  return [
    { id: 'time', text: '시간은 얼마나?', options: optionsOf(time.filter((tag) => used.has(tag))) },
    { id: 'ingredient', text: '냉장고에 뭐가 있어?', options: optionsOf(groupTags('ingredient')) },
    { id: 'day', text: '오늘은 어떤 날?', options: optionsOf(OCCASION_TAGS.filter((tag) => used.has(tag))) }
  ]
}

// answers: 질문별 고른 option 의 tag(null = 상관없음). 반환 { sets, exact, empty, tags }.
// exact=false 면 sets 는 nearestSetFor 가 고른 가까운 상 하나, empty 면 보여 줄 상이 없다.
export function candidatesFor(answers, sets = PANTRY_SETS) {
  const tags = answers.filter(Boolean)
  const exactSets = filterSetsByTags(sets, tags)
  if (exactSets.length) return { sets: exactSets, exact: true, empty: false, tags }
  const near = nearestSetFor(sets, tags)
  if (near.set) return { sets: [near.set], exact: false, empty: false, tags }
  return { sets: [], exact: false, empty: true, tags }
}

// 방금 본 것(seen 의 끝)은 후보가 남아 있는 한 다시 안 나온다. seen 을 다 채우면 마지막 것만 빼고 다시 돈다.
export function pickSet(candidates, seenIds = [], rand = Math.random) {
  if (!candidates.length) return null
  let pool = candidates.filter((set) => !seenIds.includes(set.id))
  if (!pool.length) {
    const last = seenIds[seenIds.length - 1]
    pool = candidates.filter((set) => set.id !== last)
  }
  if (!pool.length) pool = candidates
  const index = Math.min(pool.length - 1, Math.floor(rand() * pool.length))
  return pool[index]
}

export function describeSet(set) {
  const main = findDish(set.main)
  return {
    title: set.title,
    mood: set.mood,
    meta: `${set.minutes}분 · ${set.cost.toLocaleString('ko-KR')}원`,
    mainName: main ? main.name : set.main,
    drink: set.pairing.drink,
    alt: set.pairing.alt
  }
}
