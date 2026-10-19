import { createContext, useContext, useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import api from './api'
import Auth from './pages/Auth'
import ForgotPassword from './pages/ForgotPassword'
import Dentists from './pages/Dentists'
import Book from './pages/Book'
import MyAppointments from './pages/MyAppointments'
import Admin from './pages/Admin'
import { ToastProvider } from './Toast'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

function Guard({ children, admin }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="center">Loading...</p>
  if (!user) return <Navigate to="/login" replace />
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!localStorage.getItem('token'))
  const [loggingOut, setLoggingOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const nav = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!localStorage.getItem('token')) return
    api.get('/me').then((r) => setUser(r.data)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false))
  }, [])

  const login = (data) => {
    localStorage.setItem('token', data.token)
    setUser(data.user)
    nav(data.user.role === 'admin' ? '/admin' : '/')
  }
  const logout = async () => {
    setMenuOpen(false)
    setLoggingOut(true)
    try {
      await api.post('/logout')
    } catch {
      // Clear the local session even if the API is unavailable.
    } finally {
      localStorage.removeItem('token')
      setUser(null)
      nav('/login')
      setLoggingOut(false)
    }
  }

  return (
    <ToastProvider>
      <AuthCtx.Provider value={{ user, loading, login, logout }}>
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
            {user?.role === 'patient' && (<><Link to="/">Home</Link><Link to="/book">Book</Link><Link to="/my">My Appointments</Link><Link to="/#contact">Contact</Link></>)}
            {!user && (<><Link to="/">Home</Link><Link to="/#contact">Contact</Link></>)}
            {user ? <button className="link" onClick={logout} disabled={loggingOut}>{loggingOut ? 'Logging out...' : `Log out (${user.name.split(' ')[0]})`}</button>
                  : (<><Link to="/login">Log in</Link><Link to="/register">Sign up</Link></>)}
          </nav>
        </header>
        <main className="container">
          <Routes>
            <Route path="/" element={user?.role === 'admin' ? <Navigate to="/admin" /> : <Dentists />} />
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/register" element={<Auth mode="register" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/book" element={<Guard><Book /></Guard>} />
            <Route path="/my" element={<Guard><MyAppointments /></Guard>} />
            <Route path="/admin" element={<Guard admin><Admin /></Guard>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </AuthCtx.Provider>
    </ToastProvider>
  )
}
