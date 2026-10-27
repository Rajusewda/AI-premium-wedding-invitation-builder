'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, ExternalLink, FileImage, GalleryVerticalEnd, Globe2, Heart, LayoutDashboard, Menu, Palette, Plus, Send, Settings2, Sparkles, Users, X } from 'lucide-react'
import { WeddingInvitation } from '@/components/wedding-invitation'
import { DetailsPanel, EventsPanel, GalleryPanel, PublishPanel, RsvpPanel } from '@/components/builder/panels'
import { seedWeddings } from '@/lib/seed'
import { type Issue, type TemplateId, type Wedding, TEMPLATES, TIMEZONES, coupleNames, createWedding, formatDate, formatTime, validateWedding } from '@/lib/wedding'

type View = 'overview' | 'websites' | 'create' | 'templates' | 'editor' | 'events' | 'gallery' | 'rsvps' | 'preview' | 'publish'

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'websites', label: 'Wedding websites', icon: Globe2 },
  { id: 'templates', label: 'Templates', icon: Palette },
  { id: 'rsvps', label: 'RSVPs', icon: Users },
]
const buildItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'editor', label: 'Wedding details', icon: Settings2 },
  { id: 'events', label: 'Events & venues', icon: CalendarDays },
  { id: 'gallery', label: 'Photo gallery', icon: GalleryVerticalEnd },
  { id: 'publish', label: 'Publish settings', icon: Send },
]
const titles: Record<View, string> = { overview: 'Overview', websites: 'Wedding websites', create: 'Create wedding', templates: 'Templates', editor: 'Wedding details', events: 'Events & venues', gallery: 'Photo gallery', rsvps: 'RSVP management', preview: 'Preview', publish: 'Publish settings' }
const statusLabel = (w: Wedding) => (w.status === 'published' ? 'Published' : 'Draft')

function cleanLists(w: Wedding): Wedding {
  const tidy = (list: string[]) => list.map((s) => s.trim()).filter(Boolean)
  return { ...w, children: tidy(w.children), families: { ...w.families, sideA: { ...w.families.sideA, members: tidy(w.families.sideA.members) }, sideB: { ...w.families.sideB, members: tidy(w.families.sideB.members) } } }
}

function TemplateCard({ template, names, selected, onSelect }: { template: (typeof TEMPLATES)[number]; names: [string, string]; selected: boolean; onSelect: () => void }) {
  return <button type="button" className={`builder-template-card ${template.className} ${selected ? 'selected' : ''}`} onClick={onSelect} aria-pressed={selected}>
    <span className="template-card-art"><span>{names[0] || 'Your names'}</span><i>&amp;</i><span>{names[1] || 'Your love'}</span></span>
    <span className="template-card-meta"><strong>{template.name}</strong><small>{template.description}</small><em>{template.palette}</em></span>
    {selected && <span className="template-selected"><Check size={13} /></span>}
  </button>
}

function PreviewMini({ template, partner1, partner2, date }: { template: TemplateId; partner1: string; partner2: string; date: string }) {
  const option = TEMPLATES.find((item) => item.id === template)!
  return <div className={`preview-mini ${option.className}`}><span className="mini-kicker">Together with their families</span><strong>{partner1 || 'Your names'} <i>&amp;</i><br />{partner2 || 'Your love'}</strong><span className="mini-rule" /><small>{date ? date.split('-').reverse().join(' · ') : '— · — · —'}</small></div>
}

