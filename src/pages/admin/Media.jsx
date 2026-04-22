import { useEffect, useState, useRef } from 'react'
import { Plus, Edit, Trash2, Upload, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { Modal, ConfirmModal, useToast } from '../../components/ui/index'

const emptyForm = { title: '', description: '', type: 'video', url: '', thumbnail_url: '', is_public: true, class_id: '' }
const TYPES = ['video', 'audio', 'image', 'document']

export default function AdminMedia() {
  const { profile } = useAuth()
  const { toast, Toasts } = useToast()
  const [items, setItems] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const fileRef = useRef()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  useEffect(() => {
    load()
    supabase.from('classes').select('id, name').eq('is_active', true).then(({ data }) => setClasses(data || []))
  }, [])

  async function load() {
    const { data } = await supabase.from('media_items').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  function openAdd() { setForm(emptyForm); setEditId(null); setModal(true) }
  function openEdit(item) {
    setForm({ title: item.title, description: item.description || '', type: item.type || 'video', url: item.url || '', thumbnail_url: item.thumbnail_url || '', is_public: item.is_public, class_id: item.class_id || '' })
    setEditId(item.id); setModal(true)
  }

  async function handleFileUpload(file) {
    if (!file) return
    setUploadProgress(0)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error, data } = await supabase.storage.from('media').upload(path, file, { upsert: false })
    if (error) { toast('Upload failed: ' + error.message, 'error'); setUploadProgress(null); return }
    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
    setForm(f => ({ ...f, url: publicUrl, storage_path: path }))
    setUploadProgress(100)
    toast('File uploaded!', 'success')
    setTimeout(() => setUploadProgress(null), 1200)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, class_id: form.class_id || null, created_by: profile?.id }
    let error
    if (editId) {
      ({ error } = await supabase.from('media_items').update(payload).eq('id', editId))
    } else {
      ({ error } = await supabase.from('media_items').insert(payload))
    }
    if (error) { toast('Save failed', 'error') }
    else { toast(editId ? 'Updated' : 'Added!', 'success'); setModal(false); await load() }
    setSaving(false)
  }

  async function handleDelete() {
    const item = items.find(i => i.id === deleteId)
    if (item?.storage_path) await supabase.storage.from('media').remove([item.storage_path])
    await supabase.from('media_items').delete().eq('id', deleteId)
    toast('Deleted', 'success')
    setItems(i => i.filter(x => x.id !== deleteId))
    setDeleteId(null)
  }

  const typeIcon = { video: '🎬', audio: '🎵', image: '🖼', document: '📄' }

  return (
    <div>
      <Toasts />
      {deleteId && <ConfirmModal title="Delete Media" message="This will permanently delete the file." danger onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
      {modal && (
        <Modal title={editId ? 'Edit Media Item' : 'Add Media'} onClose={() => setModal(false)}>
          <form onSubmit={handleSave}>
            <div className="field">
              <label>Title *</label>
              <input value={form.title} onChange={set('title')} required placeholder="Media title" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
              <div className="field">
                <label>Type</label>
                <select value={form.type} onChange={set('type')}>
                  {TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Class (optional)</label>
                <select value={form.class_id} onChange={set('class_id')}>
                  <option value="">All classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* File upload */}
            <div className="field">
              <label>Upload file to Supabase Storage</label>
              <input type="file" ref={fileRef} onChange={e => handleFileUpload(e.target.files[0])} accept="video/*,audio/*,image/*,.pdf,.doc,.docx" style={{ background: 'var(--cream)', border: '1.5px dashed var(--rule)', borderRadius: 8, padding: '0.6rem' }} />
              {uploadProgress !== null && <div style={{ fontSize: '0.72rem', color: 'var(--teal)', marginTop: '0.3rem' }}>Uploading… {uploadProgress === 100 ? '✓ Done' : `${uploadProgress}%`}</div>}
            </div>

            <div className="divider-label">or link to external URL</div>

            <div className="field">
              <label>File URL</label>
              <input value={form.url} onChange={set('url')} placeholder="https://…" type="url" />
            </div>
            <div className="field">
              <label>Thumbnail URL (optional)</label>
              <input value={form.thumbnail_url} onChange={set('thumbnail_url')} placeholder="https://… (image preview)" type="url" />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea value={form.description} onChange={set('description')} placeholder="Optional description…" rows={2} />
            </div>
            <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.6rem' }}>
              <input type="checkbox" id="is_public" checked={form.is_public} onChange={set('is_public')} style={{ width: 'auto' }} />
              <label htmlFor="is_public" style={{ marginBottom: 0 }}>Visible to all users</label>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem', fontWeight: 400, color: 'var(--charcoal)', marginBottom: '0.2rem' }}>Media</h1>
          <p style={{ color: 'var(--soft)', fontSize: '0.85rem' }}>{items.length} items · Supabase Storage (1GB free tier)</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Media</button>
      </div>

      {loading ? <div style={{ color: 'var(--soft)' }}>Loading…</div> : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎬</div>
          <h3>No media yet</h3>
          <p>Upload videos, audio, and documents for your families.</p>
        </div>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Item</th><th>Type</th><th>Visibility</th><th>Added</th><th></th></tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>{typeIcon[item.type] || '📄'}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.title}</div>
                        {item.description && <div style={{ fontSize: '0.72rem', color: 'var(--soft)' }}>{item.description}</div>}
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{item.type}</span></td>
                  <td><span className={`badge ${item.is_public ? 'badge-green' : 'badge-gray'}`}>{item.is_public ? 'Public' : 'Hidden'}</span></td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--soft)' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary btn-icon" title="Open"><ExternalLink size={13} /></a>}
                      <button className="btn btn-sm btn-secondary btn-icon" onClick={() => openEdit(item)}><Edit size={13} /></button>
                      <button className="btn btn-sm btn-danger btn-icon" onClick={() => setDeleteId(item.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
