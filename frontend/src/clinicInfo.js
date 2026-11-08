const clinicInfo = {
  name: 'SmileBook Dental Clinic',
  tagline: 'Your smile, cared for.',
  description: 'We make it easier to plan your dental care. Meet the clinic team, explore available services, and book an appointment at a time that suits you.',
  address: '363 Casal St, Quiapo, Manila, 1001 Metro Manila',
  phone: '09944014433',
  // SMS notifications. Keep false until Semaphore (API key + approved sender name) works. Email is always used.
  smsEnabled: false,
  email: 'smilebook4dental@gmail.com',
  facebookUrl: 'https://www.facebook.com/smilebook4dental',
  // DEMO MODE: demo: true = pekeng QR at "Demo only" na payment (para sa school project / testing).
  // Para sa totoong bayad: gawing false ang demo at ilagay ang totoong accountName at accountNumber.
  // Para sa QR ng totoong account: ilagay ang larawan sa frontend/public/payment-qr.png at gawing '/payment-qr.png' ang qrImage.
  payment: {
    demo: true,
    method: 'GCash',
    accountName: 'SmileBook Dental Clinic',
    accountNumber: '09XX XXX XXXX',
    amount: 200,
    qrImage: '',
  },
  hours: 'Monday - Friday: 7:00 AM - 6:00 PM, Saturday: 7:00 AM - 12:00 NN',
  googleMapsUrl: 'https://maps.app.goo.gl/KzVKeCsMZcVdWYaS9',
  googleMapsPlaceholder: 'https://maps.app.goo.gl/KzVKeCsMZcVdWYaS9 — Add the clinic Google Maps link',
  doctors: [
    {
      name: 'Dr. Maria Santos',
      credentials: 'Doctor of Dental Medicine (DMD)',
      school: 'University of the Philippines Manila, College of Dentistry',
      yearsExperience: '10+ years',
      prcLicense: 'Sample only (PRC No. 0123456)',
      bio: 'Dr. Santos provides preventive and family dental care, from routine check‑ups and cleanings to fillings and gum care, with a gentle, patient‑first approach.',
    },
    {
      name: 'Dr. Jose Reyes',
      credentials: 'Doctor of Dental Medicine (DMD), Certificate in Orthodontics',
      school: 'Centro Escolar University School of Dentistry, School of Dentistry',
      yearsExperience: '8+ years',
      prcLicense: 'Sample only (PRC No. 0234567)',
      bio: 'Dr. Reyes specializes in straightening teeth and correcting bite problems using metal and ceramic braces, as well as retainers, for teens and adults.',
    },
    {
      name: 'Dr. Ana Cruz',
      credentials: 'Doctor of Dental Medicine (DMD), Oral and Maxillofacial Surgery training',
      school: 'University of Santo Tomas, Faculty of Medicine and Surgery (Dentistry)',
      yearsExperience: '12+ years',
      prcLicense: 'Sample only (PRC No. 0345678)',
      bio: 'Dr. Cruz handles tooth extractions, wisdom tooth removal, and minor oral surgery, focused on safe procedures and comfortable recovery.',
    },
  ],
}

export default clinicInfo