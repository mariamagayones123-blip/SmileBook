import { useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errMsg } from '../api'
import { useAuth } from '../App'
import clinicInfo from '../clinicInfo'

function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {off ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-4.4" />
          <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c7 0 10 7 10 7a18.5 18.5 0 0 1-3.2 4.4" />
          <path d="M6.6 6.6C3.8 8.5 2 12 2 12s3 7 10 7a10.4 10.4 0 0 0 4.1-.8" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )
}

export function WarnIcon({ className = '' }) {
  return (
    <svg className={'warn-icon ' + className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5 2.5 20h19L12 3.5Z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </svg>
  )
}

function FieldError({ id, message }) {
  if (!message) return null
  return <small id={id} className="field-msg" role="alert"><WarnIcon />{message}</small>
}

export function PasswordInput({ value, onChange, onBlur, autoComplete, required, minLength, placeholder, describedBy, invalid }) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        aria-describedby={describedBy}
        aria-invalid={invalid}
      />
      {invalid && <WarnIcon className="input-warn pw" />}
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((open) => !open)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        <EyeIcon off={visible} />
      </button>
    </span>
  )
}

export function AuthShell({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-intro">
        <span className="eyebrow">A brighter smile starts here</span>
        <h1>{clinicInfo.name}</h1>
        <p className="hero-tagline">{clinicInfo.tagline}</p>
        <p className="auth-intro-copy">Book appointments, review our services, and stay connected with the clinic — all in one calm, simple place.</p>
        <div className="auth-art" aria-hidden="true">
          <div className="hero-art-orbit orbit-one" />
          <div className="hero-art-orbit orbit-two" />
          <div className="hero-tooth">
            <svg viewBox="0 0 160 190" fill="none">
              <path d="M42 17c16-8 29 2 38 9 9-7 22-17 38-9 23 11 27 35 20 65-6 25-16 51-25 75-5 14-16 14-22 1l-11-28-11 28c-6 13-17 13-22-1-9-24-19-50-25-75-7-30-3-54 20-65Z" fill="white" />
              <path d="M56 54c7 5 15 7 24 7s17-2 24-7" stroke="#8CCFC2" strokeWidth="7" strokeLinecap="round" />
              <path d="M60 70c6 4 13 6 20 6s14-2 20-6" stroke="#D8F0EA" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

// Password rules shown as a live checklist on the sign-up page.
export const PASSWORD_RULES = [
  { id: 'len', label: 'At least 6 characters', test: (v) => v.length >= 6 },
  { id: 'upper', label: 'Uppercase letter (A–Z)', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Lowercase letter (a–z)', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'Number (0–9)', test: (v) => /[0-9]/.test(v) },
  { id: 'special', label: 'Special character (@ # !)', test: (v) => /[^A-Za-z0-9\s]/.test(v) },
]

// Live checklist of the password rules. Used on sign-up and on the forgot-password page.
export function PasswordChecklist({ id = 'password-hint', value, touched = false }) {
  return (
    <ul id={id} className="pw-rules" aria-live="polite">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value)
        return (
          <li key={r.id} className={'pw-rule' + (ok ? ' met' : touched ? ' bad' : '')}>
            <span className="rule-icon" aria-hidden="true">
              {ok
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="7" /></svg>}
            </span>
            <span className="rule-text">{r.label}<span className="sr-only">{ok ? ' (done)' : ' (not yet)'}</span></span>
          </li>
        )
      })}
    </ul>
  )
}

// Sign-up needs a complete Gmail address (example: juan@gmail.com)
const GMAIL_RE = /^[A-Za-z0-9._%+-]+@gmail\.com$/i

