import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { MapPin, Lock, Mail, User } from 'lucide-react'
import { login as loginApi } from '../../api/auth'
import { useAuth } from '../../context/AuthContext'

const ROLE_HOME = {
  CITIZEN:            '/report',
  MUNICIPAL_OFFICIAL: '/dashboard',
  CONTRACTOR:         '/contractor',
}

const DEMO_ACCOUNTS = [
  { role: 'Citizen',    email: 'citizen@pothole.com',    password: 'Citizen123!',    color: '#22C55E' },
  { role: 'Municipal',  email: 'admin@pothole.com',      password: 'Admin123!',      color: '#3B82F6' },
  { role: 'Contractor', email: 'contractor@pothole.com', password: 'Contractor123!', color: '#F59E0B' },
]

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const res = await loginApi(data)
      login(res.data.token)
      toast.success(`Welcome back, ${res.data.name}!`)
      navigate(ROLE_HOME[res.data.role] || '/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (account) => {
    setValue('email', account.email)
    setValue('password', account.password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#1a1a1a', border: '2px solid #333' }}>
            <MapPin className="w-8 h-8" style={{ color: '#3B82F6' }} />
          </div>
          <h1 className="text-3xl font-bold text-white">Smart City Roads</h1>
          <p className="mt-1" style={{ color: '#9CA3AF' }}>Sign in to your account</p>
        </div>

        {/* Demo accounts */}
        <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: '#111111', border: '1px solid #222' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Demo Accounts — click to fill</p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => fillDemo(acc)}
                className="rounded-lg p-2 text-left transition-all hover:opacity-80 active:scale-95"
                style={{ backgroundColor: '#1a1a1a', border: `1px solid ${acc.color}33` }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <User className="w-3 h-3" style={{ color: acc.color }} />
                  <span className="text-xs font-semibold" style={{ color: acc.color }}>{acc.role}</span>
                </div>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{acc.email}</p>
                <p className="text-xs font-mono mt-1" style={{ color: '#D1D5DB' }}>{acc.password}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#111111', border: '1px solid #222' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#D1D5DB' }}>Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B7280' }} />
                <input
                  className="w-full rounded-lg px-4 py-2 pl-10 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  type="email"
                  placeholder="you@example.com"
                  {...register('email', { required: 'Email is required' })}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#D1D5DB' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B7280' }} />
                <input
                  className="w-full rounded-lg px-4 py-2 pl-10 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 font-semibold text-white transition-all mt-2 hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#3B82F6' }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#6B7280' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium hover:underline" style={{ color: '#3B82F6' }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
