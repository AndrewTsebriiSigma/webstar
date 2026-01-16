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

// Toggle component with proper styling
const Toggle = ({ enabled, onToggle, disabled = false }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) => (
  <div
    onClick={disabled ? undefined : onToggle}
    style={{
      width: '46px',
      height: '28px',
      borderRadius: '14px',
      background: enabled ? '#00C2FF' : '#39393D',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      position: 'relative',
      transition: 'background 0.2s ease'
    }}
  >
    <div
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '12px',
        background: '#FFFFFF',
        position: 'absolute',
        top: '2px',
        left: enabled ? '20px' : '2px',
        transition: 'left 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    />
  </div>
);

// Row item component
const RowItem = ({ children, isFirst, isLast, onClick, hasChevron = false }: { children: React.ReactNode; isFirst?: boolean; isLast?: boolean; onClick?: () => void; hasChevron?: boolean }) => (
  <div
    onClick={onClick}
    style={{
      height: '55px',
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(255, 255, 255, 0.04)',
      borderTop: isFirst ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: isFirst && isLast ? '16px' : isFirst ? '16px 16px 0 0' : isLast ? '0 0 16px 16px' : '0',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.15s ease'
    }}
  >
    {children}
    {hasChevron && <ChevronRightIcon style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.3)' }} />}
  </div>
);

// Section header component
const SectionHeader = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingLeft: '0' }}>
    <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>{icon}</span>
    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>{label}</span>
  </div>
);

// Glass card container
const GlassCard = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.04)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    overflow: 'hidden'
  }}>
    {children}
  </div>
);

