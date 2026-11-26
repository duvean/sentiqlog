import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentPropsWithoutRef, type CSSProperties } from 'react'
import { db, type Entry, type Feeling, type Thought } from './db'

type View = 'home' | 'stats' | 'profile' | 'editor'
type Backup = { format: 'sentiqlog-backup'; version: 1; createdAt: string; profile: string; entries: Entry[] }
const today = () => new Date().toISOString().slice(0, 10)
const uid = () => crypto.randomUUID()
const palette = ['var(--feeling-lilac)', 'var(--feeling-rose)', 'var(--feeling-mint)', 'var(--feeling-blue)', 'var(--feeling-peach)']
const emptyEntry = (date = today()): Entry => ({
  id: uid(), date, createdAt: Date.now(), updatedAt: Date.now(), person: '', what: '', when: 'Сегодня', where: '',
  feelings: [], automaticThoughts: '', hotThought: '', evidenceFor: [], evidenceAgainst: [], alternatives: [], completed: false
})
const dateLabel = (date: string, year = false) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', ...(year ? { year: 'numeric' } : {}) }).format(new Date(`${date}T12:00:00`))
const monthLabel = (d: Date) => new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(d).replace(/^./, x => x.toUpperCase())
const initials = (name: string) => name.trim().slice(0, 1).toUpperCase() || 'Я'

function Icon({ name, size = 21 }: { name: string; size?: number }) {
  const paths: Record<string, string> = { home: 'M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-9Z M9 21v-6h6v6', chart: 'M4 20V10 M12 20V4 M20 20v-7', user: 'M20 21a8 8 0 0 0-16 0 M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', plus: 'M12 5v14M5 12h14', close: 'm6 6 12 12M18 6 6 18', back: 'm15 18-6-6 6-6', arrow: 'M5 12h14m-6-6 6 6-6 6', chevron: 'm6 9 6 6 6-6', pen: 'm4 20 4.5-1L19 8.5 15.5 5 5 15.5 4 20Z', trash: 'M4 7h16 M10 11v6 M14 11v6 M9 7l1-2h4l1 2 M6 7l1 13h10l1-13' }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>
}

