'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function SignupPage() {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    education: '',
    experience: '',
    target_domain: '',
    company: '',
    job_position: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: role,
        ...(role === 'student' ? {
          education: formData.education,
          experience: formData.experience,
          target_domain: formData.target_domain,
        } : {
          company: formData.company,
          job_position: formData.job_position,
        })
      };

      const res = await api.signup(payload);
      if (res.message && res.message.includes('Verification code sent')) {
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}&role=${role}`);
      } else {
        setError(res.detail || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Connection failure. Check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -z-10" />
      
      <div className="w-full max-w-xl relative z-10 py-12">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center space-x-3 mb-8 group">
            <div className="w-12 h-12 rounded-xl premium-blue-gradient flex items-center justify-center font-black text-xl text-white shadow-lg ring-1 ring-white/20 group-hover:scale-110 transition-transform">S</div>
            <div className="text-left">
               <h2 className="text-lg font-black font-outfit tracking-tighter text-white leading-none">Sentinel<span className="text-blue-500">AI</span></h2>
               <p className="text-[9px] text-muted font-black uppercase tracking-[0.2em] mt-1">Platform Enrollment</p>
            </div>
          </Link>
          <h1 className="text-4xl font-black font-outfit text-white tracking-tight">Initiate Personnel Sync</h1>
          <p className="text-muted mt-3 font-medium text-lg opacity-80">Configure your professional profile for the AI matrix.</p>
        </div>

        <div className="glass-card p-10 relative overflow-hidden">
          {/* Role Toggle */}
          <div className="flex p-1.5 bg-white/5 rounded-2xl mb-10 border border-white/10 backdrop-blur-md">
            <button 
              onClick={() => setRole('student')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${role === 'student' ? 'btn-premium text-white shadow-lg' : 'text-muted hover:text-white'}`}
            >
              Candidate Node
            </button>
            <button 
              onClick={() => setRole('recruiter')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${role === 'recruiter' ? 'btn-premium text-white shadow-lg' : 'text-muted hover:text-white'}`}
            >
              Operator Node
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 ml-1">Legal Designation</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500/30 text-white placeholder-white/20 text-sm font-medium transition-all outline-none" placeholder="John Doe" value={formData.full_name} onChange={e => updateForm('full_name', e.target.value)} required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 ml-1">Network Address</label>
                <input type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500/30 text-white placeholder-white/20 text-sm font-medium transition-all outline-none" placeholder="john@example.com" value={formData.email} onChange={e => updateForm('email', e.target.value)} required />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 ml-1">Security Passkey</label>
              <input type="password" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500/30 text-white placeholder-white/20 text-sm font-medium transition-all outline-none" placeholder="Create a strong key" value={formData.password} onChange={e => updateForm('password', e.target.value)} required />
            </div>

            {role === 'student' ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 ml-1">Academic Level</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500/30 text-white placeholder-white/20 text-sm font-medium transition-all outline-none" placeholder="B.Tech, CS" value={formData.education} onChange={e => updateForm('education', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 ml-1">Field Seniority</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500/30 text-white placeholder-white/20 text-sm font-medium transition-all outline-none" placeholder="Fresher / 2 Yrs" value={formData.experience} onChange={e => updateForm('experience', e.target.value)} />
                  </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 ml-1">Target Sector</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500/30 text-white placeholder-white/20 text-sm font-medium transition-all outline-none" placeholder="Fullstack Developer" value={formData.target_domain} onChange={e => updateForm('target_domain', e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 ml-1">Organization</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500/30 text-white placeholder-white/20 text-sm font-medium transition-all outline-none" placeholder="TechCorp Inc." value={formData.company} onChange={e => updateForm('company', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-3 ml-1">Designation</label>
                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500/30 text-white placeholder-white/20 text-sm font-medium transition-all outline-none" placeholder="HR / Tech Lead" value={formData.job_position} onChange={e => updateForm('job_position', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-shake">{error}</div>}

            <button 
              type="submit" 
              className="btn-premium w-full py-5 mt-6 flex items-center justify-center disabled:opacity-50 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl h-16 shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Configuring Metadata...</span>
                </div>
              ) : 'Confirm Enrollment →'}
            </button>
          </form>

          <div className="mt-10 text-center text-[10px] font-black tracking-[0.1em]">
            <span className="text-muted uppercase">Existing Node?</span> <Link href="/login" className="text-blue-500 ml-3 hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4">ESTABLISH SYNC</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
