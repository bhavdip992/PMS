import React, { useState, useEffect } from 'react';
import api from '../../services/api.tsx';
import { useAuthStore } from '../../store/useAuthStore.tsx';
import { useThemeStore } from '../../store/useThemeStore.tsx';
import { Settings as SettingsIcon, User, Shield, Bell, Globe, Camera, Sun, Moon, Monitor } from 'lucide-react';

export default function Settings() {
  const { user, checkAuth, activeSessions, fetchActiveSessions, revokeSession, logoutAll } = useAuthStore() as any;
  const { theme, setTheme } = useThemeStore() as any;

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [department, setDepartment] = useState(user?.department || 'Engineering');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [inApp, setInApp] = useState(user?.notificationPreferences?.inApp ?? true);
  const [emailNotification, setEmailNotification] = useState(user?.notificationPreferences?.email ?? true);
  const [popups, setPopups] = useState(user?.notificationPreferences?.popups ?? true);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const payload: Record<string, any> = {
        name,
        timezone,
        department,
        avatar,
        notificationPreferences: {
          inApp,
          email: emailNotification,
          popups
        }
      };

      if (password) {
        payload.password = password;
      }

      await api.put('/auth/me', payload);
      alert('Profile settings saved successfully!');
      
      // Update state in app
      checkAuth();
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile settings');
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to revoke this session?')) {
      await revokeSession(sessionId);
    }
  };

  const handleRevokeAll = async () => {
    if (window.confirm('Are you sure you want to log out from all other devices?')) {
      await logoutAll();
    }
  };

  const timezones = [
    'UTC', 'GMT', 'EST', 'CST', 'MST', 'PST', 'IST', 'CET', 'EET', 'JST', 'AEST'
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-100 flex items-center space-x-2">
          <SettingsIcon className="text-violet-400" />
          <span>Profile Settings</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Manage your user profile details, regional timezones, password, and notification alerts.</p>
      </div>

      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Role details */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col items-center justify-center space-y-4">
          <div className="relative group">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-800" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-violet-650 text-3xl flex items-center justify-center font-bold text-white uppercase border-4 border-slate-800">
                {name ? name[0] : 'U'}
              </div>
            )}
            
            <label className="absolute bottom-0 right-0 p-1.5 bg-violet-600 rounded-full cursor-pointer hover:bg-violet-500 transition-colors shadow-lg">
              <Camera size={14} className="text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-bold text-slate-200">{user?.name}</h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-violet-600/10 text-violet-400 border border-violet-500/20 uppercase tracking-wider mt-1 inline-block">
              {user?.role}
            </span>
          </div>

          <div className="w-full border-t border-slate-850 pt-3 text-center text-[10px] text-slate-500">
            <span>Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
          </div>
        </div>

        {/* Right Column: Information form fields */}
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: Core Details */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center space-x-1.5">
              <User size={12} className="text-violet-400" />
              <span>Personal Information</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5">Department</label>
                <select 
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Design">Design</option>
                  <option value="Product">Product</option>
                  <option value="QA / Testing">QA / Testing</option>
                  <option value="Operations">Operations</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5">System Timezone</label>
                <select 
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                >
                  {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5">Email Address</label>
              <input 
                type="email" 
                disabled
                value={user?.email}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-500 outline-none cursor-not-allowed"
                title="Email address cannot be changed"
              />
            </div>
          </div>

          {/* Section 2: Notifications */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center space-x-1.5">
              <Bell size={12} className="text-violet-400" />
              <span>Notification Preferences</span>
            </h3>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={inApp}
                  onChange={(e) => setInApp(e.target.checked)}
                  className="rounded border-slate-850 bg-slate-950 text-violet-600 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">In-App Notifications</span>
                  <span className="text-[10px] text-slate-500">Receive system alerts in the app dashboard notifications list.</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={emailNotification}
                  onChange={(e) => setEmailNotification(e.target.checked)}
                  className="rounded border-slate-850 bg-slate-950 text-violet-600 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Email Alerts</span>
                  <span className="text-[10px] text-slate-500">Receive periodic emails for tasks updates, assignments, and tags.</span>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={popups}
                  onChange={(e) => setPopups(e.target.checked)}
                  className="rounded border-slate-850 bg-slate-950 text-violet-600 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Desktop Popups</span>
                  <span className="text-[10px] text-slate-500">Receive push alerts for comments notifications while the app is active.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2.5: Theme Appearance */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center space-x-1.5">
              <Monitor size={12} className="text-violet-400" />
              <span>Appearance & Theme</span>
            </h3>
            <p className="text-[11px] text-slate-500">Choose how esparkPM looks for you. Your preference is saved locally on this device.</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'light',  Icon: Sun,     label: 'Light Mode',  desc: 'Bright workspace' },
                { val: 'dark',   Icon: Moon,    label: 'Dark Mode',   desc: 'Easy on eyes' },
                { val: 'system', Icon: Monitor, label: 'System',      desc: 'Follows OS setting' },
              ].map(({ val, Icon, label, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTheme(val)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === val
                      ? 'border-violet-500 bg-violet-950/30 text-violet-300'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <Icon size={20} />
                  <div className="text-center">
                    <p className="text-xs font-bold">{label}</p>
                    <p className="text-[9px] mt-0.5 opacity-70">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Credentials / Password */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center space-x-1.5">
              <Shield size={12} className="text-violet-400" />
              <span>Change Security Password</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5">New Password</label>
                <input 
                  type="password" 
                  value={password}
                  placeholder="Min. 6 characters"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1.5">Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  placeholder="Repeat new password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Connected Devices & Sessions */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center space-x-1.5">
              <Shield size={12} className="text-violet-400" />
              <span>Connected Devices & Sessions</span>
            </h3>
            <p className="text-[11px] text-slate-500">Manage active login sessions on other devices and browsers.</p>
            
            <div className="space-y-3">
              {activeSessions && activeSessions.length > 0 ? (
                activeSessions.map((session: any) => (
                  <div key={session._id} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-850">
                    <div>
                      <p className="text-xs font-bold text-slate-350">{session.deviceInfo}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">IP: {session.ipAddress} • Active: {new Date(session.lastActive).toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(session._id)}
                      className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/40 text-red-400 text-[10px] font-bold rounded-lg border border-red-900/30 transition-all cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No other active sessions detected.</p>
              )}
            </div>

            {activeSessions && activeSessions.length > 1 && (
              <button
                type="button"
                onClick={handleRevokeAll}
                className="w-full py-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 text-xs font-bold rounded-xl border border-red-900/30 transition-all mt-2 cursor-pointer"
              >
                Log Out From All Other Devices
              </button>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            Save All Profile Settings
          </button>
        </div>
      </form>
    </div>
  );
}
