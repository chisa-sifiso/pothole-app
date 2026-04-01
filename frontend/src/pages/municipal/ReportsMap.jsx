import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { getAllReports, verifyReport } from '../../api/potholes'
import { generateRFQ } from '../../api/rfqs'
import MapView from '../../components/map/MapView'
import SeverityBadge from '../../components/common/SeverityBadge'
import StatusBadge from '../../components/common/StatusBadge'
import { formatDateTime } from '../../utils/formatters'
import { X, FileText, CheckCircle, MapPin } from 'lucide-react'

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
      .then(res => setReports(res.data))
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
      toast.success('RFQ generated!')
      navigate('/rfqs')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate RFQ')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={{ position: 'relative', height: '100%' }}>

      {/* Filter bar */}
      <div style={{
        position: 'absolute', top: 16, left: 16, zIndex: 10,
        background: 'rgba(6,8,15,0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(148,163,184,0.1)',
        borderRadius: 12, padding: '10px 12px',
        display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}>
        {SEVERITIES.map(s => {
          const active = severity === s
          return (
            <button key={s || 'all'} onClick={() => setSeverity(s)} style={{
              padding: '4px 12px', borderRadius: 100, cursor: 'pointer',
              fontSize: 11, fontWeight: 600, letterSpacing: '0.03em', border: '1px solid',
              transition: 'all 0.2s',
              background: active ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
              color: active ? '#60a5fa' : '#64748b',
              borderColor: active ? 'rgba(59,130,246,0.35)' : 'rgba(148,163,184,0.1)',
            }}>
              {s || 'All'}
            </button>
          )
        })}
        <span style={{ fontSize: 11, color: '#334155', marginLeft: 4 }}>{reports.length} reports</span>
      </div>

      <MapView potholes={reports} onMarkerClick={setSelected} />

      {/* Side panel */}
      {selected && (
        <div style={{
          position: 'absolute', top: 0, right: 0, height: '100%', width: 300,
          background: 'rgba(6,8,15,0.94)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(148,163,184,0.1)',
          overflowY: 'auto', zIndex: 10,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Panel header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 16px',
            borderBottom: '1px solid rgba(148,163,184,0.08)',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
              Report #{selected.id}
            </span>
            <button onClick={() => setSelected(null)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#475569', padding: 4, display: 'flex', alignItems: 'center',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.color = '#475569'}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>

          {/* Image */}
          {selected.imageUrl && (
            <img src={selected.imageUrl} alt="Pothole"
              style={{ width: '100%', height: 180, objectFit: 'cover' }} />
          )}

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <SeverityBadge severity={selected.severity} />
              <StatusBadge status={selected.status} />
            </div>

            {/* Address */}
            {selected.address && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <MapPin style={{ width: 12, height: 12, color: '#475569', marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{selected.address}</p>
              </div>
            )}

            {/* Stats grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
            }}>
              {[
                ['Latitude',    Number(selected.latitude).toFixed(5)],
                ['Longitude',   Number(selected.longitude).toFixed(5)],
                selected.aiConfidence != null && ['AI Confidence', `${Math.round(selected.aiConfidence * 100)}%`],
                selected.estimatedDiameter && ['Diameter', `${selected.estimatedDiameter} cm`],
                selected.estimatedDepth    && ['Depth',    `${selected.estimatedDepth} cm`],
              ].filter(Boolean).map(([label, val]) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px',
                  border: '1px solid rgba(148,163,184,0.07)',
                }}>
                  <p style={{ fontSize: 10, color: '#334155', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</p>
                  <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, fontWeight: 600 }}>{val}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 11, color: '#334155', margin: 0 }}>{formatDateTime(selected.createdAt)}</p>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
              {selected.status === 'PENDING_AI' && (
                <button onClick={handleVerify} disabled={verifying} className="btn-secondary" style={{ justifyContent: 'center' }}>
                  <CheckCircle style={{ width: 14, height: 14 }} />
                  {verifying ? 'Verifying…' : 'Manually Verify'}
                </button>
              )}
              {selected.status === 'AI_VERIFIED' && (
                <button onClick={handleGenerateRFQ} disabled={generating} className="btn-primary" style={{ justifyContent: 'center' }}>
                  <FileText style={{ width: 14, height: 14 }} />
                  {generating ? 'Generating…' : 'Generate RFQ'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
