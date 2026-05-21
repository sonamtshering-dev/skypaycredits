// src/admin/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import theme from '../theme'


const NAV = [
  { to: '/admin',          label: '📊 Dashboard', end: true },
  { to: '/admin/games',    label: '🎮 Games' },
  { to: '/admin/packs',    label: '📦 Packs' },
  { to: '/admin/orders',   label: '🧾 Orders' },
  { to: '/admin/users',    label: '👤 Users' },
  { to: '/admin/coupons',  label: '🎟️ Coupons' },
  { to: '/admin/banners',  label: '🖼️ Banners' },
  { to: '/admin/settings', label: '⚙️ Settings' },
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => { await logout(); navigate('/') }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{
          fontWeight: 900, fontSize: 17,
          background: theme.gradSoft,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', marginBottom: 2,
        }}>⚡ Admin Panel</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{user?.email}</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px' }}>
        {NAV.map(({ to, label, end }) => (
          <NavLink
            key={to} to={to} end={end}
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: 'block', padding: '9px 12px', borderRadius: 10,
              fontSize: 13, fontWeight: 700, marginBottom: 2,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
              background: isActive
                ? 'linear-gradient(135deg,rgba(249,115,22,0.2),rgba(234,106,16,0.15))'
                : 'transparent',
              border: isActive ? '1px solid rgba(249,115,22,0.3)' : '1px solid transparent',
              transition: 'all 0.15s', textDecoration: 'none',
            })}
          >{label}</NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <NavLink to="/" style={{ display: 'block', padding: '8px 12px', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: 4 }}>← View Site</NavLink>
        <button onClick={handleLogout} style={{ width: '100%', padding: '8px 12px', borderRadius: 10, textAlign: 'left', fontSize: 13, fontWeight: 700, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', cursor: 'pointer' }}>Logout</button>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar-desktop { display: none !important; }
          .admin-mobile-header { display: flex !important; }
        }
        @media (min-width: 769px) {
          .admin-sidebar-desktop { display: flex !important; }
          .admin-mobile-header { display: none !important; }
        }
      `}</style>

      {/* Mobile header */}
      <div className="admin-mobile-header" style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,6,26,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontWeight: 900, fontSize: 15, background: theme.gradSoft, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>⚡ Admin Panel</div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: '#fff', padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}>☰</button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)' }} onClick={() => setSidebarOpen(false)} />
          <aside style={{ position: 'relative', width: 240, background: 'rgba(10,6,26,0.99)', backdropFilter: 'blur(24px)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', zIndex: 1 }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="admin-sidebar-desktop" style={{
        width: 220, flexShrink: 0,
        background: 'rgba(10,6,26,0.9)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowX: 'hidden' }}>
        <style>{`
          .admin-main-content { padding: 28px 24px; }
          @media (max-width: 768px) { .admin-main-content { padding: 76px 14px 28px; } }
        `}</style>
        <div className="admin-main-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}