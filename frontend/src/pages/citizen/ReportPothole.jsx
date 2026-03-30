import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MapPin, AlertCircle, CheckCircle, Ruler, X } from 'lucide-react'
import { reportPothole } from '../../api/potholes'
import { useGeolocation } from '../../hooks/useGeolocation'
import ImageUploader from '../../components/common/ImageUploader'
import SeverityBadge from '../../components/common/SeverityBadge'
import PotholeMeasure from './PotholeMeasure'

/* ── Tyre SVG icon ─────────────────────────────────────────── */
function TyreIcon({ filled, size = 40 }) {
  const color  = filled ? '#D97706' : '#D1D5DB'
  const inner  = filled ? '#F59E0B' : '#E5E7EB'
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* outer tyre */}
      <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="4" fill={filled ? '#FEF3C7' : '#F9FAFB'} />
      {/* tread blocks */}
      {[0,45,90,135,180,225,270,315].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x1  = 20 + 13 * Math.cos(rad)
        const y1  = 20 + 13 * Math.sin(rad)
        const x2  = 20 + 18 * Math.cos(rad)
        const y2  = 20 + 18 * Math.sin(rad)
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      })}
      {/* inner rim */}
      <circle cx="20" cy="20" r="9" stroke={color} strokeWidth="2.5" fill={inner} />
      {/* hub */}
      <circle cx="20" cy="20" r="3.5" fill={color} />
      {/* rim spokes */}
      {[0, 72, 144, 216, 288].map((angle) => {
        const rad = (angle * Math.PI) / 180
        return (
          <line key={angle}
            x1={20 + 3.5 * Math.cos(rad)} y1={20 + 3.5 * Math.sin(rad)}
            x2={20 + 8.5 * Math.cos(rad)} y2={20 + 8.5 * Math.sin(rad)}
            stroke={color} strokeWidth="1.8" strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

/* ── Wheel selector ─────────────────────────────────────────── */
const WHEEL_LABELS = ['', 'Small', 'Medium', 'Large', 'Very large']
const WHEEL_DESCS  = ['', '< 30 cm', '30–60 cm', '60–90 cm', '> 90 cm']

function WheelSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="label">How many wheels fit inside the pothole?</label>
      <div className="flex items-center justify-center gap-3 py-3">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? null : n)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              value >= n
                ? 'scale-105'
                : 'opacity-40 hover:opacity-70'
            }`}
          >
            <TyreIcon filled={value >= n} size={44} />
            <span className={`text-xs font-semibold ${value >= n ? 'text-amber-600' : 'text-gray-400'}`}>
              {n}
            </span>
          </button>
        ))}
      </div>
      {value && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="text-sm font-medium text-amber-800">
            {value} wheel{value > 1 ? 's' : ''} — {WHEEL_LABELS[value]} pothole
          </span>
          <span className="text-xs text-amber-600">≈ {WHEEL_DESCS[value]}</span>
        </div>
      )}
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────── */
export default function ReportPothole() {
  const navigate = useNavigate()
  const { coords, loading: locLoading, error: locError } = useGeolocation()

  const [file, setFile]               = useState(null)
  const [address, setAddress]         = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult]           = useState(null)
  const [showMeasure, setShowMeasure] = useState(false)
  const [measurements, setMeasurements] = useState(null)
  const [wheelsFit, setWheelsFit]     = useState(null)

  const handleMeasureConfirm = (data) => {
    setMeasurements(data)
    toast.success('Measurements saved!')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file)   { toast.error('Please upload an image of the pothole'); return }
    if (!coords) { toast.error('Location not available'); return }

    setSubmitting(true)
    setUploadProgress(0)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('latitude', coords.lat)
      formData.append('longitude', coords.lng)
      if (address)    formData.append('address', address)
      if (wheelsFit)  formData.append('wheelsFit', wheelsFit)

      if (measurements) {
        formData.append('measuredLength', measurements.measuredLength)
        formData.append('measuredWidth',  measurements.measuredWidth)
        formData.append('measuredDepth',  measurements.measuredDepth)
        formData.append('concreteKg',     measurements.concreteKg)
      }

      const onUploadProgress = (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100))
      }

      const res = await reportPothole(formData, onUploadProgress)
      setResult(res.data)
      toast.success('Pothole reported successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit report')
    } finally {
      setSubmitting(false)
      setUploadProgress(0)
    }
  }

  /* ── Success screen ── */
  if (result) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Report Submitted!</h2>
          <p className="text-gray-500">Your pothole report has been submitted and analysed by AI.</p>

          <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Report ID</span>
              <span className="text-sm font-medium">#{result.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">AI Status</span>
              <span className={`text-sm font-medium ${result.status === 'AI_VERIFIED' ? 'text-green-600' : 'text-red-600'}`}>
                {result.status === 'AI_VERIFIED' ? '✓ Pothole Detected' : '✗ Not a Pothole'}
              </span>
            </div>
            {result.severity && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Severity</span>
                <SeverityBadge severity={result.severity} />
              </div>
            )}
            {result.aiConfidence != null && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">AI Confidence</span>
                <span className="text-sm font-medium">{Math.round(result.aiConfidence * 100)}%</span>
              </div>
            )}
            {result.wheelsFit && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Wheels fit</span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: result.wheelsFit }).map((_, i) => (
                    <TyreIcon key={i} filled size={20} />
                  ))}
                  <span className="text-sm font-medium text-amber-700 ml-1">{result.wheelsFit}</span>
                </div>
              </div>
            )}
            {result.measuredLengthCm && (
              <>
                <div className="border-t border-gray-200 pt-3">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Measurements</div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">L × W × D</span>
                  <span className="text-sm font-medium">
                    {result.measuredLengthCm} × {result.measuredWidthCm} × {result.measuredDepthCm} cm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Concrete estimate</span>
                  <span className="text-sm font-medium">{result.concreteEstimateKg} kg</span>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => { setResult(null); setMeasurements(null); setFile(null); setWheelsFit(null) }}
              className="btn-secondary flex-1"
            >
              Report Another
            </button>
            <button onClick={() => navigate('/my-reports')} className="btn-primary flex-1">
              View My Reports
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Form ── */
  return (
    <>
      {showMeasure && (
        <PotholeMeasure
          onClose={() => setShowMeasure(false)}
          onConfirm={handleMeasureConfirm}
        />
      )}

      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report a Pothole</h1>
          <p className="text-gray-500 mt-1">Upload an image and our AI will analyse the severity.</p>
        </div>

        {locError && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Location access denied — using default coordinates. Please enable location for accuracy.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-5">
          <ImageUploader label="Pothole Image *" onFileSelect={setFile} />

          {/* Wheel selector + measure — only after image selected */}
          {file && (
            <>
              {/* wheel size selector */}
              <div className="border-t border-gray-100 pt-4">
                <WheelSelector value={wheelsFit} onChange={setWheelsFit} />
              </div>

              {/* measure tool */}
              <div>
                {measurements ? (
                  <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-amber-800">
                          {measurements.measuredLength} × {measurements.measuredWidth} cm · {measurements.measuredDepth} cm deep
                        </div>
                        <div className="text-xs text-amber-600">
                          ~{Math.ceil(measurements.concreteKg / 40)} bags concrete · {measurements.concreteKg} kg
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setShowMeasure(true)}
                        className="text-xs text-amber-700 hover:text-amber-900 underline">
                        Redo
                      </button>
                      <button type="button" onClick={() => setMeasurements(null)}
                        className="text-amber-500 hover:text-amber-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowMeasure(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100 transition-colors text-sm font-medium"
                  >
                    <Ruler className="w-4 h-4" />
                    Measure Pothole Size (optional)
                  </button>
                )}
              </div>
            </>
          )}

          <div>
            <label className="label">Location</label>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
              {locLoading ? (
                <span className="text-sm text-gray-400">Getting your location...</span>
              ) : coords ? (
                <span className="text-sm text-gray-700">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</span>
              ) : (
                <span className="text-sm text-red-500">Location unavailable</span>
              )}
            </div>
          </div>

          <div>
            <label className="label">Street address <span className="text-gray-400">(optional)</span></label>
            <input
              className="input" type="text"
              placeholder="e.g. 15 Main Street, Sandton"
              value={address} onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {submitting && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Uploading image…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || locLoading || !file}
            className="btn-primary w-full"
          >
            {submitting
              ? uploadProgress < 100
                ? `Uploading… ${uploadProgress}%`
                : 'Analysing with AI…'
              : 'Submit Report'}
          </button>
        </form>
      </div>
    </>
  )
}
