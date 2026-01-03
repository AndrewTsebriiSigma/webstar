'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon, ChevronRightIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { settingsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Setup2FAModal from './Setup2FAModal';
import Disable2FAModal from './Disable2FAModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [loading2FAStatus, setLoading2FAStatus] = useState(false);
  const [settings, setSettings] = useState({
    email: '',
    publicProfile: true,
    blockedUsers: [] as string[],
    pushNotifications: true,
    emailNotifications: true,
    twoFactorEnabled: false,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings((prev) => ({ ...prev, ...parsed }));
    }
    if (isOpen) {
      load2FAStatus();
    }
  }, [isOpen]);

  const load2FAStatus = async () => {
    setLoading2FAStatus(true);
    try {
      const response = await settingsAPI.get2FAStatus();
      setSettings((prev) => ({ ...prev, twoFactorEnabled: response.data.is_enabled }));
    } catch (error) {
      console.error('Error loading 2FA status:', error);
    } finally {
      setLoading2FAStatus(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('userSettings', JSON.stringify(settings));
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setTimeout(saveSettings, 0);
  };

  const handle2FAToggle = () => {
    if (settings.twoFactorEnabled) {
      setShow2FADisable(true);
    } else {
      setShow2FASetup(true);
    }
  };

  const handle2FASuccess = () => load2FAStatus();

  if (!isOpen) return null;

  // Toggle component - clean implementation
  const Toggle = ({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) => (
    <div
      onClick={disabled ? undefined : onToggle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: '46px',
        height: '28px',
        borderRadius: '14px',
        padding: '2px',
        background: enabled ? '#00C2FF' : '#39393D',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.2s ease',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '12px',
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
          transform: enabled ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform 0.2s ease'
        }}
      />
    </div>
  );

  // Section Header component
  const SectionHeader = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingLeft: '4px' }}>
      <span style={{ color: 'rgba(255, 255, 255, 0.4)', width: '16px', height: '16px', display: 'flex' }}>{icon}</span>
      <span style={{ 
        fontSize: '11px', 
        fontWeight: 700, 
        letterSpacing: '0.5px',
        color: 'rgba(255, 255, 255, 0.4)',
        textTransform: 'uppercase'
      }}>
        {label}
      </span>
    </div>
  );

  // Glass Card component - exact Figma spec
  const GlassCard = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {children}
    </div>
  );

  // Row Item component
  const RowItem = ({ 
    label, 
    onClick, 
    rightElement,
    showChevron = false,
    showDivider = true 
  }: { 
    label: string; 
    onClick?: () => void;
    rightElement?: React.ReactNode;
    showChevron?: boolean;
    showDivider?: boolean;
  }) => (
    <>
      <div
        onClick={onClick}
        className={onClick ? 'cursor-pointer' : ''}
        style={{
          height: '55px',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'background 0.15s ease',
          background: onClick ? undefined : undefined
        }}
        onMouseEnter={(e) => onClick && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)')}
        onMouseLeave={(e) => onClick && (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{ fontSize: '15px', fontWeight: 400, color: '#FFFFFF' }}>{label}</span>
        {rightElement || (showChevron && (
          <ChevronRightIcon style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.3)' }} />
        ))}
      </div>
      {showDivider && (
        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', marginLeft: '16px' }} />
      )}
    </>
  );

  // Icons
  const icons = {
    account: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    privacy: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    notifications: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    legal: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  };

  return (
    <>
      {/* Glass Overlay - subtle blur, preserve tone */}
      <div 
        className="fixed inset-0 z-50"
        style={{ 
          background: 'rgba(17, 17, 17, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}
      >
        {/* Full Screen Modal - semi-transparent to see blur */}
        <div 
          className="w-full h-full flex flex-col"
          style={{ background: 'transparent' }}
        >
          {/* Header - 55px height, centered vertically */}
          <div 
            className="flex items-center justify-between flex-shrink-0"
            style={{ 
              height: '55px',
              padding: '0 16px',
              background: '#0D0D0D',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF' }}>Settings</h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center hover:opacity-70 transition-opacity"
              style={{ width: '28px', height: '28px' }}
            >
              <XMarkIcon style={{ width: '24px', height: '24px', color: 'rgba(255, 255, 255, 0.5)' }} />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div 
            className="flex-1 overflow-y-auto"
            style={{ padding: '24px 16px' }}
          >
            {activeSection === null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* ACCOUNT */}
                <div>
                  <SectionHeader icon={icons.account} label="Account" />
                  <GlassCard>
                    <RowItem label="Email" onClick={() => setActiveSection('email')} showChevron />
                    <RowItem label="Password" onClick={() => setActiveSection('password')} showChevron />
                    <RowItem 
                      label="2FA" 
                      showDivider={false}
                      rightElement={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {loading2FAStatus && (
                            <div className="w-4 h-4 border-2 border-gray-600 border-t-cyan-400 rounded-full animate-spin" />
                          )}
                          <Toggle enabled={settings.twoFactorEnabled} onToggle={handle2FAToggle} disabled={loading2FAStatus} />
                        </div>
                      }
                    />
                  </GlassCard>
                </div>

                {/* PRIVACY */}
                <div>
                  <SectionHeader icon={icons.privacy} label="Privacy" />
                  <GlassCard>
                    <RowItem 
                      label="Public Profile" 
                      rightElement={<Toggle enabled={settings.publicProfile} onToggle={() => toggleSetting('publicProfile')} />}
                    />
                    <RowItem label="Blocked Users" onClick={() => setActiveSection('blocked')} showChevron showDivider={false} />
                  </GlassCard>
                </div>

                {/* NOTIFICATIONS */}
                <div>
                  <SectionHeader icon={icons.notifications} label="Notifications" />
                  <GlassCard>
                    <RowItem 
                      label="Push" 
                      rightElement={<Toggle enabled={settings.pushNotifications} onToggle={() => toggleSetting('pushNotifications')} />}
                    />
                    <RowItem 
                      label="Email" 
                      showDivider={false}
                      rightElement={<Toggle enabled={settings.emailNotifications} onToggle={() => toggleSetting('emailNotifications')} />}
                    />
                  </GlassCard>
                </div>

                {/* LEGAL */}
                <div>
                  <SectionHeader icon={icons.legal} label="Legal" />
                  <GlassCard>
                    <RowItem label="Terms" onClick={() => setActiveSection('terms')} showChevron />
                    <RowItem label="Privacy" onClick={() => setActiveSection('privacy-policy')} showChevron showDivider={false} />
                  </GlassCard>
                </div>

                {/* LOGOUT */}
                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={() => {
                      logout();
                      onClose();
                      toast.success('Logged out successfully');
                      router.push('/auth/login');
                    }}
                    className="w-full flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                    style={{
                      height: '55px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '16px',
                    }}
                  >
                    <ArrowRightOnRectangleIcon style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                    <span style={{ fontSize: '15px', fontWeight: 500, color: '#EF4444' }}>Log Out</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Subsection Views */
              <div>
                <button
                  onClick={() => setActiveSection(null)}
                  className="flex items-center gap-2 mb-6 hover:opacity-70 transition-opacity"
                  style={{ color: '#00C2FF' }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>Back</span>
                </button>

                {activeSection === 'email' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>Change Email</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Coming soon...</p>
                  </div>
                )}
                {activeSection === 'password' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>Change Password</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Coming soon...</p>
                  </div>
                )}
                {activeSection === 'blocked' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>Blocked Users</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>No blocked users</p>
                  </div>
                )}
                {activeSection === 'terms' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>Terms of Service</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Terms content...</p>
                  </div>
                )}
                {activeSection === 'privacy-policy' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', marginBottom: '16px' }}>Privacy Policy</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Privacy content...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2FA Modals */}
      <Setup2FAModal isOpen={show2FASetup} onClose={() => setShow2FASetup(false)} onSuccess={handle2FASuccess} />
      <Disable2FAModal isOpen={show2FADisable} onClose={() => setShow2FADisable(false)} onSuccess={handle2FASuccess} />
    </>
  );
}
