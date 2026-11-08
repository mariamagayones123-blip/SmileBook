// Doctor profile photos live in /public/doctors. Matched by name (ignores "Dr." and punctuation).
const PHOTOS = {
  mariasantos: '/doctors/maria-santos.jpg',
  josereyes: '/doctors/jose-reyes.jpg',
  anacruz: '/doctors/ana-cruz.jpg',
}

export default function doctorPhoto(name = '') {
  const key = name.toLowerCase().replace(/^dr\.?\s*/, '').replace(/[^a-z]/g, '')
  return PHOTOS[key] || null
}
