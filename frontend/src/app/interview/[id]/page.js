'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function InterviewRoom() {
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timer, setTimer] = useState(0);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [violations, setViolations] = useState(0);

  useEffect(() => {
    fetchSession();
    startCamera();
    setupProctoring();
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => {
        clearInterval(interval);
        stopCamera();
        cleanupProctoring();
    };
  }, []);

  const fetchSession = async () => {
    try {
      const modeRes = await api.getSessionMode(id);
      const qRes = await api.getQuestions();
      setSession(modeRes);
      setQuestions(qRes.slice(0, 5));
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { alert('Camera access required.'); }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
  };

  const setupProctoring = () => {
     window.onblur = () => {
        api.logCopyEvent(id, { event_type: 'window_blur', timestamp_seconds: timer });
        setViolations(v => v + 1);
     };
  };

  const cleanupProctoring = () => { window.onblur = null; };

  const nextQuestion = async () => {
    if (!answer.trim()) return;
    setSubmitting(true);
    try {
      await api.submitAnswer(id, {
        question_text: questions[currentIdx].text,
        answer_text: answer,
        question_id: questions[currentIdx].id,
        order_index: currentIdx
      });
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(prev => prev + 1);
        setAnswer('');
      } else {
        await api.completeSession(id);
        router.push('/dashboard/student');
      }
    } catch (err) { alert('Failed to submit answer'); } 
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center font-inter">
      {/* Tactical HUD Header */}
      <header className="w-full h-24 px-12 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-2xl sticky top-0 z-50">
         <div className="flex items-center space-x-4">
            <div className="w-12 h-12 premium-blue-gradient rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-[0_0_20px_rgba(59,130,246,0.2)] ring-1 ring-white/20">B</div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-[0.3em] leading-none text-white">Sentinel Node</h1>
              <div className="flex items-center space-x-2 mt-1.5">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></span>
                  <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest">PROCTOR CORE: LINKED</p>
              </div>
            </div>
         </div>
         
         <div className="flex items-center space-x-12">
            <div className="text-right">
              <p className="text-[9px] text-muted font-black uppercase tracking-[0.4em] mb-1">Session Telemetry</p>
              <p className="text-2xl font-black text-white font-outfit tabular-nums">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</p>
            </div>
            <div className="h-12 w-px bg-white/10"></div>
            <div className="flex items-center space-x-4">
               <div className="text-right">
                    <p className="text-[9px] text-red-500 font-black uppercase tracking-[0.4em] mb-1">Security Status</p>
                    <p className="text-xs font-black text-white uppercase tracking-widest">LIVE SURVEILLANCE</p>
               </div>
               <div className="w-10 h-10 rounded-full border-2 border-red-500/20 flex items-center justify-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></span>
               </div>
            </div>
         </div>
      </header>

      <div className="w-full flex-1 flex flex-col lg:flex-row p-12 gap-12 max-w-[1700px]">
        {/* Intelligence HUD (Left) */}
        <div className="lg:w-1/3 space-y-10">
          <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black group">
            <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-video object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
            
            {/* Camera Overlays */}
            <div className="absolute top-6 left-8 flex items-center space-x-3">
               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
               <span className="text-[9px] font-black text-white uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">REC: CAM_01</span>
            </div>
            
            <div className="absolute bottom-6 left-8 right-8 flex justify-between items-end">
              <div>
                <p className="text-[8px] text-white/40 font-black uppercase tracking-[0.3em] mb-1">Target Identity</p>
                <span className="px-4 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-[10px] font-black text-blue-400 uppercase tracking-widest backdrop-blur-md italic">Node Verified</span>
              </div>
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center p-2 backdrop-blur-md">
                 <div className="w-full h-full border-t-2 border-blue-500 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>

          <div className="glass-card p-10 space-y-10">
             <div>
                <p className="text-[10px] text-muted font-black uppercase tracking-[0.4em] mb-6 opacity-60">Session Integrity Metrics</p>
                <div className="grid grid-cols-2 gap-6">
                  <HUDCard label="Violations" value={violations} critical={violations > 0} />
                  <HUDCard label="Lexical Count" value={answer.split(' ').filter(x => x).length} />
                </div>
             </div>
             
             <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
               <div className="flex items-center space-x-3 mb-3">
                  <span className="text-lg">🤖</span>
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">AI Overwatch Directive</span>
               </div>
               <p className="text-[11px] text-muted font-medium leading-relaxed italic opacity-80">
                 "Our semantic analysis engine is monitoring focus and window dynamics. Maintain baseline professional conduct to avoid flagged incidents."
               </p>
             </div>
          </div>
        </div>

        {/* Interaction Matrix (Right) */}
        <div className="lg:w-2/3 flex flex-col pt-6">
          <div className="max-w-4xl mx-auto w-full">
            <div className="mb-16">
               <div className="flex items-center justify-between mb-8 px-2">
                  <span className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em]">Checkpoint {currentIdx + 1} of {questions.length}</span>
                  <div className="text-[10px] font-bold text-muted uppercase tracking-widest">{Math.round(((currentIdx + 1) / questions.length) * 100)}% Progress</div>
               </div>
               <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-12">
                  <div className="h-full premium-blue-gradient transition-all duration-1000 shadow-[0_0_10px_#3b82f6]" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} />
               </div>
               
               <div className="relative">
                  <span className="absolute -top-10 -left-6 text-6xl opacity-5 text-blue-500 italic font-black">?</span>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white font-outfit leading-[1.15] tracking-tight">
                     {questions[currentIdx]?.text}
                  </h2>
               </div>
            </div>

            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-[3rem] blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
                <textarea 
                    className="relative w-full h-80 bg-background/50 border border-white/10 rounded-[3rem] p-10 focus:ring-2 focus:ring-blue-500/20 text-xl font-medium text-white placeholder-white/10 leading-relaxed resize-none transition-all shadow-2xl backdrop-blur-xl outline-none"
                    placeholder="Input your professional thesis here..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                />
            </div>

            <div className="mt-14 flex justify-end">
                <button 
                  onClick={nextQuestion}
                  disabled={!answer.trim() || submitting}
                  className="px-14 py-6 btn-premium text-white font-black uppercase tracking-[0.3em] text-[11px] rounded-[2rem] hover:scale-[1.05] active:scale-95 shadow-2xl shadow-blue-500/10 transition-all disabled:opacity-30 disabled:grayscale flex items-center group h-20"
                >
                   {submitting ? (
                     <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>PROCESSING...</span>
                     </div>
                   ) : currentIdx === questions.length - 1 ? 'FINALIZE SIMULATION' : 'REGISTER INTEL'}
                   
                   {!submitting && <span className="ml-4 text-xl group-hover:translate-x-2 transition-transform">→</span>}
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HUDCard({ label, value, critical = false }) {
  return (
    <div className={`p-6 bg-white/[0.03] border border-white/5 rounded-3xl text-center group transition-all ${critical ? 'border-red-500/30 bg-red-500/5' : 'hover:bg-white/[0.05]'}`}>
      <p className="text-[9px] text-muted font-black uppercase tracking-[0.3em] mb-2 group-hover:text-white transition-colors">{label}</p>
      <p className={`text-4xl font-black font-outfit ${critical ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'text-white'}`}>{value}</p>
    </div>
  );
}
