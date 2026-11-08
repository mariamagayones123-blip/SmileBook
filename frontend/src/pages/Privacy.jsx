import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import clinicInfo from '../clinicInfo'

const LAST_UPDATED = 'November 7, 2026'

export default function Privacy() {
  useEffect(() => {
    document.title = 'Privacy Policy | SmileBook'
  }, [])

  return (
    <article className="legal-page">
      <h1>Privacy Policy</h1>
      <p className="legal-meta">SmileBook by {clinicInfo.name} · Last updated {LAST_UPDATED}</p>

      <p>
        SmileBook is the online booking system of {clinicInfo.name}. This policy explains what personal
        information we collect when you use it, why we collect it, and what you can do about it. We handle
        your information in line with the Data Privacy Act of 2012 (Republic Act No. 10173) of the Philippines.
      </p>

      <h2>Who we are</h2>
      <p>
        {clinicInfo.name}, {clinicInfo.address}. For any privacy question, contact us at{' '}
        <a href={`mailto:${clinicInfo.email}`}>{clinicInfo.email}</a> or {clinicInfo.phone}.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address, mobile number, and a password. Passwords are stored in scrambled (hashed) form, not as plain text.</li>
        <li><strong>Sign-in with Google or Facebook:</strong> your name, email address, profile picture, and the account ID that Google or Facebook gives us. We never receive your Google or Facebook password.</li>
        <li><strong>Appointments:</strong> the dentist, service, date, and time you choose, and the status of the booking.</li>
        <li><strong>Reviews and messages:</strong> what you write when you leave a review or send us a message through the contact form.</li>
        <li><strong>Password reset:</strong> a one-time code that we send to your email so you can reset your password.</li>
        <li><strong>Technical data:</strong> a sign-in token stored in your browser to keep you logged in, and basic server logs.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To create your account and let you sign in.</li>
        <li>To book, change, and cancel your appointments.</li>
        <li>To send confirmations and schedule changes by {clinicInfo.smsEnabled ? 'email and SMS' : 'email'}.</li>
        <li>To reply to your messages and show your reviews.</li>
        <li>To keep the system secure and fix problems.</li>
      </ul>

      <h2>Who can see it</h2>
      <p>
        Only clinic staff who manage appointments can see your information. We do not sell it. We use a few
        service providers to run SmileBook: {clinicInfo.smsEnabled && 'an SMS provider to send text messages, '}an email service to send
        emails, and Google and Facebook if you choose to sign in with them. They receive only what they need
        to do their job.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your account and booking information while your account is active. Dental treatment records
        are medical records, and the clinic may be required by law to keep them for a set period even after
        your SmileBook account is deleted.
      </p>

      <h2>Your rights</h2>
      <p>
        You may ask to see, correct, or delete your information, or to stop receiving messages from us. To
        delete your account and data, follow the steps on our <Link to="/data-deletion">data deletion page</Link>.
        For anything else, email <a href={`mailto:${clinicInfo.email}`}>{clinicInfo.email}</a>. If you believe
        your data was mishandled, you may also contact the National Privacy Commission of the Philippines.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy, we will update the date at the top of this page.
      </p>

      <p className="legal-note">
        Questions? Write to <a href={`mailto:${clinicInfo.email}`}>{clinicInfo.email}</a>.
      </p>
    </article>
  )
}
