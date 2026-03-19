'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';
import { useState, useEffect } from 'react';

export default function DashboardLayout({ children, role }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(auth.getUser());
  }, []);

  const getMenuItems = () => {
    if (role === 'student') return [
      { name: 'Overview', icon: '🏠', path: '/dashboard/student' },
      { name: 'Interview Hub', icon: '📹', path: '/dashboard/student/interviews' },
      { name: 'Performance', icon: '📈', path: '/dashboard/student/performance' },
      { name: 'Settings', icon: '⚙️', path: '/dashboard/student/settings' },
    ];
    if (role === 'recruiter') return [
      { name: 'Dashboard', icon: '📊', path: '/dashboard/recruiter' },
      { name: 'Live Meetings', icon: '📡', path: '/dashboard/recruiter' },
      { name: 'Candidates', icon: '👥', path: '#' },
      { name: 'Analytics', icon: '📉', path: '/dashboard/student/performance' }, // Reuse student performance for now
      { name: 'Settings', icon: '⚙️', path: '/dashboard/student/settings' },
    ];
    if (role === 'admin') return [
      { name: 'Core Control', icon: '🏛️', path: '/dashboard/admin' },
      { name: 'User Management', icon: '👥', path: '#' },
      { name: 'Meeting Streams', icon: '📡', path: '/dashboard/admin' },
      { name: 'Global Analytics', icon: '📈', path: '#' },
      { name: 'System Logs', icon: '📜', path: '#' },
    ];
    return [];
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-background flex text-foreground">
      {/* Premium Dark Sidebar - Hidden for Students for Minimalist Look */}
      {role !== 'student' && (
        <aside className="w-72 bg-sidebar-bg border-r border-white/5 flex flex-col fixed h-full z-40">
        <div className="p-8">
          <Link href="/" className="flex items-center space-x-3 group">
             <div className="w-10 h-10 premium-blue-gradient rounded-xl flex items-center justify-center text-white font-bold text-xl ring-1 ring-white/10 group-hover:scale-110 transition-transform">B</div>
             <div>
               <h1 className="text-lg font-black text-white leading-tight">Blue Planet</h1>
               <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Sentinel AI</p>
             </div>
          </Link>
        </div>

        <nav className="flex-1 px-6 space-y-2 mt-4">
          <p className="text-[10px] font-black text-muted uppercase tracking-[.3em] mb-6 ml-4 opacity-50">Main Control</p>
          {menuItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.path}
              className={pathname === item.path ? 'nav-item-active' : 'nav-item'}
            >
              <span className="text-xl opacity-80">{item.icon}</span>
              <span className="text-sm font-bold tracking-tight">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6">
           <div className="glass-card p-6 bg-blue-600/[0.03] border-blue-500/10 relative overflow-hidden group">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              <h4 className="text-sm font-black text-white mb-2">Upgrade Pro</h4>
              <p className="text-[11px] text-muted mb-5 leading-relaxed font-medium">Access deep analytical scoring and proctoring shields.</p>
              <button className="w-full py-2.5 bg-white text-black text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-50 transition-colors">Level Up</button>
           </div>
        </div>
      </aside>
      )}

      {/* Main Content Area */}
      <div className={`${role !== 'student' ? 'ml-72' : ''} flex-1 flex flex-col min-h-screen relative`}>
        {/* Floating Glass Header - Hidden for Student Dashboard Minimalist View */}
        {role !== 'student' && (
          <header className="h-24 bg-background/40 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30 px-10 flex items-center justify-between">
           <div className="flex-1 max-w-xl">
             <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted text-lg group-hover:scale-110 transition-transform cursor-default">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search candidates, interviews, track IDs..." 
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-14 pr-4 focus:ring-2 focus:ring-blue-500/20 focus:bg-white/[0.08] text-sm transition-all text-white placeholder:text-muted/60"
                />
             </div>
           </div>

           <div className="flex items-center space-x-6">
              <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/5">
                <button className="p-3 hover:bg-white/5 rounded-xl transition-all relative text-white">
                  🔔
                  <span className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full border-2 border-background animate-pulse"></span>
                </button>
                <button className="p-3 hover:bg-white/5 rounded-xl transition-all text-white">⚙️</button>
              </div>
              
              <div className="h-8 w-px bg-white/5 mx-2"></div>

              <div className="flex items-center space-x-5">
                 <div className="text-right hidden sm:block">
                   <p className="text-sm font-black text-white leading-none mb-1.5 tracking-tight">{user?.name || 'Authorized Personnel'}</p>
                   <div className="flex items-center justify-end space-x-2">
                     <span className="luminous-dot bg-blue-500 text-blue-400"></span>
                     <p className="text-[10px] text-blue-400 font-black uppercase tracking-[.2em]">{role} Node</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => auth.logout()} 
                   className="h-12 px-6 bg-white/5 hover:bg-white/10 text-white font-black text-xs rounded-2xl transition-all border border-white/10 flex items-center group active:scale-95"
                 >
                   <span className="mr-3 group-hover:rotate-12 transition-transform">👤</span>
                   Logout
                 </button>
              </div>
           </div>
          </header>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-12 relative">
          {/* Subtle Background Ambience */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -z-10"></div>
          {children}
        </main>
      </div>
    </div>
  );
}
