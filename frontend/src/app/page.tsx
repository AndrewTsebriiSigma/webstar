'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// JARVIS-style Matrix Rain Effect - Cyan/Blue only
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const chars = '01アイウエオカキクケコサシスセソ10∆∇◊○●□■△▽☆★⬡⬢WEBSTAR';
    const charArray = chars.split('');
    
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    const colors = [
      'rgba(0, 194, 255, 0.8)',
      'rgba(0, 194, 255, 0.5)',
      'rgba(0, 150, 200, 0.6)',
      'rgba(0, 220, 255, 0.4)',
      'rgba(0, 180, 230, 0.3)',
    ];

    const draw = () => {
      ctx.fillStyle = 'rgba(8, 8, 12, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        if (Math.random() > 0.97) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#00C2FF';
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fillStyle = color;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;

        if (y > canvas.height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        
        drops[i] += 0.3 + Math.random() * 0.3;
      }
    };

    const interval = setInterval(draw, 50);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ opacity: 0.25, zIndex: 0 }}
    />
  );
}

// Archetype card component - matches CreateContentModal style
function ArchetypeCard({ 
  icon, 
  title, 
  subtitle, 
  color,
  expandedContent 
}: { 
  icon: React.ReactNode;
  title: string; 
  subtitle: string;
  color: string;
  expandedContent: {
    reality: string;
    whyMultiFormat: string;
    whatYouShow: string[];
    difference: string;
  };
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      onClick={() => setExpanded(!expanded)}
      className="cursor-pointer transition-all duration-200"
      style={{
        background: 'rgba(18, 18, 18, 0.95)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}
    >
      {/* Collapsed State */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: '44px',
              height: '44px',
              background: `linear-gradient(135deg, ${color}33 0%, ${color}1A 100%)`,
              borderRadius: '10px'
            }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[15px] font-semibold text-white">{title}</h3>
            <p className="text-[13px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{subtitle}</p>
          </div>
          <div 
            className="transition-transform duration-200"
            style={{ 
              transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
              color: 'rgba(255, 255, 255, 0.3)'
            }}
          >
            ▼
          </div>
        </div>
      </div>

      {/* Expanded State */}
      <div 
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: expanded ? '500px' : '0',
          opacity: expanded ? 1 : 0
        }}
      >
        <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '0 16px' }} />
        <div className="p-5 pt-4 space-y-4">
          <div>
            <p className="text-[11px] font-semibold mb-2 uppercase tracking-wider" style={{ color }}>Your Reality</p>
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{expandedContent.reality}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold mb-2 uppercase tracking-wider" style={{ color: '#00C2FF' }}>Why Multi-Format</p>
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{expandedContent.whyMultiFormat}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold mb-2 uppercase tracking-wider" style={{ color: '#22C55E' }}>What You Show</p>
            <ul className="text-[13px] space-y-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              {expandedContent.whatYouShow.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="pt-3 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
            <p className="text-[13px]" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              <span style={{ color: '#00C2FF', fontWeight: 600 }}>The difference:</span> {expandedContent.difference}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080C' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00C2FF' }}></div>
      </div>
    );
  }

  const archetypes = [
    {
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>,
      title: 'Engineer',
      subtitle: 'Code + Design + Documentation',
      color: '#00C2FF',
      expandedContent: {
        reality: 'GitHub for code. Dribbble for designs. Medium for articles. LinkedIn for resume. Seven places. One identity split.',
        whyMultiFormat: "You're not just code OR design OR writing. You're all three. Show the architecture, the UI thinking, and the technical breakdown—in one project.",
        whatYouShow: [
          'Software devs: Repos + live demos + breakdowns',
          'Product designers: Figma + prototypes + decisions',
          'Architects: Diagrams + implementations + studies'
        ],
        difference: 'GitHub shows code. Behance shows design. webSTAR shows how you think across formats.'
      }
    },
    {
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V4.5l-10.5 3v9.75M6 19.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" /></svg>,
      title: 'Sound Maker',
      subtitle: 'Audio + Video + Story',
      color: '#00C2FF',
      expandedContent: {
        reality: 'SoundCloud compresses audio. Instagram stops playing when you scroll. Best tracks buried in feeds. No way to show full process.',
        whyMultiFormat: "Sound isn't just audio. It's waveforms, video context, production notes. Show the track WITH the making-of video WITH the mix breakdown.",
        whatYouShow: [
          'Producers: Final tracks + stems + tutorials',
          'Podcasters: Episodes + video clips + transcripts',
          'Sound designers: Samples + projects + process docs'
        ],
        difference: 'SoundCloud = audio only. webSTAR = persistent player while viewers explore your complete sonic identity.'
      }
    },
    {
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>,
      title: 'Visual Artist',
      subtitle: 'Photos + Video + Process',
      color: '#00C2FF',
      expandedContent: {
        reality: 'Instagram destroys quality. Behance templates look generic. Vimeo for video. Personal site for photos. Work scattered everywhere.',
        whyMultiFormat: "Your art isn't just the final image. It's the time-lapse, the written inspiration, the client testimonial. Show the complete story.",
        whatYouShow: [
          'Photographers: Full-res galleries + video reels',
          'Illustrators: Artwork + process sketches + time-lapses',
          'Videographers: 4K projects + stills + BTS footage'
        ],
        difference: 'Instagram compresses to 1MB. webSTAR preserves full quality. No algorithms burying your best work.'
      }
    },
    {
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
      title: 'Communicator',
      subtitle: 'Writing + Speaking + Strategy',
      color: '#00C2FF',
      expandedContent: {
        reality: 'Medium buries articles after 48 hours. LinkedIn = text-only resume. Presentations lost in Google Drive. Identity incomplete.',
        whyMultiFormat: "Ideas don't live in just text. Show the written strategy WITH the slides WITH the speaking video WITH the results.",
        whatYouShow: [
          'Writers: Articles + books + podcast interviews',
          'Marketers: Campaigns + dashboards + strategy PDFs',
          'Consultants: Frameworks + presentations + case studies'
        ],
        difference: 'LinkedIn shows job titles. webSTAR shows your complete intellectual property—permanent forever.'
      }
    }
  ];

  return (
    <div className="min-h-screen relative" style={{ background: '#08080C' }}>
      {/* JARVIS Matrix Background */}
      <MatrixRain />

      {/* Gradient Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0, 194, 255, 0.08) 0%, transparent 60%)',
          zIndex: 1
        }}
      />

      {/* Navigation */}
      <nav className="relative z-20 px-4 py-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-white">web</span>
              <span className="text-lg font-bold" style={{ color: '#00C2FF' }}>STAR</span>
              <span className="text-sm" style={{ color: '#00C2FF' }}>⭐</span>
            </div>
            <div className="flex gap-2">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium rounded-lg transition"
                style={{ color: 'rgba(255, 255, 255, 0.6)' }}
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 text-sm font-semibold rounded-lg transition-all"
                style={{ 
                  background: '#00C2FF',
                  color: '#000'
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 
            className="text-4xl sm:text-5xl font-bold mb-6 leading-tight"
            style={{ color: '#FFFFFF' }}
          >
            One space for your life's work.
          </h1>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl transition-all hover:scale-105"
            style={{ 
              background: '#00C2FF',
              color: '#000',
              boxShadow: '0 0 30px rgba(0, 194, 255, 0.4)'
            }}
          >
            Build Your Space
            <span>→</span>
          </Link>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['⚡ 5 Minutes', '🎨 All Formats', '🔒 Owned Forever', '📱 Phone-First'].map((badge, i) => (
              <span 
                key={i}
                className="px-3 py-1.5 text-xs rounded-full"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEM-AWARE INTRO */}
      <section className="relative z-10 py-16 px-4">
        <div 
          className="max-w-2xl mx-auto text-center p-8 rounded-2xl"
          style={{
            background: 'rgba(18, 18, 18, 0.8)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div className="space-y-2 mb-6">
            <p className="text-base" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Your work scattered across 7 platforms.</p>
            <p className="text-base" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Your best projects buried in feeds.</p>
            <p className="text-base" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Your professional identity rented, not owned.</p>
          </div>
          <p className="text-xl font-semibold" style={{ color: '#00C2FF' }}>
            Build permanent infrastructure instead.
          </p>
        </div>
      </section>

      {/* YOUR FUTURE - ARCHETYPE CARDS */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#00C2FF' }}>Your Future</p>
            <h2 className="text-2xl font-bold text-white mb-1">Personal Digital Spaces</h2>
            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Built for professionals who create. Tap to explore.</p>
          </div>
          <div className="space-y-3">
            {archetypes.map((archetype, i) => (
              <ArchetypeCard key={i} {...archetype} />
            ))}
          </div>
          <p className="text-center mt-6 text-xs" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
            Professionals from 50+ disciplines escaping platform fragmentation.
          </p>
        </div>
      </section>

      {/* CATEGORY POSITIONING */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm mb-1" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>Not a portfolio tool.</p>
          <h2 className="text-3xl font-bold mb-3" style={{ color: '#00C2FF' }}>Personal Digital Spaces.</h2>
          <p className="text-base" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            Infrastructure you own, not platforms you rent.
          </p>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 py-16 px-4">
        <div 
          className="max-w-2xl mx-auto rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(18, 18, 18, 0.95)',
            backdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 0 60px rgba(0, 194, 255, 0.1)'
          }}
        >
          <h2 className="text-2xl font-bold text-white mb-5">
            Build your permanent space today.
          </h2>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl transition-all hover:scale-105 mb-6"
            style={{ 
              background: '#00C2FF',
              color: '#000',
              boxShadow: '0 0 30px rgba(0, 194, 255, 0.4)'
            }}
          >
            Build Your Space
            <span>→</span>
          </Link>
          <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto mb-6">
            {[
              '✓ Free forever',
              '✓ 5 min to start',
              '✓ All formats',
              '✓ Own your data',
              '✓ Mobile-first',
              '✓ No algorithms'
            ].map((item, i) => (
              <p key={i} className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{item}</p>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
            Escape Instagram burial. Leave Behance sameness. Own your identity.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-10 px-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="text-base font-bold text-white">web</span>
            <span className="text-base font-bold" style={{ color: '#00C2FF' }}>STAR</span>
            <span className="text-sm" style={{ color: '#00C2FF' }}>⭐</span>
          </div>
          <p className="text-xs mb-1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            Space to build your life's work.
          </p>
          <p className="text-xs mb-4" style={{ color: 'rgba(255, 255, 255, 0.2)' }}>
            Not rented visibility. Permanent infrastructure.
          </p>
          <div className="flex justify-center gap-6 mb-4">
            {['About', 'Privacy', 'Terms', 'Contact'].map((link, i) => (
              <a key={i} href="#" className="text-xs transition hover:text-white" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                {link}
              </a>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.2)' }}>
            © 2024 WebSTAR. Building the future of professional identity.
          </p>
        </div>
      </footer>
    </div>
  );
}
