import { STATUS_BG, statusLabel } from '../../utils/formatters'

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BG[status] || 'bg-gray-100 text-gray-700'}`}>
      {statusLabel(status)}
    </span>
  )
}
