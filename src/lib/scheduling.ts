const BRAZIL_TIME_ZONE = 'America/Sao_Paulo'

function brazilParts(now: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRAZIL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: value('hour'),
  }
}

export function isBusinessDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return weekday !== 0 && weekday !== 6
}

export function getEarliestScheduleDate(now = new Date()) {
  const { year, month, day, hour } = brazilParts(now)
  const cursor = new Date(Date.UTC(year, month - 1, day))
  const requiredBusinessDays = hour >= 15 ? 3 : 2
  let counted = 0

  while (counted < requiredBusinessDays) {
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    const weekday = cursor.getUTCDay()
    if (weekday !== 0 && weekday !== 6) counted += 1
  }

  return cursor.toISOString().slice(0, 10)
}
