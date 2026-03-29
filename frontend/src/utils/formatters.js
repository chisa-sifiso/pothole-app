import { format } from 'date-fns'

export const formatDate = (date) =>
  date ? format(new Date(date), 'dd MMM yyyy') : '—'

export const formatDateTime = (date) =>
  date ? format(new Date(date), 'dd MMM yyyy HH:mm') : '—'

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount)

export const severityLabel = (severity) => {
  const map = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', CRITICAL: 'Critical' }
  return map[severity] || severity
}

export const statusLabel = (status) => {
  const map = {
    PENDING_AI:    'Pending AI',
    AI_VERIFIED:   'AI Verified',
    REJECTED:      'Rejected',
    RFQ_GENERATED: 'RFQ Generated',
    ASSIGNED:      'Assigned',
    IN_PROGRESS:   'In Progress',
    COMPLETED:     'Completed',
  }
  return map[status] || status
}

export const SEVERITY_COLORS = {
  LOW:      '#22c55e',
  MEDIUM:   '#eab308',
  HIGH:     '#f97316',
  CRITICAL: '#ef4444',
}

export const SEVERITY_BG = {
  LOW:      'bg-green-100 text-green-800',
  MEDIUM:   'bg-yellow-100 text-yellow-800',
  HIGH:     'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
}

export const STATUS_BG = {
  PENDING_AI:    'bg-gray-100 text-gray-700',
  AI_VERIFIED:   'bg-blue-100 text-blue-700',
  REJECTED:      'bg-red-100 text-red-700',
  RFQ_GENERATED: 'bg-purple-100 text-purple-700',
  ASSIGNED:      'bg-indigo-100 text-indigo-700',
  IN_PROGRESS:   'bg-yellow-100 text-yellow-700',
  COMPLETED:     'bg-green-100 text-green-700',
}
