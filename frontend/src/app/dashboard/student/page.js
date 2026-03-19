'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meetingCode, setMeetingCode] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // We still fetch stats to ensure we can show user name etc if needed, 
      // but we don't display the full performance matrix anymore as requested.
      await api.getStats();
      setError(null);
    } catch (err) {
      console.error(err);
      setError("FAILED_SYNC: AI Neural Core unreachable. Verify backend connectivity.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!meetingCode) return;
    
    // Extract ID if it's a full link, otherwise use as ID
    let id = meetingCode;
    if (meetingCode.includes('/meeting/')) {
        id = meetingCode.split('/meeting/')[1].split('/')[0];
    } else if (meetingCode.includes('/interview/')) {
        id = meetingCode.split('/interview/')[1].split('/')[0];
    }
    
    window.location.href = `/meeting/${id}`;
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-4xl mx-auto h-[70vh] flex flex-col justify-center">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-black text-white font-outfit tracking-tighter mb-4">Sentinel Node Sync</h2>
          <p className="text-muted text-xl font-medium opacity-60">Enter your secure protocol code to initiate a live AI interview sync.</p>
          
          {error && (
            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center space-x-4 animate-pulse max-w-lg mx-auto">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{error}</p>
            </div>
          )}
        </div>

        {/* High-Impact Centered Join Interface */}
        <div className="space-y-10">
            <form onSubmit={handleJoinByCode} className="w-full flex items-center bg-white/5 border border-white/5 p-2 rounded-[2rem] focus-within:border-blue-500/30 focus-within:bg-white/[0.08] transition-all shadow-2xl">
                <input 
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  placeholder="Paste your meeting link or code here..." 
                  className="flex-1 bg-transparent border-none outline-none px-10 py-6 text-xl text-white placeholder-white/10 font-bold"
                />
                <button 
                  type="submit"
                  disabled={!meetingCode}
                  className="px-12 py-6 bg-blue-600 disabled:bg-white/5 disabled:text-neutral-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-[1.5rem] transition-all hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-95 flex items-center"
                >
                  Join Meeting
                  <span className="ml-3 text-lg">→</span>
                </button>
            </form>

            <div className="flex flex-col items-center">
                <div className="w-full h-px bg-white/5 my-10" />
                
                <div className="grid md:grid-cols-2 gap-8 w-full">
                    {/* Profile Section Card */}
                    <div className="glass-card p-10 bg-gradient-to-br from-white/[0.02] to-blue-500/5 group hover:border-blue-500/20 transition-all cursor-pointer">
                        <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl border border-white/10 group-hover:scale-110 transition-transform">👤</div>
                            <div>
                                <h4 className="text-lg font-black text-white uppercase tracking-tight">Identity Registry</h4>
                                <p className="text-xs text-muted font-bold opacity-60 mt-1 uppercase tracking-widest">Profile Configuration</p>
                            </div>
                        </div>
                    </div>

                    {/* Logout Card */}
                    <div onClick={() => auth.logout()} className="glass-card p-10 bg-white/[0.01] hover:bg-red-500/5 group hover:border-red-500/20 transition-all cursor-pointer">
                        <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl border border-white/10 group-hover:scale-110 transition-transform">🚪</div>
                            <div>
                                <h4 className="text-lg font-black text-white uppercase tracking-tight">Node Exit</h4>
                                <p className="text-xs text-red-400 font-bold opacity-60 mt-1 uppercase tracking-widest">Secure Logout</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
