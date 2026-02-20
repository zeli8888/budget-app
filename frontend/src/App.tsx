import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PreferenceProvider } from './contexts/PreferenceContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Stats from './pages/Stats';
import Layout from './components/Layout';

const PrivateRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return user ?
    <PreferenceProvider>
      <Outlet />
    </PreferenceProvider>
    : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const baseName = import.meta.env.VITE_CONTEXT || '/';
  return (
    <AuthProvider>
      <Router basename={baseName}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={<PrivateRoute />}
            >
              <Route index element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="stats" element={<Stats />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
