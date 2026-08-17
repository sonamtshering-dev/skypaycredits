// src/pages/Auth.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSettings } from '../context/SettingsContext'
import { KeyRound, Lock } from 'lucide-react'
import api from '../api/axios'
import theme from '../theme'

// 6 individual digit boxes for OTP input
function OtpBoxes({ value, onChange, disabled }) {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()]
  const digits = (value || '').split('').concat(Array(6).fill('')).slice(0, 6)

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = [...digits]
      if (next[i]) { next[i] = ''; onChange(next.join('')) }
      else if (i > 0) { refs[i - 1].current?.focus() }
      return
    }
    if (e.key === 'ArrowLeft' && i > 0) { refs[i - 1].current?.focus(); return }
    if (e.key === 'ArrowRight' && i < 5) { refs[i + 1].current?.focus(); return }
  }

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = val
    onChange(next.join(''))
    if (val && i < 5) refs[i + 1].current?.focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) { onChange(pasted.padEnd(6, '').slice(0, 6).replace(/\s/g, '')); refs[Math.min(pasted.length, 5)].current?.focus() }
    e.preventDefault()
  }

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i} ref={refs[i]}
          type="text" inputMode="numeric" maxLength={1} value={d}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            width: 44, height: 52, borderRadius: 10, textAlign: 'center',
            fontSize: 22, fontWeight: 800, color: '#fff',
            background: d ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${d ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.12)'}`,
            outline: 'none', transition: 'all 0.15s',
          }}
        />
      ))}
    </div>
  )
}

