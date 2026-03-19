'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function StudentDashboard() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sData, statData] = await Promise.all([
        api.getSessions(),
        api.getStats()
      ]);
      setSessions(sData || []);
      setStats(statData || {});
      setError(null);
    } catch (err) {
      console.error(err);
      setError("FAILED_SYNC: AI Neural Core unreachable. Verify backend connectivity.");
    } finally {
      setLoading(false);
    }
  };

  const startInterview = async (type) => {
    try {
      const res = await api.createSession(type);
      if (res.id) window.location.href = `/interview/${res.id}`;
    } catch (err) {
      alert('Failed to start interview');
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-6xl">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white font-outfit tracking-tight">Performance Matrix</h2>
          <p className="text-muted mt-2 font-medium text-lg">Track your AI readiness and global hiring telemetry.</p>
          
          {error && (
            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center space-x-4 animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">{error}</p>
            </div>
          )}
        </div>

        {/* Premium Metrics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <MetricCard label="Total Practice" value={stats.my_sessions || 0} icon="📅" trend="+12%" />
          <MetricCard label="Readiness Index" value={`${stats.avg_score || 0}%`} icon="📡" trend="+8%" />
          <MetricCard label="Completed Labs" value={sessions.filter(s => s.status === 'completed').length} icon="✔️" trend="+23%" />
          <MetricCard label="Sync Latency" value="42ms" icon="🕒" trend="-5%" />
        </div>

        {/* Live Interview Syncs */}
        <div className="mb-16">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] opacity-40 ml-1 mb-8">Live Interview Syncs</h3>
            <div className="grid md:grid-cols-2 gap-6">
                {sessions.filter(s => s.meeting_link && s.status !== 'completed').map(m => (
                    <div key={m.id} className="glass-card p-8 group hover:border-blue-500/30 transition-all relative overflow-hidden bg-gradient-to-br from-white/[0.02] to-blue-500/5">
                        <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                             <div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Live Meeting</p>
                                <h4 className="font-black text-white capitalize text-xl tracking-tight">{m.interview_type} Practice</h4>
                             </div>
                             <div className="text-right">
                                <span className="luminous-dot bg-blue-500 animate-pulse inline-block mr-2"></span>
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Scheduled</span>
                             </div>
                        </div>
                        <div className="flex items-center space-x-3 mb-8">
                            <span className="text-xl">📅</span>
                            <p className="text-[11px] font-bold text-slate-300 tracking-wide">{new Date(m.scheduled_at).toLocaleString()}</p>
                        </div>
                        <Link 
                            href={`/meeting/${m.id}`}
                            className="w-full py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] active:scale-95"
                        >
                            Join Meeting Now
                        </Link>
                    </div>
                ))}
                {sessions.filter(s => s.meeting_link && s.status !== 'completed').length === 0 && (
                    <div className="md:col-span-2 py-12 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">No live interviews scheduled by recruiters</p>
                    </div>
                )}
            </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
            {/* Recent Telemetry List */}
            <div className="lg:col-span-2 space-y-8">
            <h3 className="text-xs font-black text-white uppercase tracking-[.4em] opacity-40 ml-1">Recent Telemetry</h3>
            {sessions.length > 0 ? sessions.map(s => (
              <div key={s.id} className="glass-card p-8 flex justify-between items-center group hover:bg-white/[0.03]">
                <div className="flex items-center space-x-6">
                   <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-all border border-white/10">📹</div>
                   <div>
                     <p className="font-black text-white text-lg tracking-tight capitalize">{s.interview_type} Practice</p>
                     <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">{new Date(s.created_at).toLocaleDateString()} • AI Node Sync</p>
                   </div>
                </div>
                <div className="text-right flex items-center space-x-8">
                   <div className="hidden sm:block">
                     <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border ${
                       s.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                     }`}>
                       {s.status}
                     </span>
                   </div>
                   {s.status === 'completed' ? (
                     <div className="w-20">
                        <p className="text-2xl font-black text-white leading-none">{s.overall_score}%</p>
                        <div className="w-full h-1 bg-white/10 rounded-full mt-2.5 overflow-hidden">
                           <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{width: `${s.overall_score}%`}}></div>
                        </div>
                     </div>
                   ) : (
                     <Link href={`/interview/${s.id}`} className="btn-premium px-6 py-3 text-[10px] uppercase tracking-widest">Resume Node →</Link>
                   )}
                </div>
              </div>
            )) : (
              <div className="py-24 text-center glass-card border-dashed bg-white/[0.01]">
                 <p className="text-muted font-bold uppercase tracking-widest text-xs opacity-40">No telemetry records found.</p>
              </div>
            )}
          </div>

          {/* AI Room Launchpad */}
          <div className="space-y-8">
            <h3 className="text-xs font-black text-white uppercase tracking-[.4em] opacity-40 ml-1">Launch AI Node</h3>
            <div className="glass-card p-10 bg-gradient-to-br from-white/[0.02] to-blue-500/10">
               <p className="text-sm text-muted leading-relaxed mb-10 font-medium italic opacity-80">Select a specialized track to begin your AI-analyzed behavioral simulation.</p>
               <div className="space-y-4">
                  <ActionBtn onClick={() => startInterview('technical')} label="Technical Node" />
                  <ActionBtn onClick={() => startInterview('hr')} label="System Leadership" />
                  <ActionBtn onClick={() => startInterview('behavioral')} label="Behavioral Matrix" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ label, value, icon, trend, negative = false }) {
  return (
    <div className="glass-card p-10 relative group overflow-hidden hover:bg-white/[0.03]">
      <div className="flex justify-between items-start mb-8">
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500 border border-white/5">
          {icon}
        </div>
        <div className={`flex items-center text-[10px] font-black px-2.5 py-1 rounded-full border ${negative ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
          {trend}
        </div>
      </div>
      <p className="text-muted text-[10px] font-black uppercase tracking-[.3em] mb-2 opacity-60 underline decoration-blue-500/30 underline-offset-4">{label}</p>
      <p className="text-5xl font-black text-white font-outfit tracking-tighter">{value}</p>
    </div>
  );
}

function ActionBtn({ label, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all group group active:scale-95">
      <span className="font-black text-white text-xs uppercase tracking-widest">{label}</span>
      <span className="text-blue-500 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-sm font-black">→</span>
    </button>
  );
}
