// src/components/Footer.jsx
import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useEffect } from 'react'
import { Zap, Lock, Globe, Gamepad2 } from 'lucide-react'

export default function Footer() {
  const { settings } = useSettings()
  const year = new Date().getFullYear()
  const siteName = settings.siteName || 'Nitrogen Store'

  useEffect(() => {
    document.title = siteName
  }, [siteName])

  const hasSocial = settings.whatsapp || settings.instagram || settings.facebook || settings.email
  const waLink = val => val?.startsWith('http') ? val : `https://wa.me/${val}`

  return (
    <>
      {/* Follow Us banner */}
      {hasSocial && (
        <div style={{
          background: '#000',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '56px 16px',
          textAlign: 'center',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Follow Us!</div>
          <div style={{ fontSize: 'clamp(22px, 5vw, 36px)', fontWeight: 900, color: '#fff', marginBottom: 36, letterSpacing: '-0.5px' }}>For Every Latest News.</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {settings.instagram && (
              <a href={settings.instagram} target="_blank" rel="noopener noreferrer"
                style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s, opacity 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1' }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="#000" stroke="none"/>
                </svg>
              </a>
            )}
            {settings.facebook && (
              <a href={settings.facebook} target="_blank" rel="noopener noreferrer"
                style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s, opacity 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1' }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="#000">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
            )}
            {settings.whatsapp && (
              <a href={waLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer"
                style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s, opacity 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1' }}>
                <svg viewBox="0 0 32 32" width="24" height="24" fill="#000">
                  <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.676 4.797 1.853 6.785L2 30l7.44-1.82A13.94 13.94 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.44 11.44 0 01-5.82-1.587l-.418-.247-4.41 1.08 1.113-4.285-.272-.44A11.5 11.5 0 1116 27.5zm6.29-8.61c-.344-.172-2.036-1.005-2.352-1.12-.316-.114-.546-.172-.776.172-.23.344-.888 1.12-1.088 1.35-.2.23-.4.258-.744.086-.344-.172-1.452-.535-2.767-1.707-1.022-.912-1.713-2.037-1.913-2.38-.2-.344-.021-.53.15-.702.154-.154.344-.4.516-.602.172-.2.23-.344.344-.573.115-.23.058-.43-.029-.602-.086-.172-.776-1.872-1.063-2.563-.28-.672-.564-.58-.776-.59l-.66-.012c-.23 0-.602.086-.917.43-.315.344-1.203 1.176-1.203 2.867s1.232 3.326 1.403 3.555c.172.23 2.424 3.7 5.873 5.188.82.355 1.46.566 1.96.724.822.262 1.571.225 2.162.137.66-.099 2.036-.832 2.324-1.636.287-.803.287-1.49.2-1.636-.086-.144-.316-.23-.66-.4z"/>
                </svg>
              </a>
            )}
            {settings.email && (
              <a href={`mailto:${settings.email}`}
                style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s, opacity 0.2s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.opacity = '0.85' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1' }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <polyline points="2,4 12,13 22,4"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      )}

      <footer style={{
        background: 'rgba(0,0,0,0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        marginTop: 'auto',
        position: 'relative', zIndex: 1,
      }}>
        <div className="container" style={{ padding: '40px 16px 20px' }}>

          {/* Brand — full width on top */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              {settings.logo && <img src={settings.logo} alt={siteName} style={{ height: 36, flexShrink: 0, borderRadius: 6 }} />}
              <span style={{ fontWeight: 900, fontSize: 24, whiteSpace: 'nowrap' }}>
                <span style={{ color: '#fff' }}>{siteName.split(' ')[0]}</span>
                {siteName.split(' ').slice(1).join(' ') && (
                  <span style={{ background: 'linear-gradient(135deg,#7c3aed,#4c00b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {' '}{siteName.split(' ').slice(1).join(' ')}
                  </span>
                )}
              </span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, lineHeight: 1.75, maxWidth: 340 }}>
              {siteName} offers reliable game top-ups with fast and secure delivery. Smooth transactions and professional service for every gamer.
            </p>
          </div>

          {/* Nav + Why Us side by side */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            marginBottom: 0,
          }}>
            {/* Navigation */}
            <div>
              <div style={{ fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1.5 }}>Navigation</div>
              {[
                { to: '/',        label: 'Home' },
                { to: '/orders',  label: 'My Orders' },
                { to: '/about',   label: 'About Us' },
                { to: '/contact', label: 'Contact' },
              ].map(({ to, label }) => (
                <Link key={to} to={to}
                  style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none', marginBottom: 9, transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = '#7c3aed'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
                >{label}</Link>
              ))}
            </div>

            {/* Why Us */}
            <div>
              <div style={{ fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1.5 }}>Why Us</div>
              {[
                [Zap,      'Instant Delivery',  '#4c00b0'],
                [Lock,     'Secure Payments',   '#22c55e'],
                [Globe,    'Multiple Regions',  '#7c3aed'],
                [Gamepad2, '15+ Games',         '#c4b5fd'],
              ].map(([Icon, label, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                  <Icon size={13} color={color} />
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
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12 }}>All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* WhatsApp sticky float button */}
      {settings.whatsappSupport && (
        <a
          href={waLink(settings.whatsappSupport)}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat on WhatsApp"
          className="wa-float"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            width: 56, height: 56, borderRadius: '50%',
            background: '#25d366',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(37,211,102,0.5)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            textDecoration: 'none',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(37,211,102,0.7)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,211,102,0.5)' }}
        >
          <WhatsAppIcon size={30} color="#fff" />
        </a>
      )}
    </>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#e1306c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="#e1306c" stroke="none"/>
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="#1877f2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

function WhatsAppIcon({ size = 18, color = '#25d366' }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill={color}>
      <path d="M16 2C8.268 2 2 8.268 2 16c0 2.478.676 4.797 1.853 6.785L2 30l7.44-1.82A13.94 13.94 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2zm0 25.5a11.44 11.44 0 01-5.82-1.587l-.418-.247-4.41 1.08 1.113-4.285-.272-.44A11.5 11.5 0 1116 27.5zm6.29-8.61c-.344-.172-2.036-1.005-2.352-1.12-.316-.114-.546-.172-.776.172-.23.344-.888 1.12-1.088 1.35-.2.23-.4.258-.744.086-.344-.172-1.452-.535-2.767-1.707-1.022-.912-1.713-2.037-1.913-2.38-.2-.344-.021-.53.15-.702.154-.154.344-.4.516-.602.172-.2.23-.344.344-.573.115-.23.058-.43-.029-.602-.086-.172-.776-1.872-1.063-2.563-.28-.672-.564-.58-.776-.59l-.66-.012c-.23 0-.602.086-.917.43-.315.344-1.203 1.176-1.203 2.867s1.232 3.326 1.403 3.555c.172.23 2.424 3.7 5.873 5.188.82.355 1.46.566 1.96.724.822.262 1.571.225 2.162.137.66-.099 2.036-.832 2.324-1.636.287-.803.287-1.49.2-1.636-.086-.144-.316-.23-.66-.4z"/>
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <polyline points="2,4 12,13 22,4"/>
    </svg>
  )
}
