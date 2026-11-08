import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { errMsg } from '../api'
import { useAuth } from '../authContext'
import { PASSWORD_RULES } from '../passwordRules'
import clinicInfo from '../clinicInfo'
import { useToast } from '../Toast'
import { getFacebookToken, getGoogleToken, preloadSocial, SocialCancelled, socialConfigured } from '../socialAuth'

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.29v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.29a12 12 0 0 0 0 10.78l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.29 6.61l4 3.1C6.23 6.87 8.88 4.76 12 4.76Z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path fill="#fff" d="M16.67 15.47 17.2 12h-3.33V9.75c0-.95.46-1.87 1.96-1.87h1.52V4.92s-1.38-.23-2.7-.23c-2.75 0-4.55 1.67-4.55 4.68V12H7.04v3.47h3.06V24a12.1 12.1 0 0 0 3.77 0v-8.53h2.8Z" />
    </svg>
  )
}

// "or" divider, terms line and the Google / Facebook buttons.
function SocialLogin({ onSelect, disabled }) {
  return (
    <div className="social-login">
      <div className="social-divider" role="separator"><span>or</span></div>
      <p className="social-terms">By continuing, you agree to SmileBook&apos;s <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.</p>
      <button type="button" className="social-btn" disabled={disabled} onClick={() => onSelect('google')}>
        <GoogleIcon /><span>Continue with Google</span>
      </button>
      <button type="button" className="social-btn" disabled={disabled} onClick={() => onSelect('facebook')}>
        <FacebookIcon /><span>Continue with Facebook</span>
      </button>
    </div>
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
  const { addToast } = useToast()
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

  // Load the Google / Facebook scripts early so their popups open instantly on click.
  useEffect(() => { preloadSocial() }, [])

  // Continue with Google / Facebook: get a token from the popup, let our backend check it, then log in.
  const socialLogin = async (provider) => {
    const name = provider === 'google' ? 'Google' : 'Facebook'
    if (!socialConfigured[provider]) {
      // While developing, say exactly what is missing. Visitors get the simple message.
      addToast('error', import.meta.env.DEV
        ? `${name} sign-in is not set up yet. Add your ${provider === 'google' ? 'Client ID' : 'App ID'} in src/socialAuth.js, or in frontend/.env, then restart npm run dev.`
        : `${name} sign-in is not available right now. Please use your email and password.`)
      return
    }
    setErr('')
    let token
    try {
      // no await before this line: the popup must open directly from the click
      token = await (provider === 'google' ? getGoogleToken() : getFacebookToken())
    } catch (x) {
      if (!(x instanceof SocialCancelled)) setErr(x.message)
      return
    }
    setBusy(true)
    try {
      const { data } = await api.post(`/auth/${provider}`, { access_token: token })
      login(data)
    } catch (x) {
      setErr(errMsg(x))
    }
    setBusy(false)
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
        <SocialLogin onSelect={socialLogin} disabled={busy} />
        <p className="muted">{isReg ? <>Already have an account? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Sign up</Link></>}</p>
      </form>
    </AuthShell>
  )
}