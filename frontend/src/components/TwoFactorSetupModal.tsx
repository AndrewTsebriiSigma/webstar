'use client';

import { useState } from 'react';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Enable 2FA</h2>
            <p className="text-sm text-gray-400 mt-1">
              Secure your account with two-factor authentication
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleVerify}
              disabled={code.length !== 6 || verifying}
              className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition"
            >
              {verifying ? 'Verifying...' : 'Enable 2FA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

