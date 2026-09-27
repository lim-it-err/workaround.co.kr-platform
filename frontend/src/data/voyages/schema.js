export function defineVoyage(source) {
  const sessions = new Map((source.daySessions || []).map((session) => [session.dayIndex, session]))
  const days = (source.days || []).map((day, dayIndex) => ({
    ...day,
    links: Array.isArray(day.links) ? day.links : [],
    plan: day.plan || {
      am: day.am || '',
      pm: day.pm || '',
      eve: day.eve || '',
      tip: day.tip || '',
      session: sessions.get(dayIndex) || null
    },
    actual: day.actual || {
      record: day.record || '',
      meals: day.meals || [],
      spend: day.spend || { items: [], total: 0 },
      photos: day.photos || []
    }
  }))

  return {
    ...source,
    days
  }
}

function owns(value, key) {
  return Object.prototype.hasOwnProperty.call(value || {}, key)
}

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function optionalAmount(value, label) {
  if (value === '' || value === null || value === undefined) return null
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`${label}은 0 이상의 숫자여야 합니다.`)
  return amount
}

function photoSource(photo) {
  return typeof photo === 'string' ? photo : photo?.src
}

function photoKey(photo) {
  return String(photoSource(photo) || '')
}

function mergeRecordText(seed, dayRecord, stopRecords) {
  const first = owns(dayRecord, 'note') ? String(dayRecord.note || '').trim() : String(seed || '').trim()
  const lines = [first]
  for (const stop of stopRecords) {
    const note = String(stop.record.note || '').trim()
    if (!note) continue
    const label = String(stop.record.place || stop.record.dish || '일정 메모').trim()
    lines.push(`${label}: ${note}`)
  }
  return [...new Set(lines.filter(Boolean))].join('\n')
}

function timelineMealIndexes(voyage, day, dayIndex, meals) {
  const session = day.plan?.session
    || (voyage.daySessions || []).find((item) => item.dayIndex === dayIndex)
  const source = session?.timeline || [
    { title: day.plan?.am || day.am || '' },
    { title: day.plan?.pm || day.pm || '' },
    { title: day.plan?.eve || day.eve || '' }
  ]
  const used = new Set()
  const indexes = new Map()
  source.filter((item) => item.title && item.title !== '—').forEach((item, timelineIndex) => {
    const haystack = `${item.title} ${item.detail || ''}`.toLocaleLowerCase()
    const matchesMeal = (meal) => {
      const place = String(meal.place || '').toLocaleLowerCase()
      const slot = String(meal.slot || '').toLocaleLowerCase()
      return (place && haystack.includes(place)) || (slot && haystack.includes(slot))
    }
    const mealIndex = meals.findIndex((meal, index) => (
      !used.has(index)
      && matchesMeal(meal)
    ))
    if (mealIndex < 0) return
    used.add(mealIndex)
    indexes.set(`timeline-${dayIndex}-${timelineIndex}`, meals[mealIndex])
  })
  meals.forEach((_, mealIndex) => {
    if (!used.has(mealIndex)) indexes.set(`meal-${dayIndex}-${mealIndex}`, meals[mealIndex])
  })
  return indexes
}

function matchingMealIndex(meals, indexedMeal, stopId, record) {
  const byStop = meals.findIndex((meal) => meal.stopId === stopId)
  if (byStop >= 0) return byStop
  const byIndex = meals.indexOf(indexedMeal)
  if (byIndex >= 0) return byIndex
  const place = String(record.place || '').trim().toLocaleLowerCase()
  const mapUrl = String(record.mapUrl || '').trim()
  if (mapUrl) {
    const byMap = meals.findIndex((meal) => meal.mapUrl === mapUrl)
    if (byMap >= 0) return byMap
  }
  return place ? meals.findIndex((meal) => String(meal.place || '').trim().toLocaleLowerCase() === place) : -1
}

function matchingSpendIndex(items, stopId, record, baselineMeal) {
  const byStop = items.findIndex((item) => item.stopId === stopId)
  if (byStop >= 0) return byStop
  const labels = [record.place, baselineMeal?.place]
    .map((value) => String(value || '').trim().toLocaleLowerCase())
    .filter(Boolean)
  return items.findIndex((item) => {
    const label = String(item.label || '').trim().toLocaleLowerCase()
    return labels.some((candidate) => label === candidate || label.includes(candidate) || candidate.includes(label))
  })
}

function normalizeBackupPhoto(photo, voyageId, date, number) {
  const src = photoSource(photo)
  const match = /^data:image\/(png|jpe?g|gif|webp|avif);base64,([a-z0-9+/=\s]+)$/i.exec(String(src || ''))
  if (!match) throw new Error(`${date}: 지원하지 않는 사진 데이터입니다.`)
  const extension = match[1].toLowerCase().replace('jpeg', 'jpg')
  const base64 = match[2].replace(/\s/g, '')
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  const size = Math.max(0, Math.floor(base64.length * 3 / 4) - padding)
  const relativePath = `voyage/${voyageId}/${date}-${number}.${extension}`
  const publicPath = `/${relativePath}`
  return {
    photo: { src: publicPath, caption: String(photo?.caption || '여행 사진').slice(0, 100) },
    asset: { relativePath, publicPath, base64, size }
  }
}

