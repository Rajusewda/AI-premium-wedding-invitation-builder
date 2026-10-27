'use client'

import { ChangeEvent, ReactNode, useState } from 'react'
import { ArrowDown, ArrowUp, Check, ExternalLink, ImagePlus, Plus, Trash2, Users, X } from 'lucide-react'
import { type GalleryImage, type Issue, type Wedding, TIMEZONES, mapUrl, newEvent, uid } from '@/lib/wedding'
import { publicWeddings } from '@/lib/seed'

export type PanelProps = { draft: Wedding; update: (fn: (w: Wedding) => Wedding) => void; issues: Issue[] }

function Field({ label, error, className = '', children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return <label className={className}>{label}{children}{error && <span className="field-error" role="alert">{error}</span>}</label>
}
const errorFor = (issues: Issue[], field: string) => issues.find((i) => i.field === field)?.message
const lines = (value: string) => value.split('\n')

export function DetailsPanel({ draft, update, issues }: PanelProps) {
  const set = <K extends keyof Wedding>(key: K, value: Wedding[K]) => update((w) => ({ ...w, [key]: value }))
  const setCopy = (key: keyof Wedding['copy'], value: string) => update((w) => ({ ...w, copy: { ...w.copy, [key]: value } }))
  const setSide = (side: 'sideA' | 'sideB', patch: Partial<Wedding['families']['sideA']>) => update((w) => ({ ...w, families: { ...w.families, [side]: { ...w.families[side], ...patch } } }))
  const setFeature = (key: keyof Wedding['features'], value: boolean) => update((w) => ({ ...w, features: { ...w.features, [key]: value } }))
  const copyFields: [keyof Wedding['copy'], string, boolean][] = [
    ['coverEyebrow', 'Cover heading', false], ['coverMessage', 'Cover message', true], ['openingLine', 'Opening line (optional, e.g. a blessing)', false],
    ['heroEyebrow', 'Welcome heading', false], ['heroMessage', 'Welcome message', true], ['countdownTitle', 'Countdown title', false], ['footerNote', 'Footer message', false],
  ]
  const features: [keyof Wedding['features'], string, string][] = [
    ['countdown', 'Countdown', 'Live countdown to the ceremony in the wedding’s timezone.'], ['family', 'Family section', 'Blessings and family details.'], ['venues', 'Venue cards & map buttons', 'Built from events that have a venue.'],
    ['children', 'Children’s section', 'A row of little names.'], ['gallery', 'Photo gallery', 'Appears once photos are added.'], ['rsvp', 'RSVP form', 'Guests can fill in the form. Responses are not stored until a backend is connected.'], ['music', 'Background music', 'Adds a music toggle to the invitation.'],
  ]
  return <>
    <section className="editor-card"><h2>Couple &amp; date</h2><p className="hint">The ceremony date and time drive the countdown.</p>
      <div className="field-grid">
        <Field label="First partner *" error={errorFor(issues, 'partner1')}><input value={draft.partner1} onChange={(e) => set('partner1', e.target.value)} /></Field>
        <Field label="Second partner *" error={errorFor(issues, 'partner2')}><input value={draft.partner2} onChange={(e) => set('partner2', e.target.value)} /></Field>
        <Field label="Word between the names (e.g. weds, &)"><input value={draft.connector} maxLength={12} onChange={(e) => set('connector', e.target.value)} /></Field>
        <Field label="Website address *" error={errorFor(issues, 'slug')}><input value={draft.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))} /></Field>
        <Field label="Ceremony date *" error={errorFor(issues, 'date')}><input type="date" value={draft.date} onChange={(e) => set('date', e.target.value)} /></Field>
        <Field label="Ceremony time *" error={errorFor(issues, 'time')}><input type="time" value={draft.time} onChange={(e) => set('time', e.target.value)} /></Field>
        <Field label="Timezone *" error={errorFor(issues, 'timezone')} className="span-2"><select value={draft.timezone} onChange={(e) => set('timezone', e.target.value)}>{TIMEZONES.map((t) => <option key={t.id} value={t.id}>{t.label} — {t.id}</option>)}</select></Field>
      </div>
      <p className="hint">Public address: <code>/w/{draft.slug || '…'}</code></p>
    </section>
    <section className="editor-card"><h2>Invitation wording</h2><p className="hint">Text shown on the cover, welcome, and footer.</p>
      <div className="field-grid">{copyFields.map(([key, label, long]) => <Field key={key} label={label} className={long ? 'span-2' : ''}>{long ? <textarea value={draft.copy[key]} onChange={(e) => setCopy(key, e.target.value)} rows={2} /> : <input value={draft.copy[key]} onChange={(e) => setCopy(key, e.target.value)} />}</Field>)}</div>
    </section>
    <section className="editor-card"><h2>Family information</h2><p className="hint">One family member per line (optional).</p>
      <Field label="Section heading"><input value={draft.copy.familyHeading} onChange={(e) => setCopy('familyHeading', e.target.value)} /></Field>
      {(['sideA', 'sideB'] as const).map((side, i) => <div className="item-card" key={side}><div className="item-card-head"><strong>Family {i + 1}</strong></div><div className="field-grid">
        <Field label="Label (e.g. Groom side)"><input value={draft.families[side].label} onChange={(e) => setSide(side, { label: e.target.value })} /></Field>
        <Field label="Title"><input value={draft.families[side].title} onChange={(e) => setSide(side, { title: e.target.value })} /></Field>
        <Field label="Message" className="span-2"><input value={draft.families[side].description} onChange={(e) => setSide(side, { description: e.target.value })} /></Field>
        <Field label="Family members (one per line)" className="span-2"><textarea value={draft.families[side].members.join('\n')} onChange={(e) => setSide(side, { members: lines(e.target.value) })} rows={3} /></Field>
      </div></div>)}
      <div className="item-card"><div className="item-card-head"><strong>Special request card</strong></div><div className="field-grid">
        <Field label="Label"><input value={draft.families.note.label} onChange={(e) => update((w) => ({ ...w, families: { ...w.families, note: { ...w.families.note, label: e.target.value } } }))} /></Field>
        <Field label="Title"><input value={draft.families.note.title} onChange={(e) => update((w) => ({ ...w, families: { ...w.families, note: { ...w.families.note, title: e.target.value } } }))} /></Field>
        <Field label="Message" className="span-2"><textarea rows={2} value={draft.families.note.description} onChange={(e) => update((w) => ({ ...w, families: { ...w.families, note: { ...w.families.note, description: e.target.value } } }))} /></Field>
      </div></div>
    </section>
    <section className="editor-card"><h2>Children’s section</h2><p className="hint">Shown only when the section is enabled below and at least one name is entered.</p>
      <div className="field-grid"><Field label="Intro text" className="span-2"><input value={draft.copy.childrenIntro} onChange={(e) => setCopy('childrenIntro', e.target.value)} /></Field><Field label="Names (one per line)" className="span-2"><textarea rows={3} value={draft.children.join('\n')} onChange={(e) => set('children', lines(e.target.value))} /></Field></div>
    </section>
    <section className="editor-card"><h2>Optional features</h2><p className="hint">Turn sections of the invitation on or off.</p>
      {features.map(([key, label, hint]) => <label className="check-row" key={key}><input type="checkbox" checked={draft.features[key]} onChange={(e) => setFeature(key, e.target.checked)} /><span>{label}<small>{hint}</small></span></label>)}
      {draft.features.music && <Field label="Music file or link"><input value={draft.musicUrl} onChange={(e) => set('musicUrl', e.target.value)} placeholder="/wedding-music.mp3 or https://…" /><span className="hint">Put the audio file in the project’s <code>public</code> folder, or paste a direct link. The toggle is hidden while this is empty.</span></Field>}
    </section>
  </>
}

