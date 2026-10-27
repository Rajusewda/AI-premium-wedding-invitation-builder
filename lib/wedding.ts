// Shared wedding data model + pure helpers. No UI and no storage here, so the
// same types can later be backed by a database without touching components.

export type TemplateId = 'royal' | 'floral' | 'minimal'
export type WeddingStatus = 'draft' | 'published'

export type WeddingEvent = {
  id: string
  name: string
  date: string // YYYY-MM-DD
  time: string // HH:mm (24h) or ''
  dressCode: string
  venueName: string
  venueAddress: string
  mapsUrl: string // optional verified link; falls back to an encoded search
}

export type GalleryImage = { id: string; src: string; alt: string }

export type FamilySide = { label: string; title: string; description: string; members: string[] }

export type Wedding = {
  id: string
  slug: string
  status: WeddingStatus
  template: TemplateId
  partner1: string
  partner2: string
  connector: string
  date: string // main ceremony date YYYY-MM-DD (drives the countdown)
  time: string // HH:mm
  timezone: string // IANA zone
  copy: {
    coverEyebrow: string
    coverMessage: string
    openingLine: string
    heroEyebrow: string
    heroMessage: string
    countdownTitle: string
    familyHeading: string
    childrenIntro: string
    footerNote: string
  }
  families: { sideA: FamilySide; sideB: FamilySide; note: { label: string; title: string; description: string } }
  children: string[]
  events: WeddingEvent[]
  gallery: GalleryImage[]
  couplePhoto: GalleryImage | null
  musicUrl: string
  features: { countdown: boolean; family: boolean; venues: boolean; children: boolean; gallery: boolean; rsvp: boolean; music: boolean }
  rsvp: { maxGuests: number }
}

export const TEMPLATES: { id: TemplateId; name: string; description: string; palette: string; className: string }[] = [
  { id: 'royal', name: 'Royal Gold', description: 'A timeless ivory, champagne, and gold celebration.', palette: 'Ivory · Champagne · Gold', className: 'template-royal' },
  { id: 'floral', name: 'Floral Romance', description: 'Soft blooms and a romantic, garden-inspired mood.', palette: 'Blush · Sage · Ivory', className: 'template-floral' },
  { id: 'minimal', name: 'Modern Minimal', description: 'Quiet luxury with space, rhythm, and refined type.', palette: 'Stone · Ink · White', className: 'template-minimal' },
]

export const TIMEZONES: { id: string; label: string }[] = [
  { id: 'Asia/Kolkata', label: 'India (IST)' },
  { id: 'Asia/Karachi', label: 'Pakistan (PKT)' },
  { id: 'Asia/Dhaka', label: 'Bangladesh (BST)' },
  { id: 'Asia/Dubai', label: 'Gulf (GST)' },
  { id: 'Europe/London', label: 'London' },
  { id: 'Europe/Paris', label: 'Central Europe' },
  { id: 'America/New_York', label: 'US Eastern' },
  { id: 'America/Chicago', label: 'US Central' },
  { id: 'America/Los_Angeles', label: 'US Pacific' },
  { id: 'Australia/Sydney', label: 'Sydney' },
  { id: 'UTC', label: 'UTC' },
]

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export function slugify(input: string) {
  return input.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

export function uniqueSlug(base: string, taken: string[]) {
  const root = base || 'wedding'
  if (!taken.includes(root)) return root
  let n = 2
  while (taken.includes(`${root}-${n}`)) n++
  return `${root}-${n}`
}

export const coupleNames = (w: Pick<Wedding, 'partner1' | 'partner2'>) => [w.partner1.trim(), w.partner2.trim()].filter(Boolean).join(' & ') || 'Untitled wedding'

function parseDate(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return null
  const d = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]))
  return Number.isNaN(d.getTime()) || d.getUTCMonth() !== +match[2] - 1 ? null : d
}

export function formatDate(date: string, style: 'long' | 'short' = 'long') {
  const d = parseDate(date)
  if (!d) return ''
  return d.toLocaleDateString('en-GB', { timeZone: 'UTC', day: style === 'long' ? 'numeric' : '2-digit', month: style === 'long' ? 'long' : 'short', year: 'numeric' })
}

export function formatTime(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return ''
  const h = +match[1]
  return `${String(h % 12 || 12).padStart(2, '0')}:${match[2]} ${h < 12 ? 'AM' : 'PM'}`
}

function offsetMs(ts: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ts))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - Math.floor(ts / 1000) * 1000
}

/** The real instant at which `date` + `time` occurs in `timeZone`, or null if the inputs are invalid. */
export function zonedInstant(date: string, time: string, timeZone: string): Date | null {
  const d = parseDate(date)
  const t = /^(\d{2}):(\d{2})$/.exec(time || '00:00')
  if (!d || !t) return null
  try {
    const guess = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), +t[1], +t[2])
    let result = guess - offsetMs(guess, timeZone)
    const second = offsetMs(result, timeZone)
    if (guess - result !== second) result = guess - second
    return new Date(result)
  } catch {
    return null
  }
}

