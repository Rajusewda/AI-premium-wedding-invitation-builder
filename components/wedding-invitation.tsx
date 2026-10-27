'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, MapPin, Music2, ArrowUp, VolumeX, X } from 'lucide-react'
import { type Wedding, directionsUrl, formatDate, formatTime, mapUrl, numberWord, timezoneName, zonedInstant } from '@/lib/wedding'

const members = (list: string[]) => list.map((m) => m.trim()).filter(Boolean)

function useCountdown(date: string, time: string, timezone: string) {
  const target = useMemo(() => zonedInstant(date, time, timezone), [date, time, timezone])
  const [remaining, setRemaining] = useState<number | null>(null)
  useEffect(() => {
    if (!target) return
    const calculate = () => setRemaining(Math.max(0, target.getTime() - Date.now()))
    calculate()
    const timer = window.setInterval(calculate, 1000)
    return () => window.clearInterval(timer)
  }, [target])
  if (!target) return { invalid: true, passed: false, ready: false, values: [0, 0, 0, 0], target }
  if (remaining === null) return { invalid: false, passed: false, ready: false, values: [0, 0, 0, 0], target }
  const seconds = Math.floor(remaining / 1000)
  return { invalid: false, passed: remaining === 0, ready: true, values: [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24, Math.floor(seconds / 60) % 60, seconds % 60], target }
}

/**
 * Renders one wedding's public invitation from its data.
 * mode="preview" is used inside the builder; mode="public" on /w/[slug].
 * RSVP responses are never stored by this component: persistence needs a backend.
 */
