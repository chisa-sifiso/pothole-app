import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { User, Save, Lock } from 'lucide-react'
import { updateProfile } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, login } = useAuth()
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    defaultValues: { name: user?.name || '', phone: '' },
  })

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const res = await updateProfile(data)
      login(res.data.token) // refresh token with updated name
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile information</p>
      </div>

      <div className="card space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              type="text"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Phone number <span className="text-gray-400">(optional)</span></label>
            <input
              className="input"
              type="tel"
              placeholder="082 000 0000"
              {...register('phone')}
            />
          </div>

          <button
            type="submit"
            disabled={saving || !isDirty}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900">Security</h2>
        </div>
        <p className="text-sm text-gray-500">
          Email address: <span className="font-medium text-gray-700">{user?.email}</span>
        </p>
        <p className="text-xs text-gray-400 mt-2">
          To change your email or password, contact your system administrator.
        </p>
      </div>
    </div>
  )
}
