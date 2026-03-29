import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getAllRFQs } from '../../api/rfqs'
import SeverityBadge from '../../components/common/SeverityBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDate, formatDateTime } from '../../utils/formatters'
import { FileText, Users, Clock } from 'lucide-react'

const STATUS_STYLES = {
  OPEN:    'bg-green-100 text-green-700',
  CLOSED:  'bg-gray-100 text-gray-700',
  AWARDED: 'bg-blue-100 text-blue-700',
}

export default function RFQManagement() {
  const [rfqs, setRfqs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('ALL')

  useEffect(() => {
    getAllRFQs()
      .then((res) => setRfqs(res.data))
      .catch(() => toast.error('Failed to load RFQs'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? rfqs : rfqs.filter((r) => r.status === filter)

  if (loading) return <LoadingSpinner text="Loading RFQs..." />

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFQ Management</h1>
          <p className="text-gray-500 mt-1">{rfqs.length} total requests for quotation</p>
        </div>
        <Link to="/map" className="btn-secondary flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Generate from Map
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['ALL', 'OPEN', 'AWARDED', 'CLOSED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No RFQs found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((rfq) => (
            <div key={rfq.id} className="card flex flex-wrap gap-4 items-start">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">RFQ #{rfq.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[rfq.status]}`}>
                    {rfq.status}
                  </span>
                  <SeverityBadge severity={rfq.potholeReport?.severity} />
                </div>

                {rfq.potholeReport?.address && (
                  <p className="text-sm text-gray-600 mb-2">{rfq.potholeReport.address}</p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Generated: {formatDate(rfq.generatedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Deadline: {formatDate(rfq.deadline)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {rfq.bidCount} bid{rfq.bidCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                {rfq.bidCount > 0 && rfq.status === 'OPEN' && (
                  <Link
                    to={`/evaluation/${rfq.id}`}
                    className="btn-primary text-sm"
                  >
                    Evaluate Bids
                  </Link>
                )}
                {rfq.status === 'AWARDED' && (
                  <Link
                    to={`/evaluation/${rfq.id}`}
                    className="btn-secondary text-sm"
                  >
                    View Result
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
