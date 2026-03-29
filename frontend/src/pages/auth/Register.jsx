import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { MapPin } from 'lucide-react'
import { register as registerApi } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'


const ROLE_HOME = {
  CITIZEN:            '/report',
  MUNICIPAL_OFFICIAL: '/dashboard',
  CONTRACTOR:         '/contractor',
}

export default function Register() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const selectedRole = watch('role')

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await registerApi(data)
      login(res.data.token)
      toast.success('Account created successfully!')
      navigate(ROLE_HOME[res.data.role] || '/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-1">Join the Smart City Roads platform</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              type="text"
              placeholder="Your full name"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Email address</label>
            <input
              className="input"
              type="email"
              placeholder="you@example.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
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

          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="Minimum 6 characters"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'At least 6 characters' }
              })}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="label">Account type</label>
            <select
              className="input"
              {...register('role', { required: 'Please select a role' })}
            >
              <option value="">Select your role...</option>
              <option value="CITIZEN">Citizen — Report potholes in your area</option>
              <option value="CONTRACTOR">Contractor — Submit bids for repair work</option>
              <option value="MUNICIPAL_OFFICIAL">Municipal Official — Manage reports &amp; RFQs</option>
            </select>
            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
          </div>

          {selectedRole === 'CONTRACTOR' && (
            <div className="space-y-3 border border-blue-100 bg-blue-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Company Details</p>
              <div>
                <label className="label">Company name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Nkosi Road Repairs (Pty) Ltd"
                  {...register('companyName', { required: 'Company name is required for contractors' })}
                />
                {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
              </div>
              <div>
                <label className="label">CIPC registration number</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. 2024/123456/07"
                  {...register('registrationNumber', { required: 'Registration number is required for contractors' })}
                />
                {errors.registrationNumber && <p className="text-red-500 text-xs mt-1">{errors.registrationNumber.message}</p>}
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
