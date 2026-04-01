import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getAllRFQs } from '../../api/rfqs'
import SeverityBadge from '../../components/common/SeverityBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDate } from '../../utils/formatters'
import { FileText, Users, Clock, ChevronRight, Map } from 'lucide-react'

const STATUS_STYLE = {
  OPEN:    { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80', border: 'rgba(34,197,94,0.25)'  },
  CLOSED:  { bg: 'rgba(100,116,139,0.12)',color: '#94a3b8', border: 'rgba(100,116,139,0.25)'},
  AWARDED: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
}

const FILTERS = ['ALL', 'OPEN', 'AWARDED', 'CLOSED']

export default function RFQManagement() {
  const [rfqs, setRfqs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('ALL')

  useEffect(() => {
    getAllRFQs()
      .then(res => setRfqs(res.data))
      .catch(() => toast.error('Failed to load RFQs'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? rfqs : rfqs.filter(r => r.status === filter)

  if (loading) return <LoadingSpinner text="Loading RFQs..." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-up">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
            RFQ Management
          </h1>
          <p style={{ fontSize: 14, color: '#475569', marginTop: 4 }}>
            {rfqs.length} total requests for quotation
          </p>
        </div>
        <Link to="/map" className="btn-secondary" style={{ gap: 8 }}>
          <Map style={{ width: 14, height: 14 }} />
          Generate from Map
        </Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {FILTERS.map(f => {
          const active = filter === f
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 16px', borderRadius: 100,
              fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
              cursor: 'pointer', transition: 'all 0.2s', border: '1px solid',
              background: active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
              color: active ? '#60a5fa' : '#475569',
              borderColor: active ? 'rgba(59,130,246,0.3)' : 'rgba(148,163,184,0.1)',
            }}>
              {f}
            </button>
          )
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid rgba(148,163,184,0.07)',
          borderRadius: 16, padding: '64px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText style={{ width: 22, height: 22, color: '#3b82f6' }} />
          </div>
          <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>No RFQs found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(rfq => {
            const ss = STATUS_STYLE[rfq.status] || STATUS_STYLE.CLOSED
            return (
              <div key={rfq.id}
                style={{
                  background: 'var(--bg-surface)', borderRadius: 16, padding: 20,
                  border: '1px solid rgba(148,163,184,0.07)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.13)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {/* Left: info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>RFQ #{rfq.id}</span>
                    <span style={{
                      padding: '2px 9px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                      background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                    }}>
                      {rfq.status}
                    </span>
                    <SeverityBadge severity={rfq.potholeReport?.severity} />
                  </div>

                  {rfq.potholeReport?.address && (
                    <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 10px' }}>
                      {rfq.potholeReport.address}
                    </p>
                  )}

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#334155' }}>
                      <Clock style={{ width: 11, height: 11 }} />
                      Generated: <span style={{ color: '#64748b' }}>{formatDate(rfq.generatedAt)}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#334155' }}>
                      <Clock style={{ width: 11, height: 11 }} />
                      Deadline: <span style={{ color: '#64748b' }}>{formatDate(rfq.deadline)}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#334155' }}>
                      <Users style={{ width: 11, height: 11 }} />
                      <span style={{ color: rfq.bidCount > 0 ? '#60a5fa' : '#334155', fontWeight: rfq.bidCount > 0 ? 600 : 400 }}>
                        {rfq.bidCount} bid{rfq.bidCount !== 1 ? 's' : ''}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Right: action */}
                <div>
                  {rfq.bidCount > 0 && rfq.status === 'OPEN' && (
                    <Link to={`/evaluation/${rfq.id}`} className="btn-primary" style={{ fontSize: 13 }}>
                      Evaluate Bids
                      <ChevronRight style={{ width: 14, height: 14 }} />
                    </Link>
                  )}
                  {rfq.status === 'AWARDED' && (
                    <Link to={`/evaluation/${rfq.id}`} className="btn-secondary" style={{ fontSize: 13 }}>
                      View Result
                      <ChevronRight style={{ width: 14, height: 14 }} />
                    </Link>
                  )}
                  {rfq.status === 'OPEN' && rfq.bidCount === 0 && (
                    <span style={{ fontSize: 12, color: '#334155', fontStyle: 'italic' }}>Awaiting bids…</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
