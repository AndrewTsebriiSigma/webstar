'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#111111' }}
    >
      {/* Error GIF Container */}
      <div 
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '24px',
          overflow: 'hidden',
          marginBottom: '32px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Animated Error Icon */}
        <div style={{ textAlign: 'center' }}>
          <div 
            className="error-icon"
            style={{
              fontSize: '80px',
              animation: 'bounce 1s ease infinite'
            }}
          >
            😵
          </div>
        </div>
      </div>

      {/* Error Message */}
      <h1 
        style={{ 
          fontSize: '28px', 
          fontWeight: 700, 
          color: '#FFFFFF',
          marginBottom: '12px',
          textAlign: 'center'
        }}
      >
        Oops! Something went wrong
      </h1>
      
      <p 
        style={{ 
          fontSize: '15px', 
          color: 'rgba(255, 255, 255, 0.5)',
          marginBottom: '32px',
          textAlign: 'center',
          maxWidth: '320px'
        }}
      >
        Don't worry, even the best stars sometimes flicker. Let's get you back on track.
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', width: '100%', maxWidth: '280px' }}>
        <button
          onClick={reset}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '12px',
            background: '#00C2FF',
            border: 'none',
            color: '#000',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 150ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#00A8E0';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#00C2FF';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Try Again
        </button>
        
        <Link
          href="/"
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          }}
        >
          Go Home
        </Link>
      </div>

      {/* Subtle Error Code */}
      {error.digest && (
        <p 
          style={{ 
            marginTop: '24px',
            fontSize: '11px', 
            color: 'rgba(255, 255, 255, 0.25)',
            fontFamily: 'monospace'
          }}
        >
          Error ID: {error.digest}
        </p>
      )}

      <style jsx>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}

