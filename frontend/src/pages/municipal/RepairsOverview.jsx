import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAllTasks } from '../../api/repairs'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import SeverityBadge from '../../components/common/SeverityBadge'
import { formatDate } from '../../utils/formatters'
import { Wrench } from 'lucide-react'

const TASK_STATUS_STYLE = {
  ASSIGNED:    'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED:   'bg-green-100 text-green-700',
}

export default function RepairsOverview() {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('ALL')

  useEffect(() => {
    getAllTasks()
      .then((res) => setTasks(res.data))
      .catch(() => toast.error('Failed to load repair tasks'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter)

  if (loading) return <LoadingSpinner text="Loading repairs..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Repairs Overview</h1>
        <p className="text-gray-500 mt-1">{tasks.length} repair task{tasks.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex gap-2">
        {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'}`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No repair tasks found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((task) => (
            <div key={task.id} className="card">
              <div className="flex flex-wrap justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">Task #{task.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS_STYLE[task.status]}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <SeverityBadge severity={task.potholeSeverity} />
                </div>
                <span className="text-xs text-gray-400">Bid #{task.bidId} · RFQ #{task.rfqId}</span>
              </div>

              {task.potholeAddress && (
                <p className="text-sm text-gray-600 mb-2">{task.potholeAddress}</p>
              )}

              <div className="flex gap-4 mt-3">
                {task.beforeImageUrl && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Before</p>
                    <img src={task.beforeImageUrl} alt="Before" className="w-24 h-16 object-cover rounded" />
                  </div>
                )}
                {task.afterImageUrl && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">After</p>
                    <img src={task.afterImageUrl} alt="After" className="w-24 h-16 object-cover rounded" />
                  </div>
                )}
              </div>

              <div className="flex gap-4 text-xs text-gray-400 mt-3">
                <span>Assigned: {formatDate(task.assignedAt)}</span>
                {task.completedAt && <span>Completed: {formatDate(task.completedAt)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
