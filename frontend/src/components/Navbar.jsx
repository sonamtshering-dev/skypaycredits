// src/components/Navbar.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { useCurrency } from '../context/CurrencyContext'
import theme from '../theme'
import { ClipboardList, User, Settings, LogOut, X, Home, ChevronRight, Wallet } from 'lucide-react'
import BottomNav from './BottomNav'

function BrandName({ name, fontSize = 16 }) {
  const parts = (name || 'Nitrogen Store').split(' ')
  const first = parts[0]
  const rest = parts.slice(1).join(' ')
  return (
    <span style={{ fontWeight: 900, fontSize, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
      <span style={{ color: '#fff' }}>{first}</span>
      {rest && <span style={{
        background: 'linear-gradient(135deg,#7c3aed,#4c00b0)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>{' '}{rest}</span>}
    </span>
  )
}


export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { settings } = useSettings()
  const { currency, toggle: toggleCurrency, fmtP } = useCurrency()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = async () => {
    await logout(); navigate('/'); setDrawerOpen(false); setProfileOpen(false)
  }

  const { walletBalance } = useAuth()

  const navItems = [
    { to: '/',        label: 'Home',       icon: Home },
    { to: '/orders',  label: 'My Orders',  icon: ClipboardList },
    { to: '/wallet',  label: 'Wallet',     icon: Wallet, badge: walletBalance > 0 ? fmtP(walletBalance) : null },
    { to: '/profile', label: 'Profile',    icon: User },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', icon: Settings }] : []),
  ]

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center', height: 56, gap: 12,
          padding: '0 20px',
        }}>

          {/* Logo + Site Name */}
          <Link to="/" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            flexShrink: 0, textDecoration: 'none',
          }}>
            {settings.logo && <img src={settings.logo} alt={settings.siteName} style={{ height: 32, flexShrink: 0 }} />}
            <BrandName name={settings.siteName} fontSize={16} />
          </Link>

          <div style={{ flex: 1 }} />

          {/* Currency toggle — visible to everyone */}
          <button
            onClick={toggleCurrency}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 11px', borderRadius: 20,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#fff', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            title="Switch currency"
          >
            {currency === 'INR' ? '🇮🇳 INR' : '🇵🇭 PHP'}
          </button>

          {/* Desktop nav */}
          {user ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Link to="/orders" className="hide-mobile btn btn-ghost btn-sm">Orders</Link>
              <Link to="/wallet" className="hide-mobile btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Wallet size={13} />
                {walletBalance > 0 ? fmtP(walletBalance) : 'Wallet'}
              </Link>
              {isAdmin && <Link to="/admin" className="hide-mobile btn btn-ghost btn-sm">Admin</Link>}

              {/* Profile avatar — desktop dropdown */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => {
                  if (window.innerWidth < 640) {
                    setDrawerOpen(v => !v); setProfileOpen(false)
                  } else {
                    setProfileOpen(v => !v); setDrawerOpen(false)
                  }
                }} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: theme.grad,
                  border: '2px solid rgba(76,0,176,0.35)',
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
                      background: 'rgba(0,0,0,0.97)', backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 14, minWidth: 200, overflow: 'hidden',
                    }}>
                      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{user.email}</div>
                      </div>
                      {[
                        { to: '/orders',  label: 'Orders',      icon: ClipboardList },
                        { to: '/wallet',  label: 'Wallet',      icon: Wallet },
                        { to: '/profile', label: 'Profile',     icon: User },
                        ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', icon: Settings }] : []),
                      ].map(({ to, label, icon: Icon }) => (
                        <Link key={to} to={to} onClick={() => setProfileOpen(false)} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 14,
                          color: 'rgba(255,255,255,0.75)', textDecoration: 'none',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background=''}
                        ><Icon size={14} />{label}</Link>
                      ))}
                      <button onClick={handleLogout} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '11px 16px',
                        textAlign: 'left', fontSize: 14, background: 'none',
                        color: '#f87171', cursor: 'pointer',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background=''}
                      ><LogOut size={14} style={{ marginRight: 10 }} />Logout</button>
                    </div>
                  </>
                )}
              </div>

            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary btn-sm">Login</Link>
          )}
        </div>
      </nav>

      {/* Spacer so page content isn't hidden under fixed nav */}
      <div style={{ height: 56 }} />

      {/* Left Drawer — mobile only */}
      {user && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 200,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              opacity: drawerOpen ? 1 : 0,
              pointerEvents: drawerOpen ? 'auto' : 'none',
              transition: 'opacity 0.3s ease',
            }}
          />

          {/* Drawer panel */}
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: 'min(300px, 82vw)',
            zIndex: 201,
            display: 'flex', flexDirection: 'column',
            background: 'linear-gradient(180deg, rgba(8,4,22,0.99) 0%, rgba(4,2,14,0.99) 100%)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
          }}>

            {/* Purple glow accent top-left */}
            <div style={{
              position: 'absolute', top: -60, left: -60,
              width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(76,0,176,0.35) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Header — brand + close */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 20px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              position: 'relative',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {settings.logo && <img src={settings.logo} alt={settings.siteName} style={{ height: 28, flexShrink: 0 }} />}
                <BrandName name={settings.siteName} fontSize={18} />
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={14} />
              </button>
            </div>

            {/* User card */}
            <div style={{
              margin: '16px 16px 8px',
              padding: '14px 16px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(76,0,176,0.18) 0%, rgba(120,40,255,0.1) 100%)',
              border: '1px solid rgba(120,40,255,0.25)',
              display: 'flex', alignItems: 'center', gap: 12,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 80, height: 80,
                background: 'radial-gradient(circle, rgba(120,40,255,0.2) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: theme.grad,
                border: '2px solid rgba(120,40,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 17, color: '#fff', flexShrink: 0,
              }}>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
              </div>
            </div>

            {/* Nav items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', padding: '8px 8px 6px' }}>
                Navigation
              </div>
              {navItems.map(({ to, label, icon: Icon, badge }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 12px', borderRadius: 10, marginBottom: 2,
                    fontSize: 14, fontWeight: 600,
                    color: 'rgba(255,255,255,0.75)',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = ''
                    e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color="rgba(255,255,255,0.6)" />
                  </div>
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: '#a78bfa',
                      background: 'rgba(120,40,255,0.15)',
                      border: '1px solid rgba(120,40,255,0.3)',
                      borderRadius: 20, padding: '2px 8px',
                    }}>{badge}</span>
                  )}
                  <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                </Link>
              ))}

              {/* Currency toggle — drawer */}
              <button
                onClick={toggleCurrency}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '12px 12px', borderRadius: 10, marginBottom: 4,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {currency === 'INR' ? '🇮🇳' : '🇵🇭'}
                </div>
                Currency: {currency === 'INR' ? 'INR (₹)' : 'PHP (₱)'}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>tap to switch</span>
              </button>

              {/* Logout — inline in nav list */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '12px 12px', borderRadius: 10, marginTop: 4,
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  color: '#f87171', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)' }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(239,68,68,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <LogOut size={15} color="#f87171" />
                </div>
                Logout
              </button>
            </div>

          </div>
        </>
      )}

      <style>{`
        .show-mobile { display: flex !important; }
        @media (min-width: 640px) {
          .show-mobile { display: none !important; }
          .hide-mobile { display: inline-flex !important; }
        }
        @media (max-width: 639px) {
          .drawer-logout { padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px)) !important; }
        }
      `}</style>

      <BottomNav />
    </>
  )
}
