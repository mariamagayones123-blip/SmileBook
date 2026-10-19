import { useEffect, useState } from 'react'
import api, { errMsg, minDate, to12h } from '../api'

// Date input (min = today + 2 days) + time slot buttons for one dentist
export default function SlotPicker({ dentistId, dentistWorkDays, date, setDate, time, setTime, exclude }) {
  const [slots, setSlots] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    setTime('')
    setErr('')
    if (!dentistId || !date) {
      setSlots([])
      setLoading(false)
      return () => { active = false }
    }

    setSlots([])
    setLoading(true)
    api.get('/slots', { params: { dentist_id: dentistId, date, exclude } })
      .then((r) => { if (active) setSlots(r.data) })
      .catch((e) => { if (active) { setSlots([]); setErr(errMsg(e)) } })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [dentistId, date, exclude, setTime])

  const dateDay = date ? new Date(`${date}T00:00:00`).getDay() : null
  const dentistClosed = Array.isArray(dentistWorkDays)
    && dateDay !== null
    && !dentistWorkDays.includes(dateDay)
  const noAvailableSlots = slots.length === 0 || slots.every((slot) => !slot.available)

  return (
    <div>
      <label>Appointment date
        <input type="date" min={minDate()} value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <p className="date-rule">Appointments must be booked at least 2 days in advance. Choose a date on or after <strong>{minDate()}</strong>.</p>
      {err && <p className="error">{err}</p>}
      {loading && <p className="muted" role="status">Loading available times...</p>}
      {date && !loading && !err && noAvailableSlots && (
        <p className="muted" role="status">
          {dentistClosed ? 'The dentist is closed on this day. Choose a working day.' : 'No slots available for this date. Please choose another date.'}
        </p>
      )}
      <div className="slots">
        {slots.map((s) => (
          <button type="button" key={s.start} disabled={loading || !s.available}
            className={'slot' + (time === s.start ? ' on' : '')} onClick={() => setTime(s.start)}>
            {to12h(s.start)} – {to12h(s.end)}{!s.available && <small> (taken)</small>}
          </button>
        ))}
      </div>
    </div>
  )
}
