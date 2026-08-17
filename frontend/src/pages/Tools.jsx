import { LayoutGrid } from 'lucide-react'

export default function Tools() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 24px 100px',
      background: '#000',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '30%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(76,0,176,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: 340 }}>

        {/* Animated icon container */}
        <div style={{
          width: 96, height: 96, borderRadius: 28,
          background: 'linear-gradient(135deg, rgba(109,40,217,0.25), rgba(76,0,176,0.15))',
          border: '1.5px solid rgba(109,40,217,0.35)',
          boxShadow: '0 0 48px rgba(76,0,176,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
          animation: 'toolsPulse 3s ease-in-out infinite',
        }}>
          <LayoutGrid size={40} color="#9b6dff" strokeWidth={1.5} />
        </div>

        {/* Coming Soon badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 14px', borderRadius: 20,
          background: 'rgba(109,40,217,0.15)',
          border: '1px solid rgba(109,40,217,0.3)',
          color: '#9b6dff', fontSize: 11, fontWeight: 800,
          letterSpacing: 2, textTransform: 'uppercase',
          marginBottom: 20,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9b6dff', display: 'inline-block', animation: 'toolsBlink 1.4s ease-in-out infinite' }} />
          Coming Soon
        </div>

        <h1 style={{
          fontSize: 30, fontWeight: 900, color: '#fff',
          letterSpacing: '-0.5px', marginBottom: 14, lineHeight: 1.2,
        }}>
          Tools &amp; Utilities
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.45)',
          fontSize: 15, lineHeight: 1.7, marginBottom: 0,
        }}>
          We're building something useful here.<br />
          Check back soon!
        </p>

      </div>

      <style>{`
        @keyframes toolsPulse {
          0%, 100% { box-shadow: 0 0 48px rgba(76,0,176,0.3), inset 0 1px 0 rgba(255,255,255,0.06); }
          50%       { box-shadow: 0 0 72px rgba(76,0,176,0.55), inset 0 1px 0 rgba(255,255,255,0.06); }
        }
        @keyframes toolsBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
