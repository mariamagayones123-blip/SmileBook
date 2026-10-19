import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers.Accept = 'application/json'
  return config
})

// Turn Laravel validation errors into one readable message
export const errMsg = (e) => {
  const d = e.response?.data
  if (d?.errors) return Object.values(d.errors).flat().join(' ')
  return d?.message || 'Something went wrong. Please try again.'
}

// Local date as YYYY-MM-DD (avoids the UTC shift problem)
export const toYMD = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Earliest bookable date = today + 2 days
export const minDate = () => {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  return toYMD(d)
}

export const to12h = (t) => {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default api
