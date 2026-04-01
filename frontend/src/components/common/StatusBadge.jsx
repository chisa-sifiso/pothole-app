import { statusLabel } from '../../utils/formatters'

const STATUS_STYLE = {
  PENDING_AI:    { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', border: 'rgba(100,116,139,0.25)' },
  AI_VERIFIED:   { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  REJECTED:      { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.25)'  },
  RFQ_GENERATED: { bg: 'rgba(168,85,247,0.12)',  color: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  ASSIGNED:      { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  IN_PROGRESS:   { bg: 'rgba(234,179,8,0.12)',   color: '#fbbf24', border: 'rgba(234,179,8,0.25)'  },
  COMPLETED:     { bg: 'rgba(34,197,94,0.12)',   color: '#4ade80', border: 'rgba(34,197,94,0.25)'  },
}

export default function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.PENDING_AI
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 9px', borderRadius: 100,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {statusLabel(status)}
    </span>
  )
}
