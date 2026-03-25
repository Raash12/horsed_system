// src/services/authService.js
import { supabase } from '../config/supabaseClient';

export const authService = {
  // 1. Galida Nidaamka
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // 2. Ka bixida Nidaamka
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // 3. Helitaanka xogta user-ka iyo doorkiisa (Role & Branch)
  getUserDetails: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('role, branch_id, full_name')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }
};
