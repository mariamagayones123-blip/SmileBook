import { useEffect, useState } from 'react'
import PageHeader from '../PageHeader'
import api, { errMsg, to12h, toYMD } from '../api'
import Modal, { ConfirmModal } from '../Modal'
import SlotPicker from './SlotPicker'

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
      setEditing(null); setDate(''); setTime(''); setErr('')
      await load()
    } catch (e) { setErr(errMsg(e)) }
    finally { setSaving(false) }
  }

  const today = toYMD(new Date())
  const upcoming = list.filter((a) => a.date >= today && a.status !== 'cancelled' && a.status !== 'done')
  const completed = list.filter((a) => (a.date < today || a.status === 'done') && a.status !== 'cancelled')
  const cancelled = list.filter((a) => a.status === 'cancelled')

  const Row = ({ a, actions }) => (
    <div className="card row appt-card">
      <div>
        <b>{a.service.name}</b> with {a.dentist.name}<br />
        {a.date} · {to12h(a.start_time)} – {to12h(a.end_time)}<br />
        <span className={`badge ${a.status}`}>{a.status}</span> <small className="muted">Down payment ₱{Number(a.down_payment)} · {a.payment_ref}</small>
      </div>
      {actions && <div className="actions">
        <button className="btn small" onClick={() => { setEditing(a); setDate(''); setTime('') }}>Reschedule</button>
        <button className="btn small danger" disabled={cancellingId !== null} onClick={() => setCancelTarget(a)}>
          {cancellingId === a.id ? 'Cancelling...' : 'Cancel'}
        </button>
      </div>}
    </div>
  )

  return (
    <>
      <PageHeader eyebrow="Your visits" title="My Appointments" subtitle="Track, reschedule, or cancel your dental visits." />
      {err && <p className="error">{err}</p>}
      {loading ? <p className="muted" role="status">Loading appointments...</p> : (
        <div className="appt-board">
          <section className="appt-column" aria-labelledby="appt-upcoming">
            <h3 id="appt-upcoming">Upcoming <span className="appt-count">{upcoming.length}</span></h3>
            {upcoming.length === 0 && <p className="muted">No upcoming appointments.</p>}
            {upcoming.map((a) => <Row key={a.id} a={a} actions />)}
          </section>
          <section className="appt-column" aria-labelledby="appt-completed">
            <h3 id="appt-completed">Completed <span className="appt-count">{completed.length}</span></h3>
            {completed.length === 0 && <p className="muted">No completed appointments.</p>}
            {completed.map((a) => <Row key={a.id} a={a} />)}
          </section>
          <section className="appt-column" aria-labelledby="appt-cancelled">
            <h3 id="appt-cancelled">Cancelled <span className="appt-count">{cancelled.length}</span></h3>
            {cancelled.length === 0 && <p className="muted">No cancelled appointments.</p>}
            {cancelled.map((a) => <Row key={a.id} a={a} />)}
          </section>
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} titleId="reschedule-modal-title">
            <h2 id="reschedule-modal-title">Reschedule</h2>
            <p className="muted">{editing.service.name} with {editing.dentist.name}</p>
            <SlotPicker dentistId={editing.dentist_id} dentistWorkDays={editing.dentist?.work_days} date={date} setDate={setDate} time={time} setTime={setTime} exclude={editing.id} />
            <button className="btn" disabled={!date || !time || saving} onClick={reschedule}>{saving ? 'Saving...' : 'Save new schedule'}</button>
            <button className="btn ghost" onClick={() => setEditing(null)}>Close</button>
        </Modal>
      )}
      {cancelTarget && (
        <ConfirmModal
          title="Cancel appointment?"
          message={`Cancel your ${cancelTarget.service.name} appointment with ${cancelTarget.dentist.name} on ${cancelTarget.date}?`}
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