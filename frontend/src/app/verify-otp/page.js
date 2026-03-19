'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import Link from 'next/link';

function OTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const role = searchParams.get('role') || 'student';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  const handleChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return setError('Enter the full 6-digit code');

    setLoading(true);
    setError('');

    try {
      const res = await api.verifySignup(email, code);
      if (res.access_token) {
        auth.saveToken(res.access_token);
        auth.saveUser(res.user);
        if (role === 'recruiter') router.push('/dashboard/recruiter');
        else router.push('/dashboard/student');
      } else {
        setError(res.detail || 'Invalid or expired code');
      }
    } catch (err) {
      setError('Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await api.resendOTP(email);
      alert('Verification code resent to ' + email);
    } catch (err) {
      alert('Failed to resend. Try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md relative z-10">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black font-outfit text-white mb-4 tracking-tight">Identity Verification</h1>
        <p className="text-muted leading-relaxed font-medium">
          Secure code dispatched to network address: <br />
          <span className="text-blue-400 font-black uppercase tracking-widest text-xs mt-2 block">{email}</span>
        </p>
      </div>

      <div className="glass-card p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 text-4xl">📡</div>
        
        <form onSubmit={verify} className="space-y-10">
          <div className="flex justify-between gap-3">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                maxLength={1}
                className="w-full aspect-[3/4] bg-white/5 border border-white/10 rounded-2xl text-center text-3xl font-black text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                required
              />
            ))}
          </div>

          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-widest text-center animate-shake">{error}</div>}

          <button 
            type="submit" 
            className="btn-premium w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all h-16 flex items-center justify-center disabled:opacity-50"
            disabled={loading}
          >
            {loading ? (
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Syncing Code...</span>
                </div>
            ) : 'Establish Credentials →'}
          </button>
        </form>

        <div className="mt-12 text-center text-[10px] font-black tracking-[0.1em]">
          <p className="text-muted uppercase mb-3">Encryption Latency?</p>
          <button 
            type="button" 
            onClick={resend} 
            className="text-blue-500 hover:text-blue-400 transition-colors underline decoration-blue-500/30 underline-offset-4 disabled:opacity-50"
            disabled={resending}
          >
            {resending ? 'RE-TRANSMITTING...' : 'RESEND SECURITY CODE'}
          </button>
        </div>
      </div>
      
      <div className="mt-12 text-center text-[10px] font-black tracking-widest">
        <Link href="/signup" className="text-muted/40 hover:text-white transition-colors">
          ← ABORT & RETURN TO SIGNUP
        </Link>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] -z-10" />
      
      <Suspense fallback={<div className="text-white font-black uppercase tracking-widest animate-pulse">Initializing Hub...</div>}>
        <OTPContent />
      </Suspense>
    </div>
  );
}
