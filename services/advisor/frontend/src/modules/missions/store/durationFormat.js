export function formatDuration(minutes) {
  const parsed = Number(minutes)
  const totalMinutes = Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0

  if (totalMinutes < 60) return `${totalMinutes}분`

  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60
  if (hours >= 24) return `약 ${Math.round(totalMinutes / 60)}시간`
  return remainingMinutes ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`
}
