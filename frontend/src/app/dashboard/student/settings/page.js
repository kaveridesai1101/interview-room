'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

export default function Settings() {
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    organization: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await api.getProfile();
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          phone: data.phone || '',
          organization: data.organization || '',
          bio: data.bio || ''
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to sync profile data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      await api.updateProfile(profile);
      setMessage({ type: 'success', text: 'Profile matrix updated successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error transmitting profile update.' });
    } finally {
      setSaving(false);
      // Clear success message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  return (
    <DashboardLayout role="student">
      <div className="max-w-4xl">
        <div className="mb-12">
          <h2 className="text-4xl font-black text-white font-outfit tracking-tight">System Settings</h2>
          <p className="text-muted mt-2 font-medium text-lg">Configure your node identity and operational parameters.</p>
        </div>

        {loading ? (
             <div className="py-24 text-center glass-card border-dashed bg-white/[0.01]">
                  <span className="w-8 h-8 rounded-full border-4 border-t-blue-500 border-white/10 animate-spin block mx-auto mb-4"></span>
                  <p className="text-muted font-bold uppercase tracking-widest text-xs opacity-40">Retrieving node configuration...</p>
             </div>
        ) : (
          <div className="glass-card p-10 relative overflow-hidden">
             {/* Decorative glow */}
             <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>

             <h3 className="text-sm font-black text-white uppercase tracking-[.4em] opacity-50 mb-8 border-b border-white/5 pb-4">Identity Matrix</h3>
             
             {message.text && (
                 <div className={`p-4 rounded-xl mb-8 border backdrop-blur-md flex items-center space-x-3 ${
                     message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                 }`}>
                     <span className="text-xl">
                         {message.type === 'success' ? '✅' : '⚠️'}
                     </span>
                     <p className="font-bold text-sm tracking-wide">{message.text}</p>
                 </div>
             )}

             <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="grid md:grid-cols-2 gap-6">
                    <InputField 
                        label="Operative Name" 
                        name="full_name" 
                        value={profile.full_name} 
                        onChange={handleChange} 
                        placeholder="e.g. Kaveri Desai"
                    />
                    <InputField 
                        label="Encrypted Comms (Phone)" 
                        name="phone" 
                        value={profile.phone} 
                        onChange={handleChange} 
                        placeholder="+1 (555) 000-0000"
                    />
                </div>
                
                <InputField 
                    label="Assigned Organization/Academy" 
                    name="organization" 
                    value={profile.organization} 
                    onChange={handleChange} 
                    placeholder="e.g. Pune Institute of Computer Technology"
                />

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1 opacity-60">Operative Bio</label>
                    <textarea 
                        name="bio"
                        value={profile.bio}
                        onChange={handleChange}
                        placeholder="Enter your system background and core competencies..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all outline-none resize-none h-32 text-sm placeholder:text-white/20"
                    />
                </div>

                <div className="pt-6 border-t border-white/5">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="btn-premium w-full md:w-auto px-10 py-4"
                    >
                        {saving ? (
                            <span className="flex items-center space-x-2">
                                <span className="w-4 h-4 rounded-full border-2 border-t-white border-white/30 animate-spin"></span>
                                <span>Transmitting...</span>
                            </span>
                        ) : 'Save Configuration'}
                    </button>
                </div>
             </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function InputField({ label, name, value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-white uppercase tracking-widest ml-1 opacity-60">{label}</label>
        <input 
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all outline-none text-sm placeholder:text-white/20"
        />
    </div>
  );
}
