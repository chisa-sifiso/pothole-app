import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  MapPin, LogOut, User, Menu, X, Settings,
  BarChart2, Map, FileText, Wrench,
  AlertCircle, ClipboardList,
  Building2, Package, CheckSquare,
} from 'lucide-react'

const NAV_LINKS = {
  CITIZEN: [
    { to: '/report',     label: 'Report Pothole', Icon: AlertCircle },
    { to: '/my-reports', label: 'My Reports',     Icon: ClipboardList },
  ],
  MUNICIPAL_OFFICIAL: [
    { to: '/dashboard', label: 'Dashboard',      Icon: BarChart2 },
    { to: '/map',       label: 'Reports Map',    Icon: Map },
    { to: '/rfqs',      label: 'RFQ Management', Icon: FileText },
    { to: '/repairs',   label: 'Repairs',        Icon: Wrench },
  ],
  CONTRACTOR: [
    { to: '/contractor',     label: 'Dashboard',      Icon: Building2 },
    { to: '/available-rfqs', label: 'Available RFQs', Icon: Package },
    { to: '/my-tasks',       label: 'My Tasks',       Icon: CheckSquare },
  ],
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const links = user ? (NAV_LINKS[user.role] || []) : []

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-600'
        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
    }`

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-gray-900 text-lg">Smart City Roads</span>
            </div>

            <div className="hidden md:flex items-center gap-1">
              {links.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} className={linkClass}>
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {user && (
                <>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden lg:block max-w-[120px] truncate">{user.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                  <NavLink
                    to="/profile"
                    className="p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Account settings"
                  >
                    <Settings className="w-4 h-4" />
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              )}
              {links.length > 0 && (
                <button
                  className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label="Toggle navigation menu"
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {user && (
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-sm text-gray-600">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium truncate">{user.name}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto whitespace-nowrap">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
            )}
            <div className="p-2 space-y-1">
              {links.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={linkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
              <div className="border-t border-gray-100 pt-1 mt-1">
                <NavLink
                  to="/profile"
                  className={linkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Account Settings
                </NavLink>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
