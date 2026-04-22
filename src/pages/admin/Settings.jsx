import { useEffect, useState } from 'react'
import { Save, QrCode, MessageSquare, Globe, Bell } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../components/ui/index'

export default function AdminSettings() {
  const { toast, Toasts } = useToast()
  const [chatbot, setChatbot] = useState(null)
  const [appUrl, setAppUrl] = useState(window.location.origin)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('chatbot_settings').select('*').single().then(({ data }) => {
      setChatbot(data || { enabled: false, welcome_message: "Hey! I'm Iris 🩰 Ask me anything about Dancers Ink!", quick_replies: [], system_prompt: '' })
      setLoading(false)
    })
  }, [])

  function setChat(k) { return e => setChatbot(c => ({ ...c, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })) }

  async function saveChatbot(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('chatbot_settings').upsert({ ...chatbot, id: 1, updated_at: new Date().toISOString() })
    if (error) toast('Save failed', 'error')
    else toast('Chatbot settings saved', 'success')
    setSaving(false)
  }

  const qrUrl = `https://api.qr-server.com/v1/create-qr-code/?data=${encodeURIComponent(appUrl)}&size=280x280&color=1f5858&bgcolor=ffffff&qzone=2`

  if (loading) return <div style={{ color: 'var(--soft)', padding: '2rem' }}>Loading…</div>

  return (
    <div style={{ maxWidth: 720 }}>
      <Toasts />
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem', fontWeight: 400, color: 'var(--charcoal)', marginBottom: '0.3rem' }}>Settings</h1>
      <p style={{ color: 'var(--soft)', fontSize: '0.85rem', marginBottom: '2rem' }}>Configure your app, chatbot, and sharing options.</p>

      {/* QR Code section */}
      <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <QrCode size={18} color="var(--teal)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)' }}>QR Code & Sharing</h2>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--mid)', marginBottom: '1rem', lineHeight: 1.6 }}>
          Share this QR code with families so they can scan and install the app. Print it on flyers, sign-in sheets, or studio windows.
        </p>
        <div className="field">
          <label>App URL (your live deployment URL)</label>
          <input value={appUrl} onChange={e => setAppUrl(e.target.value)} placeholder="https://dancers-ink.pages.dev" />
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <img
            src={qrUrl}
            alt="QR Code"
            style={{ width: 140, height: 140, borderRadius: 12, border: '1px solid var(--rule)', background: 'white' }}
          />
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--mid)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              This QR code is generated free by qr-server.com.<br />
              Right-click → Save image to use on print materials.
            </p>
            <a href={qrUrl} download="dancers-ink-qr.png" className="btn btn-secondary btn-sm">
              Download QR Image
            </a>
          </div>
        </div>
      </div>

      {/* Chatbot settings */}
      <div className="card card-pad" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <MessageSquare size={18} color="var(--teal)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)' }}>Iris Chatbot Settings</h2>
        </div>
        <form onSubmit={saveChatbot}>
          <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <input type="checkbox" id="cb_enabled" checked={chatbot?.enabled || false} onChange={setChat('enabled')} style={{ width: 'auto' }} />
            <label htmlFor="cb_enabled" style={{ marginBottom: 0 }}>Chatbot enabled</label>
          </div>
          <div className="field">
            <label>Welcome message</label>
            <textarea value={chatbot?.welcome_message || ''} onChange={setChat('welcome_message')} rows={3} placeholder="Greeting shown when the chat opens…" />
          </div>
          <div className="field">
            <label>Quick reply chips (comma-separated)</label>
            <input
              value={Array.isArray(chatbot?.quick_replies) ? chatbot.quick_replies.join(', ') : ''}
              onChange={e => setChatbot(c => ({ ...c, quick_replies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              placeholder="What styles do you teach?, How do I enroll?, …"
            />
          </div>

          <div style={{ background: 'var(--cream-deep)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Globe size={14} color="var(--teal)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--charcoal)' }}>Future AI Integration</span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--mid)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              In v1, Iris uses pre-configured responses. To connect a real AI (Claude API, OpenAI, etc.), add your API key below. This field is stored for future wiring — no live AI calls are made yet.
            </p>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>AI Provider API Key (future use)</label>
              <input value={chatbot?.api_key || ''} onChange={setChat('api_key')} placeholder="sk-… (not yet active)" type="password" autoComplete="off" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save Chatbot Settings'}
          </button>
        </form>
      </div>

      {/* Push notifications placeholder */}
      <div className="card card-pad">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
          <Bell size={18} color="var(--gold)" />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)' }}>Push Notifications</h2>
          <span className="badge badge-gray">Future</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--mid)', lineHeight: 1.6 }}>
          Push notifications are structured but not active in v1. iOS background push requires either a paid web push service or native app distribution.
          In v1, announcements are delivered in-app when users open the app.
          To enable push later: wire up a free-tier service like <strong>Firebase Cloud Messaging</strong> (free, generous limits) and update the service worker.
        </p>
        <div style={{ marginTop: '0.85rem', padding: '0.75rem', background: 'var(--cream-deep)', borderRadius: 8 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--soft)', lineHeight: 1.7 }}>
            <strong>What stays free:</strong> FCM itself is free · Supabase Edge Functions can trigger FCM · No paid plan required<br />
            <strong>What costs money:</strong> OneSignal Pro, Pusher Channels, Courier — all have paid tiers at scale
          </div>
        </div>
      </div>
    </div>
  )
}
