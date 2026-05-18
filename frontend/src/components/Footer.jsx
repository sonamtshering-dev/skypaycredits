// src/components/Footer.jsx
import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useEffect } from 'react'

// ── Social links — update these ──
const INSTAGRAM = 'https://www.instagram.com/bdcoins.insta?igsh=MTN2bXZmMjljYjFpMg=='
const FACEBOOK  = 'https://www.facebook.com/share/189erMsnZ2'

export default function Footer() {
  const { settings } = useSettings()
  const year = new Date().getFullYear()
  const siteName = settings.siteName || 'Sky Pay Credits'

  // Update page title
  useEffect(() => {
    document.title = siteName
  }, [siteName])

  return (
    <footer style={{
      background: 'rgba(6,6,18,0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      marginTop: 'auto',
      position: 'relative', zIndex: 1,
    }}>
      <div className="container" style={{ padding: '36px 16px 20px' }}>

        {/* Top row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 32, marginBottom: 32,
        }}>
          {/* Brand */}
          <div>
            <div style={{
              fontWeight: 900, fontSize: 20,
              background: 'linear-gradient(135deg,#f97316,#fbbf24)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', marginBottom: 10,
            }}>⚡ {siteName}</div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, lineHeight: 1.7, maxWidth: 200 }}>
             {siteName} offers reliable game top-ups with fast and secure delivery. We are committed to providing smooth transactions and professional service for every gamer.
            </p>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <a href={INSTAGRAM} target="_blank" rel="noreferrer"
                style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background='linear-gradient(135deg,#f97316,#ec4899)'; e.currentTarget.style.border='1px solid transparent' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.border='1px solid rgba(255,255,255,0.1)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href={FACEBOOK} target="_blank" rel="noreferrer"
                style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background='#1877f2'; e.currentTarget.style.border='1px solid transparent' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.border='1px solid rgba(255,255,255,0.1)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <div style={{ fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1.5 }}>Navigation</div>
            {[
              { to: '/',        label: 'Home' },
              { to: '/orders',  label: 'My Orders' },
              { to: '/about',   label: 'About Us' },
              { to: '/contact', label: 'Contact' },
            ].map(({ to, label }) => (
              <Link key={to} to={to} style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none', marginBottom: 9, transition: 'color 0.15s' }}
                onMouseEnter={e => e.target.style.color = '#f97316'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
              >{label}</Link>
            ))}
          </div>

          {/* Why Us */}
          <div>
            <div style={{ fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1.5 }}>Why Us</div>
            {[
              ['⚡', 'Instant Delivery'],
              ['🔒', 'Secure Payments'],
              ['🌐', 'Multiple Regions'],
              ['🎮', '15+ Games'],
            ].map(([icon, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                <span style={{ fontSize: 13 }}>{icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>© {year} {siteName}</span>
            {[{ label: 'Privacy', to: '/privacy' }, { label: 'Terms', to: '/terms' }].map(({ label, to }) => (
              <Link key={to} to={to} style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.2)'}
              >{label}</Link>
            ))}
          </div>

          <a href="https://wa.me/919907433384" target="_blank" rel="noreferrer"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Made with</span>
            <span style={{ color: '#ef4444', fontSize: 14 }}>♥</span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>by</span>
            <span style={{ fontSize: 12, fontWeight: 800, background: 'linear-gradient(135deg,#f97316,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Tshernova Studio</span>
          </a>
        </div>
      </div>
    </footer>
  )
}