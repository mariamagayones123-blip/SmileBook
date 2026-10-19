import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { errMsg } from '../api'
import { useToast } from '../Toast'
import { AuthShell, PasswordInput } from './Auth'

export default function ForgotPassword() {
  const nav = useNavigate()
  const { addToast } = useToast()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const requestCode = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const { data } = await api.post('/forgot-password', { email })
      setInfo(data.message)
      setStep('reset')
    } catch (x) {
      setErr(errMsg(x))
    }
    setBusy(false)
  }

  const resetPassword = async (e) => {
    e.preventDefault()
    if (password !== passwordConfirmation) {
      setErr('Passwords do not match.')
      return
    }
    setErr('')
    setBusy(true)
    try {
      const { data } = await api.post('/reset-password', {
        email,
        otp,
        password,
        password_confirmation: passwordConfirmation,
      })
      addToast('success', data.message)
      nav('/login')
    } catch (x) {
      setErr(errMsg(x))
    }
    setBusy(false)
  }

  return (
    <AuthShell>
      <form className="auth-card" onSubmit={step === 'email' ? requestCode : resetPassword}>
        <ol className="auth-steps" aria-label="Progress">
          <li className={step === 'email' ? 'active' : ''}>1. Email</li>
          <li className={step === 'reset' ? 'active' : ''}>2. Code &amp; password</li>
        </ol>
        <span className="eyebrow">Account help</span>
        <h2>Forgot password</h2>
        <p className="auth-lead">
          {step === 'email'
            ? 'Enter the Gmail address you used to create your account. We will send a 6-digit code there.'
            : `Enter the code sent to ${email}, then choose a new password.`}
        </p>
        {err && <p className="error" role="alert">{err}</p>}
        {info && <p className="auth-info" role="status">{info}</p>}
        {step === 'email' ? (
          <label>Email address
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" required />
          </label>
        ) : (
          <>
            <label>6-digit code
              <input
                className="otp-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                required
                minLength={6}
                maxLength={6}
              />
            </label>
            <label>New password
              <PasswordInput
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a new password (min. 6 characters)"
                required
                minLength={6}
              />
            </label>
            <label>Confirm new password
              <PasswordInput
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Re-enter your password"
                required
                minLength={6}
              />
            </label>
          </>
        )}
        <button className="btn" disabled={busy}>
          {busy ? 'Please wait...' : step === 'email' ? 'Send code to Gmail' : 'Update password'}
        </button>
        {step === 'reset' && (
          <button type="button" className="btn ghost auth-secondary" disabled={busy} onClick={requestCode}>
            Resend code
          </button>
        )}
        <p className="muted"><Link to="/login">Back to log in</Link></p>
      </form>
    </AuthShell>
  )
}
