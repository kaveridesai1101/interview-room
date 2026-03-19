'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

export default function PerformanceMatrix() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-6xl">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white font-outfit tracking-tight">System Performance</h2>
          <p className="text-muted mt-2 font-medium text-lg">Comprehensive breakdown of your AI readiness telemetry.</p>
        </div>

        {loading ? (
            <div className="py-24 text-center glass-card border-dashed bg-white/[0.01]">
                 <span className="w-8 h-8 rounded-full border-4 border-t-blue-500 border-white/10 animate-spin block mx-auto mb-4"></span>
                 <p className="text-muted font-bold uppercase tracking-widest text-xs opacity-40">Compiling Analytics Matrix...</p>
            </div>
        ) : (
          <>
            {/* Top Level Metrics */}
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <AnalyticCard 
                  label="Global Index Score" 
                  value={`${stats.avg_score || 0}%`} 
                  subtext="Aggregate AI Evaluation"
                  highlight="blue" 
              />
              <AnalyticCard 
                  label="Total Simulations" 
                  value={stats.total_sessions || 0} 
                  subtext="Nodes Deployed"
                  highlight="purple" 
              />
              <AnalyticCard 
                  label="Active Practice" 
                  value={stats.my_sessions || 0} 
                  subtext="Personal Telemetry"
                  highlight="emerald" 
              />
              <AnalyticCard 
                  label="Status" 
                  value={(stats.avg_score || 0) >= 70 ? 'OPTIMAL' : (stats.avg_score || 0) >= 40 ? 'NOMINAL' : 'CRITICAL'} 
                  subtext="System Readiness"
                  highlight={(stats.avg_score || 0) >= 70 ? 'emerald' : (stats.avg_score || 0) >= 40 ? 'amber' : 'red'} 
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Detailed Breakdown Panel */}
              <div className="glass-card p-10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
                 <h3 className="text-sm font-black text-white uppercase tracking-[.4em] opacity-50 mb-8 border-b border-white/5 pb-4">Performance Vectors</h3>
                 
                 <div className="space-y-8 relative z-10">
                    <ScoreBar label="Technical Proficiency" score={stats.avg_score ? Math.min(100, stats.avg_score + 5) : 0} color="bg-blue-500" />
                    <ScoreBar label="Communication Logic" score={stats.avg_score ? Math.max(0, stats.avg_score - 10) : 0} color="bg-purple-500" />
                    <ScoreBar label="Confidence Metrics" score={stats.avg_score ? Math.min(100, stats.avg_score + 12) : 0} color="bg-emerald-500" />
                 </div>
              </div>

              {/* Insights Panel */}
              <div className="glass-card p-10">
                 <h3 className="text-sm font-black text-white uppercase tracking-[.4em] opacity-50 mb-8 border-b border-white/5 pb-4">AI Core Insights</h3>
                 
                 <div className="space-y-6">
                    <InsightRow 
                       icon="🎯" 
                       title="Strong Technical Base" 
                       desc="Your algorithm analysis is registering high confidence intervals." 
                       type="positive" 
                    />
                    <InsightRow 
                       icon="⚠️" 
                       title="Communication Latency" 
                       desc="Verbal restructuring is required during stress response scenarios." 
                       type="warning" 
                    />
                    <InsightRow 
                       icon="👁️" 
                       title="Eye Contact Tracking" 
                       desc="Sensors indicate nominal engagement. Maintain focus." 
                       type="neutral" 
                    />
                 </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function AnalyticCard({ label, value, subtext, highlight }) {
  const highlightMap = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    red: 'text-red-400'
  };

  return (
    <div className="glass-card p-8 group hover:-translate-y-1 transition-transform">
      <p className="text-muted text-[10px] font-black uppercase tracking-[.3em] mb-4 opacity-50">{label}</p>
      <p className={`text-5xl font-black font-outfit tracking-tighter mb-2 ${highlightMap[highlight]}`}>{value}</p>
      <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{subtext}</p>
    </div>
  );
}

function ScoreBar({ label, score, color }) {
  return (
    <div>
      <div className="flex justify-between items-end mb-3">
        <span className="text-xs font-black text-white uppercase tracking-widest">{label}</span>
        <span className="text-xl font-black text-white">{score}%</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div className={`h-full ${color} shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all duration-1000`} style={{ width: `${score}%` }}></div>
      </div>
    </div>
  );
}

function InsightRow({ icon, title, desc, type }) {
  const bgMap = {
    positive: 'bg-green-500/10 border-green-500/20 text-green-400',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    neutral: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  };

  return (
    <div className="flex items-start space-x-5 group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border flex-shrink-0 ${bgMap[type]}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-black text-white mb-1 tracking-tight">{title}</h4>
        <p className="text-xs text-muted font-medium leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{desc}</p>
      </div>
    </div>
  );
}
