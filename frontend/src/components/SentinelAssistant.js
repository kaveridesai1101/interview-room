'use client';
import { useState, useEffect } from 'react';
import { Sparkles, Terminal, ShieldCheck, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SentinelAssistant({ action, details }) {
    const [message, setMessage] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!action) return;

        let response = '';
        const mode = details?.mode || 'ai_agent';
        const type = details?.type || 'technical';
        const duration = details?.duration || '45';
        const name = details?.name || 'Candidate';

        switch(action) {
            case 'schedule_interview':
                response = `Interview for ${name} [${type}] scheduled. Mode: ${mode}. Meeting Node generated successfully.`;
                break;
            case 'enable_ai_agent':
                response = `AI Agent protocol enabled for ${type} assessment. Complexity Level: ${details?.difficulty || 'Standard'}. Skills Matrix: ${details?.skills || 'Default'}.`;
                break;
            case 'start_interview':
                response = `Meeting Initialized. Initializing Sub-Modules: [Transcription], [Behavior Tracking], [Copy Detection]. AI Sentinel is now active.`;
                break;
            case 'monitor_interview':
                response = `Live Telemetry Active. Confidence: ${details?.confidence || 'High'} | Integrity: ${details?.integrity || 'Nominal'} | Response Quality: ${details?.quality || 'Analyzing'}.`;
                break;
            case 'end_interview':
                response = `Session terminated. Recording halted. Triggering AI neural processing for session #${details?.id || 'ID-ALPHA'}.`;
                break;
            case 'generate_report':
                response = `Structured evaluation report finalized for ${name}. File saved to secure storage. Access Link: [reports/${details?.id || 'id'}]`;
                break;
            default:
                response = "Sentinel Core standing by. Ready for recruiter command.";
        }

        setMessage(response);
        setIsVisible(true);
        const timer = setTimeout(() => setIsVisible(false), 8000);
        return () => clearTimeout(timer);
    }, [action, details]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="fixed bottom-10 right-10 z-[1000] w-96"
                >
                    <div className="bg-[#1a1b1e]/80 backdrop-blur-3xl border border-blue-500/20 rounded-[2rem] p-6 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4">
                            <Sparkles className="text-blue-500/20 group-hover:text-blue-500/40 transition-colors" size={40} />
                        </div>
                        
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-8 h-8 bg-blue-600/10 rounded-full flex items-center justify-center border border-blue-500/20">
                                <Terminal size={14} className="text-blue-500" />
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Sentinel AI Assistant</span>
                        </div>

                        <p className="text-[13px] leading-relaxed text-neutral-300 font-medium">
                            {message}
                        </p>

                        <div className="mt-4 flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
                            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Core Synchronized</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
