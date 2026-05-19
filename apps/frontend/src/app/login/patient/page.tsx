"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GoogleLogin } from '@react-oauth/google';

export default function PatientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await fetch('http://127.0.0.1:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const user = await res.json();
      if (user.role !== 'PATIENT') {
        setError('Access denied. Please use the Doctor Portal.');
        return;
      }
      localStorage.setItem('hotdoc_user', JSON.stringify(user));
      router.push('/patient');
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Patient record not found. Please register at the hospital desk.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:3002/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential, role: 'PATIENT' })
      });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('hotdoc_user', JSON.stringify(user));
        router.push('/patient');
      } else {
        const data = await res.json();
        setError(data.error || 'Google Login failed');
      }
    } catch (e) {
      setError('An error occurred during Google Login');
    }
  };

  return (
    <div 
      className="flex min-h-screen w-full relative items-center justify-center" 
      style={{ 
        fontFamily: "'Open Sans', sans-serif",
        backgroundImage: "url('/images/back-view-health-professional-portrait.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay to ensure form readability - blur removed and opacity reduced */}
      <div className="absolute inset-0 bg-[#0c1222]/30 z-0"></div>

      {/* ===== CENTER FORM ===== */}
      {/* More transparent background to match the color of the image behind it */}
      <div className="w-full max-w-[480px] bg-[#0c1222]/40 backdrop-blur-xl border border-white/20 rounded-2xl relative flex items-center justify-center overflow-hidden z-10 shadow-2xl mx-4">

        {/* Red glitter glows */}
        <div className="absolute top-[10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-red-700/20 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[5%] left-[10%] w-[250px] h-[250px] rounded-full bg-red-600/20 blur-[100px] pointer-events-none"></div>

        {/* Nav link top-right */}
        <div className="absolute top-6 right-6 z-20">
          <Link href="/login/doctor" className="text-[#6688aa] hover:text-white text-sm font-medium transition-colors">
            Provider Login →
          </Link>
        </div>

        {/* Form container — generous padding */}
        <div className="relative z-10 w-full px-8 py-12 pt-16">

          {/* ---- HEADER SECTION ---- */}
          <p className="text-[#6688aa] text-sm mb-3">
            Login your account
          </p>

          <h1 className="text-white text-4xl font-bold mb-4">
            Welcome Back!
          </h1>

          <p className="text-[#6688aa] text-sm mb-14">
            Enter your email and password
          </p>

          {/* ---- FORM ---- */}
          <form onSubmit={handleLogin}>

            {/* Google Sign in */}
            <div className="mb-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Sign In Failed')}
                theme="filled_black"
                shape="rectangular"
                text="signin_with"
                size="large"
                width="100%"
              />
            </div>
            
            <div className="flex items-center mb-6">
              <div className="flex-1 border-t border-[#1e3050]"></div>
              <span className="px-3 text-xs text-[#5577aa] uppercase tracking-wider font-semibold">Or continue with</span>
              <div className="flex-1 border-t border-[#1e3050]"></div>
            </div>

            {/* Email field */}
            <label className="block text-[#8899aa] text-sm font-medium mb-3">
              Email address
            </label>
            <div className="bg-[#162033] border border-[#1e3050] rounded-xl flex items-center px-5 py-4 mb-8 focus-within:border-blue-500/50 transition-colors">
              <svg className="flex-shrink-0 mr-4 text-[#5577aa]" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="text"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#445566]"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="john.doe@example.com"
              />
            </div>

            {/* Password field */}
            <label className="block text-[#8899aa] text-sm font-medium mb-3">
              Password
            </label>
            <div className="bg-[#162033] border border-[#1e3050] rounded-xl flex items-center px-5 py-4 mb-4 focus-within:border-blue-500/50 transition-colors">
              <svg className="flex-shrink-0 mr-4 text-[#5577aa]" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type="password"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#445566]"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            {/* Forgot password */}
            <div className="mb-10">
              <a href="#" className="text-blue-400 text-sm underline hover:text-blue-300">Forgot Password?</a>
            </div>

            {/* Error */}
            {error && (
              <div className="text-red-400 text-sm mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                {error}
              </div>
            )}

            {/* Sign in button */}
            <button
              type="submit"
              className="w-full bg-[#111827] hover:bg-[#1a2235] text-white py-4 rounded-xl text-sm font-semibold transition-all border border-[#1e2a3a] mb-8"
            >
              Sign in
            </button>
          </form>

          {/* Footer */}
          <p className="text-[#556677] text-sm text-center">
            Are you a medical professional?{' '}
            <Link href="/login/doctor" className="text-blue-400 font-semibold hover:underline">Doctor Login</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