export default function Auth() {
  const { login } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const [tab, setTab]           = useState('login')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Login fields
  const [loginEmail, setLoginEmail]       = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register fields
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')

  // Pre-registration OTP — email
  const [emailOtpSent, setEmailOtpSent]           = useState(false)
  const [emailOtpVerified, setEmailOtpVerified]   = useState(false)
  const [emailOtp, setEmailOtp]                   = useState('')
  const [emailOtpLoading, setEmailOtpLoading]     = useState(false)
  const [emailOtpError, setEmailOtpError]         = useState('')
  const [emailVerifiedToken, setEmailVerifiedToken] = useState('')
  const [emailResend, setEmailResend]             = useState(0)

  // Pre-registration OTP — phone
  const [phoneOtpSent, setPhoneOtpSent]           = useState(false)
  const [phoneOtpVerified, setPhoneOtpVerified]   = useState(false)
  const [phoneOtp, setPhoneOtp]                   = useState('')
  const [phoneOtpLoading, setPhoneOtpLoading]     = useState(false)
  const [phoneOtpError, setPhoneOtpError]         = useState('')
  const [phoneVerifiedToken, setPhoneVerifiedToken] = useState('')
  const [phoneResend, setPhoneResend]             = useState(0)

  // Inline OTP for login flow (email/phone-otp steps)
  const [step, setStep]                   = useState('form')
  const [pendingEmail, setPendingEmail]   = useState('')
  const [pendingPhone, setPendingPhone]   = useState('')
  const [otp, setOtp]                     = useState('')
  const [otpLoading, setOtpLoading]       = useState(false)
  const [otpError, setOtpError]           = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Forgot password
  const [forgotEmail, setForgotEmail]     = useState('')
  const [resetOtp, setResetOtp]           = useState('')
  const [newPassword, setNewPassword]     = useState('')
  const [newConfirm, setNewConfirm]       = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError]     = useState('')

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const [googleReady, setGoogleReady] = useState(false)
  const [gLoading, setGLoading] = useState(false)

  const handleGoogleCredential = async (response) => {
    setGLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/google', { credential: response.credential })
      login(data.token, data.user); navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed')
    } finally { setGLoading(false) }
  }

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const init = () => {
      if (!window.google?.accounts?.id) return
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleGoogleCredential })
      setGoogleReady(true)
    }
    if (window.google?.accounts?.id) { init() }
    else if (!document.getElementById('gsi-script')) {
      const s = document.createElement('script')
      s.id = 'gsi-script'; s.src = 'https://accounts.google.com/gsi/client'; s.async = true
      s.onload = init; document.head.appendChild(s)
    } else {
      document.getElementById('gsi-script').addEventListener('load', init, { once: true })
    }
  }, [GOOGLE_CLIENT_ID])

  const handleGoogleClick = () => {
    if (!googleReady) return
    window.google.accounts.id.prompt()
  }

  const resetRegister = () => {
    setName(''); setEmail(''); setPhone(''); setPassword(''); setConfirm('')
    setEmailOtpSent(false); setEmailOtpVerified(false); setEmailOtp(''); setEmailOtpError(''); setEmailVerifiedToken('')
    setPhoneOtpSent(false); setPhoneOtpVerified(false); setPhoneOtp(''); setPhoneOtpError(''); setPhoneVerifiedToken('')
    setEmailResend(0); setPhoneResend(0)
  }

  const startCooldown = (setter) => {
    setter(60)
    const t = setInterval(() => setter(v => { if (v <= 1) { clearInterval(t); return 0 } return v - 1 }), 1000)
  }

  const startResendCooldown = () => startCooldown(setResendCooldown)

  // ── Login ─────────────────────────────────────────────
  const handleLogin = async e => {
    e.preventDefault(); setError('')
    if (!loginEmail || !loginPassword) return setError('Fill in all fields')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email: loginEmail, password: loginPassword })
      if (data.requiresAdminOTP) {
        setPendingEmail(data.email); setStep('admin-otp'); startResendCooldown(); return
      }
      if (data.requiresVerification) {
        setPendingEmail(data.email); setStep('otp'); startResendCooldown(); return
      }
      login(data.token, data.user); navigate('/')
    } catch (err) {
      const d = err.response?.data
      if (d?.requiresVerification) { setPendingEmail(d.email); setStep('otp'); startResendCooldown(); return }
      setError(d?.message || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  // ── Register ──────────────────────────────────────────
  const handleSendEmailOtp = async () => {
    setEmailOtpError('')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setEmailOtpError('Enter a valid email address')
    setEmailOtpLoading(true)
    try {
      await api.post('/auth/send-email-otp', { email })
      setEmailOtpSent(true); setEmailOtp(''); startCooldown(setEmailResend)
    } catch (err) { setEmailOtpError(err.response?.data?.message || 'Failed to send OTP') }
    finally { setEmailOtpLoading(false) }
  }

  const handleVerifyEmailOtp = async () => {
    setEmailOtpError('')
    if (emailOtp.replace(/\s/g,'').length !== 6) return setEmailOtpError('Enter the 6-digit code')
    setEmailOtpLoading(true)
    try {
      const { data } = await api.post('/auth/verify-email-otp', { email, otp: emailOtp.replace(/\s/g,'') })
      setEmailOtpVerified(true); setEmailVerifiedToken(data.token)
    } catch (err) { setEmailOtpError(err.response?.data?.message || 'Incorrect code') }
    finally { setEmailOtpLoading(false) }
  }

  const handleSendPhoneOtp = async () => {
    setPhoneOtpError('')
    const phone10 = phone.replace(/\D/g,'').slice(-10)
    if (!/^[6-9]\d{9}$/.test(phone10)) return setPhoneOtpError('Enter a valid 10-digit number')
    setPhoneOtpLoading(true)
    try {
      await api.post('/auth/send-phone-otp', { phone })
      setPhoneOtpSent(true); setPhoneOtp(''); startCooldown(setPhoneResend)
    } catch (err) { setPhoneOtpError(err.response?.data?.message || 'Failed to send OTP') }
    finally { setPhoneOtpLoading(false) }
  }

  const handleVerifyPhoneOtp = async () => {
    setPhoneOtpError('')
    if (phoneOtp.replace(/\s/g,'').length !== 6) return setPhoneOtpError('Enter the 6-digit code')
    setPhoneOtpLoading(true)
    try {
      const { data } = await api.post('/auth/verify-phone-otp-pre', { phone, otp: phoneOtp.replace(/\s/g,'') })
      setPhoneOtpVerified(true); setPhoneVerifiedToken(data.token)
    } catch (err) { setPhoneOtpError(err.response?.data?.message || 'Incorrect code') }
    finally { setPhoneOtpLoading(false) }
  }

  const handleRegister = async e => {
    e.preventDefault(); setError('')
    if (!name) return setError('Enter your name')
    if (!emailOtpVerified) return setError('Please verify your email first')
    if (!password) return setError('Enter a password')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return setError('Password needs uppercase, lowercase and a number')
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', {
        name, email, phone, password,
        emailVerifiedToken: emailVerifiedToken,
      })
      login(data.token, data.user); navigate('/')
    } catch (err) { setError(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  // ── Login OTP verify (inline) ─────────────────────────
  const handleVerifyOTP = async e => {
    e.preventDefault(); setOtpError('')
    if (otp.length !== 6) return setOtpError('Enter the 6-digit code')
    setOtpLoading(true)
    try {
      const { data } = await api.post('/auth/verify-otp', { email: pendingEmail, otp })
      login(data.token, data.user); navigate('/')
    } catch (err) { setOtpError(err.response?.data?.message || 'Invalid code') }
    finally { setOtpLoading(false) }
  }

  const handleAdminOTP = async e => {
    e.preventDefault(); setOtpError('')
    if (otp.length !== 6) return setOtpError('Enter the 6-digit code')
    setOtpLoading(true)
    try {
      const { data } = await api.post('/auth/admin-otp', { email: pendingEmail, otp })
      login(data.token, data.user); navigate('/')
    } catch (err) { setOtpError(err.response?.data?.message || 'Invalid code') }
    finally { setOtpLoading(false) }
  }

  const handleResendAdminOTP = async () => {
    if (resendCooldown > 0) return
    try { await api.post('/auth/login', { email: loginEmail, password: loginPassword }); setOtpError(''); startResendCooldown() }
    catch { setOtpError('Failed to resend. Please log in again.') }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return
    try { await api.post('/auth/resend-otp', { email: pendingEmail }); setOtpError(''); startResendCooldown() }
    catch (err) { setOtpError(err.response?.data?.message || 'Failed to resend') }
  }

  const handleVerifyPhoneOTP = async e => {
    e.preventDefault(); setOtpError('')
    if (otp.length !== 6) return setOtpError('Enter the 6-digit code')
    setOtpLoading(true)
    try {
      const { data } = await api.post('/auth/verify-phone-otp', { email: pendingEmail, otp })
      login(data.token, data.user); navigate('/')
    } catch (err) { setOtpError(err.response?.data?.message || 'Invalid code') }
    finally { setOtpLoading(false) }
  }

  const handleResendPhoneOTP = async () => {
    if (resendCooldown > 0) return
    try { await api.post('/auth/resend-phone-otp', { email: pendingEmail }); setOtpError(''); startResendCooldown() }
    catch (err) { setOtpError(err.response?.data?.message || 'Failed to resend') }
  }

  // ── Forgot password ───────────────────────────────────
  const handleForgotPassword = async e => {
    e.preventDefault(); setForgotError('')
    if (!forgotEmail) return setForgotError('Enter your email address')
    setForgotLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail })
      setPendingEmail(forgotEmail); startResendCooldown(); setStep('reset-otp')
    } catch (err) { setForgotError(err.response?.data?.message || 'Failed to send reset email') }
    finally { setForgotLoading(false) }
  }

  const handleVerifyResetOtp = async e => {
    e.preventDefault(); setForgotError('')
    if (!resetOtp || resetOtp.length !== 6) return setForgotError('Enter the 6-digit code')
    setStep('new-password')
  }

  const handleResetPassword = async e => {
    e.preventDefault(); setForgotError('')
    if (newPassword.length < 8) return setForgotError('Password must be at least 8 characters')
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) return setForgotError('Password needs uppercase, lowercase and a number')
    if (newPassword !== newConfirm) return setForgotError('Passwords do not match')
    setForgotLoading(true)
    try {
      await api.post('/auth/reset-password', { email: pendingEmail, otp: resetOtp, password: newPassword })
      setStep('form'); setTab('login'); setLoginEmail(pendingEmail)
      setForgotEmail(''); setResetOtp(''); setNewPassword(''); setNewConfirm('')
      setError('Password reset! Please log in.')
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Reset failed')
      if (err.response?.status === 400) setStep('reset-otp')
    } finally { setForgotLoading(false) }
  }

  const handleResendResetOtp = async () => {
    if (resendCooldown > 0) return
    try { await api.post('/auth/forgot-password', { email: pendingEmail }); setForgotError(''); startResendCooldown() }
    catch (err) { setForgotError(err.response?.data?.message || 'Failed to resend') }
  }

  // ── Styles ────────────────────────────────────────────
  const inp = {
    width: '100%', background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
    padding: '12px 14px', color: '#fff', fontSize: 16, outline: 'none', boxSizing: 'border-box',
  }
  const card = {
    background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: 20, padding: 24,
  }
  const outerWrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative', zIndex: 1 }
  const btn = (disabled) => ({
    width: '100%', padding: 13, borderRadius: 11, fontWeight: 800, fontSize: 15,
    background: theme.grad, border: '1px solid rgba(249,115,22,0.3)',
    color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
  })
  const ghostBtn = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', padding: 0 }
  const resendStyle = (disabled) => ({ background: 'none', border: 'none', fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', color: disabled ? 'rgba(255,255,255,0.3)' : theme.primary, fontWeight: 600 })
  const errBox = { color: '#f87171', fontSize: 13, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }

  const SendOtpBtn = ({ onClick, loading, sent, resend, cooldown }) => (
    <button type="button" onClick={onClick} disabled={loading || cooldown > 0} style={{
      flexShrink: 0, padding: '0 14px', height: 46, borderRadius: 10, fontSize: 13, fontWeight: 700,
      background: sent ? 'rgba(255,255,255,0.06)' : theme.grad,
      border: `1px solid ${sent ? 'rgba(255,255,255,0.12)' : 'rgba(249,115,22,0.3)'}`,
      color: sent && cooldown > 0 ? 'rgba(255,255,255,0.4)' : '#fff',
      cursor: loading || cooldown > 0 ? 'not-allowed' : 'pointer',
      whiteSpace: 'nowrap',
    }}>
      {loading ? '…' : cooldown > 0 ? `${cooldown}s` : sent ? 'Resend' : 'Send OTP'}
    </button>
  )

  const VerifiedBadge = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4ade80', fontSize: 13, fontWeight: 700, padding: '8px 0' }}>
      <span style={{ fontSize: 16 }}>✓</span> Verified
    </div>
  )

  const Brand = () => {
    const siteName = settings.siteName || 'Nitrogen Store'
    const parts = siteName.split(' ')
    return (
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 28, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {settings.logo && <img src={settings.logo} alt={siteName} style={{ height: 36, flexShrink: 0 }} />}
          <span>
            <span style={{ color: '#fff' }}>{parts[0]}</span>
            {parts.slice(1).join(' ') && (
              <span style={{ background: theme.gradSoft, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {' '}{parts.slice(1).join(' ')}
              </span>
            )}
          </span>
        </div>
      </div>
    )
  }

  // ── Forgot / Reset flows (separate screens) ───────────
  if (step === 'forgot') return (
    <div style={outerWrap}><div style={{ width: '100%', maxWidth: 420 }}>
      <Brand />
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <KeyRound size={36} color="#8b5cf6" />
          <div style={{ fontWeight: 800, color: '#fff', fontSize: 16, marginTop: 8 }}>Forgot password?</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>Enter your email and we'll send a reset code</div>
        </div>
        <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input style={inp} type="email" placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} autoFocus autoComplete="email" />
          {forgotError && <div style={errBox}>{forgotError}</div>}
          <button type="submit" disabled={forgotLoading} style={btn(forgotLoading)}>{forgotLoading ? 'Sending…' : 'Send Reset Code'}</button>
          <button type="button" onClick={() => { setStep('form'); setForgotError('') }} style={{ ...ghostBtn, textAlign: 'center' }}>← Back to login</button>
        </form>
      </div>
    </div></div>
  )

  if (step === 'reset-otp') return (
    <div style={outerWrap}><div style={{ width: '100%', maxWidth: 420 }}>
      <Brand />
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 36 }}>📧</div>
          <div style={{ fontWeight: 800, color: '#fff', fontSize: 16, marginTop: 8 }}>Enter reset code</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 4 }}>
            Sent to <span style={{ color: theme.primary, fontWeight: 700 }}>{pendingEmail}</span>
          </div>
        </div>
        <form onSubmit={handleVerifyResetOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <OtpBoxes value={resetOtp} onChange={setResetOtp} />
          {forgotError && <div style={errBox}>{forgotError}</div>}
          <button type="submit" disabled={resetOtp.length !== 6} style={btn(resetOtp.length !== 6)}>Continue</button>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button type="button" onClick={() => { setStep('forgot'); setForgotError('') }} style={ghostBtn}>← Back</button>
            <button type="button" onClick={handleResendResetOtp} disabled={resendCooldown > 0} style={resendStyle(resendCooldown > 0)}>
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      </div>
    </div></div>
  )

  if (step === 'new-password') return (
    <div style={outerWrap}><div style={{ width: '100%', maxWidth: 420 }}>
      <Brand />
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Lock size={36} color="#8b5cf6" />
          <div style={{ fontWeight: 800, color: '#fff', fontSize: 16, marginTop: 8 }}>Set new password</div>
        </div>
        <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ position: 'relative' }}>
            <input style={{ ...inp, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoFocus autoComplete="new-password" />
            <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>{showPw ? '🙈' : '👁️'}</button>
          </div>
          <input style={inp} type={showPw ? 'text' : 'password'} placeholder="Confirm password" value={newConfirm} onChange={e => setNewConfirm(e.target.value)} autoComplete="new-password" />
          {forgotError && <div style={errBox}>{forgotError}</div>}
          <button type="submit" disabled={forgotLoading} style={btn(forgotLoading)}>{forgotLoading ? 'Resetting…' : 'Reset Password'}</button>
          <button type="button" onClick={() => { setStep('reset-otp'); setForgotError('') }} style={{ ...ghostBtn, textAlign: 'center' }}>← Back</button>
        </form>
      </div>
    </div></div>
  )

  // ── Main card ─────────────────────────────────────────
  return (
    <div style={outerWrap}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Brand />
        <div style={card}>

          {/* ── Admin 2FA step ── */}
          {step === 'admin-otp' && (
            <form onSubmit={handleAdminOTP} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 36 }}>🔐</div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: 15, marginTop: 8 }}>Admin verification</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4 }}>
                  A 6-digit code was sent to <span style={{ color: theme.primary, fontWeight: 700 }}>{pendingEmail}</span>
                </div>
              </div>
              <OtpBoxes value={otp} onChange={setOtp} />
              {otpError && <div style={errBox}>{otpError}</div>}
              <button type="submit" disabled={otpLoading || otp.length !== 6} style={btn(otpLoading || otp.length !== 6)}>
                {otpLoading ? 'Verifying…' : 'Verify & Sign In'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" onClick={() => { setStep('form'); setOtp(''); setOtpError('') }} style={ghostBtn}>← Back</button>
                <button type="button" onClick={handleResendAdminOTP} disabled={resendCooldown > 0} style={resendStyle(resendCooldown > 0)}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* ── Login inline OTP steps ── */}
          {(step === 'otp' || step === 'phone-otp') && (
            <form onSubmit={step === 'otp' ? handleVerifyOTP : handleVerifyPhoneOTP} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <div style={{ fontSize: 36 }}>{step === 'otp' ? '📧' : '📱'}</div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: 15, marginTop: 8 }}>
                  {step === 'otp' ? 'Verify your email' : 'Verify your phone'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4 }}>
                  Code sent to <span style={{ color: theme.primary, fontWeight: 700 }}>{step === 'otp' ? pendingEmail : pendingPhone}</span>
                </div>
              </div>
              <OtpBoxes value={otp} onChange={setOtp} />
              {otpError && <div style={errBox}>{otpError}</div>}
              <button type="submit" disabled={otpLoading || otp.length !== 6} style={btn(otpLoading || otp.length !== 6)}>
                {otpLoading ? 'Verifying…' : step === 'otp' ? 'Verify Email' : 'Verify Phone'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" onClick={() => { setStep('form'); setOtp(''); setOtpError('') }} style={ghostBtn}>← Back</button>
                <button type="button" onClick={step === 'otp' ? handleResendOTP : handleResendPhoneOTP} disabled={resendCooldown > 0} style={resendStyle(resendCooldown > 0)}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* ── Login / Register form ── */}
          {step === 'form' && (
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 4, marginBottom: 20, gap: 4 }}>
                {['login', 'register'].map(t => (
                  <button key={t} onClick={() => { setTab(t); setError(''); if (t === 'register') resetRegister() }} style={{
                    flex: 1, padding: '9px 0', borderRadius: 7, fontSize: 14, fontWeight: 700,
                    background: tab === t ? theme.grad : 'transparent',
                    color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                    border: tab === t ? '1px solid rgba(249,115,22,0.3)' : 'none', cursor: 'pointer',
                  }}>{t === 'login' ? 'Login' : 'Sign Up'}</button>
                ))}
              </div>

              {/* ── Login ── */}
              {tab === 'login' && (
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label>Email address</label>
                    <input style={inp} type="email" placeholder="you@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} autoComplete="email" autoFocus />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inp, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Your password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} autoComplete="current-password" />
                      <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>{showPw ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginTop: -8 }}>
                    <button type="button" onClick={() => { setStep('forgot'); setForgotError(''); setForgotEmail(loginEmail) }} style={{ background: 'none', border: 'none', fontSize: 12, cursor: 'pointer', color: theme.primary, fontWeight: 600 }}>Forgot password?</button>
                  </div>
                  {error && <div style={{ ...errBox, color: error.startsWith('Password reset') ? '#4ade80' : '#f87171', background: error.startsWith('Password reset') ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)' }}>{error}</div>}
                  <button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Signing in…' : 'Login'}</button>
                </form>
              )}

              {/* ── Sign Up with inline OTP ── */}
              {tab === 'register' && (
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} autoComplete="off">


                  {/* Name */}
                  <div className="form-group">
                    <label>Full name</label>
                    <input style={inp} placeholder="Display name" value={name} onChange={e => setName(e.target.value)} autoComplete="off" />
                  </div>

                  {/* Email + Send OTP */}
                  <div className="form-group">
                    <label>Email</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input style={{ ...inp, flex: 1 }} type="text" inputMode="email" placeholder="you@example.com" value={email}
                        onChange={e => { setEmail(e.target.value); setEmailOtpSent(false); setEmailOtpVerified(false); setEmailVerifiedToken('') }}
                        disabled={emailOtpVerified} autoComplete="off" />
                      {!emailOtpVerified && (
                        <SendOtpBtn onClick={handleSendEmailOtp} loading={emailOtpLoading} sent={emailOtpSent} cooldown={emailResend} />
                      )}
                      {emailOtpVerified && <VerifiedBadge />}
                    </div>
                    {emailOtpError && <div style={{ ...errBox, marginTop: 6 }}>{emailOtpError}</div>}
                  </div>

                  {/* Email OTP boxes */}
                  {emailOtpSent && !emailOtpVerified && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <OtpBoxes value={emailOtp} onChange={setEmailOtp} disabled={emailOtpLoading} />
                      <button type="button" onClick={handleVerifyEmailOtp} disabled={emailOtpLoading || emailOtp.replace(/\s/g,'').length !== 6} style={btn(emailOtpLoading || emailOtp.replace(/\s/g,'').length !== 6)}>
                        {emailOtpLoading ? 'Verifying…' : 'Verify Email'}
                      </button>
                      <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                        📭 Not seeing it? Check your <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Spam</span> or <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Junk</span> folder.
                      </div>
                    </div>
                  )}

                  {/* Phone (optional, no OTP) */}
                  <div className="form-group">
                    <label>Phone (optional)</label>
                    <input style={inp} type="tel" inputMode="numeric" placeholder="Mobile number"
                      value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,15))}
                      autoComplete="off" />
                  </div>

                  {/* Password — always visible */}
                  <div className="form-group">
                    <label>Create password</label>
                    <div style={{ position: 'relative' }}>
                      <input style={{ ...inp, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Min. 8 chars, uppercase & number" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>{showPw ? '🙈' : '👁️'}</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Confirm password</label>
                    <input style={inp} type={showPw ? 'text' : 'password'} placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
                  </div>

                  {error && <div style={errBox}>{error}</div>}

                  <button type="submit" disabled={loading || !emailOtpVerified} style={btn(loading || !emailOtpVerified)}>
                    {loading ? 'Creating account…' : 'Create Account'}
                  </button>
                </form>
              )}

              {/* ── Google sign-in ── */}
              {GOOGLE_CLIENT_ID && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>or</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={!googleReady || gLoading}
                    style={{
                      width: '100%', padding: '13px 16px', borderRadius: 11,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      color: '#fff', fontSize: 15, fontWeight: 600,
                      cursor: googleReady ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      fontFamily: 'inherit', transition: 'background 0.2s, border-color 0.2s',
                      opacity: gLoading ? 0.7 : 1,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
                  >
                    {gLoading ? (
                      <span style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    ) : (
                      <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0 }}>
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    {gLoading ? 'Signing in…' : 'Continue with Google'}
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  )
}
