'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function SubscribePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    // Trigger entrance animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  }, [user, loading, router]);

  const handleBack = () => {
    router.back();
  };

  const handleSubscribe = () => {
    // TODO: Implement Stripe checkout
    console.log('Starting subscription...');
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen min-h-screen-safe flex items-center justify-center"
        style={{ background: '#111111' }}
      >
        <div 
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#00C2FF', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen min-h-screen-safe"
      style={{ 
        background: '#111111',
        color: 'rgba(255, 255, 255, 0.95)',
        overflowX: 'hidden'
      }}
    >
      {/* Background Gradient */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `
          radial-gradient(circle at 30% 20%, rgba(0, 194, 255, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(102, 126, 234, 0.06) 0%, transparent 50%),
          #111111
        `,
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Back Button - Fixed */}
      <button
        onClick={handleBack}
        style={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          left: '16px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 100,
          transition: 'all 0.2s ease',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateX(0)' : 'translateX(-20px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Content Container - Max 430px */}
      <div style={{
        maxWidth: '430px',
        margin: '0 auto',
        padding: 'calc(80px + env(safe-area-inset-top, 0px)) 16px 40px 16px',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* HERO SECTION */}
        <div style={{
          position: 'relative',
          textAlign: 'center',
          padding: '20px 0 40px 0',
          marginBottom: '24px',
          overflow: 'hidden'
        }}>
          {/* Headline */}
          <h1 style={{
            fontSize: '28px',
            fontWeight: 800,
            lineHeight: 1.2,
            color: 'rgba(255, 255, 255, 0.95)',
            margin: '0 0 12px 0',
            letterSpacing: '-0.5px',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            You're <span style={{
              background: 'linear-gradient(135deg, #00C2FF 0%, #667eea 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '32px',
              fontWeight: 900
            }}>3.8x</span> more likely to get hired
          </h1>
          
          {/* Subheadline */}
          <p style={{
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s'
          }}>
            with a <span style={{ color: '#00C2FF', fontWeight: 700 }}>webSTAR PRO</span> portfolio
          </p>

          {/* Animated Logo */}
          <div style={{
            position: 'relative',
            margin: '32px auto 20px auto',
            width: '100px',
            height: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(100px)',
            transition: 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.3s'
          }}>
            {/* Logo Glow */}
            <div style={{
              position: 'absolute',
              inset: '-20px',
              background: 'radial-gradient(circle, rgba(0, 194, 255, 0.3) 0%, transparent 70%)',
              filter: 'blur(20px)',
              animation: 'pulse 2s ease-in-out infinite'
            }} />
            {/* Logo Image */}
            <Image
              src="/webstar.svg"
              alt="webSTAR"
              width={100}
              height={100}
              style={{
                objectFit: 'contain',
                position: 'relative',
                zIndex: 1,
                animation: 'logoFloat 3s ease-in-out infinite'
              }}
            />
          </div>
        </div>

        {/* COMPARISON SECTION */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '24px',
          padding: 0,
          overflow: 'hidden',
          marginBottom: '32px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s'
        }}>
          
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 0,
            padding: '20px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>FREE</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                padding: '8px 16px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                background: 'linear-gradient(135deg, #00C2FF 0%, #667eea 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 0 20px rgba(0, 194, 255, 0.3)',
                animation: 'proPulse 2s ease-in-out infinite'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>PRO</span>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div style={{ padding: '8px 0' }}>
            {[
              { name: 'Portfolio items', free: '30', pro: 'Unlimited', freeType: 'text', proType: 'text' },
              { name: 'Projects', free: '4', pro: 'Unlimited', freeType: 'text', proType: 'text' },
              { name: 'Quizzes', free: '3', pro: 'Unlimited', freeType: 'text', proType: 'text' },
              { name: 'Customization', free: 'Limited', pro: 'Unlimited', freeType: 'text', proType: 'text' },
              { name: 'Remove watermark', free: null, pro: true, freeType: 'minus', proType: 'check' },
            ].map((feature, index) => (
              <div 
                key={feature.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  padding: '16px',
                  borderBottom: index < 4 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
                  alignItems: 'center',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                  transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.6 + index * 0.05}s`
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255, 255, 255, 0.95)' }}>
                  {feature.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feature.freeType === 'text' ? (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)' }}>{feature.free}</span>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feature.proType === 'text' ? (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#00C2FF' }}>{feature.pro}</span>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Annual Savings */}
        <div style={{
          background: 'rgba(0, 194, 255, 0.08)',
          border: '1px solid rgba(0, 194, 255, 0.15)',
          borderRadius: '14px',
          padding: '14px 18px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.9s'
        }}>
          <div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>Annual Plan</span>
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginLeft: '10px' }}>
              $59.99/year <span style={{ opacity: 0.5 }}>(just $5/mo)</span>
            </span>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #00FF87 0%, #00C2FF 100%)',
            color: '#000',
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 800
          }}>
            SAVE $36
          </div>
        </div>

        {/* CTA SECTION */}
        <div style={{
          textAlign: 'center',
          padding: '0 16px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.95s'
        }}>
          <button
            onClick={handleSubscribe}
            style={{
              width: '100%',
              height: '58px',
              background: 'linear-gradient(135deg, #00C2FF 0%, #667eea 100%)',
              border: 'none',
              borderRadius: '16px',
              color: '#FFFFFF',
              fontSize: '17px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 24px rgba(0, 194, 255, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 194, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 194, 255, 0.3)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>CLAIM YOUR SPACE</span>
            <span style={{ fontSize: '12px', opacity: 0.85, fontWeight: 600 }}>— FREE TRIAL</span>
          </button>
          
          {/* Price note */}
          <p style={{ 
            margin: '14px 0 0 0', 
            fontSize: '13px', 
            color: 'rgba(255, 255, 255, 0.4)',
            fontWeight: 500
          }}>
            $7.99/mo · 27¢/day
          </p>
        </div>
      </div>

      {/* Keyframe animations in style tag */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.5; 
            transform: scale(1); 
          }
          50% { 
            opacity: 1; 
            transform: scale(1.1); 
          }
        }
        
        @keyframes logoFloat {
          0%, 100% { 
            transform: translateY(0) rotate(0deg); 
          }
          33% { 
            transform: translateY(-10px) rotate(2deg); 
          }
          66% { 
            transform: translateY(-5px) rotate(-2deg); 
          }
        }
        
        @keyframes proPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 194, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 40px rgba(0, 194, 255, 0.5);
          }
        }
      `}</style>
    </div>
  );
}
