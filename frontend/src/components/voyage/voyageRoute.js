const ROUTE_BOUNDS = {
  minLon: 13,
  maxLon: 19.5,
  minLat: 47.3,
  maxLat: 50.3
}

export const ROUTE_VIEWBOX = { width: 720, height: 540, padding: 46 }

export function advisorTransferHref(transfer, baseUrl = '/') {
  const courseId = String(transfer?.courseId || '').trim()
  const missionId = String(transfer?.missionId || '').trim()
  if (!courseId && !missionId) return ''

  const rawBase = String(baseUrl || '/').trim()
  if (!rawBase.startsWith('/') || rawBase.startsWith('//') || /[?#\\]/.test(rawBase)) return ''
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`
  const target = courseId
    ? `courses/${encodeURIComponent(courseId)}`
    : `missions/${encodeURIComponent(missionId)}`
  return `${base}advisor/${target}`
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function projectCity(city) {
  const { width, height, padding } = ROUTE_VIEWBOX
  const xRatio = (city.lon - ROUTE_BOUNDS.minLon) / (ROUTE_BOUNDS.maxLon - ROUTE_BOUNDS.minLon)
  const yRatio = (ROUTE_BOUNDS.maxLat - city.lat) / (ROUTE_BOUNDS.maxLat - ROUTE_BOUNDS.minLat)
  return {
    x: padding + xRatio * (width - padding * 2),
    y: padding + yRatio * (height - padding * 2)
  }
}

export function findTripDayIndex(voyage, dateKey = localDateKey()) {
  const exact = voyage.days.findIndex((day) => day.date === dateKey)
  if (exact >= 0) return exact
  if (dateKey < voyage.period.start) return -1
  if (dateKey > voyage.period.end) return voyage.days.length

  let nearest = -1
  voyage.days.forEach((day, index) => {
    if (day.date <= dateKey) nearest = index
  })
  return nearest
}

export function routeItemState(voyage, dayIndex, todayIndex) {
  if (voyage.status === 'arrived' || todayIndex >= voyage.days.length) return 'completed'
  if (voyage.status === 'planned' || todayIndex < 0) return 'upcoming'
  if (dayIndex < todayIndex) return 'completed'
  if (dayIndex === todayIndex) return 'current'
  return 'upcoming'
}

export function buildRouteSegments(voyage, todayIndex, selectedDayIndex) {
  const cities = new Map(voyage.cities.map((city) => [city.id, city]))
  return (voyage.legs || []).map((leg, index) => {
    const from = cities.get(leg.from)
    const to = cities.get(leg.to)
    if (!from || !to) return null
    return {
      ...leg,
      id: `${leg.dayIndex}-${leg.from}-${leg.to}-${index}`,
      fromCity: from,
      toCity: to,
      fromPoint: projectCity(from),
      toPoint: projectCity(to),
      state: routeItemState(voyage, leg.dayIndex, todayIndex),
      active: leg.dayIndex === selectedDayIndex,
      strokeWidth: Math.min(8, Math.max(3, 3 + leg.driveMin / 45))
    }
  }).filter(Boolean)
}

function splitTime(value = '') {
  const parts = value.split(/[~～]/, 2).map((part) => part.trim())
  return { arrival: parts[0] || '—', departure: parts[1] || '' }
}

function routeKind(title = '') {
  return /운전|택시|도보|트램|우버|항공|OZ\d|U\d|S\d/.test(title) ? 'move' : 'stop'
}

function findMeal(meals, item, usedMeals) {
  const haystack = `${item.title} ${item.detail || ''}`.toLocaleLowerCase()
  const index = meals.findIndex((meal, mealIndex) => {
    if (usedMeals.has(mealIndex)) return false
    return haystack.includes(meal.place.toLocaleLowerCase()) || haystack.includes(meal.slot)
  })
  if (index < 0) return null
  usedMeals.add(index)
  return meals[index]
}

function findSpendItem(day, title, meal) {
  const haystack = `${title} ${meal?.place || ''}`.toLocaleLowerCase()
  return (day.actual?.spend?.items || day.spend?.items || []).find((item) => {
    const label = item.label.toLocaleLowerCase()
    return haystack.includes(label) || label.includes(meal?.place?.toLocaleLowerCase() || '__no-meal__')
  }) || null
}

function fallbackTimeline(day) {
  return [
    { ...(day.stations || []).find((station) => station.slot === 'am'), time: '오전', title: day.plan?.am || day.am },
    { ...(day.stations || []).find((station) => station.slot === 'pm'), time: '오후', title: day.plan?.pm || day.pm },
    { ...(day.stations || []).find((station) => station.slot === 'eve'), time: '저녁', title: day.plan?.eve || day.eve }
  ]
}

export function buildDayTimeline(voyage, dayIndex) {
  const day = voyage.days[dayIndex]
  if (!day) return []

  const session = (voyage.daySessions || []).find((item) => item.dayIndex === dayIndex)
  const source = day.plan?.session?.timeline || session?.timeline || fallbackTimeline(day)
  const meals = day.actual?.meals || day.meals || []
  const usedMeals = new Set()
  const entries = source.filter((item) => item.title && item.title !== '—').map((item, index) => {
    const meal = findMeal(meals, item, usedMeals)
    const genericMealTitle = meal && /^(아침|점심|저녁|카페)$/.test(item.title.trim())
    return {
      id: `timeline-${dayIndex}-${index}`,
      stationId: String(item.id || ''),
      ...splitTime(item.time),
      title: genericMealTitle ? `${meal.place} — ${meal.dish}` : item.title,
      detail: item.detail || '',
      kind: meal ? 'meal' : routeKind(`${item.title} ${item.detail || ''}`),
      missions: Array.isArray(item.missions) ? item.missions.filter((mission) => mission?.courseId || mission?.missionId) : [],
      meal,
      spendItem: findSpendItem(day, item.title, meal)
    }
  })

  meals.forEach((meal, mealIndex) => {
    if (usedMeals.has(mealIndex)) return
    entries.push({
      id: `meal-${dayIndex}-${mealIndex}`,
      arrival: meal.slot,
      departure: '',
      title: `${meal.place} — ${meal.dish}`,
      detail: '',
      kind: 'meal',
      stationId: '',
      missions: [],
      meal,
      spendItem: findSpendItem(day, meal.place, meal)
    })
  })

  ;(day.plan?.session?.branches || session?.branches || []).forEach((branch, index) => {
    entries.push({
      id: `branch-${dayIndex}-${index}`,
      arrival: '',
      departure: '',
      title: `${branch.situation} → ${branch.action}`,
      detail: '',
      kind: 'branch',
      stationId: '',
      missions: [],
      meal: null,
      spendItem: null
    })
  })

  return entries
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key)
}

function numericAmount(value) {
  if (value === '' || value === null || value === undefined) return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

export function stopRecordFromEntry(entry, stored = null) {
  const source = stored && typeof stored === 'object' ? stored : {}
  const seedWon = entry.spendItem?.amount === undefined
    ? ''
    : String(Math.round(Number(entry.spendItem.amount) * 10000))
  return {
    place: hasOwn(source, 'place') ? String(source.place || '') : String(entry.meal?.place || ''),
    dish: hasOwn(source, 'dish') ? String(source.dish || '') : String(entry.meal?.dish || ''),
    localAmount: hasOwn(source, 'localAmount') ? String(source.localAmount ?? '') : String(entry.meal?.amount ?? ''),
    currency: hasOwn(source, 'currency') ? String(source.currency || '') : String(entry.meal?.currency || ''),
    krwAmount: hasOwn(source, 'krwAmount') ? String(source.krwAmount ?? '') : seedWon,
    note: hasOwn(source, 'note') ? String(source.note || '') : '',
    mapUrl: hasOwn(source, 'mapUrl') ? String(source.mapUrl || '') : String(entry.meal?.mapUrl || ''),
    photos: Array.isArray(source.photos) ? source.photos : []
  }
}

export function applyStopRecords(entries, records = {}) {
  return entries.map((entry) => {
    const stored = records?.[entry.id]
    if (!stored || typeof stored !== 'object') return entry
    const record = stopRecordFromEntry(entry, stored)
    const place = record.place.trim()
    const dish = record.dish.trim()
    const hasMeal = Boolean(place || dish || record.localAmount || record.currency)
    const krwAmount = numericAmount(record.krwAmount)
    const meal = hasMeal ? {
      ...(entry.meal || {}),
      place,
      dish,
      amount: numericAmount(record.localAmount),
      currency: record.currency.trim(),
      mapUrl: record.mapUrl.trim(),
      photo: record.photos[0] || null
    } : null

    return {
      ...entry,
      title: place || dish ? `${place || '식사'} — ${dish || '메뉴 미입력'}` : entry.title,
      kind: meal ? 'meal' : entry.kind === 'meal' ? 'stop' : entry.kind,
      meal,
      spendItem: krwAmount === null ? null : {
        ...(entry.spendItem || {}),
        label: place || entry.title,
        amount: krwAmount / 10000
      },
      stopRecord: record
    }
  })
}

export function effectiveDaySpendTotal(day, entries, records = {}) {
  const baseline = Number(day?.actual?.spend?.total ?? day?.spend?.total ?? 0)
  return Math.max(0, Object.entries(records || {}).reduce((total, [entryId, record]) => {
    if (!record || typeof record !== 'object' || !hasOwn(record, 'krwAmount')) return total
    const entry = entries.find((item) => item.id === entryId)
    const seed = Number(entry?.spendItem?.amount || 0)
    const replacement = numericAmount(record.krwAmount)
    return total - seed + (replacement === null ? 0 : replacement / 10000)
  }, baseline))
}

export function isGoogleMapsUrl(value) {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (
      url.hostname === 'maps.google.com'
      || url.hostname === 'www.google.com' && url.pathname.startsWith('/maps')
      || url.hostname === 'goo.gl' && url.pathname.startsWith('/maps')
      || url.hostname === 'maps.app.goo.gl'
    )
  } catch (error) {
    return false
  }
}

export function routeGauges(voyage, todayIndex) {
  const isComplete = voyage.status === 'arrived' || todayIndex >= voyage.days.length
  const covered = (index) => isComplete || index <= todayIndex
  const completedDistance = (voyage.legs || [])
    .filter((leg) => isComplete || leg.dayIndex < todayIndex)
    .reduce((total, leg) => total + (leg.km || 0), 0)
  const totalDistance = (voyage.legs || []).reduce((total, leg) => total + (leg.km || 0), 0)
  const prepaid = (voyage.prepaid || []).reduce((total, item) => total + (item.amount || 0), 0)
  const tripSpend = voyage.days.reduce((total, day, index) => (
    covered(index) ? total + (day.actual?.spend?.total ?? day.spend?.total ?? 0) : total
  ), 0)
  const budgetPlan = voyage.budget?.items?.reduce((total, item) => total + (item.amount || 0), 0)
    || voyage.budget?.plan
    || 0

  return {
    completedDistance,
    totalDistance,
    spent: prepaid + tripSpend,
    prepaid,
    tripSpend,
    budgetPlan
  }
}

export function cityDayIndexes(voyage, city) {
  if (city.id === 'prague') return [0, 1]
  if (city.id === 'prague-return') return [8, 9]

  const indexes = new Set()
  voyage.days.forEach((day, index) => {
    if (`${day.city} ${day.stay}`.includes(city.name)) indexes.add(index)
  })
  ;(voyage.legs || []).forEach((leg) => {
    if (leg.from === city.id || leg.to === city.id) indexes.add(leg.dayIndex)
  })
  return [...indexes].sort((a, b) => a - b)
}

export function currentCityId(voyage, todayIndex) {
  if (todayIndex < 0) return voyage.legs?.[0]?.from || voyage.cities[0]?.id || ''
  if (todayIndex >= voyage.days.length) return voyage.legs?.at(-1)?.to || voyage.cities.at(-1)?.id || ''
  const activeLeg = (voyage.legs || []).find((leg) => leg.dayIndex === todayIndex)
  if (activeLeg) return activeLeg.from
  const previousLeg = [...(voyage.legs || [])].reverse().find((leg) => leg.dayIndex < todayIndex)
  return previousLeg?.to || voyage.legs?.[0]?.from || voyage.cities[0]?.id || ''
}