export function timezoneName(instant: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'long' }).formatToParts(instant).find((p) => p.type === 'timeZoneName')?.value ?? timeZone
  } catch {
    return timeZone
  }
}

export const mapUrl = (e: Pick<WeddingEvent, 'mapsUrl' | 'venueAddress' | 'venueName'>) =>
  e.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.venueAddress || e.venueName)}`
export const directionsUrl = (e: Pick<WeddingEvent, 'venueAddress' | 'venueName'>) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(e.venueAddress || e.venueName)}`

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
export const numberWord = (n: number) => WORDS[n] ?? String(n)

export function newEvent(partial: Partial<WeddingEvent> = {}): WeddingEvent {
  return { id: uid(), name: '', date: '', time: '', dressCode: '', venueName: '', venueAddress: '', mapsUrl: '', ...partial }
}

export function createWedding(input: { partner1: string; partner2: string; date: string; time: string; timezone: string; template: TemplateId; venue: string; takenSlugs: string[] }): Wedding {
  const p1 = input.partner1.trim()
  const p2 = input.partner2.trim()
  return {
    id: uid(),
    slug: uniqueSlug(slugify(`${p1} ${p2}`), input.takenSlugs),
    status: 'draft',
    template: input.template,
    partner1: p1,
    partner2: p2,
    connector: '&',
    date: input.date,
    time: input.time,
    timezone: input.timezone,
    copy: {
      coverEyebrow: 'You are invited',
      coverMessage: 'Join us as we celebrate love, family, and a new beginning.',
      openingLine: '',
      heroEyebrow: 'Together with our families',
      heroMessage: 'We joyfully invite you to celebrate our wedding.',
      countdownTitle: 'Counting down to the big day.',
      familyHeading: `From the ${p1} and ${p2} families`,
      childrenIntro: 'A graceful space for the younger hearts in the family.',
      footerNote: 'May your presence make our day complete.',
    },
    families: {
      sideA: { label: 'Family', title: `${p1}'s Family`, description: '', members: [] },
      sideB: { label: 'Family', title: `${p2}'s Family`, description: '', members: [] },
      note: { label: 'A special request', title: 'A warm request from both families.', description: 'Please grace the occasion with your presence and blessings.' },
    },
    children: [],
    events: [newEvent({ name: 'Wedding Ceremony', date: input.date, time: input.time, venueName: input.venue.trim(), venueAddress: input.venue.trim() })],
    gallery: [],
    couplePhoto: null,
    musicUrl: '',
    features: { countdown: true, family: true, venues: true, children: false, gallery: true, rsvp: true, music: false },
    rsvp: { maxGuests: 4 },
  }
}

export type Issue = { field: string; message: string }

export function validateWedding(w: Wedding, otherSlugs: string[]): Issue[] {
  const issues: Issue[] = []
  if (!w.partner1.trim()) issues.push({ field: 'partner1', message: 'First partner’s name is required.' })
  if (!w.partner2.trim()) issues.push({ field: 'partner2', message: 'Second partner’s name is required.' })
  if (!parseDate(w.date)) issues.push({ field: 'date', message: 'A valid wedding date is required.' })
  if (!/^\d{2}:\d{2}$/.test(w.time)) issues.push({ field: 'time', message: 'A ceremony time is required for the countdown.' })
  if (!zonedInstant(w.date, w.time, w.timezone)) issues.push({ field: 'timezone', message: 'Choose a valid timezone.' })
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(w.slug)) issues.push({ field: 'slug', message: 'Web address may only use lowercase letters, numbers, and hyphens.' })
  else if (otherSlugs.includes(w.slug)) issues.push({ field: 'slug', message: 'Another wedding already uses this web address.' })
  w.events.forEach((e, i) => {
    const label = e.name.trim() || `Event ${i + 1}`
    if (!e.name.trim()) issues.push({ field: `event-${e.id}`, message: `Event ${i + 1} needs a name.` })
    if (!parseDate(e.date)) issues.push({ field: `event-${e.id}`, message: `${label} needs a valid date.` })
    if (e.mapsUrl && !/^https:\/\/\S+$/i.test(e.mapsUrl)) issues.push({ field: `event-${e.id}`, message: `${label}: map link must be a full https:// link.` })
  })
  if (w.features.rsvp && (!Number.isInteger(w.rsvp.maxGuests) || w.rsvp.maxGuests < 1 || w.rsvp.maxGuests > 20)) issues.push({ field: 'maxGuests', message: 'Maximum guests per RSVP must be between 1 and 20.' })
  return issues
}
