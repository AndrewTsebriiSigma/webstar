'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon, ChevronRightIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [settings, setSettings] = useState({
    // Account
    email: '',
    // Privacy
    publicProfile: true,
    blockedUsers: [] as string[],
    // Notifications
    pushNotifications: true,
    emailNotifications: true,
    // Security
    twoFactorEnabled: false,
  });

  useEffect(() => {
    // Load user settings from localStorage or API
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
    toast.success('Settings saved');
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {activeSection === null ? (
            // Main Menu
            <div className="p-6 space-y-6">
              {/* ACCOUNT Section */}
              <div>
                <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm font-semibold uppercase tracking-wider">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>ACCOUNT</span>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveSection('email')}
                    className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition text-left"
                  >
                    <span className="text-white font-medium">Email</span>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => setActiveSection('password')}
                    className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition text-left"
                  >
                    <span className="text-white font-medium">Password</span>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                    <span className="text-white font-medium">2FA</span>
                    <button
                      onClick={() => toggleSetting('twoFactorEnabled')}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                        settings.twoFactorEnabled ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                          settings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* PRIVACY Section */}
              <div>
                <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm font-semibold uppercase tracking-wider">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>PRIVACY</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                    <span className="text-white font-medium">Public Profile</span>
                    <button
                      onClick={() => {
                        toggleSetting('publicProfile');
                        saveSettings();
                      }}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                        settings.publicProfile ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                          settings.publicProfile ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setActiveSection('blocked')}
                    className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition text-left"
                  >
                    <span className="text-white font-medium">Blocked Users</span>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* NOTIFICATIONS Section */}
              <div>
                <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm font-semibold uppercase tracking-wider">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>NOTIFICATIONS</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                    <span className="text-white font-medium">Push</span>
                    <button
                      onClick={() => {
                        toggleSetting('pushNotifications');
                        saveSettings();
                      }}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                        settings.pushNotifications ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                          settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                    <span className="text-white font-medium">Email</span>
                    <button
                      onClick={() => {
                        toggleSetting('emailNotifications');
                        saveSettings();
                      }}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                        settings.emailNotifications ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                          settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* LEGAL Section */}
              <div>
                <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm font-semibold uppercase tracking-wider">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>LEGAL</span>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveSection('terms')}
                    className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition text-left"
                  >
                    <span className="text-white font-medium">Terms</span>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => setActiveSection('privacy-policy')}
                    className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition text-left"
                  >
                    <span className="text-white font-medium">Privacy</span>
                    <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* ACCOUNT ACTIONS Section */}
              <div>
                <div className="flex items-center gap-2 mb-4 text-gray-400 text-sm font-semibold uppercase tracking-wider">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>ACTIONS</span>
                </div>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      logout();
                      onClose();
                      toast.success('Logged out successfully');
                      router.push('/auth/login');
                    }}
                    className="w-full flex items-center justify-between p-4 bg-red-900/20 hover:bg-red-900/30 border border-red-800/50 rounded-xl transition text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-medium">Log Out</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Subsection Views
            <div className="p-6">
              <button
                onClick={() => setActiveSection(null)}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>

              {activeSection === 'email' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Change Email</h3>
                  <p className="text-gray-400 mb-4">Coming soon...</p>
                </div>
              )}

              {activeSection === 'password' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Change Password</h3>
                  <p className="text-gray-400 mb-4">Coming soon...</p>
                </div>
              )}

              {activeSection === 'blocked' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Blocked Users</h3>
                  {settings.blockedUsers.length === 0 ? (
                    <p className="text-gray-400">No blocked users</p>
                  ) : (
                    <div className="space-y-2">
                      {settings.blockedUsers.map((user) => (
                        <div key={user} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                          <span className="text-white">@{user}</span>
                          <button className="text-red-400 hover:text-red-300 text-sm">Unblock</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'terms' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Terms of Service</h3>
                  <p className="text-gray-400">Terms of service content...</p>
                </div>
              )}

              {activeSection === 'privacy-policy' && (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Privacy Policy</h3>
                  <p className="text-gray-400">Privacy policy content...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

