// src/components/Navbar.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import theme from '../theme'


export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = async () => {
    await logout(); navigate('/'); setMenuOpen(false); setProfileOpen(false)
  }

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(6,6,18,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 60, gap: 12 }}>

          {/* Logo */}
          <Link to="/" style={{
            fontWeight: 900, fontSize: 20, letterSpacing: '-0.5px',
            background: theme.gradSoft,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', flexShrink: 0, textDecoration: 'none',
          }}>
            {settings.logo
              ? <img src={settings.logo} alt={settings.siteName} style={{ height: 32 }} />
              : `⚡ ${settings.siteName || 'RechargeShop'}`}
          </Link>

          <div style={{ flex: 1 }} />

          {/* Desktop nav */}
          {user ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Link to="/orders" className="hide-mobile btn btn-ghost btn-sm">Orders</Link>
              {isAdmin && <Link to="/admin" className="hide-mobile btn btn-ghost btn-sm">Admin</Link>}

              {/* Profile avatar */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => { setProfileOpen(v => !v); setMenuOpen(false) }} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: theme.grad,
                  border: '2px solid rgba(249,115,22,0.3)',
                  color: '#fff', fontWeight: 800, fontSize: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                }}>
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </button>

                {profileOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setProfileOpen(false)} />
                    <div style={{
                      position: 'absolute', right: 0, top: 44, zIndex: 20,
                      background: 'rgba(12,8,28,0.97)', backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 14, minWidth: 200, overflow: 'hidden',
                    }}>
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{user.email}</div>
                      </div>
                      {[
                        { to: '/orders', label: '📋 Orders' },
                        { to: '/profile', label: '👤 Profile' },
                        ...(isAdmin ? [{ to: '/admin', label: '⚙️ Admin Panel' }] : []),
                      ].map(({ to, label }) => (
                        <Link key={to} to={to} onClick={() => setProfileOpen(false)} style={{
                          display: 'block', padding: '11px 16px', fontSize: 14,
                          color: 'rgba(255,255,255,0.75)', textDecoration: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background=''}
                        >{label}</Link>
                      ))}
                      <button onClick={handleLogout} style={{
                        display: 'block', width: '100%', padding: '11px 16px',
                        textAlign: 'left', fontSize: 14, background: 'none',
                        color: '#f87171', cursor: 'pointer',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background=''}
                      >🚪 Logout</button>
                    </div>
                  </>
                )}
              </div>

              {/* Hamburger (mobile) */}
              <button
                onClick={() => { setMenuOpen(v => !v); setProfileOpen(false) }}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: menuOpen ? theme.alpha(0.2) : 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 5, cursor: 'pointer', padding: 8,
                }}
                className="show-mobile"
              >
                <span style={{ width: 18, height: 2, background: menuOpen ? theme.primary : '#fff', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
                <span style={{ width: 18, height: 2, background: menuOpen ? 'transparent' : '#fff', borderRadius: 2, transition: 'all 0.2s' }} />
                <span style={{ width: 18, height: 2, background: menuOpen ? theme.primary : '#fff', borderRadius: 2, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-sm">Login</Link>
          )}
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && user && (
          <div style={{
            background: 'rgba(10,6,24,0.98)', backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            padding: '8px 0 16px',
          }}>
            {[
              { to: '/orders', label: '📋 My Orders' },
              { to: '/profile', label: '👤 Profile' },
              ...(isAdmin ? [{ to: '/admin', label: '⚙️ Admin Panel' }] : []),
            ].map(({ to, label }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={{
                display: 'block', padding: '13px 20px', fontSize: 15, fontWeight: 600,
                color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>{label}</Link>
            ))}
            <button onClick={handleLogout} style={{
              display: 'block', width: '100%', padding: '13px 20px', textAlign: 'left',
              fontSize: 15, fontWeight: 600, background: 'none', color: '#f87171', cursor: 'pointer',
            }}>🚪 Logout</button>
          </div>
        )}
      </nav>

      <style>{`
        .show-mobile { display: flex !important; }
        @media (min-width: 640px) {
          .show-mobile { display: none !important; }
          .hide-mobile { display: inline-flex !important; }
        }
      `}</style>
    </>
  )
}