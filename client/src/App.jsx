import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout & Protected Route
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

// Shared Pages
import BookDetails from './pages/BookDetails';
import NotFound from './pages/NotFound';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Books from './pages/admin/Books';
import Categories from './pages/admin/Categories';
import Students from './pages/admin/Students';
import Circulation from './pages/admin/Circulation';
import Reservations from './pages/admin/Reservations';
import Fines from './pages/admin/Fines';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import Notifications from './pages/admin/Notifications';

// Student Pages
import StudentDashboard from './pages/student/Dashboard';
import BookCatalog from './pages/student/BookCatalog';
import MyBooks from './pages/student/MyBooks';
import MyReservations from './pages/student/MyReservations';
import MyFines from './pages/student/MyFines';
import Profile from './pages/student/Profile';
import Favorites from './pages/student/Favorites';


// Root redirector based on authentication status & role
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export const App = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Main Layout Nested Routes */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<RootRedirect />} />
        
        {/* Catalog & Book Details */}
        <Route path="/catalog" element={<BookCatalog />} />
        <Route path="/books/:id" element={<BookDetails />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/books"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Books />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/circulation"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Circulation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reservations"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Reservations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/fines"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Fines />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/my-books"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <MyBooks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/my-reservations"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <MyReservations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/my-fines"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <MyFines />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/favorites"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
              <Favorites />
            </ProtectedRoute>
          }
        />
      </Route>


      {/* 404 Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
