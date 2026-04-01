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
    { to: '/report',     label: 'Report',     Icon: AlertCircle },
    { to: '/my-reports', label: 'My Reports', Icon: ClipboardList },
  ],
  MUNICIPAL_OFFICIAL: [
    { to: '/dashboard', label: 'Dashboard', Icon: BarChart2 },
    { to: '/map',       label: 'Map',       Icon: Map },
    { to: '/rfqs',      label: 'RFQs',      Icon: FileText },
    { to: '/repairs',   label: 'Repairs',   Icon: Wrench },
  ],
  CONTRACTOR: [
    { to: '/contractor',     label: 'Dashboard', Icon: Building2 },
    { to: '/available-rfqs', label: 'RFQs',      Icon: Package },
    { to: '/my-tasks',       label: 'My Tasks',  Icon: CheckSquare },
  ],
}

const ROLE_LABEL = {
  CITIZEN:            'Citizen',
  MUNICIPAL_OFFICIAL: 'Municipal',
  CONTRACTOR:         'Contractor',
}

const ROLE_STYLE = {
  CITIZEN:            { bg: 'rgba(34,197,94,0.12)',  color: '#4ade80',  border: 'rgba(34,197,94,0.25)' },
  MUNICIPAL_OFFICIAL: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa',  border: 'rgba(59,130,246,0.25)' },
  CONTRACTOR:         { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24',  border: 'rgba(251,191,36,0.25)' },
}

const navStyle = {
  background: 'rgba(6, 8, 15, 0.88)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderBottom: '1px solid rgba(148,163,184,0.07)',
  position: 'sticky',
  top: 0,
  zIndex: 40,
}

const iconBtnBase = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 34, height: 34, borderRadius: 8,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(148,163,184,0.09)',
  color: '#64748b', cursor: 'pointer', transition: 'all 0.2s',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const links = user ? (NAV_LINKS[user.role] || []) : []
  const rs = user ? ROLE_STYLE[user.role] : null

  return (
    <>
      <nav style={navStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(59,130,246,0.4)',
              }}>
                <MapPin style={{ width: 18, height: 18, color: '#fff' }} />
              </div>
              <span style={{
                fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em',
                background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                Smart City Roads
              </span>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: 2 }}>
              {links.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8,
                  fontSize: 13, fontWeight: 500, textDecoration: 'none',
                  transition: 'all 0.2s',
                  background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color: isActive ? '#60a5fa' : '#64748b',
                  border: `1px solid ${isActive ? 'rgba(59,130,246,0.22)' : 'transparent'}`,
                })}>
                  <Icon style={{ width: 14, height: 14 }} />
                  {label}
                </NavLink>
              ))}
            </div>

            {/* Right controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {user && (
                <>
                  <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
                      padding: '3px 10px', borderRadius: 100,
                      background: rs?.bg, color: rs?.color, border: `1px solid ${rs?.border}`,
                    }}>
                      {ROLE_LABEL[user.role]}
                    </span>
                    <span style={{ fontSize: 12, color: '#475569', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name}
                    </span>
                  </div>

                  <NavLink to="/profile" title="Settings" style={({ isActive }) => ({
                    ...iconBtnBase,
                    background: isActive ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                    color: isActive ? '#60a5fa' : '#64748b',
                    border: `1px solid ${isActive ? 'rgba(59,130,246,0.22)' : 'rgba(148,163,184,0.09)'}`,
                  })}>
                    <Settings style={{ width: 15, height: 15 }} />
                  </NavLink>

                  <button
                    onClick={handleLogout} title="Sign out"
                    style={iconBtnBase}
                    onMouseEnter={e => Object.assign(e.currentTarget.style, { background: 'rgba(239,68,68,0.12)', color: '#f87171', borderColor: 'rgba(239,68,68,0.25)' })}
                    onMouseLeave={e => Object.assign(e.currentTarget.style, { background: 'rgba(255,255,255,0.04)', color: '#64748b', borderColor: 'rgba(148,163,184,0.09)' })}
                  >
                    <LogOut style={{ width: 15, height: 15 }} />
                  </button>
                </>
              )}

              {links.length > 0 && (
                <button
                  className="md:hidden"
                  onClick={() => setMobileOpen(v => !v)}
                  style={iconBtnBase}
                >
                  {mobileOpen ? <X style={{ width: 15, height: 15 }} /> : <Menu style={{ width: 15, height: 15 }} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setMobileOpen(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: 64, left: 0, right: 0,
              background: 'rgba(6,8,15,0.97)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(148,163,184,0.07)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            }}
          >
            {user && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px',
                borderBottom: '1px solid rgba(148,163,184,0.07)',
              }}>
                <User style={{ width: 14, height: 14, color: '#475569', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                  background: rs?.bg, color: rs?.color, border: `1px solid ${rs?.border}`,
                }}>
                  {ROLE_LABEL[user.role]}
                </span>
              </div>
            )}
            <div style={{ padding: 8 }}>
              {links.map(({ to, label, Icon }) => (
                <NavLink
                  key={to} to={to}
                  onClick={() => setMobileOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 8, marginBottom: 2,
                    fontSize: 14, fontWeight: 500, textDecoration: 'none',
                    background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color: isActive ? '#60a5fa' : '#94a3b8',
                    border: `1px solid ${isActive ? 'rgba(59,130,246,0.22)' : 'transparent'}`,
                  })}
                >
                  <Icon style={{ width: 16, height: 16 }} />
                  {label}
                </NavLink>
              ))}
              <div style={{ borderTop: '1px solid rgba(148,163,184,0.07)', paddingTop: 8, marginTop: 4 }}>
                <NavLink to="/profile" onClick={() => setMobileOpen(false)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  fontSize: 14, fontWeight: 500, textDecoration: 'none', color: '#94a3b8',
                }}>
                  <Settings style={{ width: 16, height: 16 }} />
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
