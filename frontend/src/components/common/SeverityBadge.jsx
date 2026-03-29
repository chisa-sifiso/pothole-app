import { SEVERITY_BG, severityLabel } from '../../utils/formatters'

export default function SeverityBadge({ severity }) {
  if (!severity) return <span className="text-xs text-gray-400">Unknown</span>
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SEVERITY_BG[severity] || 'bg-gray-100 text-gray-700'}`}>
      {severityLabel(severity)}
    </span>
  )
}
