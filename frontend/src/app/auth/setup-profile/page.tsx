'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SetupProfilePage() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    // Get user data from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      toast.error('Please sign in first');
      router.push('/auth/login');
      return;
    }

    const user = JSON.parse(userStr);
    
    // If profile is already set up, redirect
    if (user.profile_setup_completed) {
      router.push('/onboarding');
      return;
    }

    // Pre-fill name from Google if available
    if (user.full_name) {
      setFullName(user.full_name);
    }
    
    // Suggest username from email if available, otherwise generate a default
    if (user.email) {
      const suggestedUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      setUsername(suggestedUsername || `user_${Date.now()}`);
    } else {
      setUsername(`user_${Date.now()}`);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Name is required');
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      toast.error('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/setup-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          full_name: fullName
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to set up profile');
      }

      const userData = await response.json();

      // Update BOTH localStorage AND React state via AuthContext
      // This ensures the username is synced across all components
      const updatedUserData = {
        ...userData,
        profile_setup_completed: true
      };
      updateUser(updatedUserData);

      toast.success('Profile set up successfully!');
      
      // Use window.location.href to force a full page load
      // This ensures AuthContext re-reads from localStorage with the correct username
      window.location.href = '/onboarding';
    } catch (error: any) {
      console.error('Profile setup error:', error);
      toast.error(error.message || 'Failed to set up profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#111111' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              WebSTAR
            </h1>
          </Link>
          <h2 className="text-2xl font-bold text-white mb-2">Complete Your Profile</h2>
          <p className="text-gray-400">Choose your username and display name</p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                Username *
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                disabled={loading}
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]{3,20}"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: '16px' }}
              />
              <p className="text-xs text-gray-500 mt-1">3-20 characters, letters, numbers, and underscores only</p>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                disabled={loading}
                maxLength={50}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !fullName.trim()}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up...' : 'Continue'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          You can change these later in your profile settings
        </p>
      </div>
    </div>
  );
}

