import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getProfile, updateProfile } from '../../api/contractors'
import { getMyTasks } from '../../api/repairs'
import { useForm } from 'react-hook-form'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { Star, Briefcase, Edit, Save } from 'lucide-react'

export default function ContractorDashboard() {
  const [profile, setProfile]   = useState(null)
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)

  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    Promise.all([getProfile(), getMyTasks()])
      .then(([pRes, tRes]) => {
        setProfile(pRes.data)
        setTasks(tRes.data)
        reset({ companyName: pRes.data.companyName, registrationNumber: pRes.data.registrationNumber })
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const onSave = async (data) => {
    setSaving(true)
    try {
      const res = await updateProfile(data)
      setProfile(res.data)
      setEditing(false)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading profile..." />

  const activeTasks = tasks.filter((t) => t.status !== 'COMPLETED')
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Contractor Dashboard</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Profile card */}
        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Company Profile</h2>
            <button onClick={() => setEditing(!editing)} className="text-gray-400 hover:text-blue-600">
              <Edit className="w-4 h-4" />
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit(onSave)} className="space-y-3">
              <div>
                <label className="label">Company Name</label>
                <input className="input" {...register('companyName', { required: true })} />
              </div>
              <div>
                <label className="label">Registration Number</label>
                <input className="input" {...register('registrationNumber', { required: true })} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400">Company Name</p>
                <p className="font-medium">{profile?.companyName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Registration Number</p>
                <p className="font-medium">{profile?.registrationNumber}</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-400">Rating</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{Number(profile?.rating || 0).toFixed(1)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Completed Jobs</p>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{profile?.completedJobs}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 content-start">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-600 font-medium">Active Tasks</p>
            <p className="text-3xl font-bold text-blue-700">{activeTasks.length}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4">
            <p className="text-sm text-green-600 font-medium">Completed</p>
            <p className="text-3xl font-bold text-green-700">{completedTasks.length}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Link to="/available-rfqs" className="btn-primary">Browse Available RFQs</Link>
        <Link to="/my-tasks" className="btn-secondary">View My Tasks</Link>
      </div>
    </div>
  )
}
