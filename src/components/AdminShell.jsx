import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, Megaphone, Image,
  Settings, LogOut, Menu, X, MessageSquare
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/classes', icon: GraduationCap, label: 'Classes' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/media', icon: Image, label: 'Media' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

function SidebarContent({ profile, onSignOut, onClose }) {
  return (
    <>
      <div className="sidebar-logo">
        <div className="sidebar-brand">Dancers Ink</div>
        <div className="sidebar-sub">Admin Dashboard</div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Manage</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            onClick={onClose}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          Signed in as<br />
          <strong>{profile?.full_name || profile?.email || 'Admin'}</strong>
        </div>
        <button className="btn btn-sm btn-danger btn-full" onClick={onSignOut}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </>
  )
}

export default function AdminShell() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="admin-layout">
      {/* Mobile header */}
      <div className="admin-mobile-header">
        <span className="admin-mobile-brand">Dancers Ink</span>
        <button
          className="btn btn-icon"
          style={{ background: 'transparent', color: 'white', border: 'none' }}
          onClick={() => setMobileOpen(v => !v)}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Sidebar overlay on mobile */}
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 70 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar${mobileOpen ? ' open' : ''}`} style={{ zIndex: 80 }}>
        <SidebarContent
          profile={profile}
          onSignOut={handleSignOut}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* Main */}
      <main className="admin-main">
        <div className="admin-topbar">
          <span className="admin-topbar-title">Dancers Ink Admin</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--soft)' }}>
              {profile?.full_name || profile?.email}
            </span>
            <button className="btn btn-sm btn-secondary" onClick={handleSignOut}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
