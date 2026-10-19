import clinicInfo from '../clinicInfo'

const POLICY_GROUPS = [
  {
    title: 'Appointment Guidelines',
    items: [
      'Please arrive at least 15 minutes before your scheduled appointment to allow time for registration, forms, and preparation before your consultation.',
      'Kindly arrive on time to maximize your scheduled treatment period. Late arrivals may require adjustments to the appointment schedule.',
      'If you need to reschedule or cancel your appointment, please do so as early as possible from the My Appointments page or by contacting the clinic, so we can assist you and accommodate other patients.',
    ],
  },
  {
    title: 'Companion Policy',
    items: [
      'To maintain a comfortable and efficient clinic environment, we encourage patients to minimize companions.',
      'A maximum of one (1) companion is allowed per patient, unless assistance is required.',
    ],
  },
  {
    title: 'Clinic Policies',
    items: [
      'Please provide accurate information regarding your medical history, medications, allergies, and dental concerns to ensure safe and personalized care.',
      'For procedures requiring preparation or special instructions, please follow the guidelines provided by our dental team before your appointment.',
      'Children and minors must be accompanied by a parent or legal guardian.',
      'Please keep your personal belongings secure during your visit.',
      'Respectful communication and a comfortable environment for all patients and staff are highly valued.',
    ],
  },
]

export default function AppointmentPolicies() {
  return (
    <section className="policy-card" aria-labelledby="policy-heading">
      <h2 id="policy-heading">Before your visit</h2>
      <div className="policy-groups">
        {POLICY_GROUPS.map((group) => (
          <div className="policy-group" key={group.title}>
            <h3>{group.title}</h3>
            <ul>
              {group.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <p className="policy-closing">We look forward to welcoming you to {clinicInfo.name} and providing you with exceptional dental care.</p>
    </section>
  )
}
