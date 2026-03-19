'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import { 
    Mic, MicOff, Video, VideoOff, PhoneOff, 
    MonitorUp, Smile, MessageSquare, Users, 
    MoreVertical, Info, LayoutGrid, Hand, 
    X, Search, Send, AlertTriangle, CheckCircle, Shield
} from 'lucide-react';
import SentinelAssistant from '@/components/SentinelAssistant';
import AutonomousInterviewer from '@/components/AutonomousInterviewer';

export default function MeetingPage() {
    const { id } = useParams();
    const router = useRouter();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const [guestInfo, setGuestInfo] = useState({ name: '', email: '' });
    const [isGuestJoining, setIsGuestJoining] = useState(false);
    
    // UI State
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoActive, setIsVideoActive] = useState(true);
    const [isSharing, setIsSharing] = useState(false);
    const [activeSidebar, setActiveSidebar] = useState(null); // 'chat' or 'people' or null
    const [jitsiApi, setJitsiApi] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const [assistantAction, setAssistantAction] = useState({ action: null, details: null });
    const [participantCount, setParticipantCount] = useState(1); 
    const [lobbyWaiting, setLobbyWaiting] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const user = auth.getUser();
                const currentRole = user ? user.role : 'guest';
                setRole(currentRole);

                let data;
                if (currentRole === 'guest') {
                    data = await api.getPublicMeetingConfig(id);
                } else {
                    data = await api.getMeetingConfig(id);
                }

                if (data.room_name) {
                    setConfig(data);
                }
            } catch (err) {
                console.error('Failed to load meeting config:', err);
                alert('Conflict in meeting parameters or session not found.');
                router.push('/');
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [id]);

    useEffect(() => {
        if (role === 'guest' && !isGuestJoining && !loading) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    if (videoRef.current) videoRef.current.srcObject = stream;
                }).catch(err => console.error("Media Error:", err));
        }
    }, [role, isGuestJoining, loading]);

    const handleJitsiCommands = (command, val = null) => {
        if (!jitsiApi) return;
        switch(command) {
            case 'mute':
                jitsiApi.executeCommand('toggleAudio');
                setIsMuted(!isMuted);
                break;
            case 'video':
                jitsiApi.executeCommand('toggleVideo');
                setIsVideoActive(!isVideoActive);
                break;
            case 'hangup':
                jitsiApi.executeCommand('hangup');
                if (isSpecialist) setAssistantAction({ action: 'end_interview', details: { name: config?.user_name } });
                setTimeout(() => router.push('/dashboard'), 2000);
                break;
            case 'share':
                jitsiApi.executeCommand('toggleShareScreen');
                setIsSharing(!isSharing);
                break;
            case 'hand':
                jitsiApi.executeCommand('toggleRaiseHand');
                break;
            case 'chat':
                setActiveSidebar(activeSidebar === 'chat' ? null : 'chat');
                break;
            case 'people':
                setActiveSidebar(activeSidebar === 'people' ? null : 'people');
                break;
            case 'background':
                jitsiApi.executeCommand('toggleVideoBackground');
                break;
            default: break;
        }
    };

    const handleGuestJoin = (e) => {
        e.preventDefault();
        if (guestInfo.name && guestInfo.email) {
            setIsGuestJoining(true);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#202124] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-t-blue-500 border-white/10 rounded-full animate-spin mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    const isSpecialist = role === 'recruiter' || role === 'admin';

    // Guest Pre-Join Node (Google Meet Aesthetic)
    if (role === 'guest' && !isGuestJoining) {
        return (
            <div className="min-h-screen bg-[#202124] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#202124] to-[#1a1b1e] text-white overflow-hidden">
                <div className="w-full max-w-5xl flex flex-col md:flex-row items-center gap-12">
                    {/* Preview Area */}
                    <div className="flex-1 w-full space-y-6">
                        <div className="aspect-video bg-[#1a1b1e] rounded-3xl overflow-hidden relative border border-white/5 shadow-2xl">
                             <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-4">
                                <button className={`p-4 rounded-full border ${isMuted ? 'bg-red-500 border-red-500' : 'bg-transparent border-white/20'} transition-all`}>
                                    {isMuted ? <MicOff size={20}/> : <Mic size={20}/>}
                                </button>
                                <button className={`p-4 rounded-full border ${!isVideoActive ? 'bg-red-500 border-red-500' : 'bg-transparent border-white/20'} transition-all`}>
                                    {!isVideoActive ? <VideoOff size={20}/> : <Video size={20}/>}
                                </button>
                             </div>
                        </div>
                        <div className="flex justify-center space-x-4 text-xs font-bold uppercase tracking-widest text-neutral-500">
                             <span className="flex items-center"><CheckCircle size={14} className="text-green-500 mr-2"/> MIC SECURE</span>
                             <span className="flex items-center"><CheckCircle size={14} className="text-green-500 mr-2"/> VISION ACTIVE</span>
                        </div>
                    </div>

                    {/* Join Card */}
                    <div className="w-full max-w-md bg-[#1a1b1e]/60 border border-white/5 p-12 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl text-center">
                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-white font-outfit tracking-tight leading-none mb-4">Identity Verification</h2>
                            <p className="text-slate-400 text-sm font-medium italic opacity-70">Enter your name to initiate the secure node sync.</p>
                        </div>
                        
                        <form onSubmit={handleGuestJoin} className="space-y-6 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">Candidate Name</label>
                                <input 
                                    required
                                    autoFocus
                                    value={guestInfo.name}
                                    onChange={(e) => setGuestInfo({...guestInfo, name: e.target.value})}
                                    type="text" 
                                    placeholder="e.g. Satoshi Nakamoto" 
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-blue-500 text-sm transition-all text-white placeholder-white/20 font-medium"
                                />
                            </div>
                            <button type="submit" className="w-full py-5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.3)] active:scale-95">
                                Join Protocol
                            </button>
                        </form>
                        <p className="mt-8 text-[9px] text-neutral-600 font-black uppercase tracking-widest">Secure Sync • Encrypted Tunnel A-1</p>
                    </div>
                </div>
            </div>
        );
    }

    // Main Meeting View
    return (
        <div className="fixed inset-0 bg-[#202124] flex flex-col overflow-hidden text-neutral-200 select-none">
            {/* Main View Area */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Jitsi IFrame Container */}
                <div className={`flex-1 transition-all duration-500 ease-in-out ${activeSidebar ? 'mr-96' : ''}`}>
                    {config?.room_name ? (
                        <JitsiMeeting
                        domain="meet.jit.si"
                        roomName={config?.room_name}
                        onApiReady={(api) => {
                            setJitsiApi(api);
                            api.executeCommand('subject', config?.subject || 'Interview Meeting');
                            if (isSpecialist) setAssistantAction({ action: 'start_interview', details: { mode: 'ai_agent' } });

                            // Lobby / Waiting Room Listeners
                            api.on('passwordRequired', () => {
                                setLobbyWaiting(true);
                            });
                            api.on('lobby.waiting', () => {
                                setLobbyWaiting(true);
                            });
                            api.on('lobby.joined', () => {
                                setLobbyWaiting(false);
                            });

                            // Enterprise Management Listeners
                            api.on('participantJoined', () => {
                                setParticipantCount(prev => prev + 1);
                            });
                            api.on('participantLeft', () => setParticipantCount(prev => Math.max(1, prev - 1)));
                        }}
                        configOverwrite={{
                            startWithAudioMuted: role === 'guest',
                            startWithVideoMuted: role === 'guest',
                            disableModeratorIndicator: true,
                            startScreenSharing: false,
                            enableEmailInStats: false,
                            prejoinPageEnabled: false,
                            lobby: {
                                enabled: true
                            },
                            toolbarButtons: [
                                'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                                'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                                'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                                'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                                'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                                'security'
                            ], // Enable core features
                            lastN: 5,
                            resolution: 720,
                        }}
                        interfaceConfigOverwrite={{
                            SHOW_JITSI_WATERMARK: false,
                            SHOW_WATERMARK_FOR_GUESTS: false,
                            DISABLE_VIDEO_BACKGROUND: true,
                            TOOLBAR_BUTTONS: [], // Redundant hide
                            SETTINGS_SECTIONS: [],
                        }}
                        userInfo={{
                            displayName: config?.user_name || guestInfo.name
                        }}
                        getIFrameRef={(iframeRef) => {
                            iframeRef.style.height = 'calc(100% - 96px)';
                            iframeRef.style.width = '100%';
                            iframeRef.style.border = 'none';
                            iframeRef.style.opacity = lobbyWaiting ? '0' : '1';
                        }}
                    />
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center p-12 glass-card border-red-500/20">
                                <AlertTriangle className="mx-auto mb-6 text-red-500" size={48} />
                                <h3 className="text-2xl font-black text-white mb-2">Node Sync Interrupted</h3>
                                <p className="text-muted text-sm font-medium italic">Failed to retrieve meeting protocol. Verify link integrity.</p>
                            </div>
                        </div>
                    )}

                    {/* Lobby Overlay */}
                    {lobbyWaiting && (
                        <div className="absolute inset-0 bg-[#202124] flex flex-col items-center justify-center p-12 text-center z-50">
                             <div className="w-24 h-24 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center mb-10 animate-pulse">
                                <Shield size={40} className="text-blue-500" />
                             </div>
                             <h3 className="text-4xl font-black text-white font-outfit tracking-tighter mb-4 animate-in fade-in duration-1000">Isolation Protocol Active</h3>
                             <p className="text-slate-400 text-lg font-medium italic opacity-80 max-w-lg mx-auto">
                                Secure sync established. Your node is in the waiting chamber. 
                                <span className="block mt-2 text-blue-400 font-black uppercase text-[10px] tracking-widest">Awaiting Recruiter Authorization...</span>
                             </p>
                        </div>
                    )}
                </div>

                {/* Role-Based Sidebars */}
                {(activeSidebar || isSpecialist) && (
                    <aside className={`w-[400px] border-l border-white/5 bg-[#1a1b1e] flex flex-col transition-all duration-300 ${activeSidebar ? 'translate-x-0' : 'translate-x-full fixed right-0'}`}>
                        {activeSidebar === 'people' && (
                            <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-medium text-white">People</h3>
                                    <button onClick={() => setActiveSidebar(null)}><X size={20}/></button>
                                </div>
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={16}/>
                                    <input placeholder="Search for people" className="w-full bg-white/5 border border-transparent rounded-full py-3 pl-12 pr-4 focus:border-blue-500 text-sm outline-none"/>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-neutral-500 ml-1">In meeting</p>
                                    <PersonRow name={config?.user_name || guestInfo.name} isMe />
                                    <PersonRow name="Recruiter (Operator)" />
                                </div>
                            </div>
                        )}

                        {activeSidebar === 'chat' && (
                            <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-medium text-white">In-call messages</h3>
                                    <button onClick={() => setActiveSidebar(null)}><X size={20}/></button>
                                </div>
                                <div className="flex-1 bg-white/[0.02] rounded-2xl p-4 text-[13px] text-neutral-400 italic">
                                    Messages can only be seen by people in the call and are deleted when the call ends.
                                </div>
                                <div className="mt-6 relative">
                                    <input placeholder="Send a message to everyone" className="w-full bg-white/5 border border-transparent rounded-full py-4 pl-6 pr-14 text-sm outline-none focus:bg-white/[0.08] transition-all"/>
                                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 p-2 hover:bg-white/5 rounded-full"><Send size={18}/></button>
                                </div>
                            </div>
                        )}

                        {isSpecialist && !activeSidebar && (
                            <div className="flex-1 p-8 overflow-y-auto">
                                <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.4em] mb-10">AI Feedback Matrix</h3>
                                
                                <div className="mb-10 p-6 bg-blue-600/10 border border-blue-500/20 rounded-2xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Node Capacity</span>
                                        <span className="text-[10px] font-black text-white">{participantCount} / 100</span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500" style={{width: `${participantCount}%`}}></div>
                                    </div>
                                    <p className="text-[9px] mt-3 text-neutral-500 font-bold uppercase tracking-widest leading-relaxed">
                                        {participantCount >= 100 ? 'CRITICAL: Capacity Reached' : 'System: Scaling Stable'}
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl group hover:border-blue-500/30 transition-all">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Copy Detection</span>
                                            <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></span>
                                        </div>
                                        <p className="text-[11px] font-bold text-white tracking-tight">Status: Nominal</p>
                                    </div>
                                    <div className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl group hover:border-blue-500/30 transition-all">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Neural Emotion</span>
                                            <span className="text-blue-500 text-[10px] font-black uppercase">Neutral</span>
                                        </div>
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-1/2 shadow-[0_0_10px_#3b82f6]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </aside>
                )}
            </div>

            {/* Custom Google Meet Toolbar (Bottom) */}
            <div className="h-24 bg-[#202124] px-8 flex items-center justify-between z-[200]">
                {/* Left Info */}
                <div className="flex items-center space-x-6 w-1/4">
                    <span className="text-sm font-medium tracking-wide">{currentTime} | {config?.room_name}</span>
                </div>

                {/* Middle Controls (Reference Style) */}
                <div className="flex items-center space-x-3">
                    <ToolbarBtn 
                        onClick={() => handleJitsiCommands('mute')} 
                        active={!isMuted} 
                        icon={isMuted ? <MicOff size={22}/> : <Mic size={22}/>} 
                        red={isMuted}
                    />
                    <ToolbarBtn 
                        onClick={() => handleJitsiCommands('video')} 
                        active={isVideoActive} 
                        icon={isVideoActive ? <Video size={22}/> : <VideoOff size={22}/>} 
                        red={!isVideoActive}
                    />
                    <ToolbarBtn icon={<LayoutGrid size={22}/>} />
                    <ToolbarBtn 
                        onClick={() => handleJitsiCommands('share')} 
                        icon={<MonitorUp size={22}/>} 
                        active={isSharing}
                    />
                    <ToolbarBtn 
                        onClick={() => handleJitsiCommands('background')}
                        icon={<Smile size={22}/>} 
                    />
                    <ToolbarBtn 
                        onClick={() => handleJitsiCommands('hand')}
                        icon={<Hand size={22}/>} 
                    />
                    <ToolbarBtn icon={<MoreVertical size={22}/>} />
                    <button 
                        onClick={() => handleJitsiCommands('hangup')} 
                        className="w-14 h-11 bg-[#ea4335] text-white rounded-full flex items-center justify-center hover:bg-[#d93025] transition-all shadow-md ml-4"
                    >
                        <PhoneOff size={22} fill="currentColor"/>
                    </button>
                </div>

                {/* Right Utils */}
                <div className="flex items-center justify-end space-x-2 w-1/4">
                    <ToolbarUtilBtn icon={<Info size={20}/>} />
                    <ToolbarUtilBtn 
                        icon={<Users size={20}/>} 
                        onClick={() => setActiveSidebar(activeSidebar === 'people' ? null : 'people')}
                        active={activeSidebar === 'people'}
                    />
                    <ToolbarUtilBtn 
                        icon={<MessageSquare size={20}/>} 
                        onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
                        active={activeSidebar === 'chat'}
                    />
                    <ToolbarUtilBtn icon={<div className="w-5 h-5 border-2 border-neutral-400 rounded-sm"></div>} />
                </div>
            </div>
        </div>
    );
}

function ToolbarBtn({ icon, active = false, onClick, red = false }) {
    return (
        <button 
            onClick={onClick}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border border-transparent ${
                red ? 'bg-[#ea4335] text-white hover:bg-[#d93025]' :
                active ? 'bg-[#3c4043] text-white hover:bg-[#4a4d51]' : 'bg-[#3c4043] text-white hover:bg-[#4a4d51] border-red-500/50'
            }`}
        >
            {icon}
        </button>
    );
}

function ToolbarUtilBtn({ icon, onClick, active = false }) {
    return (
        <button 
            onClick={onClick}
            className={`p-3 rounded-full hover:bg-white/5 transition-all ${active ? 'text-blue-400 bg-white/5' : 'text-neutral-400'}`}
        >
            {icon}
        </button>
    );
}

function PersonRow({ name, isMe }) {
    return (
        <div className="flex items-center justify-between group py-2">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">
                    {name ? name.charAt(0).toUpperCase() : '?'}
                </div>
                <span className="text-sm font-medium">{name || 'Node Unknown'} {isMe && '(You)'}</span>
            </div>
            <div className="flex items-center space-x-1 opacity-60">
                <Mic size={14} />
                <MoreVertical size={14} />
            </div>
        </div>
    );
}
