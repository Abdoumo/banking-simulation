import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import KycPortal from './pages/KycPortal';
import TransferPortal from './pages/TransferPortal';
import Transactions from './pages/Transactions';
import Credits from './pages/Credits';
import Admin from './pages/Admin';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !user.is_admin) return <Navigate to="/" replace />;
  return children;
}

function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/kyc" element={<KycPortal />} />
          <Route path="/transfer" element={<TransferPortal />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
