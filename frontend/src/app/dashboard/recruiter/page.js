'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import SentinelAssistant from '@/components/SentinelAssistant';

export default function RecruiterDashboard() {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    student_id: '',
    interview_type: 'technical',
    scheduled_at: ''
  });
  const [assistantAction, setAssistantAction] = useState({ action: null, details: null });

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      await api.scheduleMeeting(scheduleData);
      setAssistantAction({ 
        action: 'schedule_interview', 
        details: { name: `Student #${scheduleData.student_id}`, type: scheduleData.interview_type } 
      });
      setShowSchedule(false);
      fetchData();
    } catch (err) {
      alert('Failed to schedule meeting');
    }
  };

  return (
    <DashboardLayout role="recruiter">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black text-white font-outfit tracking-tight">System Intel</h2>
            <p className="text-muted mt-2 font-medium">Monitoring global candidate performance and node health.</p>
          </div>
          <div className="flex space-x-4">
             <button 
                onClick={() => setShowSchedule(true)}
                className="btn-premium flex items-center px-8 py-3 group"
             >
                <span className="mr-2 group-hover:rotate-90 transition-transform">📅</span> 
                Schedule Meeting
             </button>
             <button className="h-12 px-6 bg-white/5 hover:bg-white/10 text-white font-black text-xs rounded-2xl transition-all border border-white/10 flex items-center group">
                <span className="mr-2 group-hover:scale-125 transition-transform">➕</span> 
                Invite Operator
             </button>
          </div>
        </div>

        {/* Schedule Modal */}
        {showSchedule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
                <div className="glass-card w-full max-w-lg p-10 animate-in zoom-in duration-300">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-8">Deploy Meeting Node</h3>
                    <form onSubmit={handleSchedule} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">Candidate ID</label>
                            <input 
                                type="number" 
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Enter Student Database ID"
                                value={scheduleData.student_id}
                                onChange={(e) => setScheduleData({...scheduleData, student_id: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">Track System</label>
                                <select 
                                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                                    value={scheduleData.interview_type}
                                    onChange={(e) => setScheduleData({...scheduleData, interview_type: e.target.value})}
                                >
                                    <option value="technical">Technical</option>
                                    <option value="hr">System Leadership (HR)</option>
                                    <option value="behavioral">Behavioral Matrix</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/50 uppercase tracking-widest ml-1">Timestamp</label>
                                <input 
                                    type="datetime-local" 
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                                    value={scheduleData.scheduled_at}
                                    onChange={(e) => setScheduleData({...scheduleData, scheduled_at: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="flex space-x-4 pt-4">
                            <button type="button" onClick={() => setShowSchedule(false)} className="flex-1 py-4 bg-white/5 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all">Abort</button>
                            <button type="submit" className="flex-1 py-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all">Schedule</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Premium Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <MetricCard label="Global Sessions" value={stats.total_sessions || 0} icon="🌍" trend="+12.5%" />
          <MetricCard label="Active Nodes" value={stats.total_students || 0} icon="📡" trend="+8.2%" />
          <MetricCard label="Clearance Rate" value={`${Math.round((sessions.filter(s => s.status === 'completed').length / (sessions.length || 1)) * 100)}%`} icon="🛡️" trend="+23%" />
          <MetricCard label="Integrity Flags" value={stats.copy_flagged || 0} icon="⚠️" trend="-5.1%" negative />
        </div>

        {/* Live Meetings Selection */}
        <div className="mb-16">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.4em] opacity-40 ml-1 mb-8">Live Interview Syncs</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.filter(s => s.meeting_link && s.status !== 'completed').map(m => (
                    <div key={m.id} className="glass-card p-8 group hover:border-blue-500/30 transition-all relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                             <div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Live Mode</p>
                                <h4 className="font-black text-white capitalize text-lg tracking-tight">{m.interview_type} Matrix</h4>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Student ID</p>
                                <p className="text-sm font-black text-white">#{m.student_id}</p>
                             </div>
                        </div>
                        <div className="flex items-center space-x-3 mb-8">
                            <span className="text-xl">🕒</span>
                            <p className="text-xs font-bold text-slate-300">{new Date(m.scheduled_at).toLocaleString()}</p>
                        </div>
                        <Link 
                            href={`/meeting/${m.id}`}
                            className="w-full py-4 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center group/btn"
                        >
                            Deploy Node →
                        </Link>
                    </div>
                ))}
                {sessions.filter(s => s.meeting_link && s.status !== 'completed').length === 0 && (
                    <div className="lg:col-span-3 py-16 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">No live meetings scheduled</p>
                    </div>
                )}
            </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
             <h3 className="font-black text-white uppercase tracking-widest text-xs opacity-80">Recent Node Activity</h3>
             <div className="flex items-center space-x-3 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
                <span className="luminous-dot bg-blue-500 animate-pulse"></span>
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[.2em]">Live Sync Active</span>
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="px-10 py-6 text-[10px] font-black text-muted uppercase tracking-[.3em]">Module / Node</th>
                  <th className="px-10 py-6 text-[10px] font-black text-muted uppercase tracking-[.3em]">Track System</th>
                  <th className="px-10 py-6 text-[10px] font-black text-muted uppercase tracking-[.3em] text-center">AI Rating</th>
                  <th className="px-10 py-6 text-[10px] font-black text-muted uppercase tracking-[.3em] text-center">Status</th>
                  <th className="px-10 py-6 text-[10px] font-black text-muted uppercase tracking-[.3em] text-right">Clearance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-blue-400 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all text-sm">
                           {s.student_id}
                        </div>
                        <div>
                           <p className="font-black text-white tracking-tight">Node #{s.student_id}</p>
                           <p className="text-[10px] text-muted font-bold tracking-widest uppercase mt-1">{new Date(s.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                       <span className="text-sm font-bold text-slate-300 capitalize bg-white/5 px-3 py-1 rounded-lg border border-white/5">{s.interview_type}</span>
                    </td>
                    <td className="px-10 py-6 text-center">
                       {s.status === 'completed' ? (
                         <div className="inline-flex flex-col items-center">
                            <span className="text-xl font-black text-white">{s.overall_score}%</span>
                            <div className="w-16 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                               <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{width: `${s.overall_score}%`}}></div>
                            </div>
                         </div>
                       ) : <span className="text-muted/30">—</span>}
                    </td>
                    <td className="px-10 py-6 text-center">
                       <span className={`text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-[.15em] border ${
                         s.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                       }`}>
                         {s.status}
                       </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <Link 
                        href={`/reports/${s.id}`} 
                        className={`text-[10px] font-black uppercase tracking-[.2em] px-6 py-3 rounded-xl transition-all ${
                          s.status === 'completed' 
                            ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)] active:scale-95' 
                            : 'bg-white/5 text-muted/40 cursor-not-allowed border border-white/5'
                        }`}
                       >
                         Access Intel
                       </Link>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-10 py-24 text-center text-muted/50 font-bold uppercase tracking-widest text-xs italic">No active telemetry found in pool.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <SentinelAssistant action={assistantAction.action} details={assistantAction.details} />
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
