import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import api, { DAY_NAMES, errMsg, to12h } from '../api'
import clinicInfo from '../clinicInfo'
import doctorPhoto from '../doctorPhotos'
import { categoryForService, SERVICE_CATEGORIES } from '../serviceCategories'
import ContactSection from './ContactSection'
import BeforeAfterSection from './BeforeAfterSection'
import ReviewsSection from './ReviewsSection'

const icons = {
  location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.4 2.8a2 2 0 0 1-.6 1.7L7.5 9.6a16 16 0 0 0 6 6l1.4-1.4a2 2 0 0 1 1.7-.6l2.8.4a2 2 0 0 1 1.7 1.9Z" />,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  facebook: <path fill="currentColor" stroke="none" d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.6.4-1 1-1Z" />,
  tooth: <path d="M7 3c2-1 4 .2 5 1 1-.8 3-2 5-1 3 1 4 4 3 8-.8 3-2 6-3 9-.6 2-2 2-3 0l-2-5-2 5c-1 2-2.4 2-3 0-1-3-2.2-6-3-9C3 7 4 4 7 3Z" />,
}

function Icon({ name, className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

function normalizeName(name) {
  return name.toLowerCase().replace(/^dr\.?\s*/, '').replace(/[^a-z]/g, '')
}

function initials(name) {
  return name.replace(/^Dr\.?\s*/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function PlaceholderValue({ value }) {
  return <span className={value.startsWith('PLACEHOLDER') ? 'placeholder-value' : undefined}>{value}</span>
}

export default function Dentists() {
  const [dentists, setDentists] = useState([])
  const [services, setServices] = useState([])
  const [dentistError, setDentistError] = useState('')
  const [serviceError, setServiceError] = useState('')
  const [dentistsLoading, setDentistsLoading] = useState(true)
  const [servicesLoading, setServicesLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return
    const target = document.getElementById(location.hash.slice(1))
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash, dentistsLoading, servicesLoading])

  useEffect(() => {
    api.get('/dentists')
      .then((response) => setDentists(response.data))
      .catch((error) => setDentistError(errMsg(error)))
      .finally(() => setDentistsLoading(false))

    api.get('/services')
      .then((response) => setServices(response.data))
      .catch((error) => setServiceError(errMsg(error)))
      .finally(() => setServicesLoading(false))
  }, [])

  const profiles = new Map(clinicInfo.doctors.map((doctor) => [normalizeName(doctor.name), doctor]))

  return (
    <div className="landing">
      <section className="landing-hero" aria-labelledby="hero-heading">
        <div className="hero-copy">
          <span className="eyebrow">A brighter smile starts here</span>
          <h1 id="hero-heading">{clinicInfo.name}</h1>
          <p className="hero-tagline">{clinicInfo.tagline}</p>
          <p className="hero-description">Thoughtful dental care, easy appointment booking, and a team here to help you smile with confidence.</p>
          <Link className="btn hero-cta" to="/book">Book now <span aria-hidden="true">→</span></Link>
          <div className="hero-note"><Icon name="tooth" /> Care for every smile, from check-up to follow-up.</div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-art-orbit orbit-one" />
          <div className="hero-art-orbit orbit-two" />
          <div className="hero-tooth">
            <svg viewBox="0 0 160 190" fill="none">
              <path d="M42 17c16-8 29 2 38 9 9-7 22-17 38-9 23 11 27 35 20 65-6 25-16 51-25 75-5 14-16 14-22 1l-11-28-11 28c-6 13-17 13-22-1-9-24-19-50-25-75-7-30-3-54 20-65Z" fill="white" />
              <path d="M56 54c7 5 15 7 24 7s17-2 24-7" stroke="#8CCFC2" strokeWidth="7" strokeLinecap="round" />
              <path d="M60 70c6 4 13 6 20 6s14-2 20-6" stroke="#D8F0EA" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="hero-float-card"><span className="hero-float-icon"><Icon name="clock" /></span><span><b>Easy scheduling</b><small>Choose a time that works</small></span></div>
        </div>
      </section>

      <section className="landing-section doctors-section" aria-labelledby="doctors-heading">
        <div className="section-heading section-heading-row">
          <div><span className="eyebrow">Meet your care team</span><h2 id="doctors-heading">Our Doctors</h2></div>
          <p>Friendly professionals ready to support your dental health.</p>
        </div>
        <p className="muted"><small>Sample profiles for demonstration only.</small></p>
        {dentistsLoading && <p className="muted" role="status">Loading doctors...</p>}
        {dentistError && <p className="error" role="alert">Could not load doctors: {dentistError}</p>}
        {!dentistsLoading && !dentistError && dentists.length === 0 && <p className="muted">No doctors are currently listed.</p>}
        <div className="doctor-grid">
          {dentists.map((dentist) => {
            const profile = profiles.get(normalizeName(dentist.name)) || {}
            const credentials = profile.credentials || 'PLACEHOLDER — DMD degree'
            const school = profile.school || 'PLACEHOLDER — Dental school'
            const experience = profile.yearsExperience || 'PLACEHOLDER — Years of experience'
            const license = profile.prcLicense || 'PLACEHOLDER — PRC license number'
            const bio = profile.bio || 'PLACEHOLDER — Short doctor biography'
            const offeredServices = services.filter((service) => (
              (dentist.service_ids || []).some((id) => String(id) === String(service.id))
              || (service.dentist_ids || []).some((id) => String(id) === String(dentist.id))
            ))

            return (
              <article className="doctor-card" key={dentist.id}>
                <div className="doctor-card-top">
                  <div className="doctor-avatar" aria-hidden={doctorPhoto(dentist.name) ? undefined : 'true'}>
                    {doctorPhoto(dentist.name)
                      ? <img src={doctorPhoto(dentist.name)} alt={dentist.name} loading="lazy" />
                      : initials(dentist.name)}
                  </div>
                  <span className="specialty-tag">{dentist.specialty}</span>
                </div>
                <h3>{dentist.name}</h3>
                <p className="doctor-bio"><PlaceholderValue value={bio} /></p>
                <dl className="doctor-credentials">
                  <div><dt>Degree</dt><dd><PlaceholderValue value={credentials} /></dd></div>
                  <div><dt>School</dt><dd><PlaceholderValue value={school} /></dd></div>
                  <div><dt>Experience</dt><dd><PlaceholderValue value={experience} /></dd></div>
                  <div><dt>PRC license</dt><dd><PlaceholderValue value={license} /></dd></div>
                </dl>
                <div className="doctor-offered-services">
                  <b>Services offered</b>
                  {servicesLoading ? <p className="muted">Loading services...</p> : offeredServices.length ? (
                    SERVICE_CATEGORIES.map((category) => {
                      const categoryServices = offeredServices.filter((service) => categoryForService(service) === category)
                      return categoryServices.length ? (
                        <div className="doctor-service-category" key={category}>
                          <span>{category}</span>
                          <ul>
                            {categoryServices.map((service) => <li key={service.id}>{service.name}</li>)}
                          </ul>
                        </div>
                      ) : null
                    })
                  ) : <p className="muted">No services currently assigned.</p>}
                </div>
                <p className="doctor-schedule"><b>Schedule:</b> {dentist.work_days.map((day) => DAY_NAMES[day]).join(', ')} · {to12h(dentist.start_time)}–{to12h(dentist.end_time)}</p>
                <Link className="btn doctor-book" to={`/book?dentist=${dentist.id}`}>
                  Book with {dentist.name}
                </Link>
              </article>
            )
          })}
        </div>
      </section>

      <section className="landing-section services-section" aria-labelledby="services-heading">
        <div className="section-heading section-heading-row">
          <div><span className="eyebrow">Care for every smile</span><h2 id="services-heading">Our Services</h2></div>
          <p>Browse our services and see the listed prices before you book.</p>
        </div>
        {servicesLoading && <p className="muted" role="status">Loading services...</p>}
        {serviceError && <p className="error" role="alert">Could not load services: {serviceError}</p>}
        {!servicesLoading && !serviceError && services.length === 0 && <p className="muted">No services are currently listed.</p>}
        <div className="service-category-grid">
          {SERVICE_CATEGORIES.map((category) => {
            const categoryServices = services.filter((service) => categoryForService(service) === category)
            return (
              <article className="service-category-card" key={category}>
                <div className="service-category-icon"><Icon name="tooth" /></div>
                <h3>{category}</h3>
                {servicesLoading ? <p className="muted">Loading services...</p> : categoryServices.length > 0 ? (
                  <ul className="service-list">
                    {categoryServices.map((service) => (
                      <li key={service.id}><span>{service.name}</span><b>₱{Number(service.price).toLocaleString()}</b></li>
                    ))}
                  </ul>
                ) : <p className="muted">No services listed in this category yet.</p>}
              </article>
            )
          })}
        </div>
      </section>

      <BeforeAfterSection services={services} />

      <ReviewsSection services={services} />
      <ContactSection />

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="footer-mark"><Icon name="tooth" /></span>
          <div><b>{clinicInfo.name}</b><p>{clinicInfo.tagline}</p></div>
        </div>
        <div className="footer-contact">
          <span><Icon name="location" /><PlaceholderValue value={clinicInfo.address} /></span>
          <span><Icon name="phone" /><PlaceholderValue value={clinicInfo.phone} /></span>
          <span><Icon name="mail" /><PlaceholderValue value={clinicInfo.email} /></span>
          <span><Icon name="facebook" /><a href={clinicInfo.facebookUrl} target="_blank" rel="noreferrer">facebook.com/smilebook4dental</a></span>
        </div>
        <Link className="footer-book" to="/book">Book an appointment <span aria-hidden="true">→</span></Link>
      </footer>
    </div>
  )
}