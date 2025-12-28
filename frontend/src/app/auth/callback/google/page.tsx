'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = () => {
      // Get URL parameters
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const userId = searchParams.get('user_id');
      const username = searchParams.get('username');
      const email = searchParams.get('email');
      const onboardingCompleted = searchParams.get('onboarding_completed') === 'true';
      const error = searchParams.get('error');
      const errorMessage = searchParams.get('message');

      // Check for errors
      if (error) {
        toast.error(errorMessage || 'Authentication failed');
        router.push('/auth/login');
        return;
      }

      // Validate required parameters
      if (!accessToken || !refreshToken || !userId || !username || !email) {
        toast.error('Invalid authentication response');
        router.push('/auth/login');
        return;
      }

      // Store tokens and user data
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user', JSON.stringify({
        id: parseInt(userId),
        email,
        username,
        onboarding_completed: onboardingCompleted
      }));

      // Show success message
      toast.success('Welcome! Successfully signed in with Google');

      // Redirect based on onboarding status
      if (onboardingCompleted) {
        window.location.href = `/${username}`;
      } else {
        window.location.href = '/onboarding';
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing sign in...</p>
        <p className="text-gray-400 text-sm mt-2">Please wait while we set up your account</p>
      </div>
    </div>
  );
}

