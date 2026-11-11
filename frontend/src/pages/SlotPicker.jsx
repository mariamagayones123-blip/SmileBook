import { useEffect, useState } from 'react'
import api, { errMsg, minDate, to12h, toYMD, formatDate } from '../api'
import Icon from '../Icons'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// "2026-11-12" -> local Date (no UTC shift)
const parseYMD = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Calendar (left) + time slots (right) for one dentist.
// Days before today + 2 and days the dentist does not work are disabled.
export default function SlotPicker({ dentistId, dentistWorkDays, date, setDate, time, setTime, setTimeEnd, exclude, refreshKey }) {
  const [slots, setSlots] = useState([])
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const min = minDate()
  const [view, setView] = useState(() => {
    const base = parseYMD(date || min)
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

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
  }, [dentistId, date, exclude, refreshKey, setTime])

  const workDays = Array.isArray(dentistWorkDays) ? dentistWorkDays.map(Number) : null
  const year = view.getFullYear()
  const month = view.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: firstDow }, () => null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d)
    const ymd = toYMD(dt)
    cells.push({ d, ymd, off: ymd < min || (workDays !== null && !workDays.includes(dt.getDay())) })
  }
  const minDay = parseYMD(min)
  const atFirstMonth = year * 12 + month <= minDay.getFullYear() * 12 + minDay.getMonth()

  const dateDay = date ? parseYMD(date).getDay() : null
  const dentistClosed = workDays !== null && dateDay !== null && !workDays.includes(dateDay)
  const noAvailableSlots = slots.length === 0 || slots.every((slot) => !slot.available)

  return (
    <div className="sp">
      <div className="sp-grid">
        <div className="sp-col">
          <h3 className="sp-title"><Icon name="calendar" size={20} /> Choose a Date</h3>
          <div className="sp-month">
            <button type="button" className="sp-nav" aria-label="Previous month" disabled={atFirstMonth} onClick={() => setView(new Date(year, month - 1, 1))}>
              <Icon name="chevronLeft" size={18} />
            </button>
            <b aria-live="polite">{view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</b>
            <button type="button" className="sp-nav" aria-label="Next month" onClick={() => setView(new Date(year, month + 1, 1))}>
              <Icon name="chevronRight" size={18} />
            </button>
          </div>
          <div className="sp-week" aria-hidden="true">
            {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
          </div>
          <div className="sp-days" role="group" aria-label="Choose a date">
            {cells.map((c, i) => (c
              ? (
                <button
                  key={c.ymd}
                  type="button"
                  disabled={c.off}
                  aria-pressed={date === c.ymd}
                  aria-label={formatDate(c.ymd)}
                  className={'sp-day' + (date === c.ymd ? ' on' : '')}
                  onClick={() => setDate(c.ymd)}
                >
                  {c.d}
                </button>
              )
              : <span key={`blank-${i}`} />
            ))}
          </div>
          <p className="sp-rule">Appointments must be booked at least 2 days in advance. Earliest date: <strong>{formatDate(min)}</strong>.</p>
        </div>

        <div className="sp-col sp-times">
          <h3 className="sp-title"><Icon name="clock" size={20} /> Available Times</h3>
          {err && <p className="error" role="alert">{err}</p>}
          {!date && !err && <p className="sp-empty">Select a date to see the available times.</p>}
          {date && loading && <p className="muted" role="status">Loading available times...</p>}
          {date && !loading && !err && noAvailableSlots && (
            <p className="sp-empty" role="status">
              {dentistClosed ? 'The dentist is closed on this day. Choose a working day.' : 'No slots available for this date. Please choose another date.'}
            </p>
          )}
          <div className="sp-slots">
            {slots.map((s) => (
              <button
                type="button"
                key={s.start}
                disabled={loading || !s.available}
                className={'sp-slot' + (time === s.start ? ' on' : '')}
                aria-pressed={time === s.start}
                onClick={() => { setTime(s.start); if (setTimeEnd) setTimeEnd(s.end) }}
              >
                <span className="sp-slot-time">{to12h(s.start)} – {to12h(s.end)}</span>
                <span className="sp-slot-state">{!s.available ? 'Unavailable' : time === s.start ? 'Selected' : 'Available'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}