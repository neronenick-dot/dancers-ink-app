import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { isConfigured } from '../../lib/supabase'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(form.email.trim(), form.password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Sign in failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🩰</div>
          <div className="auth-logo-name">Dancers Ink</div>
          <div className="auth-logo-sub">Mesa, AZ · Ages 2.5–17</div>
        </div>

        {!isConfigured && (
          <div style={{
            background: '#fff8e6', border: '1.5px solid #e8c06a', borderRadius: 10,
            padding: '0.9rem 1rem', marginBottom: '1.25rem', fontSize: '0.78rem',
            color: '#7a5a10', lineHeight: 1.65
          }}>
            <strong>⚙ Setup needed</strong><br />
            Copy <code style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 4, padding: '0 3px' }}>.env.example</code> to <code style={{ background: 'rgba(0,0,0,0.06)', borderRadius: 4, padding: '0 3px' }}>.env</code> and add your Supabase URL and anon key to connect the database.
            See <strong>CLAUDE.md</strong> for the full setup guide.
          </div>
        )}

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to access your studio dashboard.</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" required autoComplete="current-password" />
          </div>

          {error && <p className="field-error" style={{ marginBottom: '0.75rem' }}>{error}</p>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="divider-label" style={{ marginTop: '1.25rem' }}>don't have an account?</div>

        <Link to="/signup" className="btn btn-secondary btn-full" style={{ textAlign: 'center' }}>
          Create Account
        </Link>

        <p style={{ fontSize: '0.68rem', color: 'var(--soft)', textAlign: 'center', marginTop: '1.25rem', lineHeight: 1.6 }}>
          Demo admin: <strong>admin@dancersink.app</strong><br />
          Demo parent: <strong>parent@dancersink.app</strong><br />
          Password for both: <strong>demo1234</strong>
        </p>
      </div>
    </div>
  )
}
