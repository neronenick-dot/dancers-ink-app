import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Spinner } from '../../components/ui/index'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function UserHome() {
  const { profile } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [myClasses, setMyClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return }
    async function load() {
      const [ann, cls] = await Promise.all([
        supabase
          .from('announcements')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('user_classes')
          .select('class_id, classes(id, name, style, day_of_week, time_start)')
          .eq('user_id', profile.id)
          .limit(4)
      ])
      setAnnouncements(ann.data || [])
      setMyClasses((cls.data || []).map(r => r.classes).filter(Boolean))
      setLoading(false)
    }
    load()
  }, [profile?.id])

  const typeColor = { urgent: 'urgent', event: 'event', info: '' }
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ paddingTop: 'max(1rem, var(--safe-top))' }}>
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--soft)', marginBottom: '2px' }}>{getGreeting()}</div>
          <div className="page-header-title">{firstName} 👋</div>
        </div>
        <div className="page-header-actions">
          <div style={{ fontFamily: "'DM Serif Display', serif", fontStyle: 'italic', fontSize: '1rem', color: 'var(--teal-dark)', letterSpacing: '-0.01em' }}>
            Dancers Ink
          </div>
        </div>
      </div>

      <div className="page-body">
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
            <Spinner size={28} />
          </div>
        )}

        {/* Trial CTA if no classes */}
        {!loading && myClasses.length === 0 && (
          <div style={{
            background: 'linear-gradient(130deg, var(--teal-dark), var(--teal))',
            borderRadius: 'var(--radius-lg)',
            padding: '1.35rem',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.35rem' }}>Spring 2026</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.35rem', fontStyle: 'italic', marginBottom: '0.35rem' }}>Your first class is free.</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.72, marginBottom: '1rem', lineHeight: 1.5 }}>No commitment. Just come dance and see if you love it.</div>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSdkiT4WP-Og-oTAKJqfmkITbDmqqSBki2beFeC8IhP5JXkCDg/viewform"
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm"
              style={{ background: 'white', color: 'var(--teal-dark)', fontWeight: 700, borderRadius: 8 }}
            >
              Book Free Trial →
            </a>
          </div>
        )}

        {/* My Classes summary */}
        {myClasses.length > 0 && (
          <div>
            <div className="flex justify-between items-center" style={{ marginBottom: '0.75rem' }}>
              <div className="section-label">My Classes</div>
              <Link to="/app/classes" style={{ fontSize: '0.76rem', color: 'var(--teal)', fontWeight: 600, textDecoration: 'none' }}>View all →</Link>
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {myClasses.map(cls => (
                <div key={cls.id} className="list-item">
                  <div className="list-item-icon">🩰</div>
                  <div className="list-item-body">
                    <div className="list-item-title">{cls.name}</div>
                    <div className="list-item-sub">{cls.day_of_week} · {cls.time_start}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <div className="section-label">Quick Access</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { label: 'Browse Classes', icon: '🩰', to: '/app/classes', sub: 'See all styles' },
              { label: 'Media Library', icon: '🎬', to: '/app/media', sub: 'Videos & audio' },
              { label: 'Ask Iris', icon: '💬', to: '/app/chat', sub: 'Studio assistant' },
              { label: 'Full Schedule', icon: '📅', href: 'https://www.dancersinkaz.com/spring.html', sub: 'Spring 2026' },
            ].map(item => (
              item.to ? (
                <Link key={item.label} to={item.to} className="card card-pad" style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{item.icon}</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--charcoal)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--soft)', marginTop: '1px' }}>{item.sub}</div>
                </Link>
              ) : (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="card card-pad" style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{item.icon}</div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--charcoal)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--soft)', marginTop: '1px' }}>{item.sub}</div>
                </a>
              )
            ))}
          </div>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div>
            <div className="section-label">Announcements</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {announcements.map(ann => (
                <div key={ann.id} className={`announce-card ${typeColor[ann.type] || ''}`}>
                  <div className="announce-title">{ann.title}</div>
                  {ann.body && <div className="announce-body">{ann.body}</div>}
                  <div className="announce-meta">{new Date(ann.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Studio info */}
        <div className="card card-pad" style={{ background: 'var(--cream-deep)' }}>
          <div style={{ fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--teal)', marginBottom: '0.5rem' }}>Studio Info</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--mid)', lineHeight: 1.75 }}>
            5233 E Southern Ave, Suite C-101<br />
            Mesa, AZ 85206<br />
            <a href="tel:4803223911" style={{ color: 'var(--teal)', textDecoration: 'none', fontWeight: 600 }}>(480) 322-3911</a>
          </div>
        </div>

        <div style={{ height: '0.5rem' }} />
      </div>
    </div>
  )
}
