import { useEffect, useRef, useState } from 'react'
import PageHeader from '../PageHeader'
import api, { errMsg, to12h, toYMD, formatDate, statusLabel } from '../api'
import Modal, { ConfirmModal } from '../Modal'
import SlotPicker from './SlotPicker'
import Icon from '../Icons'
import doctorPhoto from '../doctorPhotos'
import { useToast } from '../Toast'

const STATUS_ICON = { pending: 'clock', approved: 'check', done: 'check', cancelled: 'x' }

// Two-letter initials for the default avatar, ignoring the "Dr." prefix.
const initials = (name = '') => name.replace(/^Dr\.?\s*/i, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

// Doctor photo from /public/doctors (same helper the Dentists and Admin pages use); falls back to initials.
function DoctorAvatar({ name }) {
  const [broken, setBroken] = useState(false)
  const photo = doctorPhoto(name)
  return (
    <div className="appt-avatar">
      {photo && !broken
        ? <img src={photo} alt={name} loading="lazy" onError={() => setBroken(true)} />
        : <span aria-hidden="true">{initials(name)}</span>}
    </div>
  )
}

// Defined outside MyAppointments so React does not remount every row on each render.
function Row({ a, actions, busy, cancellingId, onReschedule, onCancel }) {
  const { addToast } = useToast()
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(a.payment_ref)
    } catch {
      // Older browsers or non-secure pages: fall back to a temporary textarea.
      const t = document.createElement('textarea')
      t.value = a.payment_ref
      document.body.appendChild(t)
      t.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(t)
      if (!ok) { addToast('error', 'Could not copy the reference number.'); return }
    }
    setCopied(true)
    addToast('success', 'Reference number copied.')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card row appt-card">
      <div className="appt-head">
        <DoctorAvatar name={a.dentist.name} />
        <div className="appt-title">
          <div className="appt-service">{a.service.name}</div>
          <div className="appt-dentist">With {a.dentist.name}</div>
        </div>
        <span className={`badge ${a.status}`}>
          <Icon name={STATUS_ICON[a.status] || 'clock'} size={14} />
          {statusLabel(a.status)}
        </span>
      </div>

      <div className="appt-when">
        <div className="appt-field">
          <span className="appt-field-icon"><Icon name="calendar" size={20} /></span>
          <div>
            <div className="appt-label">Appointment date</div>
            <div className="appt-value">{formatDate(a.date)}</div>
          </div>
        </div>
        <div className="appt-field">
          <span className="appt-field-icon"><Icon name="clock" size={20} /></span>
          <div>
            <div className="appt-label">Appointment time</div>
            <div className="appt-value">{to12h(a.start_time)} – {to12h(a.end_time)}</div>
          </div>
        </div>
      </div>

      <div className="appt-payment">
        <div className="appt-field">
          <span className="appt-field-icon"><Icon name="wallet" size={20} /></span>
          <div>
            <div className="appt-label">Down payment</div>
            <div className="appt-value">₱{Number(a.down_payment).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        <div className="appt-field appt-ref-field">
          <span className="appt-field-icon"><Icon name="hash" size={20} /></span>
          <div>
            <div className="appt-label">Reference number</div>
            <div className="appt-ref-row">
              <span className="appt-value appt-ref">{a.payment_ref}</span>
              <button type="button" className={`appt-copy${copied ? ' copied' : ''}`} onClick={copyRef}
                aria-label={copied ? 'Reference number copied' : 'Copy reference number'} title="Copy reference number">
                <Icon name={copied ? 'check' : 'copy'} size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {actions ? <div className="appt-actions">
        <button className="btn" onClick={() => onReschedule(a)}>
          <Icon name="calendarClock" size={18} />Reschedule
        </button>
        <button className="btn danger-soft" disabled={busy} onClick={() => onCancel(a)}>
          <Icon name="x" size={18} />{cancellingId === a.id ? 'Cancelling...' : 'Cancel'}
        </button>
      </div> : a.status === 'cancelled' ? (
        <div className="appt-note">
          <div className="appt-note-title">Appointment cancelled</div>
          <div className="appt-note-text">This appointment is no longer active.</div>
        </div>
      ) : (
        // Past cards have no buttons; this invisible row keeps every card the same height.
        <div className="appt-actions appt-actions-empty" aria-hidden="true"><span className="btn">&nbsp;</span></div>
      )}
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