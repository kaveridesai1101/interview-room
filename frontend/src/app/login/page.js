'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.login(email, password);
      if (res.access_token) {
        auth.saveToken(res.access_token);
        auth.saveUser(res.user);
        if (res.user.role === 'admin') router.push('/admin');
        else if (res.user.role === 'recruiter') router.push('/dashboard/recruiter');
        else router.push('/dashboard/student');
      } else {
        setError(res.detail || 'Invalid email or password');
      }
    } catch (err) {
      setError('Connection failure. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -z-10" />
      
      <div className="w-full max-w-[480px] relative z-10">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center space-x-3 mb-10 group">
            <div className="w-14 h-14 premium-blue-gradient rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-white/20 group-hover:scale-110 transition-transform">B</div>
            <div className="text-left">
              <h1 className="text-xl font-black text-white leading-none tracking-tight">Blue Planet</h1>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mt-1">AI Interview Room</p>
            </div>
          </Link>
          <h1 className="text-4xl font-black text-white font-outfit tracking-tight">Systems Access</h1>
          <p className="text-muted font-medium mt-3 text-lg opacity-80 italic">Enter your clearance credentials to proceed.</p>
        </div>

        <div className="glass-card p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 text-4xl">🔐</div>
          
          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-4 ml-1">Network Identity</label>
              <div className="relative group">
                <input 
                  type="email" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-blue-500/30 text-white placeholder-white/20 text-sm font-medium transition-all outline-none group-focus-within:border-blue-500/50" 
                  placeholder="operator@blueplanet.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-4 ml-1">Secure Passkey</label>
              <div className="relative group">
                <input 
                  type="password" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-blue-500/30 text-white placeholder-white/20 text-sm font-medium transition-all outline-none group-focus-within:border-blue-500/50" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-widest text-center animate-shake">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-5 btn-premium text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 h-16 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : 'Establish Connection →'}
            </button>
          </form>

          <div className="mt-12 text-center text-[10px] font-black tracking-[0.1em]">
            <span className="text-muted uppercase">Unauthorized?</span> 
            <Link href="/signup" className="text-blue-500 ml-3 hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">REQUEST CLEARANCE</Link>
          </div>
        </div>
        
        <p className="mt-12 text-center text-[9px] text-muted/40 font-bold uppercase tracking-[0.4em]">
          End-to-End Encryption Enabled • Sentinel Node v2.0
        </p>
      </div>
    </div>
  );
}
