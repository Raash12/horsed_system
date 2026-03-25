import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import LoginView from "@/mvc/views/LoginView";
import RoleRedirect from "@/mvc/views/RoleRedirect";
import SuperAdminHome from "@/mvc/views/SuperAdminHome";
import DoctorHome from "@/mvc/views/DoctorHome";
import ReceptionHome from "@/mvc/views/ReceptionHome";

import { RequireRole } from "@/mvc/controllers/auth/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginView />} />
      <Route path="/" element={<RoleRedirect />} />

      <Route
        path="/admin"
        element={
          <RequireRole roles="super_admin">
            <SuperAdminHome />
          </RequireRole>
        }
      />

      <Route
        path="/doctor"
        element={
          <RequireRole roles="doctor">
            <DoctorHome />
          </RequireRole>
        }
      />

      <Route
        path="/reception"
        element={
          <RequireRole roles="reception">
            <ReceptionHome />
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}