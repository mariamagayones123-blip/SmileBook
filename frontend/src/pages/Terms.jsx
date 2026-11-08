import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import clinicInfo from '../clinicInfo'

const LAST_UPDATED = 'November 7, 2026'

export default function Terms() {
  useEffect(() => {
    document.title = 'Terms of Service | SmileBook'
  }, [])

  return (
    <article className="legal-page">
      <h1>Terms of Service</h1>
      <p className="legal-meta">SmileBook by {clinicInfo.name} · Last updated {LAST_UPDATED}</p>

      <p>
        These terms apply when you create a SmileBook account or book an appointment with {clinicInfo.name}.
        By signing up or using SmileBook, you agree to them. If you do not agree, please do not use the
        service.
      </p>

      <h2>What SmileBook does</h2>
      <p>
        SmileBook lets you view the clinic's dentists and services, request appointments, and manage your
        bookings online. It is a booking tool. It does not give medical advice, and it is not for dental
        emergencies. For urgent problems, call the clinic at {clinicInfo.phone} or go to the nearest
        emergency room.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate information, including your name, email, and mobile number.</li>
        <li>Keep your password private. You are responsible for what happens under your account.</li>
        <li>Tell us right away if you think someone else has used your account.</li>
        <li>If you sign in with Google or Facebook, those providers' own terms also apply to that sign-in.</li>
        <li>Patients under 18 should use SmileBook with a parent or legal guardian.</li>
      </ul>

      <h2>Booking appointments</h2>
      <ul>
        <li>A booking is a request. It stays <strong>pending</strong> until the clinic approves it. You will be notified {clinicInfo.smsEnabled ? 'by email and SMS' : 'by email'} when its status changes.</li>
        <li>The clinic may cancel or move an appointment if a dentist is unavailable or for other clinic reasons. We will tell you and help you find another time.</li>
        <li>If you reschedule an appointment, it goes back to pending until the clinic approves the new time.</li>
        <li>Please arrive at least 15 minutes early. Late arrivals may need a shorter treatment or a new schedule.</li>
        <li>Please cancel or reschedule as early as you can from the My Appointments page, or by contacting the clinic, so that other patients can take the slot.</li>
        <li>The clinic's <strong>Before your visit</strong> guidelines on the Book page also apply.</li>
      </ul>

      <h2>Fees and payments</h2>
      {clinicInfo.payment.demo ? (
        <p>
          SmileBook does not process real online payments at this time. The down payment screen shown while
          booking is for demonstration only and no money is taken. Treatment fees are set by the clinic, and
          the clinic will tell you what to pay and when.
        </p>
      ) : (
        <ul>
          <li>To request an appointment, you pay a down payment of ₱{clinicInfo.payment.amount} to the clinic's {clinicInfo.payment.method} account shown on the booking screen, then enter the {clinicInfo.payment.method} reference number from your receipt.</li>
          <li>SmileBook does not take payments itself. Your payment goes straight to the clinic.</li>
          <li>Your booking stays <strong>pending</strong> until the clinic checks that the payment was received. If the reference number cannot be matched to a payment, the clinic may decline or cancel the booking and will contact you.</li>
          <li>Each reference number can be used for one booking only. Entering a false reference number is a breach of these terms.</li>
          <li>Treatment fees are set by the clinic. Ask the clinic whether your down payment is deducted from your treatment fee or refundable, and in what cases, before you pay.</li>
        </ul>
      )}

      <h2>Reviews and messages</h2>
      <p>
        When you post a review or send a message, keep it honest and respectful. We may remove content that
        is abusive, false, or off-topic. By posting a review, you allow the clinic to show it on SmileBook.
      </p>

      <h2>Using SmileBook properly</h2>
      <p>Please do not:</p>
      <ul>
        <li>use someone else's account or give false details;</li>
        <li>book appointments you do not plan to attend, or book many slots to block other patients;</li>
        <li>try to break, overload, or get around the security of the system;</li>
        <li>use SmileBook for anything unlawful.</li>
      </ul>
      <p>
        We may suspend or close an account that breaks these terms. You can also ask us to delete your
        account at any time. See <Link to="/data-deletion">how to delete your data</Link>.
      </p>

      <h2>Your information</h2>
      <p>
        How we collect and use your personal information is explained in our{' '}
        <Link to="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Limits of our responsibility</h2>
      <p>
        We work to keep SmileBook available and accurate, but we cannot promise it will always be free of
        errors or interruptions, for example during maintenance or when your internet{clinicInfo.smsEnabled && ' or the SMS network'} is
        down. Please check your appointment details, and contact the clinic if something looks wrong.
        Nothing in these terms limits any rights you have under Philippine law.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms. When we do, we will change the date at the top of this page. Continuing
        to use SmileBook after a change means you accept the new terms.
      </p>

      <h2>Contact</h2>
      <p>
        {clinicInfo.name}, {clinicInfo.address}. Email{' '}
        <a href={`mailto:${clinicInfo.email}`}>{clinicInfo.email}</a> or call {clinicInfo.phone}.
      </p>
    </article>
  )
}
