// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';

// Import all your pages from the sidebar
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import CadetDashboard from './pages/CadetDashboard';
import CadetAttendance from './pages/CadetAttendance';
import CadetProfiles from './pages/CadetProfiles';
import MarkAttendance from './pages/MarkAttendance';
import ParadeSchedule from './pages/ParadeSchedule';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Core App Routes wrapped inside your shared Layout component */}
          <Route element={<Layout />}>
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/cadet-dashboard" element={<CadetDashboard />} />
            <Route path="/attendance" element={<CadetAttendance />} />
            <Route path="/profiles" element={<CadetProfiles />} />
            <Route path="/mark-attendance" element={<MarkAttendance />} />
            <Route path="/schedule" element={<ParadeSchedule />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;