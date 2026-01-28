'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { settingsAPI } from '@/lib/api';

// Copy Button Component
const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: copied ? 'rgba(52, 199, 89, 0.1)' : 'rgba(0, 194, 255, 0.1)',
        border: `1px solid ${copied ? 'rgba(52, 199, 89, 0.3)' : 'rgba(0, 194, 255, 0.3)'}`,
        borderRadius: '8px',
        color: copied ? '#34C759' : '#00C2FF',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
    >
      {copied ? (
        <>
          <CheckIcon style={{ width: '14px', height: '14px' }} />
          <span>Copied</span>
        </>
      ) : (
        <>
          <ClipboardIcon style={{ width: '14px', height: '14px' }} />
          <span>Copy</span>
        </>
      )}
    </button>
  );
};

interface Setup2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function Setup2FAModal({ isOpen, onClose, onSuccess }: Setup2FAModalProps) {
  const [step, setStep] = useState<'loading' | 'scan' | 'verify'>('loading');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [verifying, setVerifying] = useState(false);

  const initiate2FA = async () => {
    try {
      setStep('loading');
      const response = await settingsAPI.enable2FA();
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
      setStep('scan');
    } catch (error: any) {
      console.error('Error initiating 2FA:', error);
      toast.error(error.response?.data?.detail || 'Failed to initiate 2FA setup');
      onClose();
    }
  };

  const verify2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setVerifying(true);
    try {
      await settingsAPI.verify2FASetup(verificationCode);
      toast.success('2FA enabled successfully! 🎉');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error verifying 2FA:', error);
      toast.error(error.response?.data?.detail || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen && step === 'loading') {
      initiate2FA();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('loading');
      setVerificationCode('');
      setQrCode('');
      setSecret('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="bottom-slider-backdrop entering"
        onClick={onClose}
        style={{ zIndex: 54 }}
      />

      {/* Bottom Slider Content */}
      <div 
        className="bottom-slider-content entering"
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 55 }}
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
          <span style={{ fontSize: '20px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)' }}>Enable Two-Factor Authentication</span>
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
          {step === 'loading' && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-rgba(255,255,255,0.1) border-t-[#00C2FF] mb-4"></div>
              <p style={{ color: 'rgba(255, 255, 255, 0.65)' }}>Setting up 2FA...</p>
            </div>
          )}

          {step === 'scan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '14px', marginBottom: '20px' }}>
                  Scan this QR code with your authenticator app (Microsoft Authenticator, Google Authenticator, Authy, etc.)
                </p>
                
                {/* QR Code */}
                <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '20px' }}>
                  <img src={qrCode} alt="2FA QR Code" style={{ width: '256px', height: '256px' }} />
                </div>

                {/* Manual Entry */}
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.06)', 
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px', 
                  padding: '16px', 
                  marginBottom: '20px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px' }}>Or enter this code manually:</p>
                    <CopyButton text={secret} />
                  </div>
                  <code style={{ 
                    color: '#00C2FF', 
                    fontFamily: 'monospace', 
                    fontSize: '13px', 
                    wordBreak: 'break-all',
                    userSelect: 'all',
                    display: 'block'
                  }}>
                    {secret}
                  </code>
                </div>

                <button
                  onClick={() => setStep('verify')}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: '#00C2FF',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#33D1FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#00C2FF';
                  }}
                >
                  I've Scanned the Code
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
                  Enter the 6-digit code from your authenticator app to verify:
                </p>
                
                <div style={{ 
                  marginBottom: '20px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '2px'
                }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setVerificationCode(value);
                    }}
                    placeholder="000000"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontSize: '24px',
                      fontWeight: 600,
                      letterSpacing: '8px',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      outline: 'none'
                    }}
                    autoFocus
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setStep('scan')}
                  disabled={verifying}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    color: 'rgba(255, 255, 255, 0.95)',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: verifying ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    opacity: verifying ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!verifying) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                >
                  Back
                </button>
                <button
                  onClick={verify2FA}
                  disabled={verificationCode.length !== 6 || verifying}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: verificationCode.length !== 6 || verifying ? 'rgba(255, 255, 255, 0.1)' : '#00C2FF',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: verificationCode.length !== 6 || verifying ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (verificationCode.length === 6 && !verifying) {
                      e.currentTarget.style.background = '#33D1FF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (verificationCode.length === 6 && !verifying) {
                      e.currentTarget.style.background = '#00C2FF';
                    }
                  }}
                >
                  {verifying ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>

              {/* Info Footer */}
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.04)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <svg style={{ width: '20px', height: '20px', color: '#00C2FF', flexShrink: 0, marginTop: '2px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '13px', lineHeight: '1.5' }}>
                    Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

