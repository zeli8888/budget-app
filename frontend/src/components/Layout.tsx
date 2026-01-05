import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/">💰 Budget App</Link>
        </div>
        <div className="navbar-menu">
          <Link
            to="/"
            className={`navbar-item ${location.pathname === '/' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            to="/transactions"
            className={`navbar-item ${location.pathname === '/transactions' ? 'active' : ''}`}
          >
            Transactions
          </Link>
          <Link
            to="/stats"
            className={`navbar-item ${location.pathname === '/stats' ? 'active' : ''}`}
          >
            Statistics
          </Link>
        </div>
        <div className="navbar-end">
          <span className="user-email">{user?.email}</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
