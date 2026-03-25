import { supabaseAdmin } from '../config/supabaseAdmin';
import { supabase } from '../config/supabaseClient';

export const adminService = {
  // Soo qaado laamaha (Branches)
  getBranches: async () => {
    const { data, error } = await supabase.from('branches').select('*');
    if (error) throw error;
    return data;
  },

  // Abuur user cusub
  createUser: async (email, password, fullName, role, branchId) => {
    // 1. Abuur Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (authError) throw authError;

    // 2. Geli miiska Users
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: authUser.user.id,
      full_name: fullName,
      role: role,
      branch_id: role === 'super_admin' ? null : branchId
    });
    if (dbError) throw dbError;

    return authUser;
  }
};
