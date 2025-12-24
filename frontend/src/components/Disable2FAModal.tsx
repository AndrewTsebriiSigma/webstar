'use client';

import { useState } from 'react';
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
    setVerificationCode('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-red-800/50">
        {/* Header */}
        <div className="bg-red-900/20 border-b border-red-800/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold text-white">Disable Two-Factor Authentication</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-3 bg-gray-800 hover:bg-gray-750 text-white font-semibold rounded-xl transition"
              disabled={disabling}
            >
              Cancel
            </button>
            <button
              onClick={disable2FA}
              disabled={verificationCode.length !== 6 || disabling}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disabling ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

