import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, GraduationCap, Megaphone, Image, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/index'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, classes: 0, announcements: 0, media: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [users, classes, ann, media] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('announcements').select('id', { count: 'exact', head: true }).eq('published', true),
        supabase.from('media_items').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        users: users.count || 0,
        classes: classes.count || 0,
        announcements: ann.count || 0,
        media: media.count || 0,
      })
      const { data: recentAnn } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)
      setRecent(recentAnn || [])
      setLoading(false)
    }
    load()
  }, [])

  const statItems = [
    { label: 'Total Users', value: stats.users, icon: Users, to: '/admin/users', color: 'var(--teal)' },
    { label: 'Active Classes', value: stats.classes, icon: GraduationCap, to: '/admin/classes', color: '#7c6bbf' },
    { label: 'Announcements', value: stats.announcements, icon: Megaphone, to: '/admin/announcements', color: 'var(--gold)' },
    { label: 'Media Items', value: stats.media, icon: Image, to: '/admin/media', color: '#2d8a52' },
  ]

  return (
    <div>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem', color: 'var(--charcoal)', marginBottom: '0.3rem', fontWeight: 400 }}>
        Dashboard
      </h1>
      <p style={{ color: 'var(--soft)', fontSize: '0.85rem', marginBottom: '2rem' }}>Welcome back. Here's what's happening at Dancers Ink.</p>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statItems.map(s => {
          const Icon = s.icon
          return (
            <Link key={s.label} to={s.to} style={{ textDecoration: 'none' }}>
              <div className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow 0.18s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontFamily: "'DM Serif Display', serif", color: s.color, lineHeight: 1 }}>{loading ? '—' : s.value}</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--soft)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3 }}>{s.label}</div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent announcements */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)' }}>Recent Announcements</h2>
          <Link to="/admin/announcements" style={{ fontSize: '0.78rem', color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
        </div>
        {recent.length === 0 && !loading ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-icon">📣</div>
            <h3>No announcements yet</h3>
            <p style={{ marginBottom: '1rem' }}>Post your first announcement to reach all families.</p>
            <Link to="/admin/announcements" className="btn btn-primary btn-sm">Add Announcement</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {recent.map(ann => (
              <div key={ann.id} className={`announce-card ${ann.type === 'urgent' ? 'urgent' : ann.type === 'event' ? 'event' : ''}`}>
                <div className="announce-title">{ann.title}</div>
                {ann.body && <div className="announce-body">{ann.body}</div>}
                <div className="announce-meta">{new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.85rem' }}>Quick Actions</h2>
        <div className="data-table-wrap" style={{ overflow: 'hidden' }}>
          {[
            { label: 'Add a new class', sub: 'Set up styles, days, and pricing', to: '/admin/classes' },
            { label: 'Post an announcement', sub: 'Reach all families instantly', to: '/admin/announcements' },
            { label: 'Upload media', sub: 'Videos, audio, and documents', to: '/admin/media' },
            { label: 'Manage users', sub: 'View and update user roles', to: '/admin/users' },
            { label: 'App settings', sub: 'Configure chatbot and QR code', to: '/admin/settings' },
          ].map((item, i, arr) => (
            <Link key={item.label} to={item.to} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.9rem 1rem', borderBottom: i < arr.length - 1 ? '1px solid var(--rule)' : 'none', transition: 'background 0.15s' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--charcoal)' }}>{item.label}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--soft)', marginTop: 2 }}>{item.sub}</div>
              </div>
              <ChevronRight size={16} color="var(--soft)" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
