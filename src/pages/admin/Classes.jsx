import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Modal, ConfirmModal, useToast } from '../../components/ui/index'

const emptyForm = { name: '', style: '', instructor: '', day_of_week: '', time_start: '', time_end: '', age_range: '', level: '', description: '', price_monthly: '', is_active: true }
const STYLES = ['Ballet', 'Tap', 'Hip Hop', 'Lyrical', 'Contemporary', 'Acro', 'Tumbling', 'Competition', 'Private']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function AdminClasses() {
  const { toast, Toasts } = useToast()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'add' | 'edit'
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('classes').select('*').order('style').order('name')
    setClasses(data || [])
    setLoading(false)
  }

  function openAdd() { setForm(emptyForm); setEditId(null); setModal('form') }
  function openEdit(cls) { setForm({ ...emptyForm, ...cls, price_monthly: cls.price_monthly?.toString() || '' }); setEditId(cls.id); setModal('form') }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const payload = { ...form, price_monthly: form.price_monthly ? parseFloat(form.price_monthly) : null }
    let error
    if (editId) {
      ({ error } = await supabase.from('classes').update(payload).eq('id', editId))
    } else {
      ({ error } = await supabase.from('classes').insert(payload))
    }
    if (error) { toast('Save failed: ' + error.message, 'error') }
    else { toast(editId ? 'Class updated' : 'Class added', 'success'); setModal(null); await load() }
    setSaving(false)
  }

  async function handleDelete() {
    const { error } = await supabase.from('classes').delete().eq('id', deleteId)
    if (error) { toast('Delete failed', 'error') }
    else { toast('Class deleted', 'success'); setClasses(c => c.filter(x => x.id !== deleteId)) }
    setDeleteId(null)
  }

  return (
    <div>
      <Toasts />
      {deleteId && <ConfirmModal title="Delete Class" message="This will remove the class and all enrollment records. This cannot be undone." danger onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
      {modal === 'form' && (
        <Modal title={editId ? 'Edit Class' : 'Add Class'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 0.75rem' }}>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label>Class name *</label>
                <input value={form.name} onChange={set('name')} required placeholder="e.g. Ballet Level 2" />
              </div>
              <div className="field">
                <label>Style</label>
                <select value={form.style} onChange={set('style')}>
                  <option value="">Select style</option>
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Instructor</label>
                <input value={form.instructor} onChange={set('instructor')} placeholder="Teacher name" />
              </div>
              <div className="field">
                <label>Day of week</label>
                <select value={form.day_of_week} onChange={set('day_of_week')}>
                  <option value="">Select day</option>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Age range</label>
                <input value={form.age_range} onChange={set('age_range')} placeholder="e.g. 5–9" />
              </div>
              <div className="field">
                <label>Start time</label>
                <input type="time" value={form.time_start} onChange={set('time_start')} />
              </div>
              <div className="field">
                <label>End time</label>
                <input type="time" value={form.time_end} onChange={set('time_end')} />
              </div>
              <div className="field">
                <label>Level</label>
                <input value={form.level} onChange={set('level')} placeholder="e.g. Beginner, Level 1" />
              </div>
              <div className="field">
                <label>Monthly price ($)</label>
                <input type="number" step="0.01" value={form.price_monthly} onChange={set('price_monthly')} placeholder="40.00" />
              </div>
              <div className="field" style={{ gridColumn: '1/-1' }}>
                <label>Description</label>
                <textarea value={form.description} onChange={set('description')} placeholder="Brief description of the class…" rows={3} />
              </div>
              <div className="field" style={{ gridColumn: '1/-1', flexDirection: 'row', alignItems: 'center', gap: '0.6rem' }}>
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={set('is_active')} style={{ width: 'auto' }} />
                <label htmlFor="is_active" style={{ marginBottom: 0 }}>Active (visible to users)</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Class'}</button>
            </div>
          </form>
        </Modal>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem', fontWeight: 400, color: 'var(--charcoal)', marginBottom: '0.2rem' }}>Classes</h1>
          <p style={{ color: 'var(--soft)', fontSize: '0.85rem' }}>{classes.length} total classes</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Class</button>
      </div>

      {loading ? <div style={{ color: 'var(--soft)' }}>Loading…</div> : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Style</th>
                <th>Day / Time</th>
                <th>Ages</th>
                <th>Price</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr key={cls.id}>
                  <td style={{ fontWeight: 600 }}>{cls.name}</td>
                  <td>{cls.style || '—'}</td>
                  <td style={{ fontSize: '0.78rem' }}>{[cls.day_of_week, cls.time_start].filter(Boolean).join(' · ') || '—'}</td>
                  <td>{cls.age_range || '—'}</td>
                  <td>{cls.price_monthly ? `$${cls.price_monthly}/mo` : '—'}</td>
                  <td><span className={`badge ${cls.is_active ? 'badge-green' : 'badge-gray'}`}>{cls.is_active ? 'Active' : 'Hidden'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="btn btn-sm btn-secondary btn-icon" onClick={() => openEdit(cls)} title="Edit"><Edit size={13} /></button>
                      <button className="btn btn-sm btn-danger btn-icon" onClick={() => setDeleteId(cls.id)} title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {classes.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--soft)', padding: '2rem' }}>No classes yet. Add your first class.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
