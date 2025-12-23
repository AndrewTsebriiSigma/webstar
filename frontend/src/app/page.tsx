'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (!user.onboarding_completed) {
        router.push('/onboarding');
      } else {
        router.push(`/${user.username}`);
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00C2FF' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#111111' }}>
      {/* Hero Section */}
      <div className="relative">
        {/* Navigation */}
        <nav className="absolute top-0 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold text-gradient">WebStar</div>
              <div className="flex gap-4">
                <Link
                  href="/auth/login"
                  className="px-6 py-2 transition"
                  style={{ color: 'rgba(255, 255, 255, 0.75)' }}
                >
                  Log In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-6 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-lg transition"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-6 animate-fade-in" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              One professional home.
              <br />
              <span className="text-gradient">One link.</span>
              <br />
              Everything you are.
            </h1>
            <p className="text-xl mb-12 max-w-2xl mx-auto animate-slide-up" style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
              Build your unified digital identity. Showcase your work.
              <br />
              Share one link that tells your complete professional story.
            </p>
            <Link
              href="/auth/register"
              className="inline-block px-12 py-4 bg-gradient-primary text-white text-lg font-semibold rounded-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Create Your Profile
            </Link>
          </div>

          {/* Onboarding Preview Animation */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="glass rounded-2xl shadow-2xl p-8 animate-slide-up">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(0, 194, 255, 0.15)' }}>
                    <span className="text-3xl">🎨</span>
                  </div>
                  <p className="font-semibold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Choose Archetype</p>
                </div>
                <div className="text-2xl" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>→</div>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(0, 194, 255, 0.15)' }}>
                    <span className="text-3xl">💼</span>
                  </div>
                  <p className="font-semibold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Define Role</p>
                </div>
                <div className="text-2xl" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>→</div>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 mx-auto" style={{ background: 'rgba(0, 194, 255, 0.15)' }}>
                    <span className="text-3xl">⭐</span>
                  </div>
                  <p className="font-semibold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Set Expertise</p>
                </div>
                <div className="text-2xl" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>→</div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">🚀</span>
                  </div>
                  <p className="font-semibold" style={{ color: '#00C2FF' }}>Go Live!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20" style={{ background: '#111111' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
            Everything you need in <span className="text-gradient">one place</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto" style={{ background: 'rgba(0, 194, 255, 0.15)' }}>
                <span className="text-3xl">📁</span>
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Portfolio & Projects</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                Showcase your work with photos, videos, audio, and links. Organize in projects.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto" style={{ background: 'rgba(0, 194, 255, 0.15)' }}>
                <span className="text-3xl">🎮</span>
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Gamification</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                Earn points for completing your profile. Unlock boosts, themes, and features.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto" style={{ background: 'rgba(0, 194, 255, 0.15)' }}>
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-4" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>Analytics</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.75)' }}>
                Track views, clicks, and engagement. Understand who's interested in your work.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20" style={{ background: 'linear-gradient(135deg, rgba(0, 194, 255, 0.2) 0%, rgba(0, 122, 255, 0.2) 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to build your digital identity?
          </h2>
          <p className="text-xl mb-8" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Join thousands of professionals showcasing their work in one unified profile.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-12 py-4 bg-gradient-primary text-white text-lg font-semibold rounded-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Get Started Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-white py-12" style={{ background: '#0a0a0a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-2xl font-bold text-gradient mb-4">WebStar</div>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>© 2024 WebStar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

