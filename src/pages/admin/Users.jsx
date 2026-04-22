import { useEffect, useState } from 'react'
import { Search, Shield, User } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/index'

export default function AdminUsers() {
  const { profile: me } = useAuth()
  const { toast, Toasts } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  async function setRole(userId, role) {
    const { error } = await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', userId)
    if (error) { toast('Failed to update role', 'error'); return }
    setUsers(u => u.map(x => x.id === userId ? { ...x, role } : x))
    toast(`Role updated to ${role}`, 'success')
  }

  const filtered = users.filter(u =>
    !search || [u.full_name, u.email, u.role].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <Toasts />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem', fontWeight: 400, color: 'var(--charcoal)', marginBottom: '0.2rem' }}>Users</h1>
          <p style={{ color: 'var(--soft)', fontSize: '0.85rem' }}>{users.length} total accounts</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.25rem', maxWidth: 320 }}>
        <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--soft)', pointerEvents: 'none' }} />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users…"
          style={{ width: '100%', fontFamily: 'inherit', fontSize: '0.85rem', border: '1.5px solid var(--rule)', borderRadius: 8, padding: '0.6rem 0.9rem 0.6rem 2.2rem', outline: 'none', background: 'var(--cream)' }}
        />
      </div>

      {loading ? (
        <div style={{ color: 'var(--soft)', padding: '2rem 0' }}>Loading…</div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name / Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Change Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.full_name || '(No name)'}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--soft)' }}>{u.email}</div>
                  </td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-red' : 'badge-teal'}`}>
                      {u.role || 'parent'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--soft)', fontSize: '0.78rem' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {u.id === me?.id ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--soft)' }}>You</span>
                    ) : (
                      <select
                        value={u.role || 'parent'}
                        onChange={e => setRole(u.id, e.target.value)}
                        style={{ fontFamily: 'inherit', fontSize: '0.78rem', border: '1.5px solid var(--rule)', borderRadius: 6, padding: '0.3rem 0.6rem', background: 'var(--cream)', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="parent">Parent</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--soft)', padding: '2rem' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
