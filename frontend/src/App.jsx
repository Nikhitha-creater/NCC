import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout';

// Import pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CadetDashboard from './pages/CadetDashboard';
import CadetAttendance from './pages/CadetAttendance';
import CadetProfiles from './pages/CadetProfiles';
import MarkAttendance from './pages/MarkAttendance';
import ParadeSchedule from './pages/ParadeSchedule';
import Reports from './pages/Reports';

// ── PROTECTED ROUTE GUARD ──────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'sans-serif'
      }}>
        <h3>Loading NCC Portal Session...</h3>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Routes inside Layout Wrapper */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          
          {/* Dashboard Path Variations */}
          <Route path="/cadet" element={<CadetDashboard />} />
          <Route path="/cadet-dashboard" element={<CadetDashboard />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          
          {/* Attendance Path Variations (Catches all potential sidebar link styles) */}
          <Route path="/attendance" element={<CadetAttendance />} />
          <Route path="/my-attendance" element={<CadetAttendance />} />
          <Route path="/cadet-attendance" element={<CadetAttendance />} />
          
          {/* Schedule Path Variations */}
          <Route path="/schedule" element={<ParadeSchedule />} />
          <Route path="/parade-schedule" element={<ParadeSchedule />} />
          <Route path="/parades" element={<ParadeSchedule />} />
          
          {/* Core Feature Management Paths */}
          <Route path="/profiles" element={<CadetProfiles />} />
          <Route path="/mark-attendance" element={<MarkAttendance />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        {/* Safe Catch-all: Bounces unmapped roots safely to dashboard instead of login */}
        <Route path="*" element={<Navigate to="/cadet-dashboard" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
