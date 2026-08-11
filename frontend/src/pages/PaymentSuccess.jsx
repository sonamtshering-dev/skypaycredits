// src/pages/PaymentSuccess.jsx
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { CheckCircle, XCircle } from 'lucide-react'

export default function PaymentSuccess() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const orderId    = params.get('order_id')
  const [status, setStatus] = useState('checking') // checking | paid | failed

  useEffect(() => {
    if (!orderId) { navigate('/orders'); return }

    // Poll payment status
    let attempts = 0
    const check = async () => {
      try {
        attempts++
        const { data } = await api.get(`/payment/status-by-order/${orderId}`)
        if (data.status === 'PAID' || data.status === 'COMPLETED') {
          setStatus('paid')
          setTimeout(() => navigate('/orders'), 2000)
        } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
          setStatus('failed')
        } else if (attempts < 20) {
          setTimeout(check, 3000)
        } else {
          setStatus('failed')
        }
      } catch {
        if (attempts < 5) setTimeout(check, 3000)
        else setStatus('failed')
      }
    }
    check()
  }, [orderId])

  return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: 80, paddingBottom: 64, maxWidth: 480, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 40 }}>

          {status === 'checking' && (
            <>
              <div style={{ width: 56, height: 56, border: '4px solid rgba(139,92,246,0.2)', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
              <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 8 }}>Verifying Payment...</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Please wait, this may take a few seconds</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>
          )}

          {status === 'paid' && (
            <>
              <div style={{ marginBottom: 16 }}><CheckCircle size={64} color="#22c55e" /></div>
              <div style={{ fontWeight: 900, fontSize: 24, color: '#fff', marginBottom: 8 }}>Payment Successful!</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Your diamonds are being delivered automatically</div>
              <div style={{ fontSize: 13, color: '#8b5cf6' }}>Redirecting to orders...</div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div style={{ marginBottom: 16 }}><XCircle size={64} color="#ef4444" /></div>
              <div style={{ fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 20 }}>Payment Failed or Cancelled</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>
                If you completed payment, please check your orders page. Contact support if diamonds were not delivered.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => navigate(-2)}>Try Again</button>
                <button className="btn btn-ghost" onClick={() => navigate('/orders')}>My Orders</button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}