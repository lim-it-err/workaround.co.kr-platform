export function defineVoyage(source) {
  const sessions = new Map((source.daySessions || []).map((session) => [session.dayIndex, session]))
  const days = (source.days || []).map((day, dayIndex) => ({
    ...day,
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
