import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Spinner, useToast } from '../../components/ui/index'

const styleIcons = {
  Ballet: '🩰', Tap: '👞', 'Hip Hop': '🎤', Lyrical: '🌊',
  Contemporary: '💫', Acro: '🤸', Tumbling: '⚡', default: '🎵'
}

export default function UserClasses() {
  const { profile } = useAuth()
  const { toast, Toasts } = useToast()
  const [classes, setClasses] = useState([])
  const [enrolled, setEnrolled] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  useEffect(() => {
    if (!profile?.id) { setLoading(false); return }
    async function load() {
      const [cls, uc] = await Promise.all([
        supabase.from('classes').select('*').eq('is_active', true).order('style').order('name'),
        supabase.from('user_classes').select('class_id').eq('user_id', profile.id)
      ])
      setClasses(cls.data || [])
      setEnrolled(new Set((uc.data || []).map(r => r.class_id)))
      setLoading(false)
    }
    load()
  }, [profile?.id])

  async function toggleClass(classId) {
    if (toggling) return
    setToggling(classId)
    const isIn = enrolled.has(classId)
    try {
      if (isIn) {
        await supabase.from('user_classes').delete().eq('user_id', profile.id).eq('class_id', classId)
        setEnrolled(s => { const n = new Set(s); n.delete(classId); return n })
        toast('Removed from your classes')
      } else {
        await supabase.from('user_classes').insert({ user_id: profile.id, class_id: classId })
        setEnrolled(s => new Set([...s, classId]))
        toast('Added to your classes ✓', 'success')
      }
    } catch {
      toast('Something went wrong', 'error')
    } finally {
      setToggling(null)
    }
  }

  const groupedByStyle = classes.reduce((acc, c) => {
    const key = c.style || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <div>
      <Toasts />
      <div className="page-header" style={{ paddingTop: 'max(1rem, var(--safe-top))' }}>
        <div>
          <div className="page-header-title">Classes</div>
          <div className="page-header-sub">Tap to add or remove from your schedule</div>
        </div>
        <div>
          <span className="badge badge-teal">{enrolled.size} enrolled</span>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><Spinner size={28} /></div>
        ) : classes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🩰</div>
            <h3>No classes yet</h3>
            <p>Classes will appear here once the admin adds them.</p>
          </div>
        ) : (
          Object.entries(groupedByStyle).map(([style, list]) => (
            <div key={style}>
              <div className="section-label">{style}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {list.map(cls => {
                  const isIn = enrolled.has(cls.id)
                  return (
                    <div
                      key={cls.id}
                      className={`class-card${isIn ? ' enrolled' : ''}`}
                      onClick={() => toggleClass(cls.id)}
                    >
                      <div className="class-card-icon" style={{ background: isIn ? 'rgba(46,140,140,0.12)' : 'var(--cream-deep)' }}>
                        {styleIcons[style] || styleIcons.default}
                      </div>
                      <div className="class-card-body">
                        <div className="class-card-name">{cls.name}</div>
                        <div className="class-card-meta">
                          {[cls.age_range, cls.day_of_week, cls.time_start && `${cls.time_start}–${cls.time_end}`]
                            .filter(Boolean).join(' · ')}
                        </div>
                        {cls.price_monthly && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--teal)', fontWeight: 600, marginTop: 2 }}>
                            ${cls.price_monthly}/mo
                          </div>
                        )}
                      </div>
                      <div className="class-card-check">
                        {toggling === cls.id
                          ? <Spinner size={12} />
                          : isIn ? <Check size={12} /> : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        <div style={{ paddingTop: '0.5rem' }}>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSczfDA3EwvSMz5UNRctDryC3AAv2D3RMzo3w7pGra8-UC_TyQ/viewform"
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost btn-full"
          >
            Register for Spring 2026 →
          </a>
        </div>

        <div style={{ height: '0.5rem' }} />
      </div>
    </div>
  )
}
