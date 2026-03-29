import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { getAllReports, verifyReport } from '../../api/potholes'
import { generateRFQ } from '../../api/rfqs'
import MapView from '../../components/map/MapView'
import SeverityBadge from '../../components/common/SeverityBadge'
import StatusBadge from '../../components/common/StatusBadge'
import { formatDateTime } from '../../utils/formatters'
import { X, FileText, CheckCircle } from 'lucide-react'

const SEVERITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function ReportsMap() {
  const navigate = useNavigate()
  const [reports, setReports]       = useState([])
  const [selected, setSelected]     = useState(null)
  const [severity, setSeverity]     = useState('')
  const [generating, setGenerating] = useState(false)
  const [verifying, setVerifying]   = useState(false)

  const load = (sev) => {
    getAllReports(sev ? { severity: sev } : {})
      .then((res) => setReports(res.data))
      .catch(() => toast.error('Failed to load reports'))
  }

  useEffect(() => { load(severity) }, [severity])

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const res = await verifyReport(selected.id)
      setSelected(res.data)
      load(severity)
      toast.success('Report verified')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  const handleGenerateRFQ = async () => {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 7)
    setGenerating(true)
    try {
      await generateRFQ(selected.id, { deadline: deadline.toISOString() })
      load(severity)
      setSelected(null)
      toast.success('RFQ generated successfully!')
      navigate('/rfqs')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate RFQ')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="relative h-full">
      {/* Filter bar */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md p-3 flex gap-2 flex-wrap">
        {SEVERITIES.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setSeverity(s)}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors
              ${severity === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
          >
            {s || 'All'}
          </button>
        ))}
        <span className="text-xs text-gray-400 self-center ml-2">{reports.length} reports</span>
      </div>

      <MapView
        potholes={reports}
        onMarkerClick={setSelected}
      />

      {/* Side panel */}
      {selected && (
        <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-xl overflow-y-auto z-10">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Report #{selected.id}</h3>
            <button onClick={() => setSelected(null)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {selected.imageUrl && (
            <img src={selected.imageUrl} alt="Pothole" className="w-full h-48 object-cover" />
          )}

          <div className="p-4 space-y-3">
            <div className="flex gap-2 flex-wrap">
              <SeverityBadge severity={selected.severity} />
              <StatusBadge status={selected.status} />
            </div>

            {selected.address && (
              <p className="text-sm text-gray-600">{selected.address}</p>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Lat</span>
                <p className="font-medium">{Number(selected.latitude).toFixed(5)}</p>
              </div>
              <div>
                <span className="text-gray-400">Lng</span>
                <p className="font-medium">{Number(selected.longitude).toFixed(5)}</p>
              </div>
              {selected.aiConfidence != null && (
                <div>
                  <span className="text-gray-400">AI Confidence</span>
                  <p className="font-medium">{Math.round(selected.aiConfidence * 100)}%</p>
                </div>
              )}
              {selected.estimatedDiameter && (
                <div>
                  <span className="text-gray-400">Diameter</span>
                  <p className="font-medium">{selected.estimatedDiameter} cm</p>
                </div>
              )}
              {selected.estimatedDepth && (
                <div>
                  <span className="text-gray-400">Depth</span>
                  <p className="font-medium">{selected.estimatedDepth} cm</p>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400">{formatDateTime(selected.createdAt)}</p>

            <div className="flex flex-col gap-2 pt-2">
              {selected.status === 'PENDING_AI' && (
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {verifying ? 'Verifying...' : 'Manually Verify'}
                </button>
              )}
              {selected.status === 'AI_VERIFIED' && (
                <button
                  onClick={handleGenerateRFQ}
                  disabled={generating}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {generating ? 'Generating...' : 'Generate RFQ'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
