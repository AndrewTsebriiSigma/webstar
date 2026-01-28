'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { settingsAPI } from '@/lib/api';

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
  
  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

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
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      if (step === 'loading') {
        initiate2FA();
      }
    } else {
      setIsVisible(false);
      setIsClosing(false);
      setStep('loading');
      setVerificationCode('');
      setQrCode('');
      setSecret('');
    }
  }, [isOpen]);

  // Animated close handler
  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Backdrop with animation */}
      <div 
        className={`bottom-slider-backdrop ${isVisible ? 'entering' : 'exiting'}`}
        onClick={handleClose}
      />
      
      {/* Bottom Slider Content with animation */}
      <div 
        className={`bottom-slider-content ${isVisible ? 'entering' : 'exiting'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - 55px consistent */}
        <div 
          className="flex items-center justify-between flex-shrink-0"
          style={{ 
            height: '55px',
            padding: '0 16px',
            background: 'rgba(20, 20, 20, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <span style={{ fontSize: '17px', fontWeight: 600, color: '#FFFFFF' }}>Enable 2FA</span>
          <button
            onClick={handleClose}
            className="flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ width: '28px', height: '28px' }}
          >
            <XMarkIcon style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.6)' }} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'loading' && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-cyan-500 mb-4"></div>
              <p className="text-gray-400">Setting up 2FA...</p>
            </div>
          )}

          {step === 'scan' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-300 mb-4">
                  Scan this QR code with your authenticator app (Microsoft Authenticator, Google Authenticator, Authy, etc.)
                </p>
                
                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl inline-block mb-4">
                  <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
                </div>

                {/* Manual Entry */}
                <div className="bg-gray-800 rounded-xl p-4 mb-4">
                  <p className="text-gray-400 text-sm mb-2">Or enter this code manually:</p>
                  <code className="text-cyan-400 font-mono text-sm break-all select-all">
                    {secret}
                  </code>
                </div>

                <button
                  onClick={() => setStep('verify')}
                  className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition"
                >
                  I've Scanned the Code
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-6">
              <div>
                <p className="text-gray-300 mb-4 text-center">
                  Enter the 6-digit code from your authenticator app to verify:
                </p>
                
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
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('scan')}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-750 text-white font-semibold rounded-xl transition"
                  disabled={verifying}
                >
                  Back
                </button>
                <button
                  onClick={verify2FA}
                  disabled={verificationCode.length !== 6 || verifying}
                  className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div 
          className="flex-shrink-0"
          style={{ 
            padding: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
          }}
        >
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="#00C2FF">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)', lineHeight: '1.4' }}>
              Two-factor authentication adds an extra layer of security to your account.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

