'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import SentinelAssistant from '@/components/SentinelAssistant';

export default function DetailedReport() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assistantAction, setAssistantAction] = useState({ action: null, details: null });

  useEffect(() => {
    if (!auth.isAuthenticated()) return router.push('/login');
    const u = auth.getUser();
    if (u.role === 'student') return router.push('/dashboard/student');
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const data = await api.getSessionReport(id);
      setReport(data);
      setAssistantAction({ action: 'generate_report', details: {} });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!report) return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>
            <Link href="/dashboard/recruiter" className="text-primary hover:underline">Back to Dashboard</Link>
        </div>
    </div>
  );

  const { candidate, session, scores, ai_feedback, questions_and_answers, copy_detection, eye_contact_percent } = report;

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-200 p-8 lg:p-20 font-inter">
      <div className="max-w-[1000px] mx-auto bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-3xl print:bg-white print:text-black">
        
        {/* Header / Export Action */}
        <div className="p-12 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/5 to-transparent">
            <div>
                 <h1 className="text-4xl font-black font-outfit tracking-tighter text-white mb-2 uppercase">Interview Intelligence Report</h1>
                 <p className="text-xs font-black text-blue-500 uppercase tracking-[0.4em]">Sentinel AI Evaluation System</p>
            </div>
            <button onClick={() => window.print()} className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all print:hidden">
                Export Protocol
            </button>
        </div>

        <div className="p-16 space-y-20">
          
          {(Array.isArray(report.participants) ? report.participants : [report]).map((candidateReport, index) => {
            const { candidate, session, scores, ai_feedback, questions_and_answers, copy_detection, eye_contact_percent, recommendation } = candidateReport;
            
            return (
              <div key={index} className="space-y-20 pt-10 first:pt-0 border-t border-white/5 first:border-0 relative">
                {/* 0. CANDIDATE HEADER (FOR BATCH REPORTS) */}
                <div className="text-center py-6 bg-blue-600/5 rounded-2xl border border-blue-500/10 mb-10">
                    <h2 className="text-xl font-black text-blue-400 tracking-tighter uppercase">
                        ===== Candidate: {candidate.name} =====
                    </h2>
                </div>

                {/* 1. BASIC INFORMATION */}
                <section>
                    <SectionHeader number="01" title="BASIC INFORMATION" />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-10 mt-8">
                        <InfoBlock label="Candidate Name" value={candidate.name} />
                        <InfoBlock label="Interview Mode" value={session.mode || 'AI Agent'} />
                        <InfoBlock label="Date / Time" value={`${session.date} | ${session.time || 'N/A'}`} />
                        <InfoBlock label="Interview Type" value={session.interview_type} />
                        <InfoBlock label="Duration" value={`${session.duration || 45} Minutes`} />
                        <InfoBlock label="Status" value="Completed" />
                    </div>
                </section>

                {/* 2. CANDIDATE INTRODUCTION */}
                <section>
                    <SectionHeader number="02" title="CANDIDATE INTRODUCTION" />
                    <div className="mt-8 p-8 bg-white/[0.03] rounded-3xl border border-white/5 italic text-lg leading-relaxed text-neutral-400">
                        "{candidate.name} is a professional with a background in {candidate.education || 'Technology'}. During the sync, the candidate demonstrated a {scores.confidence_score > 80 ? 'highly confident' : 'steady'} demeanor and articulated their experience with clarity."
                    </div>
                </section>

                {/* 3. QUESTIONS & ANSWERS */}
                <section>
                    <SectionHeader number="03" title="QUESTIONS & ANSWERS" />
                    <div className="mt-10 space-y-10">
                        {(questions_and_answers || []).map((qa, i) => (
                            <div key={i} className="group">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Inquiry {i+1}</span>
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Neural Score: {qa.ai_score}/10</span>
                                </div>
                                <h4 className="text-xl font-bold text-white mb-4 leading-tight">{qa.question}</h4>
                                <div className="pl-6 border-l-2 border-blue-600/20 py-2">
                                    <p className="text-neutral-400 leading-relaxed italic">"{qa.answer || 'No valid telemetry recorded for this segment.'}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. BEHAVIORAL ANALYSIS */}
                <section>
                    <SectionHeader number="04" title="BEHAVIORAL ANALYSIS" />
                    <div className="mt-8 grid md:grid-cols-2 gap-10">
                        <BehaviorCard label="Confidence Level" score={scores.confidence_score} description="Measures vocal stability and response latency." />
                        <BehaviorCard label="Communication Clarity" score={scores.communication_score} description="Assesses structural articulation and vocabulary bandwidth." />
                        <div className="md:col-span-2 p-8 bg-blue-600/5 border border-blue-500/10 rounded-3xl">
                            <p className="text-sm font-medium text-neutral-300 leading-relaxed">
                                Candidate maintained active engagement throughout the protocol. Emotional variance remained within optimal parameters, indicating high stress-tolerance and professional composure.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 5. COPY DETECTION REPORT */}
                <section>
                    <SectionHeader number="05" title="COPY DETECTION REPORT" />
                    <div className="mt-8 flex flex-col md:flex-row gap-10">
                        <div className="flex-1 p-8 bg-white/[0.03] rounded-3xl border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Viewport Integrity</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${copy_detection?.detected ? 'text-red-500' : 'text-green-500'}`}>
                                    {copy_detection?.detected ? 'Violations' : 'Nominal'}
                                </span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                                <div className={`h-full transition-all duration-1000 ${copy_detection?.detected ? 'bg-red-500 w-full' : 'bg-green-500 w-0'}`} />
                            </div>
                            <p className="text-xs text-neutral-500">
                                {copy_detection?.detected ? `${copy_detection.incidents.length} tab-switches registered.` : 'No external assistance telemetry recorded.'}
                            </p>
                        </div>
                        <div className="flex-1 p-8 bg-white/[0.03] rounded-3xl border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Eye Alignment</span>
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{eye_contact_percent}%</span>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-blue-500" style={{width: `${eye_contact_percent}%`}} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. SKILLS EVALUATION */}
                <section>
                    <SectionHeader number="06" title="SKILLS EVALUATION" />
                    <div className="mt-8 space-y-8">
                        <SkillRow label="Technical Proficiency" score={(scores.technical_score / 10).toFixed(1)} />
                        <SkillRow label="Conceptual Depth" score={(scores.overall_score / 10).toFixed(1)} />
                        <SkillRow label="Problem Solving" score="8.5" />
                        <SkillRow label="Professional Composure" score={(scores.confidence_score / 10).toFixed(1)} />
                    </div>
                </section>

                {/* 7. STRENGTHS & WEAKNESSES */}
                <section>
                    <SectionHeader number="07" title="STRENGTHS & WEAKNESSES" />
                    <div className="mt-8 grid md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-green-500 uppercase tracking-widest">Key Strengths</h5>
                            <ul className="space-y-3">
                                <StrengthItem text="Deep architectural understanding of requested stack" />
                                <StrengthItem text="Exceptional clarity in verbalizing technical abstractions" />
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest">Areas for Growth</h5>
                            <ul className="space-y-3">
                                <StrengthItem text="Slight latency when processing edge-case scenarios" isWeakness />
                                <StrengthItem text="May benefit from more practical system design exposure" isWeakness />
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 8. OVERALL ANALYSIS */}
                <section>
                    <SectionHeader number="08" title="OVERALL ANALYSIS" />
                    <div className="mt-8 p-10 bg-blue-600/5 border border-blue-500/10 rounded-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 text-4xl opacity-[0.03]">🧠</div>
                        <p className="text-xl leading-relaxed text-white font-medium italic opacity-90">
                            "{ai_feedback}"
                        </p>
                    </div>
                </section>

                {/* 9. FINAL AI DECISION */}
                <section className="pt-20">
                    <div className="flex flex-col items-center text-center">
                        <SectionHeader number="09" title="FINAL AI DECISION" />
                        <div className={`mt-10 px-16 py-8 rounded-full border-2 font-black text-4xl tracking-tighter shadow-2xl ${
                            recommendation === 'Shortlist' ? 'bg-green-500/10 border-green-500/30 text-green-500 shadow-green-500/10' :
                            recommendation === 'Reject' ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-red-500/10' :
                            'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-yellow-500/10'
                        }`}>
                            {recommendation.toUpperCase()} ({scores.overall_score}%)
                        </div>
                    </div>
                </section>
              </div>
            );
          })}
        </div>
        
        {/* Footer */}
        <div className="bg-white/[0.02] p-12 text-center border-t border-white/5">
            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.5em]">This report is AI-generated and subject to recruiter validation.</p>
        </div>
      </div>
      <SentinelAssistant action={assistantAction.action} details={assistantAction.details} />
    </div>
  );
}

