'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightOnRectangleIcon, XMarkIcon, ChevronRightIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
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
      transition: 'all 0.15s ease',
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.background = 'rgba(0, 194, 255, 0.08)';
        e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.15)';
      }
    }}
    onMouseLeave={(e) => {
      if (onClick) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
      }
    }}
  >
    {children}
    {hasChevron && (
      <ChevronRightIcon style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.3)' }} />
    )}
  </div>
);

// Universal Settings Sub-Modal - Instagram-style clean design
const SettingsSubModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  rightAction,
  rightActionLabel = 'Done',
  rightActionDisabled = false,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  rightAction?: () => void;
  rightActionLabel?: string;
  rightActionDisabled?: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else if (isVisible) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop - subtle tint + blur */}
      <div 
        className={`bottom-slider-backdrop ${!isClosing ? 'entering' : 'exiting'}`}
        onClick={onClose}
        style={{
          background: 'rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />
      
      {/* Content - Clean solid background, no blur */}
      <div 
        className={`bottom-slider-content ${!isClosing ? 'entering' : 'exiting'}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111111',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
      >
        {/* Header - Instagram style: back arrow, centered title, optional action */}
        <div 
          className="flex items-center justify-between sticky top-0 z-10"
          style={{
            height: '55px',
            background: '#111111',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            padding: '0 16px',
          }}
        >
          {/* Back arrow */}
          <button
            onClick={onClose}
            className="transition-opacity hover:opacity-70"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '44px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <svg 
              className="w-[18px] h-[18px]" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth={2} 
              viewBox="0 0 24 24"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Centered Title */}
          <h2 className="text-[17px] font-semibold text-white absolute left-1/2 transform -translate-x-1/2">
            {title}
          </h2>
          
          {/* Right action button (optional) */}
          <div style={{ width: '44px', display: 'flex', justifyContent: 'flex-end' }}>
            {rightAction && (
              <button
                onClick={rightAction}
                disabled={rightActionDisabled}
                className="transition-opacity"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: rightActionDisabled ? 'not-allowed' : 'pointer',
                  color: rightActionDisabled ? 'rgba(255, 255, 255, 0.3)' : '#00C2FF',
                  fontSize: '16px',
                  fontWeight: 600,
                  opacity: rightActionDisabled ? 0.5 : 1,
                }}
              >
                {rightActionLabel}
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {children}
        </div>
      </div>
    </>
  );
};

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
  
  // Username modal state for header "Done" button
  const [usernameValid, setUsernameValid] = useState(false);
  const [usernameSubmitFn, setUsernameSubmitFn] = useState<(() => Promise<void>) | null>(null);
  
  // Email modal state for header button
  const [emailValid, setEmailValid] = useState(false);
  const [emailSubmitFn, setEmailSubmitFn] = useState<(() => Promise<void>) | null>(null);
  const [emailActionLabel, setEmailActionLabel] = useState('Next');
  
  // Password modal state for header "Done" button
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordSubmitFn, setPasswordSubmitFn] = useState<(() => Promise<void>) | null>(null);
  
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
        background: '#111111',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Header - matches profile page top-nav */}
      <header 
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: '55px',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(17, 17, 17, 0.85)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Close button - absolute left, matches modal close style */}
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{
            position: 'absolute',
            left: '16px',
            width: '32px',
            height: '32px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <XMarkIcon style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.6)' }} />
        </button>
        <h1 style={{ fontSize: '17px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
          Settings
        </h1>
      </header>

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
              {/* Feedback Button - Blue background for importance */}
              <button
                onClick={() => setShowFeedbackModal(true)}
                style={{
                  width: '100%',
                  height: '55px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '0 16px',
                  background: 'rgba(0, 194, 255, 0.12)',
                  border: '1px solid rgba(0, 194, 255, 0.25)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 194, 255, 0.18)';
                  e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 194, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.25)';
                }}
              >
                <ChatBubbleLeftRightIcon style={{ width: '20px', height: '20px', color: '#00C2FF' }} />
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#00C2FF' }}>Feedback</span>
              </button>

              {/* Log Out Button */}
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
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
              >
                <ArrowRightOnRectangleIcon style={{ width: '20px', height: '20px', color: '#EF4444' }} />
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#EF4444' }}>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Username Modal - Instagram style with header Done button */}
      <SettingsSubModal 
        isOpen={activeSection === 'username'}
        onClose={() => setActiveSection(null)}
        title="Username"
        rightAction={usernameSubmitFn ? () => usernameSubmitFn() : undefined}
        rightActionLabel="Done"
        rightActionDisabled={!usernameValid}
      >
        <ChangeUsernameSection 
          onBack={() => setActiveSection(null)} 
          onValidChange={(isValid, submitFn) => {
            setUsernameValid(isValid);
            setUsernameSubmitFn(() => submitFn);
          }}
        />
      </SettingsSubModal>

      {/* Email Modal - Instagram style with header action button */}
      <SettingsSubModal 
        isOpen={activeSection === 'email'}
        onClose={() => setActiveSection(null)}
        title="Email"
        rightAction={emailSubmitFn ? () => emailSubmitFn() : undefined}
        rightActionLabel={emailActionLabel}
        rightActionDisabled={!emailValid}
      >
        <ChangeEmailSection 
          onBack={() => setActiveSection(null)} 
          onValidChange={(isValid, submitFn, label) => {
            setEmailValid(isValid);
            setEmailSubmitFn(() => submitFn);
            setEmailActionLabel(label);
          }}
        />
      </SettingsSubModal>

      {/* Password Modal - Instagram style with header Done button */}
      <SettingsSubModal 
        isOpen={activeSection === 'password'}
        onClose={() => setActiveSection(null)}
        title="Password"
        rightAction={passwordSubmitFn ? () => passwordSubmitFn() : undefined}
        rightActionLabel="Done"
        rightActionDisabled={!passwordValid}
      >
        <ChangePasswordSection 
          onBack={() => setActiveSection(null)} 
          onValidChange={(isValid, submitFn) => {
            setPasswordValid(isValid);
            setPasswordSubmitFn(() => submitFn);
          }}
        />
      </SettingsSubModal>

      {/* Terms Modal */}
      <SettingsSubModal 
        isOpen={activeSection === 'terms'}
        onClose={() => setActiveSection(null)}
        title="Terms of Service"
      >
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
      </SettingsSubModal>

      {/* Privacy Policy Modal */}
      <SettingsSubModal 
        isOpen={activeSection === 'privacy-policy'}
        onClose={() => setActiveSection(null)}
        title="Privacy Policy"
      >
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
      </SettingsSubModal>

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

      {/* Feedback Modal - Bottom slider pattern */}
      <SettingsSubModal 
        isOpen={showFeedbackModal}
        onClose={() => {
          setFeedbackText('');
          setShowFeedbackModal(false);
        }}
        title="Feedback"
        rightAction={handleFeedbackSubmit}
        rightActionLabel={feedbackSubmitting ? 'Sending...' : 'Send'}
        rightActionDisabled={feedbackSubmitting || !feedbackText.trim()}
      >
        <div>
          {/* Description centered */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(255, 255, 255, 0.6)', 
              lineHeight: 1.5
            }}>
              We'd love to hear your thoughts, suggestions, or report any issues you've encountered.
            </p>
          </div>

          {/* Textarea with counter inside */}
          <div style={{ position: 'relative' }}>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Tell us what you think..."
              rows={6}
              maxLength={1000}
              style={{
                width: '100%',
                padding: '14px 16px',
                paddingBottom: '32px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.95)',
                fontSize: '16px',
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.5)';
                e.currentTarget.style.boxShadow = '0 0 0 1px rgba(0, 194, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {/* Counter inside bottom-right */}
            <span style={{ 
              position: 'absolute',
              bottom: '10px',
              right: '14px',
              fontSize: '12px', 
              color: 'rgba(255, 255, 255, 0.35)'
            }}>
              {feedbackText.length}/1000
            </span>
          </div>
        </div>
      </SettingsSubModal>
    </div>
  );
}
