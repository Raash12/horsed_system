// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../views/auth/Login';
import ProtectedRoute from '../utils/ProtectedRoute';
import { useAuth } from '../utils/AuthContext';

// Kani waa qayb kumeel gaar ah (Placeholders) ilaa aan ka samaynayno views-ka rasmiga ah
const SuperAdminView = () => <h2>Super Admin Dashboard (Head Office)</h2>;
const DoctorView = () => <h2>Doctor Dashboard (Assigned Patients)</h2>;
const ReceptionView = () => <h2>Reception Dashboard (Queue & Registration)</h2>;
const UnauthorizedView = () => <h2>Kuma lihid rukhsad boggan!</h2>;

// Bogga ugu weyn oo u kala jiheynaya dadka doorkooda
const HomeRedirect = () => {
  const { role } = useAuth();
  if (role === 'super_admin') return <Navigate to="/admin" />;
  if (role === 'doctor') return <Navigate to="/doctor" />;
  if (role === 'reception') return <Navigate to="/reception" />;
  return <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<UnauthorizedView />} />

      {/* Routes u gaar ah Super Admin */}
      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route path="/admin" element={<SuperAdminView />} />
        {/* Halkan waxaad ku dari doontaa /admin/branches, /admin/users iwm */}
      </Route>

      {/* Routes u gaar ah Doctor */}
      <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
        <Route path="/doctor" element={<DoctorView />} />
      </Route>

      {/* Routes u gaar ah Reception */}
      <Route element={<ProtectedRoute allowedRoles={['reception']} />}>
        <Route path="/reception" element={<ReceptionView />} />
      </Route>

      {/* Home Route - Wuxuu qofka u tuurayaa meesha ku habboon */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<HomeRedirect />} />
      </Route>

      {/* Haddii URL uusan jirin */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;
