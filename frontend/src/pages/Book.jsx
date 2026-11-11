import { useEffect, useMemo, useState } from 'react'
import Icon from '../Icons'
import doctorPhoto from '../doctorPhotos'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import api, { errMsg, to12h, formatDate } from '../api'
import { useToast } from '../Toast'
import { useAuth } from '../authContext'
import Modal from '../Modal'
import clinicInfo from '../clinicInfo'
import AppointmentPolicies from './AppointmentPolicies'
import SlotPicker from './SlotPicker'
import ServiceSelect from '../ServiceSelect'
import { categoryForService, SERVICE_CATEGORIES } from '../serviceCategories'

const DOWN_PAYMENT = clinicInfo.payment.amount
// Reference numbers are letters and digits only (GCash has 13 digits).
const DEMO = clinicInfo.payment.demo
const REF_RE = /^[A-Za-z0-9-]{6,30}$/

// Doctor's profile photo (from /public/doctors). Falls back to a user icon if there is no photo.
function DentistAvatar({ name }) {
  const photo = doctorPhoto(name)
  return (
    <span className="bk-avatar">
      {photo ? <img src={photo} alt="" loading="lazy" /> : <Icon name="user" size={20} />}
    </span>
  )
}

export default function Book() {
  const [params, setParams] = useSearchParams()
  const nav = useNavigate()
  const [dentists, setDentists] = useState([])
  const [services, setServices] = useState([])
  const [dentistId, setDentistId] = useState(params.get('dentist') || '')
  // Came from a doctor's "Book with ..." button: the doctor is locked in and only their services are offered.
  const [doctorLocked, setDoctorLocked] = useState(!!params.get('dentist'))
  const [serviceId, setServiceId] = useState(params.get('service') || '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [selectionHint, setSelectionHint] = useState('')
  const [showPay, setShowPay] = useState(false)
  const [consent, setConsent] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [payRef, setPayRef] = useState('')
  const [demoRef] = useState(() => 'DP-' + Math.random().toString(36).slice(2, 8).toUpperCase())
  const [busy, setBusy] = useState(false)
  const [loadErr, setLoadErr] = useState('')
  const [slotRefresh, setSlotRefresh] = useState(0)
  const { addToast } = useToast()
  const { user, setUser } = useAuth()
  // Google/Facebook sign-ups have no mobile number yet, so ask for it here (SMS needs it).
  const [phone, setPhone] = useState('')
  const needsPhone = clinicInfo.smsEnabled && !user?.phone
  const phoneOk = /^09\d{9}$/.test(phone)

  useEffect(() => {
    api.get('/dentists').then((r) => setDentists(r.data)).catch((e) => setLoadErr(errMsg(e)))
    api.get('/services').then((r) => setServices(r.data)).catch((e) => setLoadErr(errMsg(e)))
  }, [])

  const dentist = dentists.find((d) => String(d.id) === String(dentistId))
  const service = services.find((s) => String(s.id) === String(serviceId))
  const dentistOffersService = (dentistOption, serviceOption) => {
    if (!dentistOption || !serviceOption) return false
    return (dentistOption.service_ids || []).some((id) => String(id) === String(serviceOption.id))
      || (serviceOption.dentist_ids || []).some((id) => String(id) === String(dentistOption.id))
  }
  const ready = dentistId && serviceId && date && time
  // Progress shown at the top: 1 = service, 2 = dentist, 3 = date and time
  const step = !serviceId ? 1 : !dentistId ? 2 : 3

  // When a doctor is locked in, the patient only sees the services that doctor can do.
  const offeredServices = useMemo(
    () => (doctorLocked && dentist ? services.filter((s) => dentistOffersService(dentist, s)) : services),
    [doctorLocked, dentist, services]
  )
  // Groups for the service dropdown: one group per category, skipping empty ones.
  const serviceGroups = useMemo(
    () => SERVICE_CATEGORIES
      .map((category) => ({
        label: category,
        options: offeredServices
          .filter((s) => categoryForService(s) === category)
          .map((s) => ({ value: s.id, label: s.name, price: s.price })),
      }))
      .filter((g) => g.options.length),
    [offeredServices]
  )

  // Wrong or old ?dentist= link: fall back to the normal flow instead of showing an empty form.
  useEffect(() => {
    if (doctorLocked && dentists.length && !dentist) {
      setDoctorLocked(false)
      setDentistId('')
    }
  }, [doctorLocked, dentists, dentist])

  const unlockDoctor = () => {
    setDoctorLocked(false)
    setDentistId('')
    setDate('')
    setTime('')
    setSelectionHint('')
    setParams({}, { replace: true })
  }

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

  // Short, formal note shown on a dentist card that cannot do the chosen service.
  const doctorReason = () => 'This dentist does not provide the selected service.'

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
      if (doctorLocked) {
        // e.g. an old ?service= link that this doctor does not offer: keep the doctor, clear the service
        setServiceId('')
        setSelectionHint(`${selectedDentist.name} does not offer that service. Choose one from the list below.`)
        return
      }
      setDentistId('')
      setDate('')
      setTime('')
      setSelectionHint('Your previously selected doctor does not offer this service. Choose an eligible doctor below.')
    }
  }, [dentistId, serviceId, dentists, services, doctorLocked])

  const goToPayment = async () => {
    if (needsPhone) {
      setBusy(true)
      try {
        const { data } = await api.put('/me', { phone })
        setUser(data)
      } catch (e) {
        addToast('error', errMsg(e))
        setBusy(false)
        return
      }
      setBusy(false)
    }
    setShowPay(true)
  }

  // Final step: after the (dummy) payment, send the booking to Laravel
  const confirmBooking = async () => {
    setBusy(true)
    try {
      await api.post('/appointments', { dentist_id: dentistId, service_id: serviceId, date, start_time: time, payment_ref: DEMO ? demoRef : payRef.trim() })
      addToast('success', DEMO ? 'Appointment booked! A confirmation email was sent to you.' : 'Booking submitted! The clinic will confirm it once your payment is checked.')
      nav('/my-appointments')
    } catch (e) {
      addToast('error', errMsg(e))
      setShowPay(false)
      setSlotRefresh((n) => n + 1) // reload slots so a just-taken time shows as taken
    }
    setBusy(false)
  }

  return (
    <>
      <div className="card booking-card bk">
        <header className="bk-head">
          <div className="bk-head-row">
            <h1 className="bk-title">Book an Appointment</h1>
            <span className="bk-step-pill">Step {step} of 3</span>
          </div>
          <div className="bk-progress" role="progressbar" aria-label="Booking progress" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step}>
            {[1, 2, 3].map((n) => <span key={n} className={n <= step ? 'on' : ''} />)}
          </div>
          <p className="bk-sub">Select your service, dentist, and preferred schedule.</p>
        </header>

        {loadErr && <p className="error" role="alert">Could not load the booking options: {loadErr}</p>}

        <section className="bk-section" aria-labelledby="bk-h-service">
          <h2 id="bk-h-service" className="bk-h"><span className="bk-num">01</span> — Select a Service</h2>
          <div className="bk-service-card">
            <div className="bk-service-label">
              <span className="bk-kicker">Dental Service</span>
              <ServiceSelect
                value={serviceId}
                onChange={selectService}
                groups={serviceGroups}
              />
            </div>
            {service ? (
              <div className="bk-service-summary">
                <div className="bk-service-meta">
                  <span className="bk-chip">{categoryForService(service)}</span>
                  {service.description && <p>{service.description}</p>}
                </div>
                <span className="bk-price">₱{Number(service.price).toLocaleString()}</span>
              </div>
            ) : (
              <p className="bk-hint">Choose a service to see dentists who can perform it.</p>
            )}
          </div>
          {doctorLocked && dentist && (
            <p className="bk-note">
              {offeredServices.length
                ? `Showing only the services offered by ${dentist.name}.`
                : `${dentist.name} has no services listed yet. Please choose another doctor.`}
            </p>
          )}
          {selectionHint && <p className="booking-selection-hint" role="status">{selectionHint}</p>}
        </section>

        <section className="bk-section" aria-labelledby="bk-h-dentist">
          <h2 id="bk-h-dentist" className="bk-h"><span className="bk-num">02</span> — Choose Your Dentist</h2>
          <p className="bk-sub">{doctorLocked ? 'You are booking with this dentist.' : 'Select an available dentist for your chosen service.'}</p>
          {doctorLocked && dentist ? (
            <div className="bk-dentist selected">
              <DentistAvatar name={dentist.name} />
              <span className="bk-dentist-body">
                <b>{dentist.name}</b>
                <span className="bk-dentist-spec">{dentist.specialty}</span>
              </span>
              <span className="bk-dentist-badges">
                <span className="bk-pill sel"><Icon name="check" size={12} /> Selected</span>
                <button type="button" className="bk-change" onClick={unlockDoctor}>Change doctor</button>
              </span>
            </div>
          ) : !service ? (
            <p className="bk-empty">Select a service to view available dentists.</p>
          ) : dentists.length === 0 ? (
            <p className="muted">No doctors are available right now.</p>
          ) : (
            <div className="bk-dentists" role="radiogroup" aria-label="Choose a dentist">
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
                    title={!eligible ? doctorReason() : undefined}
                    className={`bk-dentist${selected ? ' selected' : ''}${!eligible ? ' ineligible' : ''}`}
                    onClick={() => chooseDentist(option)}
                    onKeyDown={(event) => handleDentistKeyDown(event, option.id)}
                  >
                    <DentistAvatar name={option.name} />
                    <span className="bk-dentist-body">
                      <b>{option.name}</b>
                      <span className="bk-dentist-spec">{option.specialty}</span>
                    </span>
                    <span className="bk-dentist-badges">
                      {selected
                        ? <span className="bk-pill sel"><Icon name="check" size={12} /> Selected</span>
                        : <span className={`bk-pill ${eligible ? 'ok' : 'off'}`}>{eligible ? 'Available' : 'Unavailable'}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <section className="bk-section" aria-labelledby="bk-h-date">
          <h2 id="bk-h-date" className="bk-h bk-h-spaced"><span className="bk-num">03</span> — Select Date &amp; Time</h2>
          {dentistId ? (
            <SlotPicker dentistId={dentistId} dentistWorkDays={dentist?.work_days} date={date} setDate={setDate} time={time} setTime={setTime} refreshKey={slotRefresh} />
          ) : (
            <div className="bk-empty-box">
              <Icon name="calendar" size={26} />
              <p>Available schedules will appear here.</p>
              <small>Choose a dentist first to view available schedules.</small>
            </div>
          )}
        </section>

        <section className="bk-consent-section" aria-labelledby="bk-h-consent">
          <h2 id="bk-h-consent" className="bk-consent-title"><Icon name="shield" size={18} /> Appointment Consent</h2>
          {needsPhone && (
            <label>Mobile number (for SMS reminders)
              <input
                type="tel"
                name="phone"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={11}
                placeholder="09XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                aria-invalid={phone !== '' && !phoneOk}
              />
            </label>
          )}
          <label className="consent-check">
            <input type="checkbox" name="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              I agree to the SmileBook{' '}
              <button type="button" className="consent-link" onClick={() => setShowPrivacy(true)}>Privacy Notice</button>
              {' '}and consent to receive {clinicInfo.smsEnabled ? 'SMS and email messages' : 'email messages'} about my appointment (confirmations, reminders and changes).
              {clinicInfo.smsEnabled && ' Message and data rates may apply.'} To stop receiving messages, contact the clinic at {clinicInfo.email}.
            </span>
          </label>
          <button className="btn bk-continue" disabled={!ready || !consent || busy || (needsPhone && !phoneOk)} onClick={goToPayment}>Continue to Down Payment →</button>
          {ready && !consent && <p className="muted consent-hint"><small>Please tick the box above to continue.</small></p>}
        </section>
      </div>

      <AppointmentPolicies />

      {showPay && DEMO && (
        <Modal onClose={() => setShowPay(false)} titleId="payment-modal-title" descriptionId="payment-modal-description">
            <h2 id="payment-modal-title">Down Payment</h2>
            <p id="payment-modal-description" className="payment-demo-notice">Demo only: no real payment will be taken. Confirming creates a sample booking with a ₱{DOWN_PAYMENT} demo down payment.</p>
            <div className="qr"><QRCodeSVG value={`SMILEBOOK-DEMO|${demoRef}|PHP${DOWN_PAYMENT}`} size={170} /></div>
            <p className="center"><b>Ref: {demoRef}</b></p>
            <ul className="summary">
              <li>{dentist?.name}</li><li>{service?.name}</li>
              <li>{formatDate(date)} at {time && to12h(time)}</li>
            </ul>
            <button className="btn" disabled={busy} onClick={confirmBooking}>{busy ? 'Booking...' : 'Confirm demo booking'}</button>
            <button className="btn ghost" onClick={() => setShowPay(false)}>Cancel</button>
        </Modal>
      )}
      {showPay && !DEMO && (
        <Modal onClose={() => setShowPay(false)} titleId="payment-modal-title" descriptionId="payment-modal-description">
            <h2 id="payment-modal-title">Down payment</h2>
            <p id="payment-modal-description" className="payment-demo-notice">
              Pay a ₱{DOWN_PAYMENT} down payment through {clinicInfo.payment.method}, then enter the reference number below.
              Your booking stays <b>pending</b> until the clinic checks your payment.
            </p>
            {clinicInfo.payment.qrImage && (
              <div className="qr"><img src={clinicInfo.payment.qrImage} alt={`${clinicInfo.payment.method} QR code for ${clinicInfo.payment.accountName}`} width="200" height="200" /></div>
            )}
            <dl className="pay-account">
              <div><dt>Send to</dt><dd>{clinicInfo.payment.method}</dd></div>
              <div><dt>Account name</dt><dd>{clinicInfo.payment.accountName}</dd></div>
              <div><dt>Number</dt><dd>{clinicInfo.payment.accountNumber}</dd></div>
              <div><dt>Amount</dt><dd>₱{DOWN_PAYMENT}</dd></div>
            </dl>
            <ul className="summary">
              <li>{dentist?.name}</li><li>{service?.name}</li>
              <li>{formatDate(date)} at {time && to12h(time)}</li>
            </ul>
            <label>{clinicInfo.payment.method} reference number
              <input
                type="text"
                name="payment_reference"
                inputMode="text"
                autoComplete="off"
                maxLength={30}
                placeholder="Example: 1234567890123"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value.replace(/\s/g, ''))}
                aria-invalid={payRef !== '' && !REF_RE.test(payRef)}
                aria-describedby="pay-ref-hint"
              />
            </label>
            <p id="pay-ref-hint" className="muted"><small>You can find it in your {clinicInfo.payment.method} receipt. Use letters and numbers only, 6 to 30 characters. Each reference number can be used for one booking only.</small></p>
            <button className="btn" disabled={busy || !REF_RE.test(payRef)} onClick={confirmBooking}>{busy ? 'Submitting...' : 'Submit booking'}</button>
            <button className="btn ghost" onClick={() => setShowPay(false)}>Cancel</button>
        </Modal>
      )}
      {showPrivacy && (
        <Modal onClose={() => setShowPrivacy(false)} titleId="privacy-modal-title" descriptionId="privacy-modal-description">
          <h2 id="privacy-modal-title">Privacy Notice</h2>
          <div id="privacy-modal-description" className="privacy-notice">
            <p><b>What we collect.</b> Your name, email address, phone number, and the appointment details you choose (dentist, service, date and time).</p>
            <p><b>Why we collect it.</b> To book and manage your appointment, and to send you confirmations and schedule changes by {clinicInfo.smsEnabled ? 'email and SMS' : 'email'}.</p>
            <p><b>Who sees it.</b> Only SmileBook clinic staff who handle appointments. We do not sell your information.</p>
            <p><b>Your choices.</b> You may ask to see, correct or delete your information, or stop receiving messages, by emailing <a href={`mailto:${clinicInfo.email}`}>{clinicInfo.email}</a>. Read our full <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a> and how to <a href="/data-deletion" target="_blank" rel="noreferrer">delete your data</a>.</p>
          </div>
          <button className="btn" type="button" onClick={() => setShowPrivacy(false)}>Close</button>
        </Modal>
      )}
    </>
  )
}