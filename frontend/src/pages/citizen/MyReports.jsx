import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { getMyReports } from '../../api/potholes'
import SeverityBadge from '../../components/common/SeverityBadge'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDate } from '../../utils/formatters'

const STATUS_STEPS = [
  { key: 'PENDING_AI',    label: 'Submitted' },
  { key: 'AI_VERIFIED',   label: 'AI Verified' },
  { key: 'RFQ_GENERATED', label: 'RFQ Issued' },
  { key: 'ASSIGNED',      label: 'Contractor Assigned' },
  { key: 'IN_PROGRESS',   label: 'Repair In Progress' },
  { key: 'COMPLETED',     label: 'Completed' },
]

const STATUS_INDEX = Object.fromEntries(STATUS_STEPS.map((s, i) => [s.key, i]))

function StatusStepper({ status }) {
  if (status === 'REJECTED') {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs font-medium text-red-500">Report rejected by AI — not identified as a pothole</p>
      </div>
    )
  }
  const currentIndex = STATUS_INDEX[status] ?? 0
  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((step, i) => {
          const done    = i < currentIndex
          const active  = i === currentIndex
          const last    = i === STATUS_STEPS.length - 1
          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                  done   ? 'bg-blue-500 border-blue-500' :
                  active ? 'bg-white border-blue-500' :
                           'bg-white border-gray-300'
                }`}>
                  {done && (
                    <svg className="w-full h-full text-white p-0.5" viewBox="0 0 12 12" fill="currentColor">
                      <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    </svg>
                  )}
                  {active && <div className="w-2 h-2 bg-blue-500 rounded-full m-auto mt-0.5" />}
                </div>
                <span className={`text-[9px] mt-1 text-center leading-tight max-w-[52px] hidden sm:block ${
                  done || active ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {!last && (
                <div className={`flex-1 h-0.5 mx-1 ${i < currentIndex ? 'bg-blue-500' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
      <p className="text-xs text-blue-600 font-medium mt-2 sm:hidden">
        {STATUS_STEPS[currentIndex]?.label}
      </p>
    </div>
  )
}

export default function MyReports() {
  const [reports, setReports]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState({})

  useEffect(() => {
    getMyReports()
      .then((res) => setReports(res.data))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading your reports..." />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
          <p className="text-gray-500 mt-1">{reports.length} pothole{reports.length !== 1 ? 's' : ''} reported</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="card text-center py-12">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No reports yet</h3>
          <p className="text-gray-500 mt-1">When you report potholes they will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => {
            const isExpanded = !!expanded[report.id]
            return (
              <div key={report.id} className="card">
                <div className="flex gap-4">
                  {report.imageUrl && (
                    <img
                      src={report.imageUrl}
                      alt="Pothole"
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">Report #{report.id}</span>
                      <SeverityBadge severity={report.severity} />
                      <StatusBadge status={report.status} />
                      <button
                        onClick={() => setExpanded((prev) => ({ ...prev, [report.id]: !prev[report.id] }))}
                        className="ml-auto text-gray-400 hover:text-gray-600"
                        title={isExpanded ? 'Hide progress' : 'Show progress'}
                      >
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />
                        }
                      </button>
                    </div>
                    {report.address && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{report.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(report.createdAt)}
                      </span>
                      {report.aiConfidence != null && (
                        <span>AI confidence: {Math.round(report.aiConfidence * 100)}%</span>
                      )}
                      {report.estimatedDiameter && (
                        <span>~{report.estimatedDiameter} cm wide</span>
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
