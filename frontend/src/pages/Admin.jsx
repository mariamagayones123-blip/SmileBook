import { useEffect, useRef, useState } from 'react'
import api, { DAY_NAMES, errMsg, to12h } from '../api'
import Modal, { ConfirmModal } from '../Modal'
import SlotPicker from './SlotPicker'
import { categoryForService, SERVICE_CATEGORIES } from '../serviceCategories'
import PageHeader from '../PageHeader'
import Icon from '../Icons'
import doctorPhoto from '../doctorPhotos'

const fmtDate = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'appointments', label: 'Appointments', icon: 'calendar' },
  { id: 'services', label: 'Services', icon: 'tooth' },
  { id: 'schedules', label: 'Schedules', icon: 'clock' },
]

export default function Admin() {
  const [tab, setTab] = useState('dashboard')
  return (
    <>
      <PageHeader eyebrow="Clinic admin" title="Admin Panel" subtitle="Manage appointments, services, and dentist schedules in one place." />
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={'tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={17} />{t.label}
          </button>
        ))}
      </div>
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'appointments' && <Appointments />}
      {tab === 'services' && <Services />}
      {tab === 'schedules' && <Schedules />}
    </>
  )
}

function Dashboard() {
  const [d, setD] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    api.get('/admin/dashboard')
      .then((r) => setD(r.data))
      .catch((e) => setErr(errMsg(e)))
  }, [])
  if (err) return <p className="error">{err}</p>
  if (!d) return <p className="muted" role="status">Loading dashboard...</p>
  return (
    <>
      <div className="stats">
        <div className="stat-card"><span className="stat-icon"><Icon name="calendar" /></span><div><strong>{d.today_count}</strong><p>Today's appointments</p></div></div>
        <div className="stat-card warm"><span className="stat-icon"><Icon name="pending" /></span><div><strong>{d.pending_count}</strong><p>Pending requests</p></div></div>
        <div className="stat-card"><span className="stat-icon"><Icon name="week" /></span><div><strong>{d.week_count}</strong><p>Bookings this week</p></div></div>
      </div>
      <section className="panel">
        <div className="panel-head"><h3>Today's schedule</h3><span className="appt-count">{d.today.length}</span></div>
        {d.today.length === 0 && <p className="muted empty-note">No appointments today.</p>}
        <ul className="today-list">
          {d.today.map((a) => (
            <li key={a.id}>
              <span className="today-time">{to12h(a.start_time)}</span>
              <div className="today-info"><b>{a.user.name}</b><small>{a.service.name} · {a.dentist.name}</small></div>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function Appointments() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionBusyId, setActionBusyId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/appointments')
      setList(data)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const setStatus = async (id, status) => {
    setActionBusyId(id)
    setErr('')
    try {
      await api.post(`/admin/appointments/${id}/status`, { status })
      await load()
    } catch (e) { setErr(errMsg(e)) }
    finally { setActionBusyId(null) }
  }
  const save = async () => {
    setSaving(true)
    try {
      await api.put(`/appointments/${editing.id}`, { date, start_time: time })
      setEditing(null); setErr('')
      await load()
    } catch (e) { setErr(errMsg(e)) }
    finally { setSaving(false) }
  }

  const counts = list.reduce((acc, a) => ({ ...acc, [a.status]: (acc[a.status] || 0) + 1 }), { all: list.length })
  const term = q.trim().toLowerCase()
  const shown = list.filter((a) => (filter === 'all' || a.status === filter)
    && (!term || [a.user.name, a.dentist.name, a.service.name, a.payment_ref].some((v) => String(v || '').toLowerCase().includes(term))))

  return (
    <>
      {err && <p className="error">{err}</p>}
      <div className="toolbar">
        <div className="chips" role="group" aria-label="Filter by status">
          {['all', 'pending', 'approved', 'cancelled'].map((k) => (
            <button key={k} type="button" className={'chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>
              {k}<span>{counts[k] || 0}</span>
            </button>
          ))}
        </div>
        <label className="searchbox">
          <Icon name="search" size={17} />
          <input type="search" placeholder="Search patient, dentist, service" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search appointments" />
        </label>
      </div>
      <div className="tablewrap">
        <table className="appt-table">
          <thead><tr><th>Patient</th><th>Dentist</th><th>Service</th><th>Date & time</th><th>Payment</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="7" className="muted center">Loading appointments...</td></tr>}
            {!loading && shown.length === 0 && <tr><td colSpan="7" className="muted center">No appointments found.</td></tr>}
            {!loading && shown.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="person">
                    <span className="mini-avatar">{initials(a.user.name)}</span>
                    <div><b>{a.user.name}</b><small>{a.user.phone}</small></div>
                  </div>
                </td>
                <td>{a.dentist.name}</td>
                <td>{a.service.name}</td>
                <td><b className="strong-line">{fmtDate(a.date)}</b><small>{to12h(a.start_time)}</small></td>
                <td><b className="strong-line">₱{Number(a.down_payment)}</b><small className="mono">{a.payment_ref}</small></td>
                <td><span className={`badge ${a.status}`}><i className="dot" />{a.status}</span></td>
                <td>
                  <div className="row-actions">
                    {a.status === 'pending' && <button className="btn small" disabled={actionBusyId !== null} onClick={() => setStatus(a.id, 'approved')}>
                      {actionBusyId === a.id ? 'Saving...' : 'Approve'}
                    </button>}
                    {a.status !== 'cancelled' && <>
                      <button className="btn small ghost" disabled={actionBusyId !== null} onClick={() => { setEditing(a); setDate(''); setTime('') }}>Reschedule</button>
                      <button className="btn small danger-soft" disabled={actionBusyId !== null} onClick={() => setStatus(a.id, 'cancelled')}>
                        {actionBusyId === a.id ? 'Saving...' : 'Cancel'}
                      </button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <Modal onClose={() => setEditing(null)} titleId="admin-reschedule-modal-title">
          <h2 id="admin-reschedule-modal-title">Reschedule</h2>
          <p className="muted">{editing.user.name} · {editing.service.name} with {editing.dentist.name}</p>
          <SlotPicker dentistId={editing.dentist_id} dentistWorkDays={editing.dentist?.work_days} date={date} setDate={setDate} time={time} setTime={setTime} exclude={editing.id} />
          <button className="btn" disabled={!date || !time || saving} onClick={save}>{saving ? 'Saving...' : 'Save'}</button>
          <button className="btn ghost" onClick={() => setEditing(null)}>Close</button>
        </Modal>
      )}
    </>
  )
}

function Services() {
  const empty = { name: '', category: SERVICE_CATEGORIES[0], description: '', price: '', dentist_ids: [] }
  const [list, setList] = useState([])
  const [dentists, setDentists] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [f, setF] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [err, setErr] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const formRef = useRef(null)
  const nameRef = useRef(null)
  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/services')
      setList(data)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])
  useEffect(() => {
    api.get('/dentists')
      .then((response) => setDentists(response.data))
      .catch((error) => setErr(errMsg(error)))
  }, [])

  const save = async (e) => {
    e.preventDefault()
    if (f.dentist_ids.length === 0) {
      setErr('Select at least one doctor who offers this service.')
      return
    }
    setSaving(true)
    try {
      editId ? await api.put(`/admin/services/${editId}`, f) : await api.post('/admin/services', f)
      setF(empty); setEditId(null); setErr('')
      await load()
    } catch (x) { setErr(errMsg(x)) }
    finally { setSaving(false) }
  }
  const del = async (id) => {
    setDeletingId(id)
    try {
      await api.delete(`/admin/services/${id}`)
      await load()
    } catch (x) { setErr('Cannot delete: it is used by existing appointments.') }
    finally { setDeletingId(null) }
  }

  return (
    <>
      <form className="panel service-form" ref={formRef} onSubmit={save}>
        <h3>{editId ? 'Edit service' : 'Add service'}</h3>
        {err && <p className="error">{err}</p>}
        <div className="inline">
          <label>Service name<input ref={nameRef} placeholder="e.g. Teeth cleaning" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></label>
          <label>Category
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} required>
              {SERVICE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label>Description<input placeholder="Short description (optional)" value={f.description || ''} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
          <label>Price (₱)<input type="number" min="0" step="0.01" placeholder="e.g. 800" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required /></label>
          <button className="btn" disabled={saving}>{saving ? 'Saving...' : editId ? 'Update' : 'Add'}</button>
        </div>
        <fieldset className="service-dentist-assignments">
          <legend>Doctors who offer this service</legend>
          {dentists.length === 0 && <p className="muted">Loading doctors or no doctors are available.</p>}
          <div className="service-dentist-options">
            {dentists.map((dentist) => (
              <label className="check" key={dentist.id}>
                <input
                  type="checkbox"
                  checked={f.dentist_ids.some((id) => String(id) === String(dentist.id))}
                  onChange={(event) => setF({
                    ...f,
                    dentist_ids: event.target.checked
                      ? [...f.dentist_ids, dentist.id]
                      : f.dentist_ids.filter((id) => String(id) !== String(dentist.id)),
                  })}
                />
                <span>{dentist.name} <small className="muted">({dentist.specialty})</small></span>
              </label>
            ))}
          </div>
        </fieldset>
      </form>
      {loading && <p className="muted" role="status">Loading services...</p>}
      {!loading && list.length === 0 && <p className="muted">No services found.</p>}
      {!loading && SERVICE_CATEGORIES.map((category) => {
        const categorizedServices = list.filter((service) => categoryForService(service) === category)
        if (categorizedServices.length === 0) return null

        return (
          <section key={category} aria-labelledby={`services-${category.replace(/\W+/g, '-').toLowerCase()}`}>
            <h3 className="section-title" id={`services-${category.replace(/\W+/g, '-').toLowerCase()}`}>{category}</h3>
            <div className="svc-grid">
            {categorizedServices.map((s) => (
              <div className="svc-card" key={s.id}>
                <div className="svc-main">
                  <div className="svc-top"><b>{s.name}</b><span className="price-tag">₱{Number(s.price).toLocaleString()}</span></div>
                  <small className="muted">{s.description}</small>
                </div>
                <div className="actions">
                  <button type="button" className="btn small ghost" onClick={() => {
                    setEditId(s.id)
                    setErr('')
                    setF({
                      name: s.name,
                      category: categoryForService(s),
                      description: s.description,
                      price: s.price,
                      dentist_ids: s.dentist_ids || [],
                    })
                    // Go up to the "Edit service" form and focus the first field.
                    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    nameRef.current?.focus({ preventScroll: true })
                  }}>Edit</button>
                  <button className="btn small danger-soft" disabled={deletingId !== null} onClick={() => setDeleteTarget(s)}>
                    {deletingId === s.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
            </div>
          </section>
        )
      })}
      {deleteTarget && (
        <ConfirmModal
          title="Delete service?"
          message={`Delete "${deleteTarget.name}"? This action cannot be undone.`}
          confirmLabel="Delete service"
          cancelLabel="Keep service"
          busyLabel="Deleting..."
          onConfirm={() => del(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}

function Schedules() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    api.get('/dentists')
      .then((r) => setList(r.data))
      .catch((e) => setMsg(errMsg(e)))
      .finally(() => setLoading(false))
  }, [])
  const upd = (id, patch) => setList(list.map((d) => (d.id === id ? { ...d, ...patch } : d)))
  const toggleDay = (d, n) => upd(d.id, { work_days: d.work_days.includes(n) ? d.work_days.filter((x) => x !== n) : [...d.work_days, n].sort() })

  const save = async (d) => {
    setSavingId(d.id)
    try {
      await api.put(`/admin/dentists/${d.id}`, { start_time: d.start_time, end_time: d.end_time, slot_minutes: d.slot_minutes, work_days: d.work_days })
      setMsg(`Saved ${d.name}'s schedule.`)
    } catch (e) { setMsg(errMsg(e)) }
    finally { setSavingId(null) }
  }

  return (
    <>
      {msg && <p className="auth-info" role="status">{msg}</p>}
      {loading && <p className="muted" role="status">Loading schedules...</p>}
      <div className="sched-grid">
      {!loading && list.map((d) => (
        <div className="panel sched-card" key={d.id}>
          <div className="sched-head">
            <span className="mini-avatar big">{doctorPhoto(d.name) ? <img src={doctorPhoto(d.name)} alt={d.name} /> : initials(d.name.replace(/^Dr\.?\s*/i, ''))}</span>
            <div><h3>{d.name}</h3><small className="muted">{d.specialty}</small></div>
          </div>
          <div className="inline">
            <label>Start<input type="time" value={d.start_time} onChange={(e) => upd(d.id, { start_time: e.target.value })} /></label>
            <label>End<input type="time" value={d.end_time} onChange={(e) => upd(d.id, { end_time: e.target.value })} /></label>
            <label>Slot (min)<input type="number" value={d.slot_minutes} onChange={(e) => upd(d.id, { slot_minutes: Number(e.target.value) })} /></label>
          </div>
          <div className="days" role="group" aria-label={`Working days for ${d.name}`}>
            {DAY_NAMES.map((n, i) => (
              <label key={i} className={'day-chip' + (d.work_days.includes(i) ? ' on' : '')}>
                <input type="checkbox" checked={d.work_days.includes(i)} onChange={() => toggleDay(d, i)} />{n}
              </label>
            ))}
          </div>
          <button className="btn small" disabled={savingId === d.id} onClick={() => save(d)}>
            {savingId === d.id ? 'Saving...' : 'Save schedule'}
          </button>
        </div>
      ))}
      </div>
    </>
  )
}
