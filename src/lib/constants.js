export const SHIFTS = [
  { id: 'morning', label: 'Morning shift', hours: '06:00 – 14:00' },
  { id: 'afternoon', label: 'Afternoon shift', hours: '14:00 – 22:00' },
  { id: 'night', label: 'Night shift', hours: '22:00 – 06:00' },
  { id: 'custom', label: 'Custom shift', hours: 'Specify times' },
]

export const CONDITIONS = [
  { id: 'working', label: 'Working', short: 'OK', tone: 'good' },
  { id: 'minor', label: 'Minor issue', short: 'Minor', tone: 'warn' },
  { id: 'damaged', label: 'Damaged / Faulty', short: 'Damaged', tone: 'bad' },
  { id: 'missing', label: 'Missing', short: 'Missing', tone: 'bad' },
]

export const SEVERITIES = [
  { id: 'minor', label: 'Minor', tone: 'warn' },
  { id: 'major', label: 'Major', tone: 'bad' },
  { id: 'critical', label: 'Critical', tone: 'bad' },
]

export const TONES = {
  good: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  warn: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200', dot: 'bg-amber-500' },
  bad: { bg: 'bg-rose-50', text: 'text-rose-900', border: 'border-rose-200', dot: 'bg-rose-500' },
  neutral: { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200', dot: 'bg-stone-400' },
}

export const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
export const nowIso = () => new Date().toISOString()
export const formatDate = (d) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—'

// Value for <input type="datetime-local"> in the user's local time.
export const localDatetimeInput = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export const displayFont = { fontFamily: 'var(--font-display)' }
