import { severityLabel } from '../../utils/formatters'

const SEVERITY_STYLE = {
  LOW:      { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80',  border: 'rgba(34,197,94,0.25)',  dot: '#22c55e' },
  MEDIUM:   { bg: 'rgba(234,179,8,0.12)',  color: '#fbbf24',  border: 'rgba(234,179,8,0.25)',  dot: '#eab308' },
  HIGH:     { bg: 'rgba(249,115,22,0.12)', color: '#fb923c',  border: 'rgba(249,115,22,0.25)', dot: '#f97316' },
  CRITICAL: { bg: 'rgba(239,68,68,0.14)',  color: '#f87171',  border: 'rgba(239,68,68,0.30)',  dot: '#ef4444' },
}

export default function SeverityBadge({ severity }) {
  if (!severity) return (
    <span style={{ fontSize: 11, color: '#475569', fontStyle: 'italic' }}>—</span>
  )
  const s = SEVERITY_STYLE[severity] || SEVERITY_STYLE.MEDIUM
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 9px', borderRadius: 100,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {severityLabel(severity)}
    </span>
  )
}
