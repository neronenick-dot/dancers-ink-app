import { useEffect, useState } from 'react'
import { Play, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Spinner } from '../../components/ui/index'

const typeIcon = { video: '🎬', audio: '🎵', image: '🖼', document: '📄' }

function MediaPlayer({ item, onClose }) {
  const isVideo = item.type === 'video'
  const isAudio = item.type === 'audio'
  const url = item.url || (item.storage_path
    ? supabase.storage.from('media').getPublicUrl(item.storage_path).data.publicUrl
    : null)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 'max(1.25rem, var(--safe-top))', right: '1.25rem', background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <X size={18} />
      </button>
      <div style={{ width: '100%', maxWidth: 560, padding: '0 1.25rem' }}>
        {isVideo && url && (
          <video src={url} controls autoPlay playsInline style={{ width: '100%', borderRadius: 12 }} />
        )}
        {isAudio && url && (
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: '2rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎵</div>
            <div style={{ color: 'white', fontWeight: 700, marginBottom: '0.35rem' }}>{item.title}</div>
            <audio src={url} controls autoPlay style={{ width: '100%', marginTop: '1rem' }} />
          </div>
        )}
        {!isVideo && !isAudio && url && (
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{typeIcon[item.type] || '📄'}</div>
            <div style={{ color: 'white', fontWeight: 700, marginBottom: '1rem' }}>{item.title}</div>
            <a href={url} target="_blank" rel="noreferrer" className="btn btn-secondary">Open File</a>
          </div>
        )}
        {!url && (
          <div style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '2rem' }}>
            No media URL configured for this item.
          </div>
        )}
        <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '1rem', fontSize: '0.82rem' }}>{item.title}</div>
      </div>
    </div>
  )
}

export default function UserMedia() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('media_items')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const types = ['all', ...new Set(items.map(i => i.type).filter(Boolean))]
  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter)

  return (
    <div>
      {playing && <MediaPlayer item={playing} onClose={() => setPlaying(null)} />}

      <div className="page-header" style={{ paddingTop: 'max(1rem, var(--safe-top))' }}>
        <div className="page-header-title">Media</div>
      </div>

      {/* Filter tabs */}
      <div style={{ padding: '0.75rem 1.25rem 0', display: 'flex', gap: '0.5rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`badge ${filter === t ? 'badge-teal' : 'badge-gray'}`}
            style={{ cursor: 'pointer', border: 'none', whiteSpace: 'nowrap', padding: '0.32rem 0.85rem', fontSize: '0.7rem', textTransform: 'capitalize' }}
          >
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      <div className="page-body" style={{ paddingTop: '0.85rem' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}><Spinner size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎬</div>
            <h3>No media yet</h3>
            <p>Videos, audio, and documents will appear here when they're added by the studio.</p>
          </div>
        ) : (
          <div className="media-grid">
            {filtered.map(item => {
              const thumbUrl = item.thumbnail_url || null
              return (
                <div key={item.id} className="media-card" onClick={() => setPlaying(item)}>
                  <div className="media-thumb">
                    {thumbUrl ? <img src={thumbUrl} alt={item.title} /> : (
                      <span style={{ fontSize: '2rem' }}>{typeIcon[item.type] || '📄'}</span>
                    )}
                    {(item.type === 'video' || item.type === 'audio') && (
                      <div className="media-play-icon"><Play size={14} fill="white" /></div>
                    )}
                  </div>
                  <div className="media-card-body">
                    <div className="media-card-title">{item.title}</div>
                    {item.description && <div className="media-card-meta">{item.description}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div style={{ height: '0.5rem' }} />
      </div>
    </div>
  )
}
