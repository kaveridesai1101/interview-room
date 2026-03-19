'use client';
import { useState, useEffect } from 'react';
import { Sparkles, MessageSquare, ChevronRight, Mic, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AutonomousInterviewer({ config, onComplete }) {
    const [step, setStep] = useState(0); 
    const [dialogue, setDialogue] = useState('');
    const [displayedText, setDisplayedText] = useState('');
    const [isThinking, setIsThinking] = useState(false);

    // Dynamic Question Synthesis Logic
    const getQuestions = () => {
        if (config?.questions?.length > 0) return config.questions;
        
        const skills = config?.skills || 'General Software Engineering';
        const diff = config?.difficulty || 'Medium';

        // Simulated Synthesis based on skills/difficulty
        if (skills.toLowerCase().includes('react')) {
            return [
                "Explain the reconciliation process and how the Virtual DOM interacts with the actual DOM.",
                "How do you manage complex side-effects in a large-scale React application?",
                "Discuss the trade-offs between server-side rendering and static site generation."
            ];
        }
        
        return [
            `Based on your expertise in ${skills}, how do you approach architectural scalability?`,
            "Explain a scenario where you had to refactor a critical system under a strict deadline.",
            `Since we are targeting a ${diff} level, describe your strategy for ensuring deep data integrity.`
        ];
    };

    const questions = getQuestions();

    const totalSteps = questions.length + 3; // Greeting + Intro + Questions + End

    useEffect(() => {
        updateDialogue();
    }, [step]);

    useEffect(() => {
        let i = 0;
        setDisplayedText('');
        const timer = setInterval(() => {
            setDisplayedText(prev => dialogue.slice(0, prev.length + 1));
            if (i >= dialogue.length) clearInterval(timer);
            i++;
        }, 30);
        return () => clearInterval(timer);
    }, [dialogue]);

    const updateDialogue = () => {
        setIsThinking(true);
        setTimeout(() => {
            let msg = '';
            if (step === 0) {
                msg = "Hello, welcome to your professional interview.";
            } else if (step === 1) {
                msg = "Please introduce yourself.";
            } else if (step < questions.length + 2) {
                const qNum = step - 1;
                const ack = qNum > 1 ? "Thank you for your answer. Moving to next question. " : "";
                msg = `${ack}Question ${qNum}: ${questions[step - 2]}`;
            } else {
                msg = "Thank you. Your interview is now complete. We have informed the recruitment team of your completion.";
            }
            
            setDialogue(msg);
            setIsThinking(false);
        }, 800);
    };

    const handleNext = () => {
        if (step < totalSteps - 1) {
            setStep(prev => prev + 1);
        } else {
            onComplete?.();
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-none p-10"
            >
                <div className="w-full max-w-2xl bg-[#1a1b1e]/90 backdrop-blur-3xl border border-blue-500/30 rounded-[3rem] p-12 shadow-[0_0_100px_rgba(59,130,246,0.2)] pointer-events-auto relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <Sparkles size={120} className="text-blue-500" />
                    </div>

                    <div className="flex items-center space-x-4 mb-10">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/20">
                            <Mic size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] block">Autonomous Node</span>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Sentinel AI Interviewer</h2>
                        </div>
                    </div>

                    <div className="min-h-[120px] mb-10">
                        {isThinking ? (
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            </div>
                        ) : (
                            <motion.p 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl font-medium text-white leading-relaxed italic"
                            >
                                "{displayedText}"
                                {displayedText.length < dialogue.length && <span className="inline-block w-1.5 h-6 bg-blue-500 ml-1 translate-y-1 animate-pulse" />}
                            </motion.p>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-3 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                            <Info size={14} className="text-blue-500/40" />
                            <span>Protocol Step {step + 1} / {totalSteps}</span>
                         </div>
                         <button 
                            onClick={handleNext}
                            className="px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center shadow-[0_0_30px_rgba(37,99,235,0.3)] group active:scale-95"
                         >
                            {step < totalSteps - 1 ? (
                                <>Next Guidance <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" /></>
                            ) : "End Session"}
                         </button>
                    </div>

                    <div className="absolute left-0 bottom-0 w-full h-1.5 bg-white/5">
                        <motion.div 
                            className="absolute left-0 top-0 h-full bg-blue-500 shadow-[0_0_15px_#3b82f6]" 
                            initial={{ width: 0 }}
                            animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
