import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { Loading } from '../components/common/Loading';

// Public pages (lazy loaded)
const Landing = lazy(() => import('../pages/Landing'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Donor pages (lazy loaded)
const DonorDashboard = lazy(() => import('../pages/donor/Dashboard'));
const CreateDonation = lazy(() => import('../pages/donor/CreateDonation'));
const MyDonations = lazy(() => import('../pages/donor/MyDonations'));
const DonorDonationHistory = lazy(() => import('../pages/donor/DonationHistory'));
const Impact = lazy(() => import('../pages/donor/Impact'));

// NGO pages (lazy loaded)
const NGODashboard = lazy(() => import('../pages/ngo/Dashboard'));
const AvailableDonations = lazy(() => import('../pages/ngo/AvailableDonations'));
const AcceptedDonations = lazy(() => import('../pages/ngo/AcceptedDonations'));
const OrganizationProfile = lazy(() => import('../pages/ngo/OrganizationProfile'));
const NGODonationHistory = lazy(() => import('../pages/ngo/DonationHistory'));

// Volunteer pages (lazy loaded)
const VolunteerDashboard = lazy(() => import('../pages/volunteer/Dashboard'));
const AvailableTasks = lazy(() => import('../pages/volunteer/AvailableTasks'));
const AssignedTasks = lazy(() => import('../pages/volunteer/AssignedTasks'));
const VolunteerProfile = lazy(() => import('../pages/volunteer/Profile'));
const VolunteerTaskHistory = lazy(() => import('../pages/volunteer/TaskHistory'));

// Admin pages (lazy loaded)
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const UserManagement = lazy(() => import('../pages/admin/UserManagement'));
const NGOVerification = lazy(() => import('../pages/admin/NGOVerification'));
const DonationManagement = lazy(() => import('../pages/admin/DonationManagement'));
const DeliveryMonitoring = lazy(() => import('../pages/admin/DeliveryMonitoring'));
const Reports = lazy(() => import('../pages/admin/Reports'));

const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<Loading message="Loading page..." className="min-h-[50vh]" />}>
    {children}
  </Suspense>
);

export const AppRoutes: React.FC = () => {
  return (
    <SuspenseWrapper>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Authenticated Routes wrapped in MainLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Donor Routes (Restricted strictly to 'donor') */}
            <Route element={<ProtectedRoute allowedRoles={['donor']} />}>
              <Route path="donor">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DonorDashboard />} />
                <Route path="create-donation" element={<CreateDonation />} />
                <Route path="my-donations" element={<MyDonations />} />
                <Route path="history" element={<DonorDonationHistory />} />
                <Route path="impact" element={<Impact />} />
              </Route>
            </Route>

            {/* NGO Routes (Restricted strictly to 'ngo') */}
            <Route element={<ProtectedRoute allowedRoles={['ngo']} />}>
              <Route path="ngo">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<NGODashboard />} />
                <Route path="available" element={<AvailableDonations />} />
                <Route path="accepted" element={<AcceptedDonations />} />
                <Route path="profile" element={<OrganizationProfile />} />
                <Route path="history" element={<NGODonationHistory />} />
              </Route>
            </Route>

            {/* Volunteer Routes (Restricted strictly to 'volunteer') */}
            <Route element={<ProtectedRoute allowedRoles={['volunteer']} />}>
              <Route path="volunteer">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<VolunteerDashboard />} />
                <Route path="available" element={<AvailableTasks />} />
                <Route path="assigned" element={<AssignedTasks />} />
                <Route path="profile" element={<VolunteerProfile />} />
                <Route path="history" element={<VolunteerTaskHistory />} />
              </Route>
            </Route>

            {/* Admin Routes (Restricted strictly to 'admin') */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="admin">
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="ngo-verification" element={<NGOVerification />} />
                <Route path="donations" element={<DonationManagement />} />
                <Route path="deliveries" element={<DeliveryMonitoring />} />
                <Route path="reports" element={<Reports />} />
              </Route>
            </Route>
          </Route>
        </Route>

        {/* 404 Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SuspenseWrapper>
  );
};


