'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string;
  secret: string;
  onVerify: (code: string) => Promise<void>;
}

export default function TwoFactorSetupModal({
  isOpen,
  onClose,
  qrCode,
  secret,
  onVerify,
}: TwoFactorSetupModalProps) {
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      setIsClosing(false);
      setCode('');
    }
  }, [isOpen]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setVerifying(true);
    try {
      await onVerify(code);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setVerifying(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Step 1 */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <span className="text-cyan-400 font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold text-white">
                Scan QR Code
              </h3>
            </div>
            <p className="text-gray-400 text-sm mb-4 ml-11">
              Open your authenticator app (Microsoft Authenticator, Google Authenticator, Authy, etc.) and scan this QR code:
            </p>
            <div className="flex justify-center p-4 bg-white rounded-xl">
              {qrCode && (
                <img
                  src={qrCode}
                  alt="2FA QR Code"
                  className="w-48 h-48"
                />
              )}
            </div>
          </div>

          {/* Manual Entry */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-2">
              Can't scan the code? Enter this key manually:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-900 px-3 py-2 rounded-lg text-cyan-400 font-mono text-sm">
                {secret}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(secret);
                  toast.success('Secret copied to clipboard');
                }}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white transition"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <span className="text-cyan-400 font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold text-white">
                Enter Verification Code
              </h3>
            </div>
            <p className="text-gray-400 text-sm mb-4 ml-11">
              Enter the 6-digit code from your authenticator app:
            </p>
            <div className="ml-11">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-center text-2xl font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
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
            className="px-5 py-2.5 rounded-xl font-medium transition-all text-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.8)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={code.length !== 6 || verifying}
            className="flex-1 px-6 py-2.5 rounded-xl font-semibold transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: verifying || code.length !== 6 ? 'rgba(0, 194, 255, 0.4)' : '#00C2FF',
              color: '#FFFFFF'
            }}
          >
            {verifying ? 'Verifying...' : 'Enable 2FA'}
          </button>
        </div>
      </div>
    </>
  );
}