export function EventsPanel({ draft, update, issues }: PanelProps) {
  const patch = (id: string, p: Partial<Wedding['events'][number]>) => update((w) => ({ ...w, events: w.events.map((e) => (e.id === id ? { ...e, ...p } : e)) }))
  const move = (index: number, dir: -1 | 1) => update((w) => { const next = [...w.events]; const t = index + dir; if (t < 0 || t >= next.length) return w; [next[index], next[t]] = [next[t], next[index]]; return { ...w, events: next } })
  return <>
    <div className="notice info">Each event can have its own venue. Leave the map link blank to search Google Maps for the venue address; paste a verified Google Maps share link to override it. Coordinates are never guessed.</div>
    {draft.events.length === 0 && <div className="editor-card"><p className="hint">No events yet. Add the first one below.</p></div>}
    {draft.events.map((event, index) => {
      const problems = issues.filter((i) => i.field === `event-${event.id}`)
      return <section className="item-card" key={event.id}>
        <div className="item-card-head"><strong>{String(index + 1).padStart(2, '0')} · {event.name || 'New event'}</strong><div className="item-actions">
          <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move event up"><ArrowUp size={14} /></button>
          <button type="button" onClick={() => move(index, 1)} disabled={index === draft.events.length - 1} aria-label="Move event down"><ArrowDown size={14} /></button>
          <button type="button" className="danger-button" onClick={() => update((w) => ({ ...w, events: w.events.filter((e) => e.id !== event.id) }))} aria-label={`Delete ${event.name || 'event'}`}><Trash2 size={14} /></button></div></div>
        {problems.length > 0 && <ul className="issue-list">{problems.map((p, i) => <li key={i}>{p.message}</li>)}</ul>}
        <div className="field-grid">
          <Field label="Event name *" className="span-2"><input value={event.name} onChange={(e) => patch(event.id, { name: e.target.value })} /></Field>
          <Field label="Date *"><input type="date" value={event.date} onChange={(e) => patch(event.id, { date: e.target.value })} /></Field>
          <Field label="Time (optional)"><input type="time" value={event.time} onChange={(e) => patch(event.id, { time: e.target.value })} /></Field>
          <Field label="Dress code (optional)" className="span-2"><input value={event.dressCode} onChange={(e) => patch(event.id, { dressCode: e.target.value })} /></Field>
          <Field label="Venue name (leave blank if none)"><input value={event.venueName} onChange={(e) => patch(event.id, { venueName: e.target.value })} /></Field>
          <Field label="Venue address for maps"><input value={event.venueAddress} onChange={(e) => patch(event.id, { venueAddress: e.target.value })} placeholder="Defaults to the venue name" /></Field>
          <Field label="Verified Google Maps link (optional)" className="span-2"><input value={event.mapsUrl} onChange={(e) => patch(event.id, { mapsUrl: e.target.value.trim() })} placeholder="https://maps.app.goo.gl/…" /></Field>
        </div>
        {event.venueName.trim() && <a className="text-button" href={mapUrl(event)} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} />Test map link</a>}
      </section>
    })}
    <button type="button" className="secondary-action" onClick={() => update((w) => ({ ...w, events: [...w.events, newEvent({ date: w.date })] }))}><Plus size={15} />Add event</button>
  </>
}

