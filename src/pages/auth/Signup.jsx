import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      const result = await signUp(form.email.trim(), form.password, form.fullName.trim())
      if (result?.session) {
        navigate('/app/home')
      } else {
        setEmailSent(true)
      }
    } catch (err) {
      setError(err.message || 'Sign up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📬</div>
          <h1 className="auth-title" style={{ marginBottom: '0.5rem' }}>Check your email</h1>
          <p className="auth-sub">
            We sent a confirmation link to <strong>{form.email}</strong>.
            Click it to activate your account and sign in.
          </p>
          <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: '1rem' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🩰</div>
          <div className="auth-logo-name">Dancers Ink</div>
          <div className="auth-logo-sub">Join our studio family</div>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Start with a free trial class — no commitment needed.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="fullName">Your name</label>
            <input id="fullName" type="text" value={form.fullName} onChange={set('fullName')} placeholder="Parent or guardian name" required autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" required autoComplete="new-password" />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" required autoComplete="new-password" />
          </div>

          {error && <p className="field-error" style={{ marginBottom: '0.75rem' }}>{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="divider-label" style={{ marginTop: '1.25rem' }}>already have an account?</div>

        <Link to="/login" className="btn btn-secondary btn-full" style={{ textAlign: 'center' }}>
          Sign In
        </Link>
      </div>
    </div>
  )
}
