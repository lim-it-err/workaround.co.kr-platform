// TKT-229: lite 여행 화면 순수 함수 — 데이터(VOYAGES)에서 표시용 문자열만 만든다.
export const EMPTY_RECORD = '기록 정리 중'
export const EMPTY_SETTLEMENT = '결산 정리 중'

export function voyageYear(voyage) {
  const start = String(voyage?.period?.start || '')
  return /^\d{4}/.test(start) ? start.slice(0, 4) : ''
}

function lines(text) {
  return String(text || '').split('\n').map(line => line.trim()).filter(Boolean)
}

// 그날 줄: record 줄들, 없으면 계획 pm/am 중 있는 것.
export function dayLines(day) {
  const record = lines(day?.actual?.record ?? day?.record)
  if (record.length) return record
  const plan = day?.plan || {}
  return [plan.pm, plan.am, plan.eve].map(text => String(text || '').trim()).filter(Boolean).slice(0, 1)
}

export function dayRow(day, index) {
  const all = dayLines(day)
  return {
    key: `day-${index}`,
    label: `DAY ${index + 1}`,
    city: String(day?.city || '').trim(),
    summary: all[0] || EMPTY_RECORD,
    extra: all.slice(1, 4)
  }
}

export function formatAmount(value, unit = '만원') {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ''
  return `${amount.toFixed(1)}${unit}`
}

// 결산 줄 — grandTotal 이 없으면 「결산 정리 중」.
export function settlementRow(voyage) {
  const s = voyage?.settlement
  if (!s || !Number.isFinite(Number(s.grandTotal))) {
    return { key: 'settlement', label: '결산', summary: EMPTY_SETTLEMENT, extra: [], ready: false }
  }
  const unit = s.unit || '만원'
  const extra = []
  if (Number.isFinite(Number(s.perPerson))) extra.push(`1인당 ${formatAmount(s.perPerson, unit)}`)
  if (Number.isFinite(Number(s.prebooked?.total))) extra.push(`사전 결제 ${formatAmount(s.prebooked.total, unit)}`)
  if (Number.isFinite(Number(s.onTrip?.total))) extra.push(`현지 지출 ${formatAmount(s.onTrip.total, unit)}`)
  return { key: 'settlement', label: '결산', summary: formatAmount(s.grandTotal, unit), extra, ready: true }
}

export function routeRows(voyage) {
  return [...(voyage?.days || []).map(dayRow), settlementRow(voyage)]
}
