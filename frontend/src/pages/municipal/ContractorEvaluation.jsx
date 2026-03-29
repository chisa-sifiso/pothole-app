import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getBids, getRFQById, awardBid } from '../../api/rfqs'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import SeverityBadge from '../../components/common/SeverityBadge'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { Star, Trophy, ArrowLeft } from 'lucide-react'

function ScoreBar({ score }) {
  const pct = score != null ? Math.round(score * 100) : 0
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-8 text-right">{pct}%</span>
    </div>
  )
}

export default function ContractorEvaluation() {
  const { rfqId }   = useParams()
  const navigate    = useNavigate()
  const [rfq, setRfq]         = useState(null)
  const [bids, setBids]       = useState([])
  const [loading, setLoading] = useState(true)
  const [awarding, setAwarding] = useState(null)

  const load = () => {
    Promise.all([getRFQById(rfqId), getBids(rfqId)])
      .then(([rfqRes, bidsRes]) => {
        setRfq(rfqRes.data)
        // Sort by weighted score descending
        const sorted = [...bidsRes.data].sort((a, b) =>
          (b.weightedScore ?? -1) - (a.weightedScore ?? -1)
        )
        setBids(sorted)
      })
      .catch(() => toast.error('Failed to load evaluation data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [rfqId])

  const handleAward = async (bidId) => {
    setAwarding(bidId)
    try {
      await awardBid(rfqId, bidId)
      toast.success('Contract awarded successfully!')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to award contract')
    } finally {
      setAwarding(null)
    }
  }

  if (loading) return <LoadingSpinner text="Loading bid evaluation..." />

  const isAwarded = rfq?.status === 'AWARDED'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/rfqs')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contractor Evaluation</h1>
          <p className="text-gray-500 mt-0.5">RFQ #{rfqId} — {bids.length} bid{bids.length !== 1 ? 's' : ''} received</p>
        </div>
      </div>

      {rfq?.potholeReport && (
        <div className="card flex gap-4">
          {rfq.potholeReport.imageUrl && (
            <img src={rfq.potholeReport.imageUrl} alt="Pothole" className="w-20 h-20 object-cover rounded-lg" />
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">Pothole Report #{rfq.potholeReport.id}</span>
              <SeverityBadge severity={rfq.potholeReport.severity} />
            </div>
            <p className="text-sm text-gray-500">{rfq.potholeReport.address || 'No address'}</p>
            {rfq.potholeReport.estimatedDiameter && (
              <p className="text-xs text-gray-400 mt-1">
                ~{rfq.potholeReport.estimatedDiameter} cm wide × {rfq.potholeReport.estimatedDepth} cm deep
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        <strong>AI Weighted Scoring Formula:</strong> Cost (40%) + Contractor Rating (35%) + Speed (25%).
        Scores are computed across all bids — higher is better.
      </div>

      {bids.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No bids have been submitted yet.</div>
      ) : (
        <div className="space-y-4">
          {bids.map((bid) => (
            <div
              key={bid.id}
              className={`card border-2 ${bid.awarded ? 'border-green-400 bg-green-50/30' : 'border-transparent'}`}
            >
              <div className="flex flex-wrap justify-between gap-4">
                <div className="flex items-center gap-3">
                  {bid.awarded && <Trophy className="w-5 h-5 text-yellow-500" />}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{bid.companyName}</span>
                      <span className="text-sm text-gray-500">({bid.contractorName})</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500 mt-0.5">
                      {[1,2,3,4,5].map((n) => (
                        <Star key={n} className={`w-3 h-3 ${n <= Math.round(bid.contractorRating) ? 'fill-yellow-400' : 'fill-gray-200'}`} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">
                        {Number(bid.contractorRating).toFixed(1)} · {bid.completedJobs} jobs
                      </span>
                    </div>
                  </div>
                </div>

                {!isAwarded && (
                  <button
                    onClick={() => handleAward(bid.id)}
                    disabled={awarding !== null}
                    className="btn-primary"
                  >
                    {awarding === bid.id ? 'Awarding...' : 'Award Contract'}
                  </button>
                )}
                {bid.awarded && (
                  <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    Awarded
                  </span>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Bid Price</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(bid.price)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Completion Time</p>
                  <p className="font-semibold text-gray-900">{bid.completionDays} day{bid.completionDays !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Weighted Score</p>
                  <ScoreBar score={bid.weightedScore} />
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1">Repair Method</p>
                <p className="text-sm text-gray-600">{bid.repairMethod}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
