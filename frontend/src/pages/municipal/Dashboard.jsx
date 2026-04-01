import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { getStats } from '../../api/dashboard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { SEVERITY_COLORS } from '../../utils/formatters'
import { FileText, Brain, CheckCircle2, XCircle, TrendingUp, Activity, AlertCircle } from 'lucide-react'

const STAT_CARDS = [
  { key: 'totalReports', label: 'Total Reports', Icon: FileText,      grad: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', glow: 'rgba(59,130,246,0.3)'  },
  { key: 'pendingAi',    label: 'Pending AI',    Icon: Brain,         grad: 'linear-gradient(135deg,#64748b,#334155)', glow: 'rgba(100,116,139,0.25)' },
  { key: 'aiVerified',   label: 'AI Verified',   Icon: CheckCircle2,  grad: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', glow: 'rgba(139,92,246,0.3)'  },
  { key: 'openRFQs',     label: 'Open RFQs',     Icon: AlertCircle,   grad: 'linear-gradient(135deg,#eab308,#ca8a04)', glow: 'rgba(234,179,8,0.3)'   },
  { key: 'completed',    label: 'Completed',     Icon: TrendingUp,    grad: 'linear-gradient(135deg,#22c55e,#15803d)', glow: 'rgba(34,197,94,0.3)'   },
  { key: 'rejected',     label: 'Rejected',      Icon: XCircle,       grad: 'linear-gradient(135deg,#ef4444,#b91c1c)', glow: 'rgba(239,68,68,0.3)'   },
]

const STATUS_COLORS_MAP = {
  'Pending AI':  '#64748b',
  'AI Verified': '#8b5cf6',
  'RFQ Gen.':    '#a855f7',
  'In Progress': '#eab308',
  'Completed':   '#22c55e',
  'Rejected':    '#ef4444',
}

function StatCard({ label, value, Icon, grad, glow }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hovered ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.07)'}`,
        borderRadius: 16, padding: 20,
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? `0 0 30px ${glow}, 0 8px 32px rgba(0,0,0,0.5)` : 'none',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 80, height: 80, borderRadius: '50%',
        background: glow, filter: 'blur(28px)', opacity: hovered ? 0.7 : 0.4,
        transition: 'opacity 0.25s',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>
          {label}
        </p>
        <div style={{
          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
          background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 14px ${glow}`,
        }}>
          <Icon style={{ width: 15, height: 15, color: '#fff' }} />
        </div>
      </div>
      <p style={{ fontSize: 34, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.03em', lineHeight: 1, margin: 0 }}>
        {value ?? 0}
      </p>
    </div>
  )
}

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(148,163,184,0.07)', borderRadius: 16, padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        {Icon && <Icon style={{ width: 14, height: 14, color: '#3b82f6' }} />}
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: 0, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then(res => setStats(res.data))
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  const severityData = stats ? Object.entries(stats.severityBreakdown).map(([name, value]) => ({ name, value })) : []
  const statusData   = stats ? [
    { name: 'Pending AI',  value: stats.pendingAi },
    { name: 'AI Verified', value: stats.aiVerified },
    { name: 'RFQ Gen.',    value: stats.rfqGenerated },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Completed',   value: stats.completed },
    { name: 'Rejected',    value: stats.rejected },
  ].filter(d => d.value > 0) : []
  const lineData = stats?.reportsByDay || []

  const tooltipStyle = {
    background: '#0c0f1c', border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.7)', padding: '10px 14px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="animate-fade-up">

      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.02em' }}>
          Municipal Dashboard
        </h1>
        <p style={{ fontSize: 14, color: '#475569', marginTop: 4 }}>Real-time pothole management overview</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14 }}>
        {STAT_CARDS.map(c => (
          <StatCard key={c.key} label={c.label} value={stats?.[c.key] ?? 0} Icon={c.Icon} grad={c.grad} glow={c.glow} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <ChartCard title="Severity Breakdown" icon={Activity}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={severityData} barSize={36}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" name="Reports" radius={[6, 6, 0, 0]}>
                {severityData.map(e => <Cell key={e.name} fill={SEVERITY_COLORS[e.name] || '#64748b'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pipeline Status" icon={FileText}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">
                {statusData.map((e, i) => <Cell key={i} fill={STATUS_COLORS_MAP[e.name] || '#64748b'} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color: '#64748b', fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {lineData.length > 0 && (
        <ChartCard title="Reports Per Day — Last 30 Days" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
              <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" name="Reports" stroke="#3b82f6" strokeWidth={2.5} dot={false}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: 'rgba(59,130,246,0.3)', strokeWidth: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}
