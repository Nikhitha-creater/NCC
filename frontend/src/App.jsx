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
// Ensures unauthenticated users are forced back to the login screen cleanly.
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
          {/* Match both common variations of the cadet pathway to stop blank page routing */}
          <Route path="/cadet" element={<CadetDashboard />} />
          <Route path="/cadet-dashboard" element={<CadetDashboard />} />
          
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/attendance" element={<CadetAttendance />} />
          <Route path="/profiles" element={<CadetProfiles />} />
          <Route path="/mark-attendance" element={<MarkAttendance />} />
          <Route path="/schedule" element={<ParadeSchedule />} />
          <Route path="/reports" element={<Reports />} />
        </Route>

        {/* Catch-all Route: If path doesn't exist, redirect safely to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
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
