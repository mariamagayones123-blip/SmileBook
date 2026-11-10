import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers.Accept = 'application/json'
  return config
})

// If the server says our token is no longer valid (expired / revoked), log out cleanly.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || ''
    const isAuthForm = ['/login', '/register', '/forgot-password', '/reset-password'].some((p) => url.endsWith(p))
    if (error.response?.status === 401 && !isAuthForm && localStorage.getItem('token')) {
      localStorage.removeItem('token')
      window.dispatchEvent(new Event('auth:expired'))
    }
    return Promise.reject(error)
  }
)

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

// Same as to12h, but noon is shown as "12:00 NN" (used for clinic / Saturday closing time)
export const toClinicTime = (t) => (t === '12:00' ? '12:00 NN' : to12h(t))

// "2026-11-12" -> "November 12, 2026" (same style as the emails)
export const formatDate = (ymd) => {
  if (!ymd) return ''
  const [y, m, d] = String(ymd).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// "pending" -> "Pending approval", "approved" -> "Approved" (same wording as the emails)
export const statusLabel = (s) => (s === 'pending' ? 'Pending approval' : s ? s.charAt(0).toUpperCase() + s.slice(1) : '')

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default api
