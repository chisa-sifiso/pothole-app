import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getAllRFQs } from '../../api/rfqs'
import SeverityBadge from '../../components/common/SeverityBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDate } from '../../utils/formatters'
import { FileText, Clock, MapPin } from 'lucide-react'

export default function AvailableRFQs() {
  const [rfqs, setRfqs]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllRFQs()
      .then((res) => setRfqs(res.data.filter((r) => r.status === 'OPEN')))
      .catch(() => toast.error('Failed to load RFQs'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading available RFQs..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Available RFQs</h1>
        <p className="text-gray-500 mt-1">{rfqs.length} open request{rfqs.length !== 1 ? 's' : ''} for quotation</p>
      </div>

      {rfqs.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No open RFQs at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rfqs.map((rfq) => {
            const isExpired = new Date(rfq.deadline) < new Date()
            return (
              <div key={rfq.id} className="card">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900">RFQ #{rfq.id}</span>
                      <SeverityBadge severity={rfq.potholeReport?.severity} />
                      {isExpired && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Expired</span>
                      )}
                    </div>

                    {rfq.potholeReport?.address && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                        <MapPin className="w-3 h-3" />
                        {rfq.potholeReport.address}
                      </div>
                    )}

                    {rfq.potholeReport?.estimatedDiameter && (
                      <p className="text-xs text-gray-400 mb-2">
                        Est. size: {rfq.potholeReport.estimatedDiameter} cm wide × {rfq.potholeReport.estimatedDepth} cm deep
                      </p>
                    )}

                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      Deadline: {formatDate(rfq.deadline)}
                    </div>
                  </div>

                  {rfq.potholeReport?.imageUrl && (
                    <img
                      src={rfq.potholeReport.imageUrl}
                      alt="Pothole"
                      className="w-24 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                  <Link
                    to={`/bid/${rfq.id}`}
                    className={`btn-primary flex-1 text-center ${isExpired ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    Submit Bid
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
