import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import Navbar from './components/layout/Navbar'

import Login    from './pages/auth/Login'
import Register from './pages/auth/Register'

import ReportPothole from './pages/citizen/ReportPothole'
import MyReports     from './pages/citizen/MyReports'

import Dashboard            from './pages/municipal/Dashboard'
import ReportsMap           from './pages/municipal/ReportsMap'
import RFQManagement        from './pages/municipal/RFQManagement'
import ContractorEvaluation from './pages/municipal/ContractorEvaluation'
import RepairsOverview      from './pages/municipal/RepairsOverview'

import ContractorDashboard from './pages/contractor/ContractorDashboard'
import AvailableRFQs       from './pages/contractor/AvailableRFQs'
import BidForm             from './pages/contractor/BidForm'
import MyTasks             from './pages/contractor/MyTasks'

import Profile from './pages/Profile'

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute role="CITIZEN" />}>
            <Route path="/report"     element={<Layout><ReportPothole /></Layout>} />
            <Route path="/my-reports" element={<Layout><MyReports /></Layout>} />
          </Route>

          <Route element={<ProtectedRoute role="MUNICIPAL_OFFICIAL" />}>
            <Route path="/dashboard"         element={<Layout><Dashboard /></Layout>} />
            <Route path="/map"               element={<div className="h-screen flex flex-col"><Navbar /><div className="flex-1"><ReportsMap /></div></div>} />
            <Route path="/rfqs"              element={<Layout><RFQManagement /></Layout>} />
            <Route path="/evaluation/:rfqId" element={<Layout><ContractorEvaluation /></Layout>} />
            <Route path="/repairs"           element={<Layout><RepairsOverview /></Layout>} />
          </Route>

          <Route element={<ProtectedRoute role="CONTRACTOR" />}>
            <Route path="/contractor"     element={<Layout><ContractorDashboard /></Layout>} />
            <Route path="/available-rfqs" element={<Layout><AvailableRFQs /></Layout>} />
            <Route path="/bid/:rfqId"     element={<Layout><BidForm /></Layout>} />
            <Route path="/my-tasks"       element={<Layout><MyTasks /></Layout>} />
          </Route>

          {/* Profile route accessible to any authenticated user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Layout><Profile /></Layout>} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