export default function Auth({ mode }) {
  const { login } = useAuth()
  const isReg = mode === 'register'
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [fieldErr, setFieldErr] = useState({ name: '', phone: '', password: '', confirm: '' })
  const [touched, setTouched] = useState({ name: false, phone: false, password: false, confirm: false })

  const MSG = {
    name: 'Name must not contain numbers.',
    phone: 'Please enter a valid mobile number.',
    password: 'Password must be at least 6 characters long.',
    passwordRules: 'Password must include an uppercase letter, a lowercase letter, a number, and a special character.',
  }
  // Each validator returns an error message, or '' when the value is fine.
  const validators = {
    name: (v) => {
      if (/\d/.test(v)) return MSG.name
      if (!v.trim()) return 'Please enter your full name.'
      if (!/^[\p{L}\s'-]+$/u.test(v) || !/\p{L}/u.test(v)) return 'Name can only contain letters, spaces, hyphens, and apostrophes.'
      return ''
    },
    phone: (v) => (/^09\d{9}$/.test(v) ? '' : MSG.phone), // PH mobile format: 11 digits starting with 09
    password: (v) => {
      if (v.length < 6) return MSG.password
      return PASSWORD_RULES.every((r) => r.test(v)) ? '' : MSG.passwordRules
    },
  }
  const checkConfirm = (confirm, password) => {
    if (!confirm) return 'Please confirm your password.'
    return confirm === password ? '' : 'Passwords do not match.'
  }
  const setErrFor = (k, msg) => setFieldErr((cur) => ({ ...cur, [k]: msg }))

  // Name: letters, spaces, hyphens and apostrophes only. Mobile: digits only (max 11).
  const clean = {
    name: (v) => v.replace(/[’‘]/g, "'").replace(/[^\p{L}\s'-]/gu, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' '),
    phone: (v) => v.replace(/\D/g, '').slice(0, 11),
  }
  const set = (k) => (e) => {
    const raw = e.target.value
    const value = clean[k] ? clean[k](raw) : raw
    setF({ ...f, [k]: value })
    if (!isReg) return

    if (k === 'password_confirmation') {
      // live match check: stay quiet while the user is still typing a shorter value
      if (value === f.password) setErrFor('confirm', '')
      else if (touched.confirm || value.length >= f.password.length) setErrFor('confirm', checkConfirm(value, f.password))
      else setErrFor('confirm', '')
      return
    }
    if (!validators[k]) return

    if (k === 'password' && f.password_confirmation) {
      setErrFor('confirm', f.password_confirmation === value ? '' : 'Passwords do not match.')
    }
    if (k === 'name' && /\d/.test(raw)) {
      setErrFor('name', MSG.name) // the digit is blocked, but tell the user why
    } else if (k === 'phone' && (/\D/.test(raw) || raw.length > 11)) {
      setErrFor('phone', MSG.phone) // a letter or symbol was blocked
    } else if (touched[k] || fieldErr[k] || (k === 'phone' && value.length === 11)) {
      setErrFor(k, validators[k](value)) // real-time check; clears once the input is corrected
    }
  }
  const blur = (k) => () => {
    if (!isReg) return
    if (k === 'password_confirmation') {
      setTouched((t) => ({ ...t, confirm: true }))
      setErrFor('confirm', checkConfirm(f.password_confirmation, f.password))
      return
    }
    if (!validators[k]) return
    setTouched((t) => ({ ...t, [k]: true }))
    setErrFor(k, validators[k](f[k]))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (isReg) {
      const next = {
        name: validators.name(f.name),
        phone: validators.phone(f.phone),
        password: validators.password(f.password),
        confirm: checkConfirm(f.password_confirmation, f.password),
      }
      const emailErr = GMAIL_RE.test(f.email.trim()) ? '' : 'Please use a complete Gmail address, like yourname@gmail.com.'
      setFieldErr(next)
      setErr(emailErr)
      setTouched({ name: true, phone: true, password: true, confirm: true })
      if (Object.values(next).some(Boolean) || emailErr) {
        // focus the first invalid field once React has re-rendered
        setTimeout(() => document.querySelector('.auth-card [aria-invalid="true"]')?.focus(), 0)
        return
      }
    }
    setErr(''); setBusy(true)
    try {
      const { data } = await api.post(isReg ? '/register' : '/login', { ...f, email: f.email.trim().toLowerCase() })
      login(data)
    } catch (x) {
      // The server validates too: show its messages next to the matching fields.
      const errors = x.response?.data?.errors
      if (isReg && errors) {
        const mine = {}
        const rest = []
        Object.entries(errors).forEach(([k, msgs]) => {
          if (k in validators) mine[k] = msgs[0]
          else rest.push(...msgs)
        })
        setFieldErr((cur) => ({ ...cur, ...mine }))
        setErr(rest.join(' '))
      } else setErr(errMsg(x))
    }
    setBusy(false)
  }

  return (
    <AuthShell>
      <form className="auth-card" onSubmit={submit} noValidate={isReg}>
        <span className="eyebrow">{isReg ? 'Join SmileBook' : 'Welcome back'}</span>
        <h2>{isReg ? 'Create your account' : 'Log in to continue'}</h2>
        <p className="auth-lead">{isReg ? 'Set up your patient profile to book care with our clinic team.' : 'Use the email and password for your SmileBook account.'}</p>
        {err && <p className="error">{err}</p>}
        {isReg && (<>
          <label>Full name
            <span className="input-wrap">
              <input
                autoComplete="name"
                value={f.name}
                onChange={set('name')}
                onBlur={blur('name')}
                placeholder="e.g. Jamie Santos"
                maxLength={100}
                aria-invalid={Boolean(fieldErr.name)}
                aria-describedby={fieldErr.name ? 'name-error' : undefined}
                required
              />
              {fieldErr.name && <WarnIcon className="input-warn" />}
            </span>
            <FieldError id="name-error" message={fieldErr.name} />
          </label>
          <label>Mobile number
            <span className="input-wrap">
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={f.phone}
                onChange={set('phone')}
                onBlur={blur('phone')}
                placeholder="e.g. 09171234567"
                maxLength={11}
                aria-invalid={Boolean(fieldErr.phone)}
                aria-describedby={fieldErr.phone ? 'phone-error' : undefined}
                required
              />
              {fieldErr.phone && <WarnIcon className="input-warn" />}
            </span>
            <FieldError id="phone-error" message={fieldErr.phone} />
          </label>
        </>)}
        <label>Email address<input type="email" autoComplete="email" value={f.email} onChange={set('email')} placeholder={isReg ? 'you@gmail.com' : 'you@example.com'} required /></label>
        <label>Password
          <PasswordInput
            autoComplete={isReg ? 'new-password' : 'current-password'}
            value={f.password}
            onChange={set('password')}
            onBlur={isReg ? blur('password') : undefined}
            required
            placeholder={isReg ? 'Create a password (min. 6 characters)' : 'Enter your password'}
            describedBy={isReg ? (fieldErr.password ? 'password-error password-hint' : 'password-hint') : undefined}
            invalid={isReg ? Boolean(fieldErr.password) : undefined}
          />
          {isReg && <FieldError id="password-error" message={fieldErr.password} />}
        </label>
        {isReg && <PasswordChecklist id="password-hint" value={f.password} touched={touched.password} />}
        {isReg && (
          <label>Confirm password
            <PasswordInput
              autoComplete="new-password"
              value={f.password_confirmation}
              onChange={set('password_confirmation')}
              onBlur={blur('password_confirmation')}
              placeholder="Re-enter your password"
              required
              describedBy={fieldErr.confirm ? 'confirm-error' : undefined}
              invalid={Boolean(fieldErr.confirm)}
            />
            <FieldError id="confirm-error" message={fieldErr.confirm} />
            {!fieldErr.confirm && f.password_confirmation && f.password_confirmation === f.password && (
              <small className="field-ok" role="status">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                Passwords match
              </small>
            )}
          </label>
        )}
        {!isReg && <p className="auth-forgot"><Link to="/forgot-password">Forgot password?</Link></p>}
        <button className="btn" disabled={busy}>{busy ? 'Please wait...' : isReg ? 'Sign up' : 'Log in'}</button>
        <p className="muted">{isReg ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Sign up</Link></>}</p>
      </form>
    </AuthShell>
  )
}