export function mergeVoyageDayRecords(voyage, records) {
  if (!plainObject(voyage) || !Array.isArray(voyage.days)) throw new Error('여행 데이터가 올바르지 않습니다.')
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(String(voyage.id || ''))) throw new Error('여행 ID가 올바르지 않습니다.')
  if (!plainObject(records)) throw new Error('여행 기록이 올바르지 않습니다.')

  const knownDates = new Set(voyage.days.map((day) => day.date))
  const unknownDates = Object.keys(records).filter((date) => !knownDates.has(date))
  if (unknownDates.length) throw new Error(`일정에 없는 날짜가 있습니다: ${unknownDates.join(', ')}`)

  const assets = []
  const changedDates = []
  const days = voyage.days.map((day, dayIndex) => {
    const dayRecord = records[day.date]
    if (!plainObject(dayRecord)) return day
    const stopSource = plainObject(dayRecord.stops) ? dayRecord.stops : {}
    const stopRecords = Object.entries(stopSource).map(([id, record]) => {
      if (!plainObject(record)) throw new Error(`${day.date}: ${id} 기록이 올바르지 않습니다.`)
      return { id, record }
    })
    const actual = plainObject(day.actual) ? day.actual : {}
    const meals = (Array.isArray(actual.meals) ? actual.meals : []).map((meal) => ({ ...meal }))
    const spendSeed = plainObject(actual.spend) ? actual.spend : { items: [], total: 0 }
    const spendItems = (Array.isArray(spendSeed.items) ? spendSeed.items : []).map((item) => ({ ...item }))
    let spendTotal = Number(spendSeed.total)
    if (!Number.isFinite(spendTotal)) spendTotal = spendItems.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    const importedPrefix = `/voyage/${voyage.id}/${day.date}-`
    const dayPhotos = (Array.isArray(actual.photos) ? actual.photos : [])
      .filter((photo) => !photoKey(photo).startsWith(importedPrefix))
      .map((photo) => typeof photo === 'string' ? photo : { ...photo })
    const mealIndexes = timelineMealIndexes(voyage, day, dayIndex, meals)
    let photoNumber = 0

    for (const { id: stopId, record } of stopRecords) {
      const extracted = (Array.isArray(record.photos) ? record.photos : []).map((photo) => {
        photoNumber += 1
        return normalizeBackupPhoto(photo, voyage.id, day.date, photoNumber)
      })
      assets.push(...extracted.map((item) => item.asset))
      dayPhotos.push(...extracted.map((item) => item.photo))

      const indexedMeal = mealIndexes.get(stopId)
      const mealIndex = matchingMealIndex(meals, indexedMeal, stopId, record)
      const baselineMeal = mealIndex >= 0 ? meals[mealIndex] : null
      const hasMealFields = ['place', 'dish', 'localAmount', 'currency', 'mapUrl'].some((key) => owns(record, key))
      const hasMeal = Boolean(String(record.place || '').trim() || String(record.dish || '').trim() || record.localAmount || record.currency || record.mapUrl)
      if (hasMealFields && hasMeal) {
        const mergedMeal = {
          ...(baselineMeal || {}),
          stopId,
          slot: baselineMeal?.slot || '현장',
          place: String(record.place || '').trim(),
          dish: String(record.dish || '').trim(),
          amount: optionalAmount(record.localAmount, `${day.date} 현지 금액`),
          currency: String(record.currency || '').trim(),
          mapUrl: String(record.mapUrl || '').trim(),
          photo: owns(record, 'photos') ? extracted[0]?.photo || null : baselineMeal?.photo || null
        }
        if (mealIndex >= 0) meals.splice(mealIndex, 1, mergedMeal)
        else meals.push(mergedMeal)
      } else if (hasMealFields && mealIndex >= 0) {
        meals.splice(mealIndex, 1)
      }

      if (owns(record, 'krwAmount')) {
        const spendIndex = matchingSpendIndex(spendItems, stopId, record, baselineMeal)
        const previous = spendIndex >= 0 ? Number(spendItems[spendIndex].amount || 0) : 0
        const won = optionalAmount(record.krwAmount, `${day.date} 원화 금액`)
        const next = won === null ? 0 : won / 10000
        spendTotal = Math.max(0, spendTotal - previous + next)
        if (won === null && spendIndex >= 0) spendItems.splice(spendIndex, 1)
        if (won !== null) {
          const mergedSpend = {
            ...(spendIndex >= 0 ? spendItems[spendIndex] : {}),
            stopId,
            label: String(record.place || record.dish || baselineMeal?.place || '현장 기록').trim(),
            amount: next
          }
          if (spendIndex >= 0) spendItems.splice(spendIndex, 1, mergedSpend)
          else spendItems.push(mergedSpend)
        }
      }
    }

    changedDates.push(day.date)
    return {
      ...day,
      actual: {
        ...actual,
        record: mergeRecordText(actual.record, dayRecord, stopRecords),
        meals,
        spend: { ...spendSeed, items: spendItems, total: spendTotal },
        photos: [...new Map(dayPhotos.map((photo) => [photoKey(photo), photo])).values()]
      }
    }
  })

  return { voyage: { ...voyage, days }, assets, changedDates }
}
