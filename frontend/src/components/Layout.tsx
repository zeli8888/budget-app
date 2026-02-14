import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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

  const isActive = (path: string) => location.pathname === path;

  const showNavbar = user || location.pathname !== '/login';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {showNavbar && (
        <nav className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:opacity-90 transition-opacity">
                <span className="text-2xl">💰</span>
                <span className="hidden sm:inline">Budget App</span>
              </Link>

              {user && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    to="/"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/')
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="hidden sm:inline">Dashboard</span>
                    <span className="sm:hidden">📊</span>
                  </Link>
                  <Link
                    to="/transactions"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/transactions')
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="hidden sm:inline">Transactions</span>
                    <span className="sm:hidden">💳</span>
                  </Link>
                  <Link
                    to="/stats"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive('/stats')
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="hidden sm:inline">Statistics</span>
                    <span className="sm:hidden">📈</span>
                  </Link>
                </div>
              )}

              <div className="flex items-center gap-4">
                {user ? (
                  <>
                    <span className="hidden md:block text-sm text-white/80 truncate max-w-[150px]">
                      {user.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  location.pathname !== '/login' && (
                    <Link
                      to="/login"
                      className="px-4 py-2 bg-white text-primary-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-all"
                    >
                      Sign In
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Budget App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
