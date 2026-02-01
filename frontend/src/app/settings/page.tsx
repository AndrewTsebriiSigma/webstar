'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightOnRectangleIcon, ChevronLeftIcon, ChevronRightIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { settingsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import Setup2FAModal from '@/components/Setup2FAModal';
import Disable2FAModal from '@/components/Disable2FAModal';
import { ChangeEmailSection, ChangePasswordSection, ChangeUsernameSection } from '@/components/SettingsModal';

// Toggle component with proper styling
const Toggle = ({ enabled, onToggle, disabled = false }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) => (
  <button
    onClick={disabled ? undefined : onToggle}
    disabled={disabled}
    style={{
      width: '44px',
      height: '24px',
      borderRadius: '12px',
      background: enabled ? '#00C2FF' : 'rgba(255, 255, 255, 0.15)',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      position: 'relative',
      transition: 'background 0.2s ease',
      opacity: disabled ? 0.5 : 1,
    }}
  >
    <div
      style={{
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#FFFFFF',
        position: 'absolute',
        top: '3px',
        left: enabled ? '23px' : '3px',
        transition: 'left 0.2s ease',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      }}
    />
  </button>
);

const SectionHeader = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
    <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{icon}</div>
    <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
      {label}
    </span>
  </div>
);

const GlassCard = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

const RowItem = ({ 
  children, 
  onClick, 
  hasChevron = false, 
  isFirst = false, 
  isLast = false 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  hasChevron?: boolean; 
  isFirst?: boolean; 
  isLast?: boolean;
}) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.15s ease',
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
      }
    }}
    onMouseLeave={(e) => {
      if (onClick) {
        e.currentTarget.style.background = 'transparent';
      }
    }}
  >
    {children}
    {hasChevron && (
      <ChevronRightIcon style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.3)' }} />
    )}
  </div>
);

