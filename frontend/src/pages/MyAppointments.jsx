import { useEffect, useState } from 'react'
import PageHeader from '../PageHeader'
import api, { errMsg, to12h, toYMD, formatDate, statusLabel } from '../api'
import Modal, { ConfirmModal } from '../Modal'
import SlotPicker from './SlotPicker'

// Defined outside MyAppointments so React does not remount every row on each render.
function Row({ a, actions, busy, cancellingId, onReschedule, onCancel }) {
  return (
    <div className="card row appt-card">
      <div>
        <b>{a.service.name}</b> with {a.dentist.name}<br />
        {formatDate(a.date)} · {to12h(a.start_time)} – {to12h(a.end_time)}<br />
        <span className={`badge ${a.status}`}>{statusLabel(a.status)}</span> <small className="muted">Down payment ₱{Number(a.down_payment)} · {a.payment_ref}</small>
      </div>
      {actions && <div className="actions">
        <button className="btn small" onClick={() => onReschedule(a)}>Reschedule</button>
        <button className="btn small danger" disabled={busy} onClick={() => onCancel(a)}>
          {cancellingId === a.id ? 'Cancelling...' : 'Cancel'}
        </button>
      </div>}
    </div>
  )
}

export default function MyAppointments() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [err, setErr] = useState('')
  const [modalErr, setModalErr] = useState('')

  // The "Loading..." screen only shows on the first load, so the board does not flash after a cancel or reschedule.
  const load = async (first = false) => {
    if (first) setLoading(true)
    try {
      const { data } = await api.get('/appointments')
      setList(data)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load(true) }, [])

  const cancel = async (id) => {
    setCancellingId(id)
    try {
      await api.post(`/appointments/${id}/cancel`)
      await load()
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setCancellingId(null)
    }
  }
  const reschedule = async () => {
    setSaving(true)
    try {
      await api.put(`/appointments/${editing.id}`, { date, start_time: time })
      setEditing(null); setDate(''); setTime(''); setErr(''); setModalErr('')
      await load()
    } catch (e) { setModalErr(errMsg(e)) }
    finally { setSaving(false) }
  }

  const today = toYMD(new Date())
  const upcoming = list.filter((a) => a.date >= today && a.status !== 'cancelled' && a.status !== 'done')
  // Past = finished visits plus older bookings that were never completed (their status badge still shows what happened)
  const completed = list.filter((a) => (a.date < today || a.status === 'done') && a.status !== 'cancelled')
  const cancelled = list.filter((a) => a.status === 'cancelled')

  const startReschedule = (a) => { setEditing(a); setDate(''); setTime(''); setModalErr('') }
  const rowProps = { busy: cancellingId !== null, cancellingId, onReschedule: startReschedule, onCancel: setCancelTarget }

  return (
    <>
      <PageHeader eyebrow="Your visits" title="My Appointments" subtitle="Track, reschedule, or cancel your dental visits." />
      {err && <p className="error">{err}</p>}
      {loading ? <p className="muted" role="status">Loading appointments...</p> : (
        <div className="appt-board">
          <section className="appt-column" aria-labelledby="appt-upcoming">
            <h3 id="appt-upcoming">Upcoming <span className="appt-count">{upcoming.length}</span></h3>
            {upcoming.length === 0 && <p className="muted">No upcoming appointments.</p>}
            {upcoming.map((a) => <Row key={a.id} a={a} actions {...rowProps} />)}
          </section>
          <section className="appt-column" aria-labelledby="appt-completed">
            <h3 id="appt-completed">Past <span className="appt-count">{completed.length}</span></h3>
            {completed.length === 0 && <p className="muted">No past appointments.</p>}
            {completed.map((a) => <Row key={a.id} a={a} {...rowProps} />)}
          </section>
          <section className="appt-column" aria-labelledby="appt-cancelled">
            <h3 id="appt-cancelled">Cancelled <span className="appt-count">{cancelled.length}</span></h3>
            {cancelled.length === 0 && <p className="muted">No cancelled appointments.</p>}
            {cancelled.map((a) => <Row key={a.id} a={a} {...rowProps} />)}
          </section>
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} titleId="reschedule-modal-title">
            <h2 id="reschedule-modal-title">Reschedule</h2>
            <p className="muted">{editing.service.name} with {editing.dentist.name}</p>
            {modalErr && <p className="error" role="alert">{modalErr}</p>}
            <SlotPicker dentistId={editing.dentist_id} dentistWorkDays={editing.dentist?.work_days} date={date} setDate={setDate} time={time} setTime={setTime} exclude={editing.id} />
            <button className="btn" disabled={!date || !time || saving} onClick={reschedule}>{saving ? 'Saving...' : 'Save new schedule'}</button>
            <button className="btn ghost" onClick={() => setEditing(null)}>Close</button>
        </Modal>
      )}
      {cancelTarget && (
        <ConfirmModal
          title="Cancel appointment?"
          message={`Cancel your ${cancelTarget.service.name} appointment with ${cancelTarget.dentist.name} on ${formatDate(cancelTarget.date)}?`}
          confirmLabel="Cancel appointment"
          cancelLabel="Keep appointment"
          busyLabel="Cancelling..."
          onConfirm={() => cancel(cancelTarget.id)}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </>
  )
}