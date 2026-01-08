'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#111111' }}
    >
      {/* 404 GIF Container */}
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
        {/* Animated 404 Icon */}
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: '#00C2FF',
              textShadow: '0 0 30px rgba(0, 194, 255, 0.4)',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            404
          </div>
          <div 
            style={{
              fontSize: '32px',
              marginTop: '-8px',
              animation: 'float 3s ease-in-out infinite'
            }}
          >
            🔍
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
        Page Not Found
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
        This page seems to have wandered off into the digital void. Let's find you something better.
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', width: '100%', maxWidth: '280px' }}>
        <Link
          href="/"
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
            transition: 'all 150ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none'
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
          Take Me Home
        </Link>
        
        <button
          onClick={() => window.history.back()}
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
            transition: 'all 150ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          }}
        >
          Go Back
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(10deg); }
        }
      `}</style>
    </div>
  );
}

