import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { getMyReports } from '../../api/potholes'
import SeverityBadge from '../../components/common/SeverityBadge'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDate } from '../../utils/formatters'

const STATUS_STEPS = [
  { key: 'PENDING_AI',    label: 'Submitted'   },
  { key: 'AI_VERIFIED',   label: 'AI Verified' },
  { key: 'RFQ_GENERATED', label: 'RFQ Issued'  },
  { key: 'ASSIGNED',      label: 'Assigned'    },
  { key: 'IN_PROGRESS',   label: 'In Progress' },
  { key: 'COMPLETED',     label: 'Completed'   },
]
const STATUS_INDEX = Object.fromEntries(STATUS_STEPS.map((s, i) => [s.key, i]))

function StatusStepper({ status }) {
  if (status === 'REJECTED') {
    return (
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(148,163,184,0.07)' }}>
        <p style={{ fontSize: 12, color: '#f87171', fontWeight: 500, margin: 0 }}>
          Report rejected — not identified as a pothole by AI
        </p>
      </div>
    )
  }
  const current = STATUS_INDEX[status] ?? 0
  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(148,163,184,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {STATUS_STEPS.map((step, i) => {
          const done   = i < current
          const active = i === current
          const last   = i === STATUS_STEPS.length - 1
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: last ? 'none' : 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  background: done ? '#3b82f6' : active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${done ? '#3b82f6' : active ? '#3b82f6' : 'rgba(148,163,184,0.2)'}`,
                  boxShadow: active ? '0 0 8px rgba(59,130,246,0.5)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {done && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {active && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6' }} />}
                </div>
                <span className="hidden sm:block" style={{
                  fontSize: 9, fontWeight: 600, letterSpacing: '0.04em',
                  color: done || active ? '#60a5fa' : '#334155',
                  textAlign: 'center', maxWidth: 52, lineHeight: 1.3, textTransform: 'uppercase',
                }}>
                  {step.label}
                </span>
              </div>
              {!last && (
                <div style={{
                  flex: 1, height: 2, margin: '0 3px',
                  background: i < current ? '#3b82f6' : 'rgba(148,163,184,0.1)',
                  borderRadius: 2,
                }} />
              )}
            </div>
          )
        })}
      </div>
      <p className="sm:hidden" style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600, marginTop: 8 }}>
        {STATUS_STEPS[current]?.label}
      </p>
    </div>
  )
}

export default function MyReports() {
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    getMyReports()
      .then(res => setReports(res.data))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading your reports..." />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-up">
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>My Reports</h1>
        <p style={{ fontSize: 14, color: '#475569', marginTop: 4 }}>
          {reports.length} pothole{reports.length !== 1 ? 's' : ''} reported
        </p>
      </div>

      {reports.length === 0 ? (
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
            <MapPin style={{ width: 22, height: 22, color: '#3b82f6' }} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#64748b', margin: 0 }}>No reports yet</h3>
          <p style={{ fontSize: 13, color: '#334155', margin: 0 }}>Potholes you report will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reports.map(report => {
            const isExpanded = !!expanded[report.id]
            return (
              <div key={report.id}
                style={{
                  background: 'var(--bg-surface)', borderRadius: 16, padding: 20,
                  border: '1px solid rgba(148,163,184,0.07)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.13)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.07)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', gap: 14 }}>
                  {report.imageUrl && (
                    <img src={report.imageUrl} alt="Pothole" style={{
                      width: 76, height: 76, objectFit: 'cover', borderRadius: 10, flexShrink: 0,
                      border: '1px solid rgba(148,163,184,0.1)',
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                        Report <span style={{ color: '#e2e8f0' }}>#{report.id}</span>
                      </span>
                      <SeverityBadge severity={report.severity} />
                      <StatusBadge status={report.status} />
                      <button
                        onClick={() => setExpanded(p => ({ ...p, [report.id]: !p[report.id] }))}
                        style={{
                          marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                          color: '#334155', padding: 4, display: 'flex', alignItems: 'center', transition: 'color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#60a5fa'}
                        onMouseLeave={e => e.currentTarget.style.color = '#334155'}
                      >
                        {isExpanded ? <ChevronUp style={{ width: 15, height: 15 }} /> : <ChevronDown style={{ width: 15, height: 15 }} />}
                      </button>
                    </div>

                    {report.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                        <MapPin style={{ width: 10, height: 10, color: '#334155', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {report.address}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#334155' }}>
                        <Calendar style={{ width: 10, height: 10 }} />
                        {formatDate(report.createdAt)}
                      </span>
                      {report.aiConfidence != null && (
                        <span style={{ fontSize: 11, color: '#334155' }}>
                          AI: <span style={{ color: '#60a5fa', fontWeight: 600 }}>{Math.round(report.aiConfidence * 100)}%</span>
                        </span>
                      )}
                      {report.estimatedDiameter && (
                        <span style={{ fontSize: 11, color: '#334155' }}>
                          ~<span style={{ color: '#94a3b8' }}>{report.estimatedDiameter} cm</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isExpanded && <StatusStepper status={report.status} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