// Change Email Section Component
const ChangeEmailSection = ({ onBack }: { onBack: () => void }) => {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !password) return;

    setLoading(true);
    setError('');

    try {
      const response = await settingsAPI.changeEmail(newEmail, password);
      if (response.data) {
        setSuccess(true);
        toast.success('Email updated successfully!');
        // Update local storage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.email = newEmail;
        localStorage.setItem('user', JSON.stringify(user));
        setTimeout(() => onBack(), 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
          style={{ background: 'rgba(52, 199, 89, 0.1)' }}>
          <svg className="w-8 h-8 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>Email Updated!</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Your email has been changed successfully.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>Change Email</h3>
      
      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm"
          style={{ background: 'rgba(255, 69, 58, 0.1)', color: '#FF453A' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>
            New Email
          </label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="your@newemail.com"
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontSize: '15px',
              outline: 'none'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>
            Current Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password to confirm"
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontSize: '15px',
              outline: 'none'
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !newEmail || !password}
          style={{
            width: '100%',
            padding: '14px',
            background: loading || !newEmail || !password ? 'rgba(255, 255, 255, 0.1)' : '#00C2FF',
            borderRadius: '12px',
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: 600,
            border: 'none',
            cursor: loading || !newEmail || !password ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Updating...' : 'Update Email'}
        </button>
      </form>
    </div>
  );
};

// Change Password Section Component
const ChangePasswordSection = ({ onBack }: { onBack: () => void }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await settingsAPI.changePassword(currentPassword, newPassword);
      if (response.data) {
        setSuccess(true);
        toast.success('Password updated successfully!');
        setTimeout(() => onBack(), 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
          style={{ background: 'rgba(52, 199, 89, 0.1)' }}>
          <svg className="w-8 h-8 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>Password Updated!</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Your password has been changed successfully.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>Change Password</h3>
      
      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm"
          style={{ background: 'rgba(255, 69, 58, 0.1)', color: '#FF453A' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontSize: '15px',
              outline: 'none'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontSize: '15px',
              outline: 'none'
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '6px' }}>
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            style={{
              width: '100%',
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontSize: '15px',
              outline: 'none'
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          style={{
            width: '100%',
            padding: '14px',
            background: loading || !currentPassword || !newPassword || !confirmPassword ? 'rgba(255, 255, 255, 0.1)' : '#00C2FF',
            borderRadius: '12px',
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: 600,
            border: 'none',
            cursor: loading || !currentPassword || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

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
      setSettings((prev) => ({
        ...prev,
        twoFactorEnabled: response.data.is_enabled,
      }));
    } catch (error: any) {
      console.error('Error loading 2FA status:', error);
    } finally {
      setLoading2FAStatus(false);
    }
  };

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

  const handle2FAToggle = () => {
    if (settings.twoFactorEnabled) {
      setShow2FADisable(true);
    } else {
      setShow2FASetup(true);
    }
  };

  const handle2FASuccess = () => {
    load2FAStatus();
  };

  if (!isOpen) return null;

  // Icons
  const AccountIcon = <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  const PrivacyIcon = <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
  const NotifIcon = <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
  const LegalIcon = <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  const ActionIcon = <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;

  return (
    <>
      {/* Glass Overlay */}
      <div 
        className="fixed inset-0 z-50"
        style={{ 
          background: 'rgba(17, 17, 17, 0.92)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)'
        }}
      >
        {/* Full screen container */}
        <div className="w-full h-full flex flex-col" style={{ background: 'transparent' }}>
          {/* Header - 55px */}
          <div 
            className="flex items-center justify-between flex-shrink-0"
            style={{ 
              height: '55px',
              padding: '0 16px',
              background: '#0D0D0D',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF' }}>Settings</span>
            <button onClick={onClose} className="flex items-center justify-center hover:opacity-70 transition-opacity" style={{ width: '28px', height: '28px' }}>
              <XMarkIcon style={{ width: '24px', height: '24px', color: 'rgba(255, 255, 255, 0.5)' }} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto" style={{ padding: '24px 16px' }}>
            {activeSection === null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* ACCOUNT Section */}
                <div>
                  <SectionHeader icon={AccountIcon} label="ACCOUNT" />
                  <GlassCard>
                    <RowItem isFirst onClick={() => setActiveSection('email')} hasChevron>
                      <span style={{ fontSize: '15px', fontWeight: 400, color: '#FFFFFF' }}>Email</span>
                    </RowItem>
                    <RowItem onClick={() => setActiveSection('password')} hasChevron>
                      <span style={{ fontSize: '15px', fontWeight: 400, color: '#FFFFFF' }}>Password</span>
                    </RowItem>
                    <RowItem isLast>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 400, color: '#FFFFFF' }}>2FA</span>
                        {loading2FAStatus && <div className="w-3 h-3 border-2 border-gray-600 border-t-cyan-500 rounded-full animate-spin" />}
                      </div>
                      <Toggle enabled={settings.twoFactorEnabled} onToggle={handle2FAToggle} disabled={loading2FAStatus} />
                    </RowItem>
                  </GlassCard>
                </div>

                {/* PRIVACY Section */}
                <div>
                  <SectionHeader icon={PrivacyIcon} label="PRIVACY" />
                  <GlassCard>
                    <RowItem isFirst>
                      <span style={{ fontSize: '15px', fontWeight: 400, color: '#FFFFFF' }}>Public Profile</span>
                      <Toggle enabled={settings.publicProfile} onToggle={() => { toggleSetting('publicProfile'); saveSettings(); }} />
                    </RowItem>
                    <RowItem isLast onClick={() => setActiveSection('blocked')} hasChevron>
                      <span style={{ fontSize: '15px', fontWeight: 400, color: '#FFFFFF' }}>Blocked Users</span>
                    </RowItem>
                  </GlassCard>
                </div>

                {/* NOTIFICATIONS Section */}
                <div>
                  <SectionHeader icon={NotifIcon} label="NOTIFICATIONS" />
                  <GlassCard>
                    <RowItem isFirst>
                      <span style={{ fontSize: '15px', fontWeight: 400, color: '#FFFFFF' }}>Push</span>
                      <Toggle enabled={settings.pushNotifications} onToggle={() => { toggleSetting('pushNotifications'); saveSettings(); }} />
                    </RowItem>
                    <RowItem isLast>
                      <span style={{ fontSize: '15px', fontWeight: 400, color: '#FFFFFF' }}>Email</span>
                      <Toggle enabled={settings.emailNotifications} onToggle={() => { toggleSetting('emailNotifications'); saveSettings(); }} />
                    </RowItem>
                  </GlassCard>
                </div>

                {/* LEGAL Section */}
                <div>
                  <SectionHeader icon={LegalIcon} label="LEGAL" />
                  <GlassCard>
                    <RowItem isFirst onClick={() => setActiveSection('terms')} hasChevron>
                      <span style={{ fontSize: '15px', fontWeight: 400, color: '#FFFFFF' }}>Terms</span>
                    </RowItem>
                    <RowItem isLast onClick={() => setActiveSection('privacy-policy')} hasChevron>
                      <span style={{ fontSize: '15px', fontWeight: 400, color: '#FFFFFF' }}>Privacy</span>
                    </RowItem>
                  </GlassCard>
                </div>

                {/* ACTIONS Section */}
                <div>
                  <SectionHeader icon={ActionIcon} label="ACTIONS" />
                  <button
                    onClick={() => {
                      logout();
                      onClose();
                      toast.success('Logged out successfully');
                      router.push('/auth/login');
                    }}
                    style={{
                      width: '100%',
                      height: '55px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '0 16px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <ArrowRightOnRectangleIcon style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                    <span style={{ fontSize: '15px', fontWeight: 500, color: '#EF4444' }}>Log Out</span>
                  </button>
                </div>
              </div>
            ) : (
              // Subsection Views
              <div>
                <button
                  onClick={() => setActiveSection(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#00C2FF',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '24px',
                    padding: 0
                  }}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span style={{ fontSize: '15px' }}>Back</span>
                </button>

                {activeSection === 'email' && (
                  <ChangeEmailSection onBack={() => setActiveSection(null)} />
                )}

                {activeSection === 'password' && (
                  <ChangePasswordSection onBack={() => setActiveSection(null)} />
                )}

                {activeSection === 'blocked' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>Blocked Users</h3>
                    {settings.blockedUsers.length === 0 ? (
                      <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>No blocked users</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {settings.blockedUsers.map((user) => (
                          <div key={user} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '12px' }}>
                            <span style={{ color: '#FFFFFF' }}>@{user}</span>
                            <button style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Unblock</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeSection === 'terms' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>Terms of Service</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Terms of service content...</p>
                  </div>
                )}

                {activeSection === 'privacy-policy' && (
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>Privacy Policy</h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Privacy policy content...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2FA Modals */}
      <Setup2FAModal 
        isOpen={show2FASetup} 
        onClose={() => setShow2FASetup(false)}
        onSuccess={handle2FASuccess}
      />
      <Disable2FAModal 
        isOpen={show2FADisable} 
        onClose={() => setShow2FADisable(false)}
        onSuccess={handle2FASuccess}
      />
    </>
  );
}
