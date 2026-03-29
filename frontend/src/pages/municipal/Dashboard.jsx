import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { getStats } from '../../api/dashboard'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { SEVERITY_COLORS } from '../../utils/formatters'

const STATUS_COLORS = {
  PENDING_AI:    '#94a3b8',
  AI_VERIFIED:   '#3b82f6',
  REJECTED:      '#ef4444',
  RFQ_GENERATED: '#a855f7',
  ASSIGNED:      '#6366f1',
  IN_PROGRESS:   '#eab308',
  COMPLETED:     '#22c55e',
}

function StatCard({ label, value, color = 'blue' }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-700',
    green:  'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red:    'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    gray:   'bg-gray-50 text-gray-700',
  }
  return (
    <div className={`rounded-xl p-5 ${colors[color] || colors.blue}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats()
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Failed to load dashboard stats'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading dashboard..." />

  const severityData = stats
    ? Object.entries(stats.severityBreakdown).map(([name, value]) => ({ name, value }))
    : []

  const statusData = stats
    ? [
        { name: 'Pending AI',  value: stats.pendingAi },
        { name: 'AI Verified', value: stats.aiVerified },
        { name: 'RFQ Gen.',    value: stats.rfqGenerated },
        { name: 'In Progress', value: stats.inProgress },
        { name: 'Completed',   value: stats.completed },
        { name: 'Rejected',    value: stats.rejected },
      ].filter(d => d.value > 0)
    : []

  const lineData = stats?.reportsByDay || []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Municipal Dashboard</h1>
        <p className="text-gray-500 mt-1">Pothole management overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Reports"  value={stats.totalReports}  color="blue"   />
        <StatCard label="Pending AI"     value={stats.pendingAi}     color="gray"   />
        <StatCard label="AI Verified"    value={stats.aiVerified}    color="purple" />
        <StatCard label="Open RFQs"      value={stats.openRFQs ?? 0} color="yellow" />
        <StatCard label="Completed"      value={stats.completed}     color="green"  />
        <StatCard label="Rejected"       value={stats.rejected}      color="red"    />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Severity breakdown bar chart */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Reports by Severity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name="Reports">
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie chart */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Reports by Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={Object.values(STATUS_COLORS)[i % 7]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily trend line chart */}
      {lineData.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Reports Per Day (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Reports" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
