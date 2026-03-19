'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!auth.isAuthenticated()) return router.push('/login');
    const u = auth.getUser();
    if (u.role !== 'admin') return router.push('/login');
    setUser(u);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-inter">
      <div className="container mx-auto px-10 py-16 max-w-[1400px]">
        <header className="flex justify-between items-end mb-20">
          <div className="flex items-center space-x-6">
             <div className="w-16 h-16 rounded-[2rem] premium-blue-gradient shadow-2xl shadow-blue-500/20 flex items-center justify-center text-3xl ring-1 ring-white/20">⚡</div>
             <div>
                <h1 className="text-5xl font-black font-outfit tracking-tighter text-white">Platform Command</h1>
                <p className="text-muted mt-2 font-medium text-lg italic opacity-80">Full-spectrum surveillance and node health telemetry.</p>
             </div>
          </div>
          <button onClick={() => auth.logout()} className="px-8 py-3 bg-red-500/5 text-red-500 font-black uppercase tracking-widest text-[10px] rounded-2xl border border-red-500/10 hover:bg-red-500/10 transition-all active:scale-95 shadow-lg shadow-red-500/5">
            TERMINATE SESSION
          </button>
        </header>

        {/* Global Intelligence Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            <AdminStatCard label="Network Sessions" value={stats?.total_sessions || 0} icon="🌐" />
            <AdminStatCard label="Registered Nodes" value={stats?.total_students || 0} icon="🆔" />
            <AdminStatCard label="Authorized Ops" value={stats?.total_recruiters || 0} icon="🔑" />
            <AdminStatCard label="Security Flags" value={stats?.copy_flagged || 0} icon="🚨" critical />
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
            {/* Live Activity Matrix */}
            <div className="lg:col-span-2 space-y-10">
                <div className="flex justify-between items-end px-4">
                    <h2 className="text-2xl font-black font-outfit text-white tracking-tight uppercase tracking-[0.2em]">Real-time Event Stream</h2>
                    <div className="flex items-center space-x-3 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Global Sync Active</span>
                    </div>
                </div>

                <div className="glass-card overflow-hidden">
                    <div className="p-10 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-60">System Log Entries</h3>
                    </div>
                    <div className="divide-y divide-white/5">
                        <ActivityRow user="Student_41" action="Initialized Technical Simulation" time="02m ago" status="active" />
                        <ActivityRow user="Op_Valkyrie" action="Extracted AI Analytical Report" time="15m ago" status="done" />
                        <ActivityRow user="Student_92" action="Violation Detected: DOM Occlusion" time="22m ago" status="alert" />
                        <ActivityRow user="Kernel" action="Database Index Optimization" time="01h ago" status="info" />
                    </div>
                </div>
            </div>

            {/* Platform Integrity Hub */}
            <div className="space-y-10">
                <h2 className="text-2xl font-black font-outfit text-white tracking-tight uppercase tracking-[0.2em] px-4">System Core</h2>
                <div className="glass-card p-10 space-y-10">
                    <div className="space-y-8">
                        <HealthBadge label="AI Inference Engine" status="healthy" value="Operational" />
                        <HealthBadge label="Video Transcoding" status="healthy" value="Stable" />
                        <HealthBadge label="Encrypted Storage" status="healthy" value="Syncing" />
                        <HealthBadge label="SMTP Gateway" status="warning" value="Latency Detected" />
                    </div>

                    <div className="pt-10 border-t border-white/5">
                        <button className="w-full btn-premium py-5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-500/10">
                            PLATFORM CONFIGURATION
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ label, value, icon, critical = false }) {
    return (
        <div className="glass-card p-10 group hover:bg-white/[0.03] transition-all relative overflow-hidden">
            <div className="absolute top-[-20px] right-[-20px] text-8xl opacity-[0.03] group-hover:scale-125 transition-transform duration-1000">
               {icon}
            </div>
            <div className="text-muted text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-60 underline decoration-blue-500/20 underline-offset-8">{label}</div>
            <div className={`text-6xl font-black font-outfit tracking-tighter ${critical ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-white'}`}>
                {value}
            </div>
        </div>
    );
}

function ActivityRow({ user, action, time, status }) {
    const statusIcons = {
        active: { color: 'bg-blue-500', icon: '📡' },
        done: { color: 'bg-green-500', icon: '✅' },
        alert: { color: 'bg-red-500', icon: '🚨' },
        info: { color: 'bg-white/20', icon: 'ℹ️' }
    };
    const s = statusIcons[status] || statusIcons.info;
    return (
        <div className="px-10 py-6 flex items-center hover:bg-white/[0.02] transition-colors group">
            <div className={`w-3 h-3 rounded-full mr-6 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${s.color}`} />
            <div className="flex-1">
                <div className="text-sm font-black text-white tracking-tight group-hover:text-blue-400 transition-colors uppercase">{user}</div>
                <div className="text-[10px] text-muted font-bold tracking-widest mt-1 uppercase italic opacity-60">{action}</div>
            </div>
            <div className="text-[10px] font-black text-muted/40 uppercase tracking-widest">{time}</div>
        </div>
    );
}

function HealthBadge({ label, status, value }) {
    const colors = {
        healthy: 'bg-green-500 shadow-green-500/20',
        warning: 'bg-yellow-500 shadow-yellow-500/20',
        error: 'bg-red-500 shadow-red-500/20'
    };
    return (
        <div className="flex justify-between items-center group">
            <div className="flex flex-col">
                <span className="text-[10px] text-muted font-black uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
                <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1 italic">{value}</span>
            </div>
            <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_15px] ${colors[status]}`} title={status} />
        </div>
    );
}
