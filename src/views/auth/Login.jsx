// src/views/auth/Login.jsx
import React, { useState } from 'react';
import { supabase } from '../../config/supabaseClient';

// HUBI INAY TAYADAAN TAHAY (export default)
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else window.location.href = "/";
  };

  return (
    <div style={{ padding: '50px' }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required /><br/><br/>
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required /><br/><br/>
        <button type="submit">Gali (Login)</button>
      </form>
    </div>
  );
};

// MA KA HARAY KHADKAN? (WAA MUHIIM)
export default Login; 
