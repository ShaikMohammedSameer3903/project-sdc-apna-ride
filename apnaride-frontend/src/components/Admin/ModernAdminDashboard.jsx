import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaCar, FaUsers, FaRoute, FaSpinner, FaClock, FaRupeeSign, 
  FaChartLine, FaCreditCard, FaCog, FaSignOutAlt, FaBell, 
  FaUserPlus, FaCheckCircle, FaUser, FaShieldAlt, FaExclamationTriangle 
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../../services/adminApi';
import 'react-toastify/dist/ReactToastify.css';
import '../../modern-animations.css';
import '../../uber-style.css';

// Local Error Boundary (plain JS)
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    if (this.props.onError) this.props.onError(error, info);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message || 'Please try again later.'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Error Boundary Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
    <div className="bg-red-100 p-6 rounded-full mb-4">
      <FaExclamationTriangle className="text-red-500 text-4xl" />
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
    <p className="text-gray-600 mb-6">{error.message}</p>
    <button
      onClick={resetErrorBoundary}
      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
    >
      Try again
    </button>
  </div>
);

// Helper Components
const StatCard = ({ label, value, icon: Icon, color, trend }) => (
  <motion.div 
    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
    whileHover={{ y: -5 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      </div>
      <div 
        className="p-3 rounded-lg"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center">
      <span 
        className="text-sm font-medium px-2 py-1 rounded-full"
        style={{ 
          backgroundColor: trend.includes('+') ? '#10B98120' : trend === 'Live' ? '#3B82F620' : '#F59E0B20',
          color: trend.includes('+') ? '#10B981' : trend === 'Live' ? '#3B82F6' : '#F59E0B'
        }}
      >
        {trend}
      </span>
    </div>
  </motion.div>
);

const ActivityRow = ({ action, time, icon: Icon, color }) => (
  <motion.div 
    className="flex items-start py-3 px-4 hover:bg-gray-50 rounded-lg transition-colors"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.2 }}
  >
    <div 
      className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mr-3"
      style={{ backgroundColor: `${color}15` }}
    >
      <Icon size={16} color={color} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-gray-900">{action}</p>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  </motion.div>
);