export function WeddingBuilder() {
  const [view, setView] = useState<View>('overview')
  const [weddings, setWeddings] = useState<Wedding[]>(seedWeddings)
  const [activeId, setActiveId] = useState(seedWeddings[0].id)
  const [draft, setDraft] = useState<Wedding>(seedWeddings[0])
  const [saveIssues, setSaveIssues] = useState<Issue[]>([])
  const [mobileNav, setMobileNav] = useState(false)
  const [touched, setTouched] = useState(false)
  const [form, setForm] = useState({ partner1: '', partner2: '', date: '', time: '17:00', timezone: 'Asia/Kolkata', venue: '', template: 'royal' as TemplateId })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const saved = weddings.find((w) => w.id === activeId) ?? weddings[0]
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const otherSlugs = useMemo(() => weddings.filter((w) => w.id !== draft.id).map((w) => w.slug), [weddings, draft.id])
  const liveIssues = useMemo(() => validateWedding(draft, otherSlugs), [draft, otherSlugs])
  const shownIssues = saveIssues.length ? liveIssues : []

  useEffect(() => {
    if (!dirty && !touched) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, touched])

  const go = (next: View) => { setView(next); setMobileNav(false); if (next !== view) window.scrollTo({ top: 0 }) }
  const update = (fn: (w: Wedding) => Wedding) => setDraft((w) => fn(w))

  function selectWedding(id: string, next?: View): boolean {
    if (id !== activeId) {
      if (dirty && !window.confirm('You have unsaved changes to the current wedding. Discard them?')) return false
      const target = weddings.find((w) => w.id === id)
      if (!target) return false
      setActiveId(id); setDraft(target); setSaveIssues([])
    }
    if (next) go(next)
    return true
  }

  function commit(next: Wedding): boolean {
    const cleaned = cleanLists(next)
    const issues = validateWedding(cleaned, weddings.filter((w) => w.id !== cleaned.id).map((w) => w.slug))
    if (issues.length) { setDraft(cleaned); setSaveIssues(issues); return false }
    setWeddings((list) => list.map((w) => (w.id === cleaned.id ? cleaned : w)))
    setDraft(cleaned); setSaveIssues([]); setTouched(true)
    return true
  }
  const discard = () => { setDraft(saved); setSaveIssues([]) }
  const setStatus = (status: Wedding['status']) => { commit({ ...draft, status }) }

  function createNew() {
    const errors: Record<string, string> = {}
    if (!form.partner1.trim()) errors.partner1 = 'Enter the first partner’s name.'
    if (!form.partner2.trim()) errors.partner2 = 'Enter the second partner’s name.'
    if (!form.date) errors.date = 'Choose the wedding date.'
    if (!form.time) errors.time = 'Choose the ceremony time.'
    setFormErrors(errors)
    if (Object.keys(errors).length) return
    if (dirty && !window.confirm('You have unsaved changes to the current wedding. Discard them?')) return
    const wedding = createWedding({ ...form, takenSlugs: weddings.map((w) => w.slug) })
    setWeddings((list) => [wedding, ...list]); setActiveId(wedding.id); setDraft(wedding); setSaveIssues([]); setTouched(true)
    setForm((f) => ({ ...f, partner1: '', partner2: '', date: '', venue: '' }))
    go('editor')
  }

  if (view === 'preview') return <div className="preview-frame">
    <div className="preview-bar"><button type="button" onClick={() => go('editor')}><ArrowLeft size={14} />Back to editor</button><span>Previewing {coupleNames(draft)} · {TEMPLATES.find((t) => t.id === draft.template)?.name} · {dirty ? 'includes unsaved changes' : 'saved version'}</span><button type="button" onClick={() => go('overview')}><X size={14} />Close</button></div>
    <div className="preview-offset"><WeddingInvitation key={draft.id} wedding={draft} mode="preview" /></div>
  </div>

  const counts = { published: weddings.filter((w) => w.status === 'published').length, events: weddings.reduce((n, w) => n + w.events.length, 0) }
  const workspaceView = ['editor', 'events', 'gallery', 'rsvps', 'publish', 'templates'].includes(view)
  const venueOf = (w: Wedding) => w.events.find((e) => e.venueName.trim())?.venueName ?? 'Venue to be confirmed'
  const intro = (eyebrow: string, title: string, copy: string) => <div className="page-intro"><div><p className="builder-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="intro-muted">{copy}</p></div><button className="primary-action" onClick={() => go('preview')}><ExternalLink size={16} />View preview</button></div>
  const panelProps = { draft, update, issues: shownIssues }
  const attention = [
    dirty && { icon: Settings2, text: 'Unsaved changes', note: `${coupleNames(draft)} has edits waiting to be saved.` },
    draft.status === 'draft' && { icon: Send, text: 'Not published', note: 'This wedding is still a draft.' },
    draft.gallery.length === 0 && { icon: FileImage, text: 'No gallery photographs', note: 'The gallery section stays hidden until photos are added.' },
    !draft.events.some((e) => e.venueName.trim()) && { icon: CalendarDays, text: 'No venue added', note: 'Add a venue to an event to show map buttons.' },
  ].filter(Boolean) as { icon: typeof Send; text: string; note: string }[]

  return <div className="builder-shell">
    <aside className={`builder-sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <div className="builder-brand"><span className="brand-mark"><Heart size={15} fill="currentColor" /></span><span>Maison <b>Vow</b></span><button className="sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={18} /></button></div>
      <label className="workspace-switcher"><span className="avatar">{(draft.partner1[0] ?? '?') + (draft.partner2[0] ?? '')}</span><span><small>Editing wedding</small><select className="builder-select" value={activeId} onChange={(e) => selectWedding(e.target.value)} aria-label="Wedding being edited">{weddings.map((w) => <option key={w.id} value={w.id}>{coupleNames(w)}</option>)}</select></span></label>
      <nav className="builder-nav" aria-label="Dashboard navigation">
        <p>Manage</p>
        {navItems.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={view === id ? 'active' : ''} onClick={() => go(id)}><Icon size={17} />{label}</button>)}
        <p className="nav-spacer">Build</p>
        {buildItems.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={view === id ? 'active' : ''} onClick={() => go(id)}><Icon size={17} />{label}</button>)}
      </nav>
      <div className="sidebar-bottom"><p className="sidebar-note">No sign-in or database is connected yet. Everything here lives in this browser tab and is lost on reload.</p></div>
    </aside>
    <main className="builder-main">
      <header className="builder-header"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumb"><span>Maison Vow Studio</span><strong>{titles[view]}</strong></div><div className="header-actions"><button className="preview-link" onClick={() => go('preview')}><ExternalLink size={15} />Preview site</button></div></header>
      <div className="builder-content">
        {view === 'overview' && <>
          <div className="page-intro"><div><p className="builder-eyebrow">Your workspace</p><h1>Welcome back <span>✦</span></h1><p className="intro-muted">Here&apos;s where your wedding websites stand.</p></div><button className="primary-action" onClick={() => go('create')}><Plus size={17} />Create wedding</button></div>
          <div className="metric-grid"><div className="metric-card"><span className="metric-icon rose"><Globe2 size={18} /></span><small>Wedding websites</small><strong>{String(weddings.length).padStart(2, '0')}</strong><em>{weddings.length - counts.published} drafts</em></div><div className="metric-card"><span className="metric-icon gold"><Sparkles size={18} /></span><small>Marked published</small><strong>{String(counts.published).padStart(2, '0')}</strong><em>Session status only</em></div><div className="metric-card"><span className="metric-icon sage"><CalendarDays size={18} /></span><small>Events configured</small><strong>{String(counts.events).padStart(2, '0')}</strong><em>Across all weddings</em></div><div className="metric-card"><span className="metric-icon lilac"><Send size={18} /></span><small>RSVP responses</small><strong>—</strong><em>Needs backend</em></div></div>
          <div className="dashboard-columns"><section className="builder-panel recent-panel"><div className="panel-heading"><div><p className="builder-eyebrow">Your workspace</p><h2>Recent weddings</h2></div><button className="text-button" onClick={() => go('websites')}>View all <ArrowRight size={15} /></button></div>{weddings.map((w) => <div className="wedding-row" key={w.id}><PreviewMini template={w.template} partner1={w.partner1} partner2={w.partner2} date={w.date} /><div className="wedding-row-info"><strong>{coupleNames(w)}</strong><span>{formatDate(w.date)} · {venueOf(w)}</span></div><span className={`status-pill ${w.status}`}>{statusLabel(w)}</span><button className="row-arrow" onClick={() => selectWedding(w.id, 'editor')} aria-label={`Edit ${coupleNames(w)}`}><ArrowRight size={16} /></button></div>)}</section>
            <section className="builder-panel activity-panel"><div className="panel-heading"><div><p className="builder-eyebrow">{coupleNames(draft)}</p><h2>Needs attention</h2></div></div>{attention.length === 0 ? <div className="activity-item"><span className="activity-avatar"><Check size={14} /></span><p><strong>All set</strong><small>Nothing needs attention for this wedding.</small></p></div> : attention.map((a) => <div className="activity-item" key={a.text}><span className="activity-avatar gold-bg"><a.icon size={14} /></span><p><strong>{a.text}</strong><small>{a.note}</small></p></div>)}<div className="activity-tip"><Sparkles size={16} /><span><strong>Session only</strong><small>Weddings, photos, and publish status are not stored yet. Connect the backend to keep them.</small></span></div></section></div>
        </>}
        {view === 'websites' && <section className="workflow-page"><div className="page-intro"><div><p className="builder-eyebrow">Manage your collection</p><h1>Wedding websites</h1><p className="intro-muted">Create, edit, and preview websites for your couples.</p></div><button className="primary-action" onClick={() => go('create')}><Plus size={17} />Create wedding</button></div><div className="website-grid">{weddings.map((w) => <article className="website-card" key={w.id}><PreviewMini template={w.template} partner1={w.partner1} partner2={w.partner2} date={w.date} /><div className="website-card-body"><div><span className={`status-pill ${w.status}`}>{statusLabel(w)}</span><h2>{coupleNames(w)}</h2><p>{formatDate(w.date)} · {venueOf(w)}</p><p>/w/{w.slug}</p></div><div className="item-actions"><button className="secondary-action" onClick={() => selectWedding(w.id, 'editor')}>Edit <ArrowRight size={15} /></button><button className="secondary-action" onClick={() => { if (selectWedding(w.id)) go('preview') }}>Preview</button></div></div></article>)}</div></section>}
        {view === 'templates' && <section className="workflow-page"><div className="page-intro"><div><p className="builder-eyebrow">Template for {coupleNames(draft)}</p><h1>Choose a feeling.</h1><p className="intro-muted">Pick a template, then save. Switch the wedding in the sidebar to restyle another.</p></div><button className="primary-action" onClick={() => go('preview')}><ExternalLink size={16} />View preview</button></div><div className="templates-grid">{TEMPLATES.map((t) => <TemplateCard key={t.id} template={t} names={[draft.partner1, draft.partner2]} selected={draft.template === t.id} onSelect={() => update((w) => ({ ...w, template: t.id }))} />)}</div></section>}
        {view === 'create' && <section className="workflow-page create-page"><div className="page-intro"><div><p className="builder-eyebrow">New project</p><h1>Start their story.</h1><p className="intro-muted">A few details to begin. You can change everything later.</p></div></div><div className="workflow-layout"><div className="form-card">
          <div className="form-two"><label>First partner *<input value={form.partner1} onChange={(e) => setForm({ ...form, partner1: e.target.value })} placeholder="e.g. Amelia" autoFocus />{formErrors.partner1 && <span className="field-error" role="alert">{formErrors.partner1}</span>}</label><label>Second partner *<input value={form.partner2} onChange={(e) => setForm({ ...form, partner2: e.target.value })} placeholder="e.g. James" />{formErrors.partner2 && <span className="field-error" role="alert">{formErrors.partner2}</span>}</label></div>
          <div className="form-two"><label>Wedding date *<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />{formErrors.date && <span className="field-error" role="alert">{formErrors.date}</span>}</label><label>Ceremony time *<input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />{formErrors.time && <span className="field-error" role="alert">{formErrors.time}</span>}</label></div>
          <div className="form-two"><label>Timezone<select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>{TIMEZONES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label><label>Venue or location<input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g. The Glasshouse" /></label></div>
          <div className="form-section-heading"><span>01</span><div><strong>Choose a template</strong><small>This sets the mood. You can switch it anytime.</small></div></div>
          <div className="mini-template-grid">{TEMPLATES.map((t) => <TemplateCard key={t.id} template={t} names={[form.partner1, form.partner2]} selected={form.template === t.id} onSelect={() => setForm({ ...form, template: t.id })} />)}</div>
          <div className="form-footer"><button className="back-button" onClick={() => go('overview')}>Cancel</button><button className="primary-action" onClick={createNew}>Create draft <ArrowRight size={16} /></button></div></div>
          <div className="create-preview"><p className="builder-eyebrow">Live preview</p><PreviewMini template={form.template} partner1={form.partner1} partner2={form.partner2} date={form.date} /><div className="preview-caption"><strong>{TEMPLATES.find((t) => t.id === form.template)?.name}</strong><small>Your couple&apos;s website will look and feel like this.</small></div></div></div></section>}
        {workspaceView && view !== 'templates' && <section className="workflow-page">
          {intro(coupleNames(draft), titles[view], view === 'rsvps' ? 'Control the RSVP form and review responses.' : view === 'publish' ? 'Check readiness and set the wedding’s status.' : 'Changes apply to the preview straight away; save to keep them.')}
          {view === 'editor' && <DetailsPanel {...panelProps} />}
          {view === 'events' && <EventsPanel {...panelProps} />}
          {view === 'gallery' && <GalleryPanel {...panelProps} />}
          {view === 'rsvps' && <RsvpPanel {...panelProps} />}
          {view === 'publish' && <PublishPanel {...panelProps} saved={saved} dirty={dirty} setStatus={setStatus} />}
        </section>}
        {workspaceView && (dirty || saveIssues.length > 0) && <div className="save-bar" role="region" aria-label="Unsaved changes">
          <div style={{ display: 'block' }}>{saveIssues.length > 0 && liveIssues.length > 0 ? <ul className="issue-list" style={{ margin: 0 }}>{liveIssues.map((i, n) => <li key={n}>{i.message}</li>)}</ul> : <span>You have unsaved changes to {coupleNames(draft)}.</span>}</div>
          <div><button className="secondary-action" onClick={discard}>Discard</button><button className="primary-action" onClick={() => commit(draft)}>Save changes</button></div></div>}
      </div>
    </main>
  </div>
}
