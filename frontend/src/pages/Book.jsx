import { useEffect, useState } from 'react'
import PageHeader from '../PageHeader'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api, { errMsg, to12h } from '../api'
import { useToast } from '../Toast'
import Modal from '../Modal'
import clinicInfo from '../clinicInfo'
import AppointmentPolicies from './AppointmentPolicies'
import SlotPicker from './SlotPicker'
import { categoryForService, SERVICE_CATEGORIES } from '../serviceCategories'

const DOWN_PAYMENT = 200

export default function Book() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const [dentists, setDentists] = useState([])
  const [services, setServices] = useState([])
  const [dentistId, setDentistId] = useState(params.get('dentist') || '')
  const [serviceId, setServiceId] = useState(params.get('service') || '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [selectionHint, setSelectionHint] = useState('')
  const [showPay, setShowPay] = useState(false)
  const [consent, setConsent] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [ref] = useState(() => 'DP-' + Math.random().toString(36).slice(2, 8).toUpperCase())
  const [busy, setBusy] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    api.get('/dentists').then((r) => setDentists(r.data))
    api.get('/services').then((r) => setServices(r.data))
  }, [])

  const dentist = dentists.find((d) => String(d.id) === String(dentistId))
  const service = services.find((s) => String(s.id) === String(serviceId))
  const dentistOffersService = (dentistOption, serviceOption) => {
    if (!dentistOption || !serviceOption) return false
    return (dentistOption.service_ids || []).some((id) => String(id) === String(serviceOption.id))
      || (serviceOption.dentist_ids || []).some((id) => String(id) === String(dentistOption.id))
  }
  const ready = dentistId && serviceId && date && time

  const selectService = (value) => {
    const nextService = services.find((option) => String(option.id) === value)
    setServiceId(value)
    if (value && dentist && !dentistOffersService(dentist, nextService)) {
      setDentistId('')
      setDate('')
      setTime('')
      setSelectionHint('Your previously selected doctor does not offer this service. Choose an eligible doctor below.')
    } else if (!value) {
      setDate('')
      setTime('')
      setSelectionHint('')
    } else {
      setSelectionHint('')
    }
  }

  const doctorReason = (option) => {
    const specialtyText = option.specialty.toLowerCase().includes('general')
      ? 'General Dentistry only'
      : option.specialty
    return `${option.name}: ${specialtyText}. Can't perform ${service.name}.`
  }

  const chooseDentist = (option) => {
    if (!service || !dentistOffersService(option, service)) return
    setDentistId(String(option.id))
    setDate('')
    setTime('')
    setSelectionHint('')
  }

  const handleDentistKeyDown = (event, currentId) => {
    if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const eligible = dentists.filter((option) => dentistOffersService(option, service))
    if (!eligible.length) return
    const currentIndex = eligible.findIndex((option) => String(option.id) === String(currentId))
    let nextIndex
    if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = eligible.length - 1
    else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % eligible.length
    else nextIndex = (currentIndex <= 0 ? eligible.length : currentIndex) - 1
    document.querySelector(`[data-dentist-id="${eligible[nextIndex].id}"]`)?.focus()
  }

  useEffect(() => {
    if (!dentistId || !serviceId || !dentists.length || !services.length) return
    const selectedDentist = dentists.find((option) => String(option.id) === String(dentistId))
    const selectedService = services.find((option) => String(option.id) === String(serviceId))
    if (selectedDentist && selectedService && !dentistOffersService(selectedDentist, selectedService)) {
      setDentistId('')
      setDate('')
      setTime('')
      setSelectionHint('Your previously selected doctor does not offer this service. Choose an eligible doctor below.')
    }
  }, [dentistId, serviceId, dentists, services])

  // Final step: after the (dummy) payment, send the booking to Laravel
  const confirmBooking = async () => {
    setBusy(true)
    try {
      await api.post('/appointments', { dentist_id: dentistId, service_id: serviceId, date, start_time: time, payment_ref: ref })
      addToast('success', 'Appointment booked! A confirmation SMS and email were sent to you.')
      nav('/my')
    } catch (e) {
      addToast('error', errMsg(e))
      setShowPay(false)
    }
    setBusy(false)
  }

  return (
    <>
      <PageHeader eyebrow="New booking" title="Book an Appointment" subtitle="Pick a dentist, service, and a time that works for you." />
      <div className="card">
        <label>1. Service
          <select value={serviceId} onChange={(e) => selectService(e.target.value)}>
            <option value="">-- choose a service --</option>
            {SERVICE_CATEGORIES.map((category) => (
              <optgroup key={category} label={category}>
                {services.filter((s) => categoryForService(s) === category).map((s) => (
                  <option key={s.id} value={s.id}>{s.name} – ₱{Number(s.price).toLocaleString()}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {selectionHint && <p className="booking-selection-hint" role="status">{selectionHint}</p>}
        <fieldset className={`dentist-picker${!service ? ' is-locked' : ''}`} aria-describedby="dentist-picker-hint">
          <legend>2. Choose a dentist</legend>
          <p id="dentist-picker-hint" className="muted"><small>{service ? 'Doctors who cannot provide this service are shown with a reason and cannot be selected.' : 'Pick a service first.'}</small></p>
          {!service && dentist && <p className="preselected-dentist">Preselected from your link: <b>{dentist.name}</b>. Pick a service to check eligibility.</p>}
          {!service && <p className="dentist-picker-prompt">Pick a service first.</p>}
          {service && dentists.length === 0 && <p className="muted">No doctors are available right now.</p>}
          {service && dentists.length > 0 && (
            <div className="dentist-options" role="radiogroup" aria-label="Choose a dentist">
              {dentists.map((option) => {
                const eligible = dentistOffersService(option, service)
                const selected = String(option.id) === String(dentistId)
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-disabled={!eligible}
                    tabIndex={selected || (!dentistId && eligible) ? 0 : -1}
                    data-dentist-id={option.id}
                    className={`dentist-option${selected ? ' selected' : ''}${!eligible ? ' ineligible' : ''}`}
                    onClick={() => chooseDentist(option)}
                    onKeyDown={(event) => handleDentistKeyDown(event, option.id)}
                  >
                    <span className="dentist-option-indicator" aria-hidden="true" />
                    <span className="dentist-option-content">
                      <b>{option.name}</b>
                      <span className="dentist-option-specialty">{option.specialty}</span>
                      {!eligible && <span className="dentist-option-reason">{doctorReason(option)}</span>}
                    </span>
                    {!eligible && <span className="dentist-option-status">Unavailable for this service</span>}
                  </button>
                )
              })}
            </div>
          )}
        </fieldset>
        <h3>3. Date and time</h3>
        {dentistId ? <SlotPicker dentistId={dentistId} dentistWorkDays={dentist?.work_days} date={date} setDate={setDate} time={time} setTime={setTime} />
                   : <p className="muted">Pick a dentist first to see the schedule.</p>}
        <label className="consent-check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            I agree to the SmileBook{' '}
            <button type="button" className="consent-link" onClick={() => setShowPrivacy(true)}>Privacy Notice</button>
            {' '}and consent to receive SMS and email messages about my appointment (confirmations, reminders and changes).
            Message and data rates may apply. To stop receiving messages, contact the clinic at {clinicInfo.email}.
          </span>
        </label>
        <button className="btn" disabled={!ready || !consent} onClick={() => setShowPay(true)}>Continue to down payment</button>
        {ready && !consent && <p className="muted consent-hint"><small>Please tick the box above to continue.</small></p>}
      </div>

      <AppointmentPolicies />

      {showPay && (
        <Modal onClose={() => setShowPay(false)} titleId="payment-modal-title" descriptionId="payment-modal-description">
            <h2 id="payment-modal-title">Down Payment</h2>
            <p id="payment-modal-description" className="payment-demo-notice">Demo only: no real payment will be taken. Confirming creates a sample booking with a ₱{DOWN_PAYMENT} demo down payment.</p>
            <div className="qr"><QRCodeSVG value={`SMILEBOOK-DEMO|${ref}|PHP${DOWN_PAYMENT}`} size={170} /></div>
            <p className="center"><b>Ref: {ref}</b></p>
            <ul className="summary">
              <li>{dentist?.name}</li><li>{service?.name}</li>
              <li>{date} at {time && to12h(time)}</li>
            </ul>
            <button className="btn" disabled={busy} onClick={confirmBooking}>{busy ? 'Booking...' : 'Confirm demo booking'}</button>
            <button className="btn ghost" onClick={() => setShowPay(false)}>Cancel</button>
        </Modal>
      )}
      {showPrivacy && (
        <Modal onClose={() => setShowPrivacy(false)} titleId="privacy-modal-title" descriptionId="privacy-modal-description">
          <h2 id="privacy-modal-title">Privacy Notice</h2>
          <div id="privacy-modal-description" className="privacy-notice">
            <p><b>What we collect.</b> Your name, email address, phone number, and the appointment details you choose (dentist, service, date and time).</p>
            <p><b>Why we collect it.</b> To book and manage your appointment, and to send you confirmations, reminders and schedule changes by SMS and email.</p>
            <p><b>Who sees it.</b> Only SmileBook clinic staff who handle appointments. We do not sell your information.</p>
            <p><b>Your choices.</b> You may ask to see, correct or delete your information, or stop receiving messages, by emailing <a href={`mailto:${clinicInfo.email}`}>{clinicInfo.email}</a>.</p>
            <p className="muted"><small>Sample notice for a school project. Have it reviewed before using it for a real clinic.</small></p>
          </div>
          <button className="btn" type="button" onClick={() => setShowPrivacy(false)}>Close</button>
        </Modal>
      )}
    </>
  )
}
