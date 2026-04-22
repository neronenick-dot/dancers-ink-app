import { X } from 'lucide-react'

/* ---- Modal ---- */
export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

/* ---- Toast hook ---- */
import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'default') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800)
  }, [])

  function Toasts() {
    if (!toasts.length) return null
    return (
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
        ))}
      </div>
    )
  }

  return { toast, Toasts }
}

/* ---- Confirm dialog ---- */
export function ConfirmModal({ title, message, onConfirm, onCancel, danger = false }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onCancel}><X size={16} /></button>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--mid)', lineHeight: 1.6, marginBottom: '1.25rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            {danger ? 'Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---- Loading spinner ---- */
export function Spinner({ size = 20 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: `2px solid var(--rule)`, borderTopColor: 'var(--teal)',
      animation: 'spin 0.7s linear infinite', flexShrink: 0
    }} />
  )
}

const spinStyle = document.createElement('style')
spinStyle.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
document.head.appendChild(spinStyle)
