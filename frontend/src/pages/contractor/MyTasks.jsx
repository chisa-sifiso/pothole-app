import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getMyTasks, startRepair, completeRepair } from '../../api/repairs'
import SeverityBadge from '../../components/common/SeverityBadge'
import ImageUploader from '../../components/common/ImageUploader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatDate } from '../../utils/formatters'
import { Wrench, CheckCircle, Play } from 'lucide-react'

const TASK_STATUS_STYLE = {
  ASSIGNED:    'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED:   'bg-green-100 text-green-700',
}

export default function MyTasks() {
  const [tasks, setTasks]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('ALL')
  const [completing, setCompleting] = useState(null)
  const [afterFile, setAfterFile]   = useState({})
  const [actionLoading, setActionLoading] = useState(null)

  const load = () => {
    getMyTasks()
      .then((res) => setTasks(res.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleStart = async (taskId) => {
    setActionLoading(taskId)
    try {
      await startRepair(taskId)
      load()
      toast.success('Repair started!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start repair')
    } finally {
      setActionLoading(null)
    }
  }

  const handleComplete = async (taskId) => {
    setActionLoading(taskId)
    try {
      const formData = new FormData()
      const file = afterFile[taskId]
      if (file) formData.append('afterImage', file)
      await completeRepair(taskId, formData)
      setCompleting(null)
      setAfterFile((prev) => { const n = {...prev}; delete n[taskId]; return n })
      load()
      toast.success('Repair marked as completed!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete repair')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter)

  if (loading) return <LoadingSpinner text="Loading your tasks..." />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-500 mt-1">{tasks.length} assigned repair task{tasks.length !== 1 ? 's' : ''}</p>
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
          <p className="text-gray-500">No tasks found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((task) => (
            <div key={task.id} className="card space-y-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">Task #{task.id}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS_STYLE[task.status]}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <SeverityBadge severity={task.potholeSeverity} />
                </div>
                <span className="text-xs text-gray-400">Assigned: {formatDate(task.assignedAt)}</span>
              </div>

              {task.potholeAddress && (
                <p className="text-sm text-gray-600">{task.potholeAddress}</p>
              )}

              {/* Before/After images */}
              {(task.beforeImageUrl || task.afterImageUrl) && (
                <div className="flex gap-4">
                  {task.beforeImageUrl && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Before</p>
                      <img src={task.beforeImageUrl} alt="Before" className="w-28 h-20 object-cover rounded" />
                    </div>
                  )}
                  {task.afterImageUrl && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">After</p>
                      <img src={task.afterImageUrl} alt="After" className="w-28 h-20 object-cover rounded" />
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              {task.status === 'ASSIGNED' && (
                <button
                  onClick={() => handleStart(task.id)}
                  disabled={actionLoading === task.id}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {actionLoading === task.id ? 'Starting...' : 'Start Repair'}
                </button>
              )}

              {task.status === 'IN_PROGRESS' && (
                <>
                  {completing === task.id ? (
                    <div className="space-y-3">
                      <ImageUploader
                        label="After-repair photo (optional)"
                        onFileSelect={(f) => setAfterFile((prev) => ({ ...prev, [task.id]: f }))}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleComplete(task.id)}
                          disabled={actionLoading === task.id}
                          className="btn-primary flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {actionLoading === task.id ? 'Completing...' : 'Mark Complete'}
                        </button>
                        <button onClick={() => setCompleting(null)} className="btn-secondary">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCompleting(task.id)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Complete Repair
                    </button>
                  )}
                </>
              )}

              {task.status === 'COMPLETED' && task.completedAt && (
                <p className="text-sm text-green-600 font-medium">
                  Completed on {formatDate(task.completedAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
