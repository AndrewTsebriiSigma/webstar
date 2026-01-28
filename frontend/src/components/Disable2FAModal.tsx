'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { settingsAPI } from '@/lib/api';

interface Disable2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function Disable2FAModal({ isOpen, onClose, onSuccess }: Disable2FAModalProps) {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [disabling, setDisabling] = useState(false);
  
  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      setIsClosing(false);
      setVerificationCode('');
    }
  }, [isOpen]);

  const disable2FA = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setDisabling(true);
    try {
      await settingsAPI.disable2FA(verificationCode);
      toast.success('2FA disabled successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      toast.error(error.response?.data?.detail || 'Invalid verification code');
    } finally {
      setDisabling(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
    setTimeout(() => {
      setIsClosing(false);
      setVerificationCode('');
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
            borderBottom: '1px solid rgba(255, 100, 100, 0.2)'
          }}
        >
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon style={{ width: '20px', height: '20px', color: '#FF453A' }} />
            <span style={{ fontSize: '17px', fontWeight: 600, color: '#FFFFFF' }}>Disable 2FA</span>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ width: '28px', height: '28px' }}
          >
            <XMarkIcon style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.6)' }} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Warning */}
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold mb-1">Warning</p>
                <p className="text-gray-300 text-sm">
                  Disabling 2FA will make your account less secure. You'll only need your password to log in.
                </p>
              </div>
            </div>
          </div>

          {/* Verification Input */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm font-medium">
              Enter your 6-digit authenticator code to confirm:
            </label>
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
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Actions Footer */}
        <div 
          className="flex-shrink-0 flex gap-3 p-4"
          style={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
          }}
        >
          <button
            onClick={handleClose}
            disabled={disabling}
            className="px-5 py-2.5 rounded-xl font-medium transition-all text-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.8)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={disable2FA}
            disabled={verificationCode.length !== 6 || disabling}
            className="flex-1 px-6 py-2.5 rounded-xl font-semibold transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: disabling ? 'rgba(255, 69, 58, 0.4)' : '#FF453A',
              color: '#FFFFFF'
            }}
          >
            {disabling ? 'Disabling...' : 'Disable 2FA'}
          </button>
        </div>
      </div>
    </>
  );
}

