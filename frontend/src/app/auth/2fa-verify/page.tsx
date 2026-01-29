'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function TwoFactorVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updateUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isOAuthLogin, setIsOAuthLogin] = useState(false);

  useEffect(() => {
    const token = searchParams.get('temp_token');
    const userId = searchParams.get('user_id');
    const username = searchParams.get('username');
    const email = searchParams.get('email');
    const fullName = searchParams.get('full_name');
    const onboardingCompleted = searchParams.get('onboarding_completed') === 'true';
    const profileSetupCompleted = searchParams.get('profile_setup_completed') === 'true';
    const oauthLogin = searchParams.get('oauth_login') === 'true';

    if (!token || !userId || !email) {
      toast.error('Invalid verification link');
      router.push('/auth/login');
      return;
    }

    setTempToken(token);
    setIsOAuthLogin(oauthLogin);
    setUserInfo({
      id: parseInt(userId),
      username,
      email,
      full_name: fullName || '',
      onboarding_completed: onboardingCompleted,
      profile_setup_completed: profileSetupCompleted
    });
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      toast.error('Please enter verification code');
      return;
    }

    if (code.length !== 6) {
      toast.error('Code must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verify2FALogin(tempToken, code);
      
      // Store tokens and user data
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      
      const userData = response.data.user;
      const userObject = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        full_name: userData.full_name || '',
        onboarding_completed: userData.onboarding_completed,
        profile_setup_completed: userData.profile_setup_completed,
        is_active: userData.is_active,
        created_at: userData.created_at
      };
      
      localStorage.setItem('user', JSON.stringify(userObject));
      
      // UPDATE AUTHCONTEXT STATE - Critical for immediate state sync!
      updateUser(userObject);

      toast.success('Successfully verified!');

      // Redirect based on setup status (same logic as OAuth callback)
      if (isOAuthLogin && !userData.profile_setup_completed) {
        router.push('/auth/setup-profile');
      } else if (!userData.onboarding_completed) {
        router.push('/onboarding');
      } else {
        router.push(`/${userData.username}`);
      }
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail;
      const errorMessage = typeof errorDetail === 'string' ? errorDetail : (errorDetail?.message || 'Invalid verification code');
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#111111' }}>
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Two-Factor Authentication</h1>
            <p className="text-gray-400">Enter the 6-digit code from your authenticator app</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-center text-2xl tracking-widest"
                style={{ fontSize: '24px', letterSpacing: '0.5em' }}
                disabled={loading}
                autoComplete="off"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/auth/login')}
              className="text-sm text-gray-400 hover:text-cyan-400 transition"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TwoFactorVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    }>
      <TwoFactorVerifyContent />
    </Suspense>
  );
}

