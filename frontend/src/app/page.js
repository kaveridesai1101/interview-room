'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-blue-500/30">
      {/* Premium Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 premium-blue-gradient rounded-xl flex items-center justify-center text-white font-bold text-xl ring-1 ring-white/20 group-hover:scale-110 transition-transform">B</div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white leading-tight">Blue Planet</h1>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Solutions</p>
            </div>
          </Link>
          
          <div className="hidden lg:flex items-center space-x-10 text-[11px] font-black text-muted uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-white transition-colors">Infrastructure</a>
            <a href="#" className="hover:text-white transition-colors">AI Engine</a>
            <a href="#" className="hover:text-white transition-colors">Case Studies</a>
          </div>

          <div className="flex items-center space-x-6">
            <Link href="/login" className="text-xs font-black text-muted hover:text-white uppercase tracking-widest transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="btn-premium py-3 px-8 text-[11px] uppercase tracking-widest">
              Join Platform
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] -z-10"></div>

        <div className="container mx-auto px-6 relative text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-2 mb-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping"></span>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
              Next-Gen AI Interview Infrastructure
            </span>
          </div>
          
          <h1 className="text-6xl md:text-9xl font-black mb-12 leading-[0.9] tracking-tighter text-white">
            Hire with <br />
            <span className="premium-glow-text">Intelligence.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-muted mb-16 leading-relaxed font-medium">
            Blue Planet Solutions' advanced proctoring and behavioural analytics 
            engine for high-integrity global recruitment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/signup" className="btn-premium text-xs px-10 py-5 w-full sm:w-auto flex items-center justify-center uppercase tracking-widest">
              Deploy Your System
              <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </Link>
            <Link href="/login" className="btn-ghost px-10 py-5 text-xs w-full sm:w-auto flex items-center justify-center uppercase tracking-widest">
              View Analytics Room →
            </Link>
          </div>
        </div>
      </section>

      {/* Features - Glassmorphism */}
      <section className="py-32 bg-background/40 relative">
        <div className="container mx-auto px-6">
           <div className="flex flex-col items-center mb-24 text-center">
              <h2 className="text-4xl font-black text-white mb-6">Built for Scaling</h2>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
           </div>

           <div className="grid md:grid-cols-3 gap-10">
              <FeatureCard 
                icon="📹" 
                title="AI Video Surveillance" 
                desc="Real-time multi-angle analysis with automated emotion tracking."
              />
              <FeatureCard 
                icon="📉" 
                title="Deep Analytics" 
                desc="Custom scoring algorithms mapped to role-specific competencies."
              />
              <FeatureCard 
                icon="🛡️" 
                title="Integrity Shield" 
                desc="Proprietary copy-detection and window-blur tracking protocols."
               />
           </div>
        </div>
      </section>
      
      <footer className="py-24 border-t border-white/5">
        <div className="container mx-auto px-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center space-x-3 mb-10 translate-y-[-1px]">
            <div className="w-8 h-8 premium-blue-gradient rounded-lg flex items-center justify-center text-white font-bold text-sm">B</div>
            <span className="font-black text-white tracking-tighter uppercase text-lg">Blue Planet Solutions</span>
          </div>
          <p className="text-[10px] text-muted font-bold uppercase tracking-[0.3em]">
            Empowering the Global Workforce © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="glass-card p-12 group hover:bg-white/[0.03] hover:-translate-y-2">
       <div className="text-4xl mb-10 group-hover:scale-110 transition-transform inline-block p-5 bg-white/5 rounded-3xl border border-white/10">{icon}</div>
       <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{title}</h3>
       <p className="text-muted leading-relaxed font-medium text-lg">{desc}</p>
    </div>
  );
}