export function WeddingInvitation({ wedding, mode = 'public' }: { wedding: Wedding; mode?: 'public' | 'preview' }) {
  const { copy, features } = wedding
  const [isOpen, setIsOpen] = useState(false)
  const defaultEvent = Math.max(0, wedding.events.findIndex((e) => e.date === wedding.date && e.time === wedding.time))
  const [selected, setSelected] = useState(defaultEvent)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [rsvpChecked, setRsvpChecked] = useState(false)
  const [rsvpError, setRsvpError] = useState('')
  const [musicOn, setMusicOn] = useState(false)
  const [musicError, setMusicError] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const countdown = useCountdown(wedding.date, wedding.time, wedding.timezone)
  const theme = `inv-${wedding.template}`

  const venues = wedding.events.filter((e) => e.venueName.trim())
  const event = wedding.events[Math.min(selected, wedding.events.length - 1)]
  const showMusic = features.music && wedding.musicUrl.trim() !== ''
  const showVenues = features.venues && venues.length > 0
  const names = <>{wedding.partner1} <span>{wedding.connector || '&'}</span> {wedding.partner2}</>
  const dateText = formatDate(wedding.date)

  useEffect(() => {
    if (lightbox === null) return
    const onKey = (e: KeyboardEvent) => {
      const count = wedding.gallery.length
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight') setLightbox((i) => (i === null ? i : (i + 1) % count))
      if (e.key === 'ArrowLeft') setLightbox((i) => (i === null ? i : (i - 1 + count) % count))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, wedding.gallery.length])

  function submitRsvp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const phone = String(form.get('phone') ?? '').trim()
    if (!name) return setRsvpError('Please enter your name.')
    if (!/^[+0-9 ()-]{8,20}$/.test(phone)) return setRsvpError('Please enter a valid phone number.')
    setRsvpError('')
    // Nothing is sent or stored: there is no backend yet, so the response is not saved.
    setRsvpChecked(true)
  }
  function toggleMusic() {
    const audio = audioRef.current
    if (!audio) return
    if (musicOn) { audio.pause(); setMusicOn(false) } else {
      audio.play().then(() => { setMusicOn(true); setMusicError(false) }).catch(() => setMusicError(true))
    }
  }

  if (!isOpen) return <main className={`wedding-shell ${theme}`}><section className="cover-card" aria-labelledby="invitation-title"><div className="cover-rule" aria-hidden="true" /><p className="eyebrow">{copy.coverEyebrow}</p><h1 id="invitation-title">{names}</h1><p className="cover-copy">{copy.coverMessage}</p><p className="date-label">{dateText}</p><button className="open-button" type="button" onClick={() => setIsOpen(true)}>Open invitation</button></section></main>

  return <main id="top" className={`wedding-shell invitation-shell ${theme}`}>
    <nav className="quick-actions" aria-label="Quick actions">{showVenues && <a href="#venue">Venue</a>}{features.rsvp && <a href="#rsvp">RSVP</a>}{showMusic && <button type="button" onClick={toggleMusic} aria-pressed={musicOn}>{musicOn ? <Music2 size={14} aria-hidden="true" /> : <VolumeX size={14} aria-hidden="true" />} {musicOn ? 'Music on' : 'Music off'}</button>}</nav>
    {showMusic && <audio ref={audioRef} src={wedding.musicUrl} loop onError={() => { setMusicOn(false); setMusicError(true) }} aria-label="Wedding music" />}
    <section className="hero-panel" aria-labelledby="hero-title">{wedding.couplePhoto && <img className="hero-photo" src={wedding.couplePhoto.src} alt={wedding.couplePhoto.alt || `${wedding.partner1} and ${wedding.partner2}`} />}{copy.openingLine && <p className="arabic-line">{copy.openingLine}</p>}<p className="eyebrow">{copy.heroEyebrow}</p><h1 id="hero-title">{names}</h1><p className="hero-copy">{copy.heroMessage}</p><div className="hero-actions">{wedding.events.length > 0 && <a className="open-button" href="#events">View events</a>}{showVenues && <a className="open-button secondary-button" href="#venue">Get directions</a>}{features.rsvp && <a className="open-button secondary-button" href="#rsvp">RSVP</a>}</div>{features.countdown && <a className="scroll-cue" href="#countdown"><span>Discover the day</span><ArrowDown size={16} aria-hidden="true" /></a>}</section>
    {features.countdown && <section className="detail-panel" id="countdown"><p className="eyebrow">Save the date</p><h2>{copy.countdownTitle}</h2>{countdown.target && <p>{dateText} · {formatTime(wedding.time)} · {timezoneName(countdown.target, wedding.timezone)}</p>}{countdown.invalid ? <p className="completed-message">The wedding date is not set.</p> : !countdown.ready ? <p className="completed-message" aria-live="polite">Preparing the countdown…</p> : countdown.passed ? <p className="completed-message">The celebration has begun.</p> : <div className="countdown">{countdown.values.map((value, index) => <div className="countdown-item" key={index}><strong>{String(value).padStart(2, '0')}</strong><span>{['Days', 'Hours', 'Minutes', 'Seconds'][index]}</span></div>)}</div>}</section>}
    {features.family && <section className="family-section"><p className="eyebrow">With blessings around us</p><h2>{copy.familyHeading}</h2><div className="card-grid three">{[wedding.families.sideA, wedding.families.sideB].map((side, i) => <article key={i}><p className="eyebrow">{side.label}</p><h3>{side.title}</h3>{side.description && <p>{side.description}</p>}{members(side.members).length > 0 && <ul className="family-members">{members(side.members).map((m, j) => <li key={j}>{m}</li>)}</ul>}</article>)}<article><p className="eyebrow">{wedding.families.note.label}</p><h3>{wedding.families.note.title}</h3><p>{wedding.families.note.description}</p></article></div></section>}
    {event && <section className="events-section" id="events"><div className="section-heading"><p className="eyebrow">The celebrations</p><h2>{numberWord(wedding.events.length)} beautiful {wedding.events.length === 1 ? 'moment' : 'moments'}.</h2></div><div className="events-layout"><div className="event-list" role="tablist" aria-label="Wedding events">{wedding.events.map((item, index) => <button key={item.id} className={selected === index ? 'event-row selected' : 'event-row'} type="button" role="tab" aria-selected={selected === index} onClick={() => setSelected(index)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.name}</strong><small>{formatDate(item.date)}</small></button>)}</div><article className="event-detail" aria-live="polite"><p className="eyebrow">Selected event</p><h3>{event.name}</h3><p><CalendarDays size={16} aria-hidden="true" /> {formatDate(event.date)}</p>{event.time && <p><Clock3 size={16} aria-hidden="true" /> {formatTime(event.time)}</p>}{event.venueName && <p><MapPin size={16} aria-hidden="true" /> {event.venueName}</p>}{event.dressCode && <p className="dress-code">Dress code: {event.dressCode}</p>}</article></div></section>}
    {showVenues && <section className="venue-section" id="venue"><p className="eyebrow">Gather with us</p><h2>Elegant locations for the {numberWord(venues.length).toLowerCase()} key {venues.length === 1 ? 'ceremony' : 'ceremonies'}.</h2><div className={venues.length === 1 ? 'card-grid one' : 'card-grid two'}>{venues.map((venue) => <article className="venue-card" key={venue.id}><div className="map-placeholder"><MapPin size={24} aria-hidden="true" /><span>Location details</span></div><p className="eyebrow">{venue.name}</p><h3>{venue.venueName}</h3><p>{formatDate(venue.date)}{venue.time && ` · ${formatTime(venue.time)}`}</p><div className="venue-actions"><a href={mapUrl(venue)} target="_blank" rel="noopener noreferrer"><span>Open in Google Maps</span><ArrowUpRight size={14} aria-hidden="true" /></a><a href={directionsUrl(venue)} target="_blank" rel="noopener noreferrer"><span>Get directions</span><ArrowUpRight size={14} aria-hidden="true" /></a></div></article>)}</div></section>}
    {features.children && members(wedding.children).length > 0 && <section className="children-section"><p className="eyebrow">Children</p><h2>A joyful line of little names, placed with love and care.</h2><p className="section-copy">{copy.childrenIntro}</p><div className="children-list">{members(wedding.children).map((name, i) => <span key={i}>{name}</span>)}</div></section>}
    {features.gallery && wedding.gallery.length > 0 && <section className="gallery-section" id="gallery"><p className="eyebrow">Moments</p><h2>A glimpse of our story.</h2><div className="gallery-grid">{wedding.gallery.map((img, i) => <button key={img.id} type="button" onClick={() => setLightbox(i)} aria-label={`Open photograph ${i + 1}`}><img src={img.src} alt={img.alt} loading="lazy" /></button>)}</div></section>}
    {features.rsvp && <section className="rsvp-section" id="rsvp"><p className="eyebrow">Your presence is our gift</p><h2>Let us know if you can join us.</h2>{rsvpChecked ? <div className="success-box notice-box" role="status"><Check size={22} aria-hidden="true" /><div><p><strong>Your response was not saved.</strong></p><p>{mode === 'preview' ? 'This is a preview, so RSVP responses are not collected.' : 'Online RSVP collection is not connected yet. Please contact the family directly to confirm your attendance.'}</p><button type="button" className="open-button secondary-button" onClick={() => setRsvpChecked(false)}>Back to form</button></div></div> : <form className="rsvp-form" onSubmit={submitRsvp} noValidate><label>Your name<input name="name" required autoComplete="name" /></label><label>Phone number<input name="phone" required type="tel" placeholder="+91 300 1234567" autoComplete="tel" /></label><label>Number of guests<select name="guests" defaultValue="1">{Array.from({ length: Math.max(1, wedding.rsvp.maxGuests) }, (_, i) => <option key={i} value={i + 1}>{i + 1} {i === 0 ? 'guest' : 'guests'}</option>)}</select></label><label>Attendance<select name="attendance" defaultValue="accept"><option value="accept">Accepts with pleasure</option><option value="decline">Declines with regret</option></select></label><label className="full-width">Message<textarea name="message" rows={4} /></label><button className="open-button" type="submit">Send RSVP</button>{rsvpError && <p role="alert" className="form-error">{rsvpError}</p>}</form>}{musicError && <p className="music-error" role="status">Music is unavailable. Check the music file or link in the wedding settings.</p>}</section>}
    <footer className="wedding-footer"><p className="eyebrow">With love, {wedding.partner1} &amp; {wedding.partner2}</p><p>{dateText} · {copy.footerNote}</p><a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Return to top <ArrowUp size={14} aria-hidden="true" /></a></footer>
    {lightbox !== null && wedding.gallery[lightbox] && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Wedding photograph"><button type="button" className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close photograph"><X /></button><img src={wedding.gallery[lightbox].src} alt={wedding.gallery[lightbox].alt} />{wedding.gallery.length > 1 && <><button type="button" className="lightbox-prev" onClick={() => setLightbox((lightbox - 1 + wedding.gallery.length) % wedding.gallery.length)} aria-label="Previous photograph"><ChevronLeft /></button><button type="button" className="lightbox-next" onClick={() => setLightbox((lightbox + 1) % wedding.gallery.length)} aria-label="Next photograph"><ChevronRight /></button></>}</div>}
  </main>
}
