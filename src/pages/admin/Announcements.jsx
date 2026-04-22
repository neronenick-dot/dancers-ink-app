import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Modal, ConfirmModal, useToast } from '../../components/ui/index'

const emptyForm = { title: '', body: '', type: 'info', target_all: true, published: true }

export default function AdminAnnouncements() {
  const { profile } = useAuth()
  const { toast, Toasts } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  function openAdd() { setForm(emptyForm); setEditId(null); setModal(true) }
  function openEdit(item) { setForm({ title: item.title, body: item.body || '', type: item.type || 'info', target_all: item.target_all, published: item.published }); setEditId(item.id); setModal(true) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, created_by: profile?.id }
    let error
    if (editId) {
      ({ error } = await supabase.from('announcements').update(payload).eq('id', editId))
    } else {
      ({ error } = await supabase.from('announcements').insert(payload))
    }
    if (error) { toast('Save failed', 'error') }
    else { toast(editId ? 'Updated' : 'Posted!', 'success'); setModal(false); await load() }
    setSaving(false)
  }

  async function handleDelete() {
    await supabase.from('announcements').delete().eq('id', deleteId)
    toast('Deleted', 'success')
    setItems(i => i.filter(x => x.id !== deleteId))
    setDeleteId(null)
  }

  const typeColor = { info: 'badge-teal', urgent: 'badge-red', event: 'badge-gold' }

  return (
    <div>
      <Toasts />
      {deleteId && <ConfirmModal title="Delete Announcement" message="This announcement will be permanently removed." danger onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
      {modal && (
        <Modal title={editId ? 'Edit Announcement' : 'New Announcement'} onClose={() => setModal(false)}>
          <form onSubmit={handleSave}>
            <div className="field">
              <label>Title *</label>
              <input value={form.title} onChange={set('title')} required placeholder="Announcement title" />
            </div>
            <div className="field">
              <label>Body</label>
              <textarea value={form.body} onChange={set('body')} placeholder="Optional details…" rows={4} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
              <div className="field">
                <label>Type</label>
                <select value={form.type} onChange={set('type')}>
                  <option value="info">Info</option>
                  <option value="urgent">Urgent</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div className="field">
                <label>Visibility</label>
                <select value={form.published ? 'published' : 'draft'} onChange={e => setForm(f => ({ ...f, published: e.target.value === 'published' }))}>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Post Announcement'}</button>
            </div>
          </form>
        </Modal>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem', fontWeight: 400, color: 'var(--charcoal)', marginBottom: '0.2rem' }}>Announcements</h1>
          <p style={{ color: 'var(--soft)', fontSize: '0.85rem' }}>Post updates visible to all families in the app.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> New Announcement</button>
      </div>

      {loading ? <div style={{ color: 'var(--soft)' }}>Loading…</div> : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📣</div>
          <h3>No announcements yet</h3>
          <p>Click "New Announcement" to post your first update.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map(item => (
            <div key={item.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--rule)', padding: '1.1rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--charcoal)' }}>{item.title}</span>
                  <span className={`badge ${typeColor[item.type] || 'badge-teal'}`}>{item.type}</span>
                  {!item.published && <span className="badge badge-gray">Draft</span>}
                </div>
                {item.body && <div style={{ fontSize: '0.82rem', color: 'var(--mid)', lineHeight: 1.6 }}>{item.body}</div>}
                <div style={{ fontSize: '0.65rem', color: 'var(--soft)', marginTop: '0.4rem' }}>
                  {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                <button className="btn btn-sm btn-secondary btn-icon" onClick={() => openEdit(item)}><Edit size={13} /></button>
                <button className="btn btn-sm btn-danger btn-icon" onClick={() => setDeleteId(item.id)}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
