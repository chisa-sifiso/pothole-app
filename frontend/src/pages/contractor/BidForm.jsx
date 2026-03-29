import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { submitBid, getRFQById } from '../../api/rfqs'
import SeverityBadge from '../../components/common/SeverityBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { ArrowLeft, SendHorizonal } from 'lucide-react'

export default function BidForm() {
  const { rfqId } = useParams()
  const navigate  = useNavigate()
  const [rfq, setRfq]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  useEffect(() => {
    getRFQById(rfqId)
      .then((res) => setRfq(res.data))
      .catch(() => toast.error('RFQ not found'))
      .finally(() => setLoading(false))
  }, [rfqId])

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      await submitBid(rfqId, {
        price:         parseFloat(data.price),
        completionDays: parseInt(data.completionDays),
        repairMethod:  data.repairMethod,
      })
      toast.success('Bid submitted successfully!')
      navigate('/available-rfqs')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit bid')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Submit Bid</h1>
          <p className="text-gray-500 mt-0.5">RFQ #{rfqId}</p>
        </div>
      </div>

      {rfq?.potholeReport && (
        <div className="card flex gap-4">
          {rfq.potholeReport.imageUrl && (
            <img src={rfq.potholeReport.imageUrl} alt="Pothole" className="w-20 h-20 object-cover rounded-lg" />
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SeverityBadge severity={rfq.potholeReport.severity} />
            </div>
            <p className="text-sm text-gray-600">{rfq.potholeReport.address || 'No address provided'}</p>
            {rfq.potholeReport.estimatedDiameter && (
              <p className="text-xs text-gray-400 mt-1">
                ~{rfq.potholeReport.estimatedDiameter} cm × {rfq.potholeReport.estimatedDepth} cm
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div>
          <label className="label">Bid Price (ZAR) *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R</span>
            <input
              className="input pl-7"
              type="number"
              step="0.01"
              min="1"
              placeholder="5000.00"
              {...register('price', {
                required: 'Price is required',
                min: { value: 1, message: 'Price must be positive' }
              })}
            />
          </div>
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>

        <div>
          <label className="label">Estimated Completion (days) *</label>
          <input
            className="input"
            type="number"
            min="1"
            max="365"
            placeholder="e.g. 3"
            {...register('completionDays', {
              required: 'Completion days is required',
              min: { value: 1, message: 'Must be at least 1 day' }
            })}
          />
          {errors.completionDays && <p className="text-red-500 text-xs mt-1">{errors.completionDays.message}</p>}
        </div>

        <div>
          <label className="label">Repair Method *</label>
          <textarea
            className="input h-28 resize-none"
            placeholder="Describe your proposed repair method, materials, and approach..."
            {...register('repairMethod', { required: 'Repair method is required' })}
          />
          {errors.repairMethod && <p className="text-red-500 text-xs mt-1">{errors.repairMethod.message}</p>}
        </div>

        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-600">
          Your bid will be scored on: Cost (40%) + Your Rating (35%) + Completion Speed (25%)
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
          <SendHorizonal className="w-4 h-4" />
          {submitting ? 'Submitting bid...' : 'Submit Bid'}
        </button>
      </form>
    </div>
  )
}