function Glass({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={`glass g ${className}`} style={style}>{children}</div>
}

function AutoTextarea(props: ComponentPropsWithoutRef<'textarea'>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const resize = () => {
    if (!ref.current) return
    ref.current.style.height = 'auto'
    ref.current.style.height = `${ref.current.scrollHeight}px`
  }
  useLayoutEffect(resize, [props.value])
  return <textarea {...props} ref={ref} onInput={event => { resize(); props.onInput?.(event) }} />
}

function Calendar({ selected, onSelect, dots }: { selected: string; onSelect: (date: string) => void; dots: Set<string> }) {
  const [month, setMonth] = useState(() => new Date(`${selected}T12:00:00`))
  useEffect(() => setMonth(new Date(`${selected}T12:00:00`)), [selected])
  const days = useMemo(() => {
    const y = month.getFullYear(), m = month.getMonth(), first = new Date(y, m, 1), last = new Date(y, m + 1, 0)
    const blanks = Array.from({ length: (first.getDay() + 6) % 7 }, () => null)
    return [...blanks, ...Array.from({ length: last.getDate() }, (_, i) => new Date(y, m, i + 1))]
  }, [month])
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return <Glass className="calendar"><div className="calendar-head"><b>{monthLabel(month)}</b><span><button aria-label="Предыдущий месяц" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>‹</button><button aria-label="Следующий месяц" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>›</button></span></div><div className="weekdays">{['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(x => <span key={x}>{x}</span>)}</div><div className="days">{days.map((day, i) => day ? <button key={iso(day)} className={iso(day) === selected ? 'selected' : ''} onClick={() => onSelect(iso(day))}><b>{day.getDate()}</b>{dots.has(iso(day)) && <i />}</button> : <span key={`blank${i}`} />)}</div></Glass>
}

function EntryCard({ entry, onEdit, onDelete }: { entry: Entry; onEdit: () => void; onDelete: () => void }) {
  const heading = entry.what || 'Новая запись'
  const place = [entry.person, entry.where].filter(Boolean).join(' · ') || 'Заполните детали ситуации'
  return <article className="entry-card glass"><button className="entry-open" onClick={onEdit}><time className="entry-time">{entry.when || '—'}</time><span className="entry-top"><b>{heading}</b></span><span className="entry-place">{place}</span>{entry.feelings.length > 0 && <span className="emotion-progress-list">{entry.feelings.map(f => <span className="emotion-progress" key={f.id}><span className="emotion-progress-head"><span><i style={{ background: f.color }} />{f.name || 'Чувство'}</span><b>{f.before}% → {f.after}%</b></span><span className="emotion-meter"><i style={{ width: `${f.before}%`, background: f.color, opacity: .28 }} /><i style={{ width: `${f.after}%`, background: f.color }} /></span></span>)}</span>}{!entry.completed && <span className="edit-hint"><Icon name="pen" size={13} /> Продолжить запись</span>}</button><button className="entry-remove" onClick={onDelete} aria-label={`Удалить запись: ${heading}`}><Icon name="trash" size={16} /></button></article>
}

function Home({ entries, profile, openEntry, deleteEntry, add, selected, setSelected }: { entries: Entry[]; profile: string; openEntry: (e: Entry) => void; deleteEntry: (e: Entry) => void; add: () => void; selected: string; setSelected: (d: string) => void }) {
  const current = entries.filter(x => x.date === selected).sort((a, b) => b.updatedAt - a.updatedAt)
  return <main className="home screen page-transition"><header className="greeting"><div><p>Добрый день, {profile || 'друг'}</p><h1>Как вы себя<br /><em>чувствуете?</em></h1></div><div className="avatar">{initials(profile)}</div></header><Calendar selected={selected} onSelect={setSelected} dots={new Set(entries.map(x => x.date))} /><section className="records"><div className="section-title"><h2><span className="record-date" key={selected}>Записи  ·  {dateLabel(selected)}</span></h2><span className="record-count"><b key={selected}>{current.length}</b></span></div><div className="records-list" key={selected}>{current.length ? current.map(entry => <EntryCard key={entry.id} entry={entry} onEdit={() => openEntry(entry)} onDelete={() => deleteEntry(entry)} />) : <div className="empty glass"><span>✦</span><b>Пока нет записей</b><p>Зафиксируйте ситуацию и свои чувства — это поможет взглянуть на них яснее.</p><button onClick={add}>Создать первую запись</button></div>}</div></section></main>
}

function Slider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) { return <input aria-label={label} className="range" type="range" min="0" max="100" value={value} onChange={e => onChange(Number(e.target.value))} style={{ '--fill': `${value}%` } as CSSProperties} /> }
function Feelings({ feelings, onChange, after }: { feelings: Feeling[]; onChange: (f: Feeling[]) => void; after?: boolean }) {
  const add = () => onChange([...feelings, { id: uid(), name: '', color: palette[feelings.length % palette.length], before: 50, after: 50 }])
  const update = (id: string, key: keyof Feeling, value: string | number) => onChange(feelings.map(f => f.id === id ? { ...f, [key]: value } : f))
  return <><div className="feelings-list">{feelings.map((f, ix) => <Glass className="feeling" key={f.id}><div className="feeling-line"><i style={{ background: f.color }} /><input aria-label={`Название чувства ${ix + 1}`} value={f.name} placeholder="Название чувства" onChange={e => update(f.id, 'name', e.target.value)} /> <b>{after ? `${f.before}% → ${f.after}%` : `${f.before}%`}</b><button className="delete" aria-label="Удалить чувство" onClick={() => onChange(feelings.filter(x => x.id !== f.id))}>×</button></div><Slider label={f.name || 'Интенсивность чувства'} value={after ? f.after : f.before} onChange={v => update(f.id, after ? 'after' : 'before', v)} /></Glass>)}</div><button className="add-inline" onClick={add}>+ Добавить чувство</button></>
}

function Editor({ initial, onSave, onClose }: { initial: Entry; onSave: (entry: Entry) => void; onClose: (entry: Entry) => void }) {
  const [entry, setEntry] = useState<Entry>(initial), [step, setStep] = useState(0)
  const update = <K extends keyof Entry>(key: K, value: Entry[K]) => setEntry(e => ({ ...e, [key]: value }))
  const move = (delta: number) => { if (step + delta < 0) return setStep(0); if (step + delta > 2) return onSave({ ...entry, completed: true, updatedAt: Date.now() }); setStep(s => s + delta) }
  const multi = (key: 'evidenceFor' | 'evidenceAgainst', label: string) => <Glass className="arguments"><b>{label}</b>{entry[key].map((value, ix) => <div className="argument" key={`${key}${ix}`}><AutoTextarea aria-label={label} value={value} onChange={e => update(key, entry[key].map((v, j) => j === ix ? e.target.value : v))} /><button aria-label="Удалить довод" onClick={() => update(key, entry[key].filter((_, j) => j !== ix))}>×</button></div>)}<button className="add-text" onClick={() => update(key, [...entry[key], ''])}>+ Добавить довод</button></Glass>
  const thought = (t: Thought, ix: number) => <Glass className="thought" key={t.id}><AutoTextarea aria-label="Взвешенная мысль" value={t.text} placeholder="Более взвешенная мысль" onChange={e => update('alternatives', entry.alternatives.map((x, j) => j === ix ? { ...x, text: e.target.value } : x))} /><div className="confidence"><span>Уверенность</span><b>{t.confidence}%</b></div><Slider label="Уверенность во взвешенной мысли" value={t.confidence} onChange={v => update('alternatives', entry.alternatives.map((x, j) => j === ix ? { ...x, confidence: v } : x))} /><button className="remove-thought" onClick={() => update('alternatives', entry.alternatives.filter(x => x.id !== t.id))}>Удалить</button></Glass>
  return <main className="editor screen page-transition"><div className="editor-scroll"><header className="editor-head"><button className="round-button" onClick={() => onClose({ ...entry, updatedAt: Date.now() })} aria-label="Закрыть и сохранить черновик"><Icon name="close" /></button><div className="progress">{[0,1,2].map(x => <i key={x} className={x <= step ? 'active' : ''} />)}</div><b>{step + 1}/3</b></header><div className="editor-step" key={step}>{step === 0 && <><h1>Что <em>произошло?</em></h1><div className="fields"><label className="field glass"><span>С кем?</span><input value={entry.person} placeholder="Например, руководитель" onChange={e => update('person', e.target.value)} /></label><label className="field glass"><span>Когда?</span><input value={entry.when} placeholder="Сегодня, 18:40" onChange={e => update('when', e.target.value)} /></label><label className="field glass full"><span>Что?</span><AutoTextarea value={entry.what} placeholder="Опишите ситуацию" onChange={e => update('what', e.target.value)} /></label><label className="field glass full"><span>Где?</span><input value={entry.where} placeholder="Например, дома" onChange={e => update('where', e.target.value)} /></label></div><div className="editor-subtitle"><h2>Что вы чувствовали?</h2><span>0–100%</span></div><Feelings feelings={entry.feelings} onChange={v => update('feelings', v)} /></>}{step === 1 && <><h1>Что было <em>в голове?</em></h1><label className="field glass full big"><span>Мысли и образы перед чувством</span><AutoTextarea value={entry.automaticThoughts} placeholder="Что возникло в вашем сознании?" onChange={e => update('automaticThoughts', e.target.value)} /></label><label className="hot-thought"><span>Самая напряжённая мысль</span><AutoTextarea value={entry.hotThought} placeholder="Запишите мысль" onChange={e => update('hotThought', e.target.value)} /></label>{multi('evidenceFor', 'Доводы «за»')}{multi('evidenceAgainst', 'Доводы «против»')}</>}{step === 2 && <><h1>Взгляд <em>со стороны</em></h1>{entry.alternatives.map(thought)}<button className="add-inline" onClick={() => update('alternatives', [...entry.alternatives, { id: uid(), text: '', confidence: 50 }])}>+ Ещё одна мысль</button><h2 className="now-heading">Что вы чувствуете теперь?</h2><Feelings feelings={entry.feelings} onChange={v => update('feelings', v)} after /></>}</div></div><footer className="editor-footer"><button className="primary" onClick={() => move(1)}>{step === 2 ? 'Сохранить запись' : <>Далее <Icon name="arrow" /></>}</button></footer></main>
}

function Stats() { return <main className="placeholder screen page-transition"><span>✦</span><h1>Статистика</h1><p>Раздел в разработке.</p></main> }
function Profile({ name, setName, onExport, onImport }: { name: string; setName: (v: string) => void; onExport: () => void; onImport: (event: ChangeEvent<HTMLInputElement>) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return <main className="profile screen page-transition"><h1>Профиль</h1><Glass className="profile-card"><label><span>Ваше имя</span><input value={name} placeholder="Как к вам обращаться?" onChange={e => setName(e.target.value)} /></label></Glass><section className="data-tools"><h2>Ваши данные</h2><p>Все записи остаются только на этом устройстве. Сохраните копию, чтобы перенести или восстановить их.</p><button className="data-action glass" onClick={onExport}><span><b>Выгрузить копию</b><small>Скачать файл с записями</small></span><span>↓</span></button><button className="data-action glass" onClick={() => inputRef.current?.click()}><span><b>Восстановить из файла</b><small>Текущие данные будут заменены</small></span><span>↑</span></button><input ref={inputRef} className="file-input" type="file" accept="application/json,.json" onChange={onImport} /></section></main>
}
function Nav({ active, onChange, add }: { active: View; onChange: (v: View) => void; add: () => void }) { return <nav className="bottom-bar"><div className="tabs glass tab"><button className={active === 'home' ? 'active' : ''} onClick={() => onChange('home')}><Icon name="home" />Главная</button><button className={active === 'stats' ? 'active' : ''} onClick={() => onChange('stats')}><Icon name="chart" />Статистика</button><button className={active === 'profile' ? 'active' : ''} onClick={() => onChange('profile')}><Icon name="user" />Профиль</button></div><button className="fab glass" onClick={add} aria-label="Добавить запись"><Icon name="plus" size={28} /></button></nav> }

export default function App() {
  const [view, setView] = useState<View>('home'), [entries, setEntries] = useState<Entry[]>([]), [profile, setProfile] = useState(''), [profileLoaded, setProfileLoaded] = useState(false), [selected, setSelected] = useState(today()), [editing, setEditing] = useState<Entry | null>(null)
  useEffect(() => { void db.entries.toArray().then(setEntries); void db.profile.get('profile').then(p => { setProfile(p?.name ?? ''); setProfileLoaded(true) }) }, [])
  useEffect(() => { if (profileLoaded) void db.profile.put({ key: 'profile', name: profile }) }, [profile, profileLoaded])
  const add = () => { setEditing(emptyEntry(selected)); setView('editor') }
  const open = (entry: Entry) => { setEditing(entry); setView('editor') }
  const save = async (entry: Entry) => { await db.entries.put(entry); setEntries(await db.entries.toArray()); setEditing(null); setSelected(entry.date); setView('home') }
  const close = (entry: Entry) => { void save(entry) }
  const deleteEntry = async (entry: Entry) => {
    if (!window.confirm(`Удалить запись «${entry.what || 'Новая запись'}»? Это действие нельзя отменить.`)) return
    await db.entries.delete(entry.id)
    setEntries(await db.entries.toArray())
  }
  const exportBackup = () => {
    const backup: Backup = { format: 'sentiqlog-backup', version: 1, createdAt: new Date().toISOString(), profile, entries }
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `sentiqlog-backup-${today()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }
  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const data = JSON.parse(await file.text()) as Partial<Backup>
      if (data.format !== 'sentiqlog-backup' || data.version !== 1 || !Array.isArray(data.entries) || typeof data.profile !== 'string') throw new Error('invalid backup')
      if (!window.confirm(`Восстановить ${data.entries.length} записей из копии? Текущие записи на этом устройстве будут заменены.`)) return
      await db.transaction('rw', db.entries, db.profile, async () => {
        await db.entries.clear()
        await db.entries.bulkPut(data.entries as Entry[])
        await db.profile.put({ key: 'profile', name: data.profile as string })
      })
      setEntries(data.entries as Entry[])
      setProfile(data.profile)
      window.alert('Копия восстановлена.')
    } catch {
      window.alert('Не удалось прочитать файл. Выберите резервную копию, созданную в «Сенти».')
    }
  }
  return <div className="desktop"><div className="phone-stage">{view === 'editor' && editing ? <Editor initial={editing} onSave={save} onClose={close} /> : <>{view === 'home' && <Home entries={entries} profile={profile} selected={selected} setSelected={setSelected} openEntry={open} deleteEntry={deleteEntry} add={add} />}{view === 'stats' && <Stats />}{view === 'profile' && <Profile name={profile} setName={setProfile} onExport={exportBackup} onImport={importBackup} />}<Nav active={view} onChange={setView} add={add} /></>}</div></div>
}
