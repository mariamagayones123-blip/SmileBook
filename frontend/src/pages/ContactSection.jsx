import { useEffect, useState } from 'react'
import api, { errMsg } from '../api'
import { useAuth } from '../App'
import clinicInfo from '../clinicInfo'
import { useToast } from '../Toast'

const icons = {
  location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.4 2.8a2 2 0 0 1-.6 1.7L7.5 9.6a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 1.7-.6l2.8.4a2 2 0 0 1 1.7 1.9Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  facebook: <path fill="currentColor" stroke="none" d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.6.4-1 1-1Z" />,
}

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

const mapsQuery = encodeURIComponent(clinicInfo.address)
const mapsEmbedUrl = `https://maps.google.com/maps?q=${mapsQuery}&z=16&output=embed`

export default function ContactSection() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
  })

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: current.name || user?.name || '',
      email: current.email || user?.email || '',
    }))
  }, [user])

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value })
    setFormError('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      const { data } = await api.post('/contact', form)
      addToast('success', data.message || 'Message sent.')
      setForm({ name: user?.name || '', email: user?.email || '', subject: '', message: '' })
    } catch (error) {
      setFormError(errMsg(error))
    }
    setBusy(false)
  }

  return (
    <section className="landing-section contact-section" id="contact" aria-labelledby="contact-heading">
      <div className="section-heading section-heading-row">
        <div>
          <span className="eyebrow">We are here to help</span>
          <h2 id="contact-heading">Contact us</h2>
        </div>
        <p>Send a message or reach the clinic through any of the details below.</p>
      </div>
      <div className="contact-layout">
        <div className="contact-details">
          <div className="clinic-detail"><Icon name="location" /><div><b>Address</b><p>{clinicInfo.address}</p></div></div>
          <div className="clinic-detail"><Icon name="phone" /><div><b>Contact no.</b><p><a href={`tel:${clinicInfo.phone.replace(/[^\d+]/g, '')}`}>{clinicInfo.phone}</a></p></div></div>
          <div className="clinic-detail"><Icon name="mail" /><div><b>Gmail</b><p><a href={`mailto:${clinicInfo.email}`}>{clinicInfo.email}</a></p></div></div>
          <div className="clinic-detail"><Icon name="facebook" /><div><b>Facebook</b><p><a href={clinicInfo.facebookUrl} target="_blank" rel="noreferrer">facebook.com/smilebook4dental</a></p></div></div>
          <div className="clinic-detail"><Icon name="clock" /><div><b>Clinic hours</b><p>{clinicInfo.hours}</p></div></div>
          <div className="map-frame">
            <iframe title="SmileBook Dental Clinic on Google Maps" src={mapsEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            <a className="map-link" href={clinicInfo.googleMapsUrl} target="_blank" rel="noreferrer">Open location in Google Maps</a>
          </div>
        </div>
        <form className="feedback-card" onSubmit={submit}>
          <h3>Send a message</h3>
          {formError && <p className="field-error" role="alert">{formError}</p>}
          <label>Name
            <input value={form.name} onChange={set('name')} autoComplete="name" placeholder="Your full name" required maxLength={100} />
          </label>
          <label>Email
            <input type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" required maxLength={120} />
          </label>
          <label>Subject
            <input value={form.subject} onChange={set('subject')} placeholder="What is this about?" required maxLength={150} />
          </label>
          <label>Message
            <textarea
              value={form.message}
              onChange={set('message')}
              placeholder="How can we help?"
              required
              minLength={10}
              maxLength={2000}
              rows={5}
            />
          </label>
          <button className="btn" disabled={busy}>{busy ? 'Sending...' : 'Send message'}</button>
        </form>
      </div>
    </section>
  )
}
