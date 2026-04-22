import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Mail, Phone, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/ui/index'

export default function UserProfile() {
  const { profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { toast, Toasts } = useToast()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '' })
  const [saving, setSaving] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function saveProfile() {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      updated_at: new Date().toISOString()
    }).eq('id', profile.id)
    if (error) {
      toast('Failed to save changes', 'error')
    } else {
      await refreshProfile()
      setEditing(false)
      toast('Profile updated', 'success')
    }
    setSaving(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div>
      <Toasts />
      <div className="page-header" style={{ paddingTop: 'max(1rem, var(--safe-top))' }}>
        <div className="page-header-title">My Profile</div>
        <button
          className={`btn btn-sm ${editing ? 'btn-primary' : 'btn-secondary'}`}
          onClick={editing ? saveProfile : () => setEditing(true)}
          disabled={saving}
        >
          {editing ? (saving ? 'Saving…' : 'Save') : 'Edit'}
        </button>
      </div>

      <div className="page-body">
        {/* Avatar area */}
        <div style={{ textAlign: 'center', padding: '1.5rem 0 0.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--teal-dark), var(--teal))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', fontWeight: 700, color: 'white',
            margin: '0 auto 0.75rem'
          }}>
            {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.35rem', color: 'var(--charcoal)' }}>
            {profile?.full_name || 'Studio Member'}
          </div>
          <div className="badge badge-teal" style={{ marginTop: '0.4rem' }}>
            {profile?.role === 'admin' ? '⚙ Admin' : '👨‍👩‍👧 Parent'}
          </div>
        </div>

        {/* Fields */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {editing ? (
            <div style={{ padding: '1.1rem' }}>
              <div className="field">
                <label>Full name</label>
                <input type="text" value={form.full_name} onChange={set('full_name')} placeholder="Your name" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Phone number</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="(555) 000-0000" />
              </div>
            </div>
          ) : (
            <>
              <div className="list-item">
                <div className="list-item-icon"><User size={16} /></div>
                <div className="list-item-body">
                  <div className="list-item-sub">Name</div>
                  <div className="list-item-title">{profile?.full_name || '—'}</div>
                </div>
              </div>
              <div className="list-item">
                <div className="list-item-icon"><Mail size={16} /></div>
                <div className="list-item-body">
                  <div className="list-item-sub">Email</div>
                  <div className="list-item-title">{profile?.email || '—'}</div>
                </div>
              </div>
              <div className="list-item">
                <div className="list-item-icon"><Phone size={16} /></div>
                <div className="list-item-body">
                  <div className="list-item-sub">Phone</div>
                  <div className="list-item-title">{profile?.phone || 'Not set'}</div>
                </div>
              </div>
              <div className="list-item">
                <div className="list-item-icon"><Shield size={16} /></div>
                <div className="list-item-body">
                  <div className="list-item-sub">Role</div>
                  <div className="list-item-title" style={{ textTransform: 'capitalize' }}>{profile?.role || 'parent'}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {editing && (
          <button className="btn btn-secondary btn-full" onClick={() => setEditing(false)}>Cancel</button>
        )}

        {/* External resources */}
        <div>
          <div className="section-label">Resources</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {[
              { label: 'Spring 2026 Schedule', href: 'https://www.dancersinkaz.com/spring.html', icon: '📅' },
              { label: 'Book Free Trial Class', href: 'https://docs.google.com/forms/d/e/1FAIpQLSdkiT4WP-Og-oTAKJqfmkITbDmqqSBki2beFeC8IhP5JXkCDg/viewform', icon: '🎉' },
              { label: 'Registration Form', href: 'https://docs.google.com/forms/d/e/1FAIpQLSczfDA3EwvSMz5UNRctDryC3AAv2D3RMzo3w7pGra8-UC_TyQ/viewform', icon: '📝' },
            ].map(r => (
              <a key={r.label} href={r.href} target="_blank" rel="noreferrer" className="list-item" style={{ textDecoration: 'none', display: 'flex' }}>
                <div className="list-item-icon">{r.icon}</div>
                <div className="list-item-body"><div className="list-item-title">{r.label}</div></div>
                <span style={{ color: 'var(--teal)', fontSize: '0.8rem' }}>→</span>
              </a>
            ))}
          </div>
        </div>

        <button className="btn btn-danger btn-full" onClick={handleSignOut}>
          <LogOut size={16} /> Sign Out
        </button>

        <div style={{ height: '0.5rem' }} />
      </div>
    </div>
  )
}
