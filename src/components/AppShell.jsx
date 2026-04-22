import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, BookOpen, Play, MessageCircle, User } from 'lucide-react'

const navItems = [
  { to: '/app/home', icon: Home, label: 'Home' },
  { to: '/app/classes', icon: BookOpen, label: 'Classes' },
  { to: '/app/media', icon: Play, label: 'Media' },
  { to: '/app/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/app/profile', icon: User, label: 'Me' },
]

export default function AppShell() {
  const { pathname } = useLocation()
  const isChat = pathname === '/app/chat'

  return (
    <div className="app-shell">
      <div className={`app-content${isChat ? ' chat-mode' : ''}`}>
        <Outlet />
      </div>
      <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={21} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
