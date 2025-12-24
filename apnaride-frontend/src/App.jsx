import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { LanguageProvider } from './context/LanguageContext';
import { RideProvider } from './context/RideContext';
import { ToastProvider } from './context/ToastContext';
import LandingPage from './components/Home/LandingPage';
import ExcitingLandingPage from './components/Home/ExcitingLandingPage';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import AdminLogin from './components/Auth/AdminLogin';
import UberStyleCustomerDashboard from './components/Customer/UberStyleCustomerDashboard';
import CustomerProfile from './components/Customer/CustomerProfile';
import CustomerProfileView from './components/Customer/CustomerProfileView';
import UberStyleRiderDashboard from './components/Rider/UberStyleRiderDashboard';
import RiderProfile from './components/Rider/RiderProfile';
import EnhancedAdminDashboard from './components/Admin/EnhancedAdminDashboard';
import './App.css';
import './enhanced-animations.css';
import './modern-design-system.css';
import './uber-style.css';

// Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Animated Routes wrapper
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<ExcitingLandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route 
          path="/customer" 
          element={
            <ProtectedRoute allowedRole="customer">
              <UberStyleCustomerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customer/profile" 
          element={
            <ProtectedRoute allowedRole="customer">
              <CustomerProfileView />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/rider" 
          element={
            <ProtectedRoute allowedRole="rider">
              <UberStyleRiderDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/rider/profile" 
          element={
            <ProtectedRoute allowedRole="rider">
              <RiderProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRole="admin">
              <EnhancedAdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <RideProvider>
      <LanguageProvider>
        <ToastProvider>
          <Router>
            <AnimatedRoutes />
          </Router>
        </ToastProvider>
      </LanguageProvider>
    </RideProvider>
  );
}
