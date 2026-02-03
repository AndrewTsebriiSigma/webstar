'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { XMarkIcon, ChevronRightIcon, ArrowRightOnRectangleIcon, ClipboardIcon, CheckIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { settingsAPI, profileAPI, authAPI } from '@/lib/api';
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

// Row item component - matches profile page style
const RowItem = ({ children, isFirst, isLast, onClick, hasChevron = false }: { children: React.ReactNode; isFirst?: boolean; isLast?: boolean; onClick?: () => void; hasChevron?: boolean }) => (
  <div
    onClick={onClick}
    style={{
      height: '55px',
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'rgba(255, 255, 255, 0.06)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: isFirst ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: isFirst && isLast ? '16px' : isFirst ? '16px 16px 0 0' : isLast ? '0 0 16px 16px' : '0',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'background 0.15s ease'
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
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

// Glass card container - matches profile page style
const GlassCard = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
  }}>
    {children}
  </div>
);

// Bottom Slider Component for Settings Sections
const BottomSlider = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  zIndex = 50,
  fullWidth = false
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode;
  zIndex?: number;
  fullWidth?: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      setIsClosing(true);
      setTimeout(() => setIsClosing(false), 300);
    }
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`bottom-slider-backdrop ${isVisible ? 'entering' : 'exiting'}`}
        onClick={onClose}
        style={{ zIndex: zIndex }}
      />
      
      {/* Bottom Slider Content */}
      <div 
        className={`bottom-slider-content ${fullWidth ? 'bottom-slider-content-full-width' : ''} ${isVisible ? 'entering' : 'exiting'}`}
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: zIndex + 1 }}
      >
        {/* Header - Fixed 55px height */}
        <div 
          className="flex items-center justify-between flex-shrink-0"
          style={{ 
            height: '55px',
            padding: '0 20px',
            background: '#111111',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <span style={{ fontSize: '20px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)' }}>{title}</span>
          <button 
            onClick={onClose} 
            className="flex items-center justify-center hover:opacity-70 transition-opacity" 
            style={{ width: '32px', height: '32px' }}
          >
            <XMarkIcon style={{ width: '24px', height: '24px', color: 'rgba(255, 255, 255, 0.5)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '20px 16px' }}>
          {children}
        </div>
      </div>
    </>
  );
};

// Change Email Section Component - Redesigned to match profile page style
export const ChangeEmailSection = ({ 
  onBack,
  onValidChange 
}: { 
  onBack: () => void;
  onValidChange?: (isValid: boolean, submitFn: () => Promise<void>, label: string) => void;
}) => {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRequestChange = async () => {
    if (!newEmail || !password || loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await settingsAPI.requestEmailChange(newEmail, password);
      if (response.data) {
        toast.success('Code sent!');
        setStep('verify');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyChange = async () => {
    if (!verificationCode || loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await settingsAPI.verifyEmailChange(verificationCode);
      if (response.data) {
        setSuccess(true);
        toast.success('Email updated!');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.email = response.data.new_email || newEmail;
        localStorage.setItem('user', JSON.stringify(user));
        setTimeout(() => onBack(), 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  // Notify parent of validity changes for header button
  const isValidRequest = newEmail.length > 0 && password.length > 0 && !loading;
  const isValidVerify = verificationCode.length === 6 && !loading;
  
  useEffect(() => {
    if (onValidChange) {
      if (step === 'request') {
        onValidChange(isValidRequest, handleRequestChange, 'Next');
      } else {
        onValidChange(isValidVerify, handleVerifyChange, 'Confirm');
      }
    }
  }, [step, isValidRequest, isValidVerify, newEmail, password, verificationCode]);

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
          style={{ background: 'rgba(52, 199, 89, 0.1)' }}>
          <svg className="w-8 h-8 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px' }}>Done!</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Your email has been updated.</p>
      </div>
    );
  }

  // Step 2: Verify Code
  if (step === 'verify') {
    return (
      <div>
        {/* Context */}
        <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px' }}>
          Enter the code sent to <span style={{ color: '#00C2FF' }}>{newEmail}</span>
        </p>
        
        {error && (
          <p style={{ fontSize: '13px', color: '#FF453A', marginBottom: '12px' }}>{error}</p>
        )}

        {/* Code input - matching username style */}
            <div style={{
          background: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
          marginBottom: '16px'
            }}>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
            autoFocus
              maxLength={6}
              style={{
                width: '100%',
              padding: '14px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '20px',
                fontWeight: 600,
                letterSpacing: '8px',
                textAlign: 'center',
                outline: 'none'
              }}
            />
          </div>

        {/* Change email link */}
          <button
            type="button"
            onClick={() => { setStep('request'); setError(''); setVerificationCode(''); }}
            style={{
              background: 'transparent',
              border: 'none',
            color: '#00C2FF',
              fontSize: '14px',
              cursor: 'pointer',
            padding: 0
            }}
          >
          Change email address
          </button>
      </div>
    );
  }

  // Step 1: Request Email Change
  return (
    <div>
      {error && (
        <p style={{ fontSize: '13px', color: '#FF453A', marginBottom: '12px' }}>{error}</p>
      )}

      {/* Email input - matching username style */}
          <div style={{
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
        marginBottom: '12px'
          }}>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          placeholder="New email address"
          autoFocus
            style={{
              width: '100%',
            padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>

      {/* Password input - matching username style */}
          <div style={{
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '12px'
          }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          placeholder="Current password"
            style={{
              width: '100%',
            padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '16px',
              outline: 'none'
            }}
          />
          </div>
    </div>
  );
};

// Change Username Section Component - Onboarding style with live preview
export const ChangeUsernameSection = ({ 
  onBack,
  onSubmit,
  onValidChange 
}: { 
  onBack: () => void;
  onSubmit?: () => void;
  onValidChange?: (isValid: boolean, submitFn: () => Promise<void>) => void;
}) => {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  // Pre-fill with current username
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Check username availability
  useEffect(() => {
    if (!newUsername || newUsername.length < 3) {
      setIsAvailable(null);
      setError('');
      return;
    }

    // If same as current, no need to check - it's "available" (no change)
    if (newUsername.toLowerCase() === user?.username?.toLowerCase()) {
      setIsAvailable(null);
      setError('');
      return;
    }

    const checkAvailability = async () => {
      setCheckingAvailability(true);
      setError('');
      try {
        const response = await authAPI.checkUsername(newUsername);
        setIsAvailable(response.data.available);
      } catch (err: any) {
        setIsAvailable(false);
        setError(err.response?.data?.detail || 'Failed to check');
      } finally {
        setCheckingAvailability(false);
      }
    };

    const timeoutId = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [newUsername, user?.username]);

  const handleSubmit = async () => {
    if (!newUsername.trim() || isAvailable !== true || loading) return;

    setLoading(true);
    setError('');

    try {
      const response = await settingsAPI.changeUsername(newUsername);
      if (response.data) {
        setSuccess(true);
        toast.success('Username updated!');
        
        if (user) {
          const updatedUser = { ...user, username: response.data.username };
          updateUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        setTimeout(() => {
          router.push(`/${response.data.username}`);
          onBack();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  // Notify parent of validity changes for header "Done" button
  const isValid = isAvailable === true && newUsername.length >= 3 && !checkingAvailability && !loading;
  useEffect(() => {
    if (onValidChange) {
      onValidChange(isValid, handleSubmit);
    }
  }, [isValid, newUsername]);

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
          style={{ background: 'rgba(52, 199, 89, 0.1)' }}>
          <svg className="w-8 h-8 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px' }}>Done!</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Redirecting to your profile...</p>
      </div>
    );
  }

  // Clean: just username input + live preview below
  return (
    <div>
      {/* Simple username input - pre-filled with current */}
          <div style={{
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden'
          }}>
        {/* Input - pre-filled with current username */}
            <input
              type="text"
              value={newUsername}
              onChange={(e) => {
            const value = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
            if (value.length <= 15) {
                setNewUsername(value);
            }
              }}
          placeholder="username"
          autoFocus
              style={{
            flex: 1,
            padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '16px',
                outline: 'none'
              }}
          maxLength={15}
        />
        
        {/* Inline status indicator */}
        <div style={{ paddingRight: '12px', display: 'flex', alignItems: 'center' }}>
          {checkingAvailability ? (
            <div 
              className="animate-spin rounded-full border-2 border-transparent"
              style={{ 
                width: '18px', 
                height: '18px',
                borderColor: '#00C2FF',
                borderTopColor: 'transparent'
              }}
            />
          ) : newUsername.length >= 3 && newUsername !== user?.username ? (
            isAvailable === true ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#30D158">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : isAvailable === false ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#FF453A">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : null
          ) : null}
          </div>
        </div>

      {/* Live preview - shows the full URL as they type */}
      {newUsername && (
        <div style={{ 
          marginTop: '16px',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontSize: '13px', 
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '4px'
          }}>
            Your profile link
          </p>
          <p style={{ 
            fontSize: '15px',
            color: '#00C2FF',
            fontWeight: 500
          }}>
            webstar.bio/{newUsername}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p style={{ fontSize: '13px', color: '#FF453A', marginTop: '12px', textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  );
};

// Change Password Section Component
export const ChangePasswordSection = ({ 
  onBack,
  onValidChange 
}: { 
  onBack: () => void;
  onValidChange?: (isValid: boolean, submitFn: () => Promise<void>) => void;
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    
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
        toast.success('Password updated!');
        setTimeout(() => onBack(), 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Notify parent of validity changes for header button
  const isValid = currentPassword.length > 0 && newPassword.length >= 8 && confirmPassword.length > 0 && newPassword === confirmPassword && !loading;
  
  useEffect(() => {
    if (onValidChange) {
      onValidChange(isValid, handleSubmit);
    }
  }, [isValid, currentPassword, newPassword, confirmPassword]);

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" 
          style={{ background: 'rgba(52, 199, 89, 0.1)' }}>
          <svg className="w-8 h-8 text-[#34C759]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.95)', marginBottom: '8px' }}>Done!</h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Your password has been updated.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Description */}
      <p style={{ 
        fontSize: '14px', 
        color: 'rgba(255, 255, 255, 0.5)', 
        lineHeight: 1.5,
        marginBottom: '20px' 
      }}>
        Your password must be at least 8 characters.
      </p>
      
      {error && (
        <p style={{ fontSize: '13px', color: '#FF453A', marginBottom: '12px' }}>{error}</p>
      )}

      {/* Current Password - matching username style */}
          <div style={{
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
        marginBottom: '12px'
          }}>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          autoFocus
            style={{
              width: '100%',
            padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>

      {/* New Password - matching username style */}
          <div style={{
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
        marginBottom: '12px'
          }}>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password"
            style={{
              width: '100%',
            padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>

      {/* Confirm Password - matching username style */}
          <div style={{
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
        marginBottom: '16px'
          }}>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
            style={{
              width: '100%',
            padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.95)',
            fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>

      {/* Forgot password link */}
        <button
        type="button"
        onClick={() => {
          toast('Password reset feature coming soon', { icon: '🔐' });
        }}
          style={{
          background: 'transparent',
            border: 'none',
          color: '#00C2FF',
          fontSize: '14px',
          cursor: 'pointer',
          padding: 0
          }}
        >
        Forgot your password?
        </button>
    </div>
  );
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
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
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Reset activeSection when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      setActiveSection(null);
      setIsVisible(false);
      setIsClosing(true);
      setTimeout(() => setIsClosing(false), 300);
    } else {
      // Explicitly reset activeSection when modal opens to prevent flash
      setActiveSection(null);
      setIsClosing(false);
      requestAnimationFrame(() => setIsVisible(true));
    }
  }, [isOpen]);

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
      onClose();
    } catch (error) {
      toast.error('Failed to open email client');
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  // Icons
  const AccountIcon = <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
  const NotifIcon = <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
  const LegalIcon = <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  const ActionIcon = <svg style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;

  return (
    <>
      {/* Main Settings Modal - Bottom Slider */}
      {activeSection === null && (
        <BottomSlider
          isOpen={isOpen}
          onClose={onClose}
          title="Settings"
          fullWidth={true}
        >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* ACCOUNT Section */}
                <div>
                  <SectionHeader icon={AccountIcon} label="ACCOUNT" />
                  <GlassCard>
                    <RowItem isFirst onClick={() => setActiveSection('email')} hasChevron>
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

            {/* NOTIFICATIONS Section - Only Email */}
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
                  <GlassCard>
                    <RowItem isFirst onClick={() => setShowFeedbackModal(true)} hasChevron>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ChatBubbleLeftRightIcon style={{ width: '18px', height: '18px', color: 'rgba(255, 255, 255, 0.7)' }} />
                        <span style={{ fontSize: '15px', fontWeight: 400, color: 'rgba(255, 255, 255, 0.95)' }}>Feedback</span>
                      </div>
                    </RowItem>
                    <RowItem isLast>
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
                    </RowItem>
                  </GlassCard>
                </div>
              </div>
        </BottomSlider>
      )}

      {/* Email Section - Bottom Slider */}
      <BottomSlider
        isOpen={activeSection === 'email'}
        onClose={() => setActiveSection(null)}
        title="Change Email"
        zIndex={52}
        fullWidth={true}
      >
                  <ChangeEmailSection onBack={() => setActiveSection(null)} />
      </BottomSlider>

      {/* Password Section - Bottom Slider */}
      <BottomSlider
        isOpen={activeSection === 'password'}
        onClose={() => setActiveSection(null)}
        title="Change Password"
        zIndex={52}
        fullWidth={true}
      >
                  <ChangePasswordSection onBack={() => setActiveSection(null)} />
      </BottomSlider>

      {/* Terms Section - Bottom Slider */}
      <BottomSlider
        isOpen={activeSection === 'terms'}
        onClose={() => setActiveSection(null)}
        title="Terms of Service"
        zIndex={52}
        fullWidth={true}
      >
                  <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
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
      </BottomSlider>

      {/* Privacy Policy Section - Bottom Slider */}
      <BottomSlider
        isOpen={activeSection === 'privacy-policy'}
        onClose={() => setActiveSection(null)}
        title="Privacy Policy"
        zIndex={52}
        fullWidth={true}
      >
                  <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
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
      </BottomSlider>

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
            zIndex: 60,
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
                <XMarkIcon style={{ width: '20px', height: '20px', color: '#FFFFFF' }} />
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
    </>
  );
}