export default function SettingsPage() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [loading2FAStatus, setLoading2FAStatus] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [settings, setSettings] = useState({
    email: '',
    emailNotifications: true,
    twoFactorEnabled: false,
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings((prev) => ({ ...prev, ...parsed }));
    }
    load2FAStatus();
  }, [user, router]);

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

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    setFeedbackSubmitting(true);
    try {
      // For now, we'll use mailto link. In the future, this could be an API endpoint
      const subject = encodeURIComponent('WebSTAR Feedback');
      const body = encodeURIComponent(`User: ${user?.email || 'Anonymous'}\nUsername: ${user?.username || 'N/A'}\n\nFeedback:\n${feedbackText}`);
      window.location.href = `mailto:feedback@webstar.bio?subject=${subject}&body=${body}`;
      
      // Show success message
      toast.success('Opening email client...');
      setFeedbackText('');
      setShowFeedbackModal(false);
    } catch (error) {
      toast.error('Failed to open email client');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  // Icons
  const AccountIcon = <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  const NotifIcon = <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
  const LegalIcon = <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  const ActionIcon = <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: '#08080C',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Header */}
      <div 
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(8, 8, 12, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          }}
        >
          <ChevronLeftIcon style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
          Settings
        </h1>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 20px', maxWidth: '672px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* ACCOUNT Section */}
          <div>
            <SectionHeader icon={AccountIcon} label="ACCOUNT" />
            <GlassCard>
              <RowItem isFirst onClick={() => setActiveSection('username')} hasChevron>
                <span style={{ fontSize: '15px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.95)' }}>Username</span>
              </RowItem>
              <RowItem onClick={() => setActiveSection('email')} hasChevron>
                <span style={{ fontSize: '15px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.95)' }}>Email</span>
              </RowItem>
              <RowItem onClick={() => setActiveSection('password')} hasChevron>
                <span style={{ fontSize: '15px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.95)' }}>Password</span>
              </RowItem>
              <RowItem isLast>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.95)' }}>2FA</span>
                  {loading2FAStatus && <div className="w-3 h-3 border-2 border-gray-600 border-t-cyan-500 rounded-full animate-spin" />}
                </div>
                <Toggle enabled={settings.twoFactorEnabled} onToggle={handle2FAToggle} disabled={loading2FAStatus} />
              </RowItem>
            </GlassCard>
          </div>

          {/* NOTIFICATIONS Section */}
          <div>
            <SectionHeader icon={NotifIcon} label="NOTIFICATIONS" />
            <GlassCard>
              <RowItem isFirst isLast>
                <span style={{ fontSize: '15px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.95)' }}>Email</span>
                <Toggle enabled={settings.emailNotifications} onToggle={() => { toggleSetting('emailNotifications'); saveSettings(); }} />
              </RowItem>
            </GlassCard>
          </div>

          {/* LEGAL Section */}
          <div>
            <SectionHeader icon={LegalIcon} label="LEGAL" />
            <GlassCard>
              <RowItem isFirst onClick={() => setActiveSection('terms')} hasChevron>
                <span style={{ fontSize: '15px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.95)' }}>Terms</span>
              </RowItem>
              <RowItem isLast onClick={() => setActiveSection('privacy-policy')} hasChevron>
                <span style={{ fontSize: '15px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.95)' }}>Privacy</span>
              </RowItem>
            </GlassCard>
          </div>

          {/* ACTIONS Section */}
          <div>
            <SectionHeader icon={ActionIcon} label="ACTIONS" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Feedback Button */}
              <GlassCard>
                <RowItem isFirst isLast onClick={() => setShowFeedbackModal(true)} hasChevron>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ChatBubbleLeftRightIcon style={{ width: '18px', height: '18px', color: 'rgba(255, 255, 255, 0.7)' }} />
                    <span style={{ fontSize: '15px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.95)' }}>Feedback</span>
                  </div>
                </RowItem>
              </GlassCard>

              {/* Log Out Button */}
              <GlassCard>
                <div style={{ padding: '16px' }}>
                  <button
                    onClick={() => {
                      logout();
                      toast.success('Logged out successfully');
                      router.push('/auth/login');
                    }}
                    style={{
                      width: '100%',
                      height: '55px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '0 16px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                  >
                    <ArrowRightOnRectangleIcon style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                    <span style={{ fontSize: '15px', fontWeight: 500, color: '#EF4444' }}>Log Out</span>
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>

      {/* Username Section Modal */}
      {activeSection === 'username' && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setActiveSection(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxHeight: '80vh',
              background: '#111111',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF' }}>Change Username</h2>
              <button onClick={() => setActiveSection(null)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ChangeUsernameSection onBack={() => setActiveSection(null)} />
          </div>
        </div>
      )}

      {/* Email Section Modal */}
      {activeSection === 'email' && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setActiveSection(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxHeight: '80vh',
              background: '#111111',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF' }}>Change Email</h2>
              <button onClick={() => setActiveSection(null)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ChangeEmailSection onBack={() => setActiveSection(null)} />
          </div>
        </div>
      )}

      {/* Password Section Modal */}
      {activeSection === 'password' && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setActiveSection(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxHeight: '80vh',
              background: '#111111',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF' }}>Change Password</h2>
              <button onClick={() => setActiveSection(null)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ChangePasswordSection onBack={() => setActiveSection(null)} />
          </div>
        </div>
      )}

      {/* Terms Section Modal */}
      {activeSection === 'terms' && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setActiveSection(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxHeight: '80vh',
              background: '#111111',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '20px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF' }}>Terms of Service</h2>
              <button onClick={() => setActiveSection(null)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Last updated:</strong> January 2026
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>1. Acceptance of Terms</h4>
              <p style={{ marginBottom: '12px' }}>
                By accessing and using WebSTAR, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>2. Description of Service</h4>
              <p style={{ marginBottom: '12px' }}>
                WebSTAR is a professional portfolio and creative showcase platform that enables users to create, share, and manage their creative work, connect with other professionals, and build their personal brand.
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>3. User Accounts</h4>
              <p style={{ marginBottom: '12px' }}>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>4. User Content</h4>
              <p style={{ marginBottom: '12px' }}>
                You retain ownership of content you upload. By posting content, you grant WebSTAR a non-exclusive license to display, distribute, and promote your content within the platform.
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>5. Prohibited Conduct</h4>
              <p style={{ marginBottom: '12px' }}>
                Users may not upload illegal content, harass others, spam, impersonate others, or attempt to compromise platform security.
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>6. Termination</h4>
              <p style={{ marginBottom: '12px' }}>
                We reserve the right to suspend or terminate accounts that violate these terms or for any other reason at our discretion.
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>7. Contact</h4>
              <p style={{ marginBottom: '12px' }}>
                For questions about these terms, contact us at <span style={{ color: '#00C2FF' }}>legal@webstar.bio</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Section Modal */}
      {activeSection === 'privacy-policy' && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setActiveSection(null)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxHeight: '80vh',
              background: '#111111',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '20px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF' }}>Privacy Policy</h2>
              <button onClick={() => setActiveSection(null)} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', lineHeight: '1.6' }}>
              <p style={{ marginBottom: '16px' }}>
                <strong style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Last updated:</strong> January 2026
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>1. Information We Collect</h4>
              <p style={{ marginBottom: '12px' }}>
                We collect information you provide directly, including your name, email, profile information, and content you upload. We also collect usage data to improve our services.
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>2. How We Use Your Information</h4>
              <p style={{ marginBottom: '12px' }}>
                We use your information to provide and improve our services, communicate with you, personalize your experience, and ensure platform security.
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>3. Information Sharing</h4>
              <p style={{ marginBottom: '12px' }}>
                We do not sell your personal information. We may share data with service providers who help us operate the platform, and when required by law.
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>4. Data Security</h4>
              <p style={{ marginBottom: '12px' }}>
                We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>5. Your Rights</h4>
              <p style={{ marginBottom: '12px' }}>
                You have the right to access, correct, or delete your personal data. You can manage your privacy settings in your account preferences.
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>6. Cookies</h4>
              <p style={{ marginBottom: '12px' }}>
                We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content.
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px', marginTop: '20px' }}>7. Contact Us</h4>
              <p style={{ marginBottom: '12px' }}>
                For privacy-related inquiries, contact us at <span style={{ color: '#00C2FF' }}>privacy@webstar.bio</span>
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowFeedbackModal(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              background: '#111111',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '24px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF' }}>Send Feedback</h2>
              <button 
                onClick={() => setShowFeedbackModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '16px' }}>
              We'd love to hear your thoughts, suggestions, or report any issues you've encountered.
            </p>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us what you think..."
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                marginBottom: '16px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.5)';
                e.currentTarget.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.3)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setFeedbackText('');
                  setShowFeedbackModal(false);
                }}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                disabled={feedbackSubmitting || !feedbackText.trim()}
                style={{
                  padding: '10px 20px',
                  background: feedbackSubmitting || !feedbackText.trim() ? 'rgba(0, 194, 255, 0.3)' : '#00C2FF',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: feedbackSubmitting || !feedbackText.trim() ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!feedbackSubmitting && feedbackText.trim()) {
                    e.currentTarget.style.background = '#0099CC';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!feedbackSubmitting && feedbackText.trim()) {
                    e.currentTarget.style.background = '#00C2FF';
                  }
                }}
              >
                {feedbackSubmitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
