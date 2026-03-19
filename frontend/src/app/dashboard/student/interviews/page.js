'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function InterviewHub() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data || []);
    } catch (err) {
      console.error(err);
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
          <h2 className="text-4xl font-black text-white font-outfit tracking-tight">Interview Hub</h2>
          <p className="text-muted mt-2 font-medium text-lg">Deploy specialized AI tracks and review past global telemetries.</p>
        </div>

        {/* Action Grid for Launching Labs */}
        <h3 className="text-xs font-black text-white uppercase tracking-[.4em] opacity-40 ml-1 mb-8">Launch Sector</h3>
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <LabCard 
            title="Technical Node" 
            desc="Algorithms, system design, and deep logic analysis." 
            type="technical" 
            onLaunch={() => startInterview('technical')}
            glowColor="blue"
          />
          <LabCard 
            title="System Leadership (HR)" 
            desc="Management logic, team orchestration, and cultural fit." 
            type="hr" 
            onLaunch={() => startInterview('hr')}
            glowColor="purple"
          />
          <LabCard 
            title="Behavioral Matrix" 
            desc="Conflict resolution, stress response, and ethics." 
            type="behavioral" 
            onLaunch={() => startInterview('behavioral')}
            glowColor="emerald"
          />
        </div>

        <h3 className="text-xs font-black text-white uppercase tracking-[.4em] opacity-40 ml-1 mb-8">Node History</h3>
        
        {loading ? (
            <div className="py-24 text-center glass-card border-dashed bg-white/[0.01]">
                 <span className="w-8 h-8 rounded-full border-4 border-t-blue-500 border-white/10 animate-spin block mx-auto mb-4"></span>
                 <p className="text-muted font-bold uppercase tracking-widest text-xs opacity-40">Syncing telemetry data...</p>
            </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map(s => (
                <div key={s.id} className="glass-card p-6 flex justify-between items-center group hover:bg-white/[0.03]">
                  <div className="flex items-center space-x-6">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all border shadow-[0_0_15px_rgba(255,255,255,0.05)] ${
                        s.interview_type === 'technical' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                        s.interview_type === 'hr' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                     }`}>
                       {s.interview_type === 'technical' ? '💻' : s.interview_type === 'hr' ? '🤝' : '🧠'}
                     </div>
                     <div>
                       <p className="font-black text-white text-lg tracking-tight capitalize">{s.interview_type} Practice</p>
                       <p className="text-[10px] text-muted font-bold uppercase tracking-widest mt-1">
                           Node ID: {s.id} • {new Date(s.created_at).toLocaleString()}
                       </p>
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
                        <div className="text-right min-w-[100px]">
                           <p className="text-sm font-black text-muted uppercase tracking-[.2em] mb-1">AI Score</p>
                           <p className={`text-2xl font-black leading-none ${s.overall_score >= 70 ? 'text-green-400' : s.overall_score >= 45 ? 'text-amber-400' : 'text-red-400'}`}>
                             {s.overall_score}%
                           </p>
                        </div>
                     ) : (
                       <Link href={`/interview/${s.id}`} className="btn-premium px-6 py-3 text-[10px] uppercase tracking-widest">Resume →</Link>
                     )}
                  </div>
                </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center glass-card border-dashed bg-white/[0.01]">
             <p className="text-muted font-bold uppercase tracking-widest text-xs opacity-40">No historical labs found. Deploy a node to begin.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function LabCard({ title, desc, type, onLaunch, glowColor }) {
  const colorMap = {
    blue: 'group-hover:bg-blue-500/20 border-blue-500/20',
    purple: 'group-hover:bg-purple-500/20 border-purple-500/20',
    emerald: 'group-hover:bg-emerald-500/20 border-emerald-500/20'
  };

  return (
    <div className={`glass-card p-10 relative group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] cursor-pointer flex flex-col h-full`} onClick={onLaunch}>
        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl transition-all duration-700 ${colorMap[glowColor]}`}></div>
        
        <div className="mb-6 z-10">
            <h4 className="text-xl font-black text-white font-outfit">{title}</h4>
            <p className="text-xs text-muted font-medium mt-3 leading-relaxed">{desc}</p>
        </div>
        
        <div className="mt-auto z-10 pt-6">
            <button className="w-full flex justify-between items-center py-3 px-5 bg-white/5 border border-white/10 rounded-xl group-hover:bg-white text-white group-hover:text-black transition-colors font-black text-xs uppercase tracking-widest">
                <span>Deploy Node</span>
                <span className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
            </button>
        </div>
    </div>
  );
}
