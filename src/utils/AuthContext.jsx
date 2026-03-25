// src/utils/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [branchId, setBranchId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Marka hore hubi haddii user horey u login gareeyay
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchAndSetUser(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();

    // 2. Dhegeyso marka la sameeyo Login ama Logout
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchAndSetUser(session.user.id);
      } else {
        setUser(null);
        setRole(null);
        setBranchId(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchAndSetUser = async (userId) => {
    try {
      const userDetails = await authService.getUserDetails(userId);
      setUser({ id: userId, ...userDetails });
      setRole(userDetails.role);
      setBranchId(userDetails.branch_id);
    } catch (error) {
      console.error("Cilad baa ka dhacday soo qaadista xogta userka:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    return await authService.login(email, password);
  };

  const logout = async () => {
    await authService.logout();
  };

  return (
    <AuthContext.Provider value={{ user, role, branchId, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
