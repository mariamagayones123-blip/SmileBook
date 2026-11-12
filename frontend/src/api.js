import axios from 'axios'

// 70 seconds: the free Render server sleeps and can take about a minute to wake up. Without a limit the page would wait forever.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api', timeout: 70000 })

// "Server is waking up" signal. If any request is still waiting after a few seconds, the app shows a notice
// (see ServerWaking.jsx). It listens for the 'api:slow' event; detail is true while something is slow.
const SLOW_MS = 4000
let slowCount = 0
const tellSlow = () => window.dispatchEvent(new CustomEvent('api:slow', { detail: slowCount > 0 }))
const startSlowTimer = (config) => {
  const mark = { slow: false }
  mark.timer = setTimeout(() => { mark.slow = true; slowCount += 1; tellSlow() }, SLOW_MS)
  config.slowMark = mark
}
const stopSlowTimer = (config) => {
  const mark = config?.slowMark
  if (!mark) return
  clearTimeout(mark.timer)
  if (mark.slow) { mark.slow = false; slowCount = Math.max(0, slowCount - 1); tellSlow() }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers.Accept = 'application/json'
  startSlowTimer(config)
  return config
})

// If the server says our token is no longer valid (expired / revoked), log out cleanly.
api.interceptors.response.use(
  (res) => { stopSlowTimer(res.config); return res },
  (error) => {
    stopSlowTimer(error.config)
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
  if (d?.message) return d.message
  if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') return 'The server is taking too long to respond. Please wait a moment and try again.'
  if (!e.response) return 'Cannot reach the server. Please check your internet connection and try again.'
  return 'Something went wrong. Please try again.'
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
