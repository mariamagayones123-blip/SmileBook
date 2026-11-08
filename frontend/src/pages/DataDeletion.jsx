import { useEffect } from 'react'
import clinicInfo from '../clinicInfo'

const LAST_UPDATED = 'November 7, 2026'

export default function DataDeletion() {
  useEffect(() => {
    document.title = 'Data Deletion | SmileBook'
  }, [])

  const subject = encodeURIComponent('Data deletion request - SmileBook')
  const body = encodeURIComponent(
    'Hello,\n\nPlease delete my SmileBook account and personal data.\n\nFull name:\nEmail used to sign up:\nSign-in method (Email / Google / Facebook):\n\nThank you.'
  )
  const mailto = `mailto:${clinicInfo.email}?subject=${subject}&body=${body}`

  return (
    <article className="legal-page">
      <h1>How to delete your data</h1>
      <p className="legal-meta">SmileBook by {clinicInfo.name} · Last updated {LAST_UPDATED}</p>

      <p>
        You can ask us to delete your SmileBook account and the personal data connected to it at any time.
        This applies to accounts created with email and password, Google, or Facebook.
      </p>

      <h2>Request deletion</h2>
      <ol>
        <li>
          Send an email to <a href={mailto}>{clinicInfo.email}</a> with the subject "Data deletion request".
        </li>
        <li>
          Include your full name and the email address you used to sign up. If you signed in with Google or
          Facebook, tell us which one.
        </li>
        <li>We will confirm the request came from you. We may reply to the email address on the account.</li>
        <li>We will delete your account within 30 days and email you when it is done.</li>
      </ol>

      <h2>What we delete</h2>
      <p>
        Your name, email address, phone number, profile picture, and sign-in details, including the connection
        to your Facebook or Google account. Your appointment bookings on SmileBook are also removed.
      </p>

      <h2>What we may keep</h2>
      <p>
        Dental treatment records are medical records, and the clinic may be required by law to keep them for a
        set period. If that applies to you, we keep only those records and tell you what was kept.
      </p>

      <h2>If you signed in with Facebook</h2>
      <p>
        You can also remove {clinicInfo.name} from your Facebook account. Open Facebook Settings, go to{' '}
        <strong>Apps and Websites</strong>, select the app, and choose <strong>Remove</strong>. This stops
        Facebook from sharing new information with us. To delete the data we already hold, send the email
        request above.
      </p>

      <p className="legal-note">
        Questions about your data? Write to <a href={`mailto:${clinicInfo.email}`}>{clinicInfo.email}</a>.
      </p>
    </article>
  )
}