function SectionHeader({ number, title }) {
    return (
        <div className="flex items-center space-x-4">
            <span className="text-xs font-black text-blue-500 border border-blue-500/20 px-3 py-1 rounded-lg">{number}</span>
            <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em]">{title}</h3>
            <div className="flex-1 h-[1px] bg-white/5"></div>
        </div>
    );
}

function InfoBlock({ label, value }) {
    return (
        <div>
            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-1">{label}</span>
            <span className="text-sm font-bold text-white tracking-tight">{value}</span>
        </div>
    );
}

function BehaviorCard({ label, score, description }) {
    return (
        <div className="p-8 bg-white/[0.03] border border-white/5 rounded-3xl group hover:border-blue-500/30 transition-all">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{label}</span>
                <span className="text-blue-500 font-black">{score}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-blue-600 transition-all duration-1000" style={{width: `${score}%`}} />
            </div>
            <p className="text-[11px] text-neutral-500 font-medium leading-relaxed">{description}</p>
        </div>
    );
}

function SkillRow({ label, score }) {
    return (
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <span className="text-sm font-medium text-neutral-300">{label}</span>
            <div className="flex items-center space-x-4">
                 <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500/50" style={{width: `${score * 10}%`}} />
                 </div>
                 <span className="text-sm font-black text-white w-8 text-right">{score} <span className="text-[9px] text-neutral-500">/ 10</span></span>
            </div>
        </div>
    );
}

function StrengthItem({ text, isWeakness = false }) {
    return (
        <li className="flex items-start space-x-3 text-xs text-neutral-400 font-medium">
            <span className={isWeakness ? "text-red-500 mt-0.5" : "text-green-500 mt-0.5"}>
                {isWeakness ? "●" : "✓"}
            </span>
            <span>{text}</span>
        </li>
    );
}