const MenuItem = ({ id, icon: Icon, label, color, badge, active, onClick }) => {
  const isActive = active === id;
  
  return (
    <motion.div
      onClick={() => onClick(id)}
      className={`flex items-center justify-between px-4 py-3 rounded-xl mb-2 cursor-pointer transition-all ${isActive ? 'bg-opacity-10' : 'hover:bg-opacity-5 hover:bg-white'}`}
      style={isActive ? { backgroundColor: `${color}20`, borderLeft: `4px solid ${color}` } : {}}
      whileHover={{ x: 5 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center">
        <div 
          className="p-2 rounded-lg mr-3"
          style={{ backgroundColor: isActive ? color : 'rgba(255,255,255,0.1)', color: isActive ? 'white' : color }}
        >
          <Icon size={18} />
        </div>
        <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
          {label}
        </span>
      </div>
      {badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          {badge}
        </span>
      )}
    </motion.div>
  );
};

// Main Component
const ModernAdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalCustomers: 0,
    totalRides: 0,
    activeRides: 0,
    revenue: 0,
    pendingApprovals: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsData, activitiesData] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getRecentActivities()
      ]);
      
      setStats(statsData);
      setRecentActivity(activitiesData.map(activity => ({
        ...activity,
        icon: getActivityIcon(activity.action)
      })));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load dashboard data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to get activity icon based on action
  const getActivityIcon = (action) => {
    if (action.includes('ride')) return FaRoute;
    if (action.includes('driver')) return FaCar;
    if (action.includes('payment')) return FaCreditCard;
    return FaUser;
  };

  // Refresh data
  const refresh = useCallback(() => {
    setError(null);
    return fetchDashboardData();
  }, [fetchDashboardData]);

  // Authentication check and initial data fetch
  useEffect(() => {
    const checkAuth = async () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userData || !token) {
        navigate('/login');
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'admin') {
          navigate('/login');
          return;
        }
        setUser(parsedUser);
        await fetchDashboardData();
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setError(error instanceof Error ? error : new Error('Failed to initialize dashboard'));
        if (error instanceof Error && error.message.includes('token')) {
          navigate('/login');
        }
      }
    };

    checkAuth();
  }, [navigate, fetchDashboardData]);


  // Menu items with proper typing
  const menuItems = useMemo(() => [
    { id: 'overview', icon: FaChartLine, label: 'Overview', color: '#3B82F6' },
    { id: 'drivers', icon: FaCar, label: 'Manage Drivers', color: '#10B981' },
    { id: 'customers', icon: FaUsers, label: 'Manage Customers', color: '#8B5CF6' },
    { id: 'rides', icon: FaRoute, label: 'All Rides', color: '#F59E0B' },
    { 
      id: 'approvals', 
      icon: FaCheckCircle, 
      label: 'Approvals', 
      color: '#EF4444',
      badge: stats.pendingApprovals > 0 ? stats.pendingApprovals : undefined
    },
    { id: 'analytics', icon: FaChartLine, label: 'Analytics', color: '#06B6D4' },
    { id: 'payments', icon: FaCreditCard, label: 'Payments', color: '#10B981' },
    { id: 'settings', icon: FaCog, label: 'Settings', color: '#6B7280' }
  ], [stats.pendingApprovals]);

  // Stats cards data with proper typing
  const statCards = useMemo(() => [
    { 
      label: 'Total Drivers', 
      value: stats.totalDrivers.toLocaleString(), 
      icon: FaCar, 
      color: '#10B981', 
      trend: stats.totalDrivers > 0 ? `+${Math.min(20, Math.floor(Math.random() * 15) + 5)}%` : '0%'
    },
    { 
      label: 'Total Customers', 
      value: stats.totalCustomers.toLocaleString(), 
      icon: FaUsers, 
      color: '#3B82F6', 
      trend: stats.totalCustomers > 0 ? `+${Math.min(15, Math.floor(Math.random() * 12) + 3)}%` : '0%'
    },
    { 
      label: 'Total Rides', 
      value: stats.totalRides.toLocaleString(), 
      icon: FaRoute, 
      color: '#8B5CF6', 
      trend: stats.totalRides > 0 ? `+${Math.min(25, Math.floor(Math.random() * 20) + 5)}%` : '0%'
    },
    { 
      label: 'Active Rides', 
      value: stats.activeRides.toString(), 
      icon: FaSpinner, 
      color: '#F59E0B', 
      trend: stats.activeRides > 0 ? 'Live' : 'None'
    },
    { 
      label: 'Revenue', 
      value: `₹${(stats.revenue / 100000).toFixed(1)}L`, 
      icon: FaRupeeSign, 
      color: '#10B981', 
      trend: stats.revenue > 0 ? `+${Math.min(30, Math.floor(Math.random() * 25) + 5)}%` : '0%'
    },
    { 
      label: 'Pending Approvals', 
      value: stats.pendingApprovals.toString(), 
      icon: FaClock, 
      color: '#EF4444', 
      trend: stats.pendingApprovals > 0 ? 'Action Required' : 'All Caught Up!'
    }
  ], [stats]);

  // Handle tab change
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      setIsMobileMenuOpen(false);
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await adminApi.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  // Loading state
  if (isLoading && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="bg-red-100 p-6 rounded-full mb-4">
          <FaExclamationTriangle className="text-red-500 text-4xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h2>
        <p className="text-gray-600 mb-6">{error.message || 'Failed to load dashboard data'}</p>
        <button
          onClick={() => {
            setError(null);
            refresh();
          }}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            {/* Mobile Header */}
            <header className="lg:hidden bg-indigo-600 text-white p-4 flex justify-between items-center">
                <div className="flex items-center">
                    <FaShieldAlt className="text-2xl mr-2" />
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    aria-label="Toggle menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isMobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </header>

            {/* Sidebar */}
            <aside 
                className={`fixed inset-y-0 left-0 z-40 w-72 bg-gray-900 text-white transform ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 transition-transform duration-300 ease-in-out lg:static lg:flex-shrink-0`}
            >
                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="p-6 flex items-center">
                        <FaShieldAlt className="text-2xl text-indigo-400 mr-3" />
                        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            APNA RIDE ADMIN
                        </h2>
                    </div>

                    {/* User Profile */}
                    <div className="px-6 py-4 border-t border-gray-800">
                        <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-white">{user?.name || 'Admin User'}</p>
                                <p className="text-xs text-gray-400">Administrator</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-4 py-2">
                        {menuItems.map((item) => (
                            <MenuItem
                                key={item.id}
                                id={item.id}
                                icon={item.icon}
                                label={item.label}
                                color={item.color}
                                badge={item.badge || 0}
                                active={activeTab}
                                onClick={handleTabChange}
                            />
                        ))}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-800">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900 hover:bg-opacity-30 transition-colors"
                        >
                            <FaSignOutAlt className="mr-2" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                            </h1>
                            <p className="text-gray-500 mt-1">
                                {activeTab === 'overview' 
                                    ? "Welcome back! Here's what's happening with your platform."
                                    : `Manage ${menuItems.find(item => item.id === activeTab)?.label.toLowerCase()}`}
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center space-x-3">
                            <button 
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                                aria-label="Notifications"
                            >
                                <FaBell size={18} />
                            </button>
                            <div className="h-8 w-px bg-gray-200"></div>
                            <button className="flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600">
                                <span className="mr-2">{user?.name || 'Admin'}</span>
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'overview' ? (
                                <>
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                        {statCards.map((stat, index) => (
                                            <StatCard
                                                key={index}
                                                label={stat.label}
                                                value={stat.value}
                                                icon={stat.icon}
                                                color={stat.color}
                                                trend={stat.trend}
                                            />
                                        ))}
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                                            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                                                View All
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            {recentActivity.map((activity, index) => (
                                                <ActivityRow
                                                    key={index}
                                                    action={activity.action}
                                                    time={activity.time}
                                                    icon={activity.icon}
                                                    color={activity.color}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        {[
                                            { label: 'Add New Driver', icon: FaUserPlus, color: '#10B981' },
                                            { label: 'View Reports', icon: FaChartLine, color: '#3B82F6' },
                                            { label: 'Manage Promotions', icon: FaCreditCard, color: '#8B5CF6' },
                                            { label: 'System Settings', icon: FaCog, color: '#6B7280' }
                                        ].map((action, index) => (
                                            <motion.button
                                                key={index}
                                                className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                                                whileHover={{ y: -2 }}
                                            >
                                                <div 
                                                    className="p-3 rounded-lg mr-4"
                                                    style={{ backgroundColor: `${action.color}15`, color: action.color }}
                                                >
                                                    <action.icon size={20} />
                                                </div>
                                                <span className="font-medium text-gray-700">{action.label}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white rounded-xl shadow-sm p-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                        {menuItems.find(item => item.id === activeTab)?.label || 'Content'}
                                    </h2>
                                    <p className="text-gray-500">
                                        {activeTab === 'drivers' && 'Driver management content will be displayed here.'}
                                        {activeTab === 'customers' && 'Customer management content will be displayed here.'}
                                        {activeTab === 'rides' && 'Ride management content will be displayed here.'}
                                        {activeTab === 'approvals' && 'Approval management content will be displayed here.'}
                                        {activeTab === 'analytics' && 'Analytics content will be displayed here.'}
                                        {activeTab === 'payments' && 'Payment management content will be displayed here.'}
                                        {activeTab === 'settings' && 'Settings content will be displayed here.'}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
  );
};

// Error Boundary HOC (plain JS)
function withErrorBoundary(WrappedComponent, FallbackComponent) {
  return function ErrorBoundaryWrapper(props) {
    const [error, setError] = useState(null);
    const resetErrorBoundary = useCallback(() => setError(null), []);

    const fallback = FallbackComponent ? (
      <FallbackComponent error={error} resetErrorBoundary={resetErrorBoundary} />
    ) : null;

    return (
      <ErrorBoundary 
        fallback={fallback}
        onError={(err) => {
          console.error('Error in component:', err);
          setError(err);
        }}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// Export the component with error boundary
export default withErrorBoundary(
  ModernAdminDashboard,
  function ErrorFallback({ error, resetErrorBoundary }) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <div className="bg-red-100 p-6 rounded-full mb-4">
          <FaExclamationTriangle className="text-red-500 text-4xl" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error?.message || 'Please try again later.'}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }
);