const MAX_BYTES = 8 * 1024 * 1024
export function GalleryPanel({ draft, update }: PanelProps) {
  const [error, setError] = useState('')
  function toImages(files: FileList | null): GalleryImage[] {
    const out: GalleryImage[] = []
    const problems: string[] = []
    Array.from(files ?? []).forEach((file) => {
      if (!file.type.startsWith('image/')) problems.push(`${file.name} is not an image.`)
      else if (file.size > MAX_BYTES) problems.push(`${file.name} is larger than 8 MB.`)
      else out.push({ id: uid(), src: URL.createObjectURL(file), alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') })
    })
    setError(problems.join(' '))
    return out
  }
  const addGallery = (e: ChangeEvent<HTMLInputElement>) => { const imgs = toImages(e.target.files); if (imgs.length) update((w) => ({ ...w, gallery: [...w.gallery, ...imgs] })); e.target.value = '' }
  const setCouple = (e: ChangeEvent<HTMLInputElement>) => { const [img] = toImages(e.target.files); if (img) update((w) => ({ ...w, couplePhoto: { ...img, alt: `${w.partner1} and ${w.partner2}` } })); e.target.value = '' }
  const move = (i: number, dir: -1 | 1) => update((w) => { const next = [...w.gallery]; const t = i + dir; if (t < 0 || t >= next.length) return w; [next[i], next[t]] = [next[t], next[i]]; return { ...w, gallery: next } })
  return <>
    <div className="notice">Photos are held in this browser session only and disappear on reload. Permanent storage needs the backend (Supabase Storage) that is not connected yet.</div>
    {error && <ul className="issue-list"><li>{error}</li></ul>}
    <section className="editor-card"><h2>Couple photograph</h2><p className="hint">Shown at the top of the welcome section.</p>
      {draft.couplePhoto ? <div className="thumb-row"><img src={draft.couplePhoto.src} alt={draft.couplePhoto.alt} /><Field label="Description for screen readers"><input value={draft.couplePhoto.alt} onChange={(e) => update((w) => w.couplePhoto ? { ...w, couplePhoto: { ...w.couplePhoto, alt: e.target.value } } : w)} /></Field><button type="button" className="danger-button" onClick={() => update((w) => ({ ...w, couplePhoto: null }))} aria-label="Remove couple photograph"><X size={14} /></button></div> : <label className="secondary-action"><ImagePlus size={15} />Choose photograph<input type="file" accept="image/*" hidden onChange={setCouple} /></label>}
    </section>
    <section className="editor-card"><h2>Gallery</h2><p className="hint">Order here is the order guests see. JPG, PNG or WebP, up to 8 MB each.</p>
      {draft.gallery.length === 0 && <p className="hint">No photographs yet. The gallery section stays hidden until you add some.</p>}
      {draft.gallery.map((img, i) => <div className="item-card thumb-row" key={img.id}><img src={img.src} alt={img.alt} /><Field label="Description for screen readers"><input value={img.alt} onChange={(e) => update((w) => ({ ...w, gallery: w.gallery.map((g) => (g.id === img.id ? { ...g, alt: e.target.value } : g)) }))} /></Field><div className="item-actions">
        <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move photograph earlier"><ArrowUp size={14} /></button>
        <button type="button" onClick={() => move(i, 1)} disabled={i === draft.gallery.length - 1} aria-label="Move photograph later"><ArrowDown size={14} /></button>
        <button type="button" className="danger-button" onClick={() => update((w) => ({ ...w, gallery: w.gallery.filter((g) => g.id !== img.id) }))} aria-label="Remove photograph"><Trash2 size={14} /></button></div></div>)}
      <label className="secondary-action"><ImagePlus size={15} />Add photographs<input type="file" accept="image/*" multiple hidden onChange={addGallery} /></label>
    </section>
  </>
}

export function RsvpPanel({ draft, update, issues }: PanelProps) {
  return <>
    <div className="notice">RSVP responses cannot be stored yet. The invitation’s form validates input but tells guests plainly that their response was not saved. Real collection and this response list arrive with the backend.</div>
    <section className="editor-card"><h2>RSVP settings</h2><p className="hint">These settings do apply to the invitation form.</p>
      <label className="check-row"><input type="checkbox" checked={draft.features.rsvp} onChange={(e) => update((w) => ({ ...w, features: { ...w.features, rsvp: e.target.checked } }))} /><span>Show the RSVP form on the invitation</span></label>
      <Field label="Maximum guests per response" error={errorFor(issues, 'maxGuests')}><input type="number" min={1} max={20} value={draft.rsvp.maxGuests} onChange={(e) => update((w) => ({ ...w, rsvp: { maxGuests: Number(e.target.value) } }))} /></Field>
    </section>
    <section className="editor-card"><h2>Responses</h2><div className="empty-workspace"><span><Users size={21} /></span><h2>No responses can be collected yet</h2><p>Connect the backend to store guest responses and review them here.</p></div></section>
  </>
}

export function PublishPanel({ draft, saved, dirty, issues, setStatus }: PanelProps & { saved: Wedding; dirty: boolean; setStatus: (status: Wedding['status']) => void }) {
  const checks: [boolean, string][] = [
    [issues.length === 0, 'Required details are complete'],
    [draft.events.length > 0, 'At least one event is configured'],
    [draft.events.some((e) => e.venueName.trim()), 'At least one event has a venue'],
    [!dirty, 'All changes are saved'],
  ]
  const live = publicWeddings.some((w) => w.slug === saved.slug)
  return <>
    <div className="notice">Publishing is not connected to a server. Marking a wedding as published records its status for this session only; its public page is served only for the built-in reference wedding until the backend exists.</div>
    <section className="editor-card"><h2>Status: {draft.status === 'published' ? 'Published' : 'Draft'}</h2>
      <ul className="checklist">{checks.map(([ok, label]) => <li key={label} className={ok ? 'ok' : 'todo'}>{ok ? <Check size={15} /> : <X size={15} />}{label}</li>)}</ul>
      <p className="hint">Website address</p><code className="url-box">/w/{draft.slug}</code>
      <div className="item-actions" style={{ marginTop: 18 }}>
        {draft.status === 'published'
          ? <button type="button" className="secondary-action" onClick={() => setStatus('draft')}>Unpublish (back to draft)</button>
          : <button type="button" className="primary-action" onClick={() => setStatus('published')}>Save &amp; mark as published</button>}
        {live && <a className="secondary-action" href={`/w/${saved.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} />Open public page</a>}
      </div>
    </section>
  </>
}
