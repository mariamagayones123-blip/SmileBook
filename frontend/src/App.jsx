import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import api from './api'
import Auth from './pages/Auth'
import ForgotPassword from './pages/ForgotPassword'
import Dentists from './pages/Dentists'
import Book from './pages/Book'
import MyAppointments from './pages/MyAppointments'
import Admin from './pages/Admin'
import DataDeletion from './pages/DataDeletion'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import { ToastProvider } from './Toast'
import ServerWaking from './ServerWaking'
import { AuthCtx, useAuth } from './authContext'

function Guard({ children, admin }) {
  const { user, loading, authError } = useAuth()
  const location = useLocation()
  if (loading) return <p className="center">Loading...</p>
  if (!user && authError) {
    return (
      <div className="center">
        <p className="error">We could not reach the server. Your session is still saved.</p>
        <button className="btn" type="button" onClick={() => window.location.reload()}>Try again</button>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

// Start every new page at the top. Without this, the browser keeps the old scroll position
// (for example the bottom of Home) when you go to another page like Book.
function ScrollToTop() {
  const { pathname, search, hash } = useLocation()
  useEffect(() => {
    if (hash) return // links like /#contact scroll to their own section
    // 'instant' because the page has scroll-behavior: smooth, which would make it glide up slowly
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, search, hash])
  return null
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem('token'))
  const [authError, setAuthError] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const nav = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!localStorage.getItem('token')) return
    api.get('/me')
      .then((r) => setUser(r.data))
      .catch((e) => {
        // Only a 401 means the token is bad. A network/server error must not log the user out.
        if (e.response?.status === 401) localStorage.removeItem('token')
        else setAuthError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  // The API told us the token expired while the app was open.
  useEffect(() => {
    const onExpired = () => { setUser(null); nav('/login', { replace: true }) }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [nav])

  const login = (data) => {
    localStorage.setItem('token', data.token)
    setUser(data.user)
    setAuthError(false)
    const from = location.state?.from
    nav(data.user.role === 'admin' ? '/admin' : (from ? from.pathname + (from.search || '') : '/'), { replace: true })
  }
  const logout = () => {
    setMenuOpen(false)
    const token = localStorage.getItem('token')
    // Log out locally right away so the user does not wait for the server.
    localStorage.removeItem('token')
    setUser(null)
    nav('/login')
    // Revoke the token on the server in the background. Failures are ignored:
    // the local session is already cleared.
    if (token) {
      api.post('/logout', null, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    }
  }

  return (
    <ToastProvider>
      <AuthCtx.Provider value={{ user, setUser, loading, authError, login, logout }}>
        <ScrollToTop />
        <ServerWaking />
        <header className="nav">
          <Link to="/" className="brand" aria-label="SmileBook home">
            <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
              <rect width="40" height="40" rx="13" fill="currentColor" />
              <path d="M12 12.5c2.1-2 5.2-2.3 8-.7 2.8-1.6 5.9-1.3 8 .7 2.3 2.2 2.1 5.8.5 9l-5 9.5c-.7 1.3-2.1 1.4-2.7.2l-.8-1.8-.8 1.8c-.6 1.2-2 1.1-2.7-.2l-5-9.5c-1.6-3.2-1.8-6.8.5-9Z" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
              <path d="M15.5 17.2c1.1 1 2.5 1.5 4.5 1.5s3.4-.5 4.5-1.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>Smile<span className="brand-accent">Book</span></span>
          </Link>
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">{menuOpen ? '×' : '☰'}</span>
          </button>
          <nav id="primary-navigation" className={`nav-links${menuOpen ? ' open' : ''}`}>
            {user?.role === 'patient' && (<><Link to="/">Home</Link><Link to="/book">Book</Link><Link to="/my-appointments">My Appointments</Link><Link to="/#contact">Contact</Link></>)}
            {!user && (<><Link to="/">Home</Link><Link to="/#contact">Contact</Link></>)}
            {user ? <button className="link" onClick={logout}>{`Log out (${user.name.split(' ')[0]})`}</button>
                  : (<><Link to="/login">Log in</Link><Link to="/register">Sign up</Link></>)}
          </nav>
        </header>
        <main className="container">
          <Routes>
            <Route path="/" element={user?.role === 'admin' ? <Navigate to="/admin" /> : <Dentists />} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/register" element={<Auth mode="register" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/data-deletion" element={<DataDeletion />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/book" element={<Guard><Book /></Guard>} />
            <Route path="/my-appointments" element={<Guard><MyAppointments /></Guard>} />
            <Route path="/my" element={<Navigate to="/my-appointments" replace />} />
            <Route path="/myappointments" element={<Navigate to="/my-appointments" replace />} />
            <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </AuthCtx.Provider>
    </ToastProvider>
  )
}