'use client';
import { useState, useEffect } from 'react';
import { 
    Users, Activity, Shield, FileText, Settings, 
    Search, Filter, ExternalLink, Trash2, CheckCircle, 
    AlertTriangle, Server, Database, Lock, MoreVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('view_interviews');
    const [searchQuery, setSearchQuery] = useState('');

    const tabs = [
        { id: 'view_users', label: 'Nodes Directory', icon: Users, color: 'text-blue-400' },
        { id: 'view_interviews', label: 'Active Sessions', icon: Activity, color: 'text-green-400' },
        { id: 'view_reports', label: 'Intelligence Registry', icon: FileText, color: 'text-purple-400' },
        { id: 'monitor_activity', label: 'Security Logs', icon: Shield, color: 'text-red-400' },
        { id: 'manage_system', label: 'System Protocols', icon: Settings, color: 'text-neutral-400' },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-neutral-200">
            {/* Command Header */}
            <header className="border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-8 h-24 flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                            <Shield size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-white uppercase tracking-[0.2em]">Sentinel Command</h1>
                            <div className="flex items-center space-x-2 mt-0.5">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Global Node: ID-ALPHA-01</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                         <div className="flex items-center px-4 py-2.5 bg-white/5 border border-white/5 rounded-xl hover:border-blue-500/30 transition-all group">
                            <Search size={16} className="text-neutral-500 mr-3 group-hover:text-blue-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search Cluster..." 
                                className="bg-transparent border-none outline-none text-xs font-bold text-white placeholder-neutral-600 w-64"
                            />
                         </div>
                         <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                             <Filter size={18} className="text-neutral-400" />
                         </div>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto flex">
                {/* Protocol Sidebar */}
                <aside className="w-80 border-r border-white/5 h-[calc(100-6rem)] sticky top-24 p-8">
                    <nav className="space-y-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-4 px-5 py-4 rounded-2xl transition-all group ${
                                    activeTab === tab.id 
                                    ? 'bg-blue-600/10 border border-blue-500/20 text-white' 
                                    : 'hover:bg-white/[0.03] text-neutral-500'
                                }`}
                            >
                                <tab.icon size={18} className={`${activeTab === tab.id ? tab.color : 'text-neutral-600 group-hover:text-neutral-400'}`} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="mt-12 pt-8 border-t border-white/5 space-y-6">
                         <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-5">Cluster Health</h4>
                         <div className="space-y-4 px-5">
                            <HealthMetric label="Core Load" value="12%" color="bg-blue-500" />
                            <HealthMetric label="Memory Node" value="4.2 / 16 GB" color="bg-green-500" />
                            <HealthMetric label="Network Latency" value="24 ms" color="bg-purple-500" />
                         </div>
                    </div>
                </aside>

                {/* Main Command View */}
                <main className="flex-1 p-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-10"
                        >
                            {activeTab === 'view_interviews' && <ActiveInterviewsView />}
                            {activeTab === 'view_users' && <UserDirectoryView />}
                            {activeTab === 'view_reports' && <ReportsRegistryView />}
                            {activeTab === 'monitor_activity' && <ActivityLogsView />}
                            {activeTab === 'manage_system' && <SystemProtocolsView />}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

function HealthMetric({ label, value, color }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                <span className="text-neutral-600">{label}</span>
                <span className="text-neutral-400">{value}</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${color}`} style={{ width: '40%' }} />
            </div>
        </div>
    );
}

// Logic Views
function ActiveInterviewsView() {
    const interviews = [
        { id: 'INT-901', name: 'Software Engineer II', candidate: 'Alice Chen', recruiter: 'David Miller', status: 'Live', mode: 'Autonomous Agent' },
        { id: 'INT-902', name: 'Product Designer', candidate: 'Mark Smith', recruiter: 'Sarah J.', status: 'Waiting', mode: 'Recruiter Led' },
        { id: 'INT-903', name: 'DevOps Specialist', candidate: 'Bob Wilson', recruiter: 'Systems AI', status: 'Live', mode: 'Autonomous Agent' },
    ];

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Active Sync Protocols</h3>
                <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 text-[10px] font-black uppercase tracking-widest">
                    3 Live Sessions
                </div>
            </header>
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 h-16 bg-white/[0.01]">
                            <th className="px-8 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Protocol ID</th>
                            <th className="px-8 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Target Role</th>
                            <th className="px-8 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Candidate</th>
                            <th className="px-8 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Mode</th>
                            <th className="px-8 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Status</th>
                            <th className="px-8 text-[10px] font-black text-neutral-500 uppercase tracking-widest">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {interviews.map((int) => (
                            <tr key={int.id} className="h-20 hover:bg-white/[0.01] transition-all group">
                                <td className="px-8 font-mono text-xs text-blue-500">{int.id}</td>
                                <td className="px-8 font-bold text-sm text-white">{int.name}</td>
                                <td className="px-8 text-sm text-neutral-400">{int.candidate}</td>
                                <td className="px-8">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{int.mode}</span>
                                </td>
                                <td className="px-8">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${int.status === 'Live' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                                        <span className="text-xs font-bold text-neutral-300">{int.status}</span>
                                    </div>
                                </td>
                                <td className="px-8">
                                    <button className="p-3 bg-white/5 border border-white/5 rounded-xl hover:border-blue-500/30 text-white hover:text-blue-500 transition-all">
                                        <ExternalLink size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function UserDirectoryView() {
    return (
        <div className="p-12 border-2 border-dashed border-white/5 rounded-[3rem] text-center space-y-4">
             <div className="w-16 h-16 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users size={32} className="text-blue-500" />
             </div>
             <h3 className="text-xl font-bold text-white">Nodes Directory Initialized</h3>
             <p className="text-neutral-500 text-sm max-w-md mx-auto">Centralized database for Recruiters and Candidates. Full identity synchronization is active.</p>
        </div>
    );
}

function ReportsRegistryView() {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
                <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-blue-500/20 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                            <FileText size={24} className="text-purple-400" />
                        </div>
                        <MoreVertical size={18} className="text-neutral-600 cursor-pointer" />
                    </div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tighter mb-1">EVAL-PRO-NODE-{i}</h4>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mb-6">Analysis Finalized</p>
                    <button className="w-full py-3 bg-white/5 border border-white/5 rounded-xl font-black text-[10px] uppercase tracking-widest text-neutral-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
                        Access Intel
                    </button>
                </div>
            ))}
        </div>
    );
}

function ActivityLogsView() {
    const logs = [
        { time: '17:15:31', action: 'PROTOCOL_INIT', node: 'AI_INT_AGENT', status: 'NOMINAL' },
        { time: '17:14:22', action: 'AUTH_SUCCESS', node: 'RECRUITER_ALPHA', status: 'SECURE' },
        { time: '17:12:05', action: 'REPORT_GEN', node: 'NEURAL_CORE', status: 'COMPLETE' },
        { time: '17:10:11', action: 'SYS_TWEAK', node: 'ADMIN_NODE', status: 'OVERRIDE' },
    ];

    return (
        <div className="space-y-8">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Security Log Feed</h3>
            <div className="space-y-3">
                {logs.map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-white/[0.01] border border-white/5 rounded-2xl font-mono text-xs">
                        <div className="flex items-center space-x-6">
                            <span className="text-neutral-600">{log.time}</span>
                            <span className="text-blue-500 font-bold">{log.action}</span>
                            <span className="text-neutral-400 tracking-widest">{log.node}</span>
                        </div>
                        <span className="px-3 py-1 bg-green-500/10 rounded-full text-green-500 text-[9px] font-black">{log.status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SystemProtocolsView() {
    return (
        <div className="max-w-3xl space-y-10">
            <header>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">System Protocols</h3>
                <p className="text-neutral-500 text-sm">Configure global feature flags and core AI behavior parameters.</p>
            </header>
            
            <div className="space-y-4">
                <ProtocolToggle label="Autonomous AI Agent Conduct" description="Enable Level-3 AI logic for independent interviewing." active />
                <ProtocolToggle label="Neural Behavioral Telemetry" description="Activate real-time emotional and vocal analysis." active />
                <ProtocolToggle label="Global Node Capacity (100+)" description="Allow sessions to scale beyond standard limits." />
                <ProtocolToggle label="Automatic Insight Synthesis" description="Trigger report generation immediately after hangup." active />
            </div>
        </div>
    );
}

function ProtocolToggle({ label, description, active = false }) {
    const [isOn, setIsOn] = useState(active);
    return (
        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-between group hover:border-white/10 transition-all">
            <div className="space-y-1">
                <h5 className="text-sm font-black text-white uppercase tracking-widest">{label}</h5>
                <p className="text-xs text-neutral-500 font-medium">{description}</p>
            </div>
            <button 
                onClick={() => setIsOn(!isOn)}
                className={`w-14 h-8 rounded-full transition-all relative ${isOn ? 'bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-neutral-800'}`}
            >
                <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all ${isOn ? 'right-1.5' : 'left-1.5'}`} />
            </button>
        </div>
    );
}
