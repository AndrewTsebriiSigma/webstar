'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// Two Chaotic Glows (Pinkish + Bluish) + Reactor Particles flowing to center
function HeroGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const centerX = () => canvas.width / 2;
    const centerY = () => canvas.height * 0.55;

    // Two glows - PINKISH and BLUISH
    interface GlowOrb {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      size: number;
      alpha: number;
      speed: number;
      r: number;
      g: number;
      b: number;
    }

    const orbs: GlowOrb[] = [];

    // BLUISH glow - faster, shorter height
    orbs.push({
      x: centerX() + 80,
      y: centerY() - 30,
      targetX: centerX() + (Math.random() - 0.5) * 400,
      targetY: centerY() + (Math.random() - 0.5) * 200,
      size: 150,
      alpha: 0.12,
      speed: 0.006,
      r: 100, g: 180, b: 255
    });

    // PINKISH glow - faster, shorter height
    orbs.push({
      x: centerX() - 80,
      y: centerY() + 30,
      targetX: centerX() + (Math.random() - 0.5) * 400,
      targetY: centerY() + (Math.random() - 0.5) * 200,
      size: 140,
      alpha: 0.1,
      speed: 0.005,
      r: 255, g: 130, b: 200
    });

    // NEUTRAL glow - lower area, faster, shorter
    orbs.push({
      x: centerX(),
      y: centerY() + 100,
      targetX: centerX() + (Math.random() - 0.5) * 300,
      targetY: centerY() + 80 + Math.random() * 80,
      size: 120,
      alpha: 0.05,
      speed: 0.004,
      r: 200, g: 200, b: 210
    });

    // Particles from screen sides
    interface Particle {
      x: number;
      y: number;
      size: number;
      speed: number;
      alpha: number;
      drift: number; // slight vertical angle
    }

    const particles: Particle[] = [];

    const spawnParticle = () => {
      // Spawn from TRUE screen edges - mostly LEFT and RIGHT sides
      const spawnType = Math.floor(Math.random() * 10);
      let x, y;
      
      if (spawnType < 5) {
        // LEFT edge (50% chance)
        x = -10;
        y = centerY() + (Math.random() - 0.5) * canvas.height * 0.6;
      } else if (spawnType < 10) {
        // RIGHT edge (50% chance)
        x = canvas.width + 10;
        y = centerY() + (Math.random() - 0.5) * canvas.height * 0.6;
      }
      
      particles.push({
        x: x!,
        y: y!,
        size: 1 + Math.random() * 1.5,
        speed: 0.003 + Math.random() * 0.002,
        alpha: 0.4 + Math.random() * 0.35,
        // Small random vertical drift for slight angle
        drift: (Math.random() - 0.5) * 0.3
      });
    };

    // Particles from sides
    for (let i = 0; i < 12; i++) spawnParticle();

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw glow orbs - faster animation
      for (const orb of orbs) {
        orb.x += (orb.targetX - orb.x) * orb.speed;
        orb.y += (orb.targetY - orb.y) * orb.speed;

        const dist = Math.hypot(orb.targetX - orb.x, orb.targetY - orb.y);
        if (dist < 30) {
          orb.targetX = centerX() + (Math.random() - 0.5) * 400;
          orb.targetY = centerY() + (Math.random() - 0.5) * 200;
          orb.speed = 0.004 + Math.random() * 0.004;
        }

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
        gradient.addColorStop(0, `rgba(${orb.r}, ${orb.g}, ${orb.b}, ${orb.alpha})`);
        gradient.addColorStop(0.4, `rgba(${orb.r}, ${orb.g}, ${orb.b}, ${orb.alpha * 0.4})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(orb.x - orb.size, orb.y - orb.size, orb.size * 2, orb.size * 2);
      }

      // Draw particles - from sides, horizontal flow with slight angle
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        // Horizontal movement toward center + slight vertical drift
        const dx = centerX() - p.x;
        const distToCenter = Math.abs(dx);
        
        // Move horizontally toward center
        const direction = dx > 0 ? 1 : -1;
        const slowdownFactor = Math.max(0.2, distToCenter / 500);
        p.x += direction * p.speed * 200 * slowdownFactor;
        
        // Slight vertical drift (angle)
        p.y += p.drift;
        
        // Fade out as approaching center (150px radius)
        const fadeAlpha = Math.min(1, (distToCenter - 100) / 200) * p.alpha;

        // Draw small square particle
        if (fadeAlpha > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${fadeAlpha})`;
          ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
        }

        // Respawn when reaching center area (150px)
        if (distToCenter < 150) {
          particles.splice(i, 1);
          spawnParticle();
        }
      }

      // Maintain particle count
      if (Math.random() < 0.03 && particles.length < 15) {
        spawnParticle();
      }
    };

    const interval = setInterval(draw, 20);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

// Video Marquee - macOS Dock magnification style
function VideoMarquee() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  
  // Video cards with "Midnight Jewels" palette + placeholder videos
  const videos = [
    { id: 1, color: '#4ECDC4', src: 'https://assets.mixkit.co/videos/preview/mixkit-woman-modeling-in-front-of-the-camera-34483-large.mp4' },
    { id: 2, color: '#7B68EE', src: 'https://assets.mixkit.co/videos/preview/mixkit-portrait-of-a-fashion-woman-with-silver-makeup-39875-large.mp4' },
    { id: 3, color: '#DDA0DD', src: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-waving-her-hair-in-slow-motion-41170-large.mp4' },
    { id: 4, color: '#E07A5F', src: 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-changing-lights-1240-large.mp4' },
    { id: 5, color: '#45B7D1', src: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4' },
  ];
  const allVideos = [...videos, ...videos, ...videos];

  // Golden ratio scale + z-index based on distance - magnified cards above edge fades (z-20)
  const getScaleAndZ = (index: number) => {
    if (hoveredIndex === null) return { scale: 1, zIndex: 1 };
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return { scale: 1.65, zIndex: 30 };  // Hovered - above edge fades
    if (distance === 1) return { scale: 1.28, zIndex: 25 };  // Adjacent - above edge fades
    if (distance === 2) return { scale: 1.1, zIndex: 15 };   // Next - below edge fades
    return { scale: 1, zIndex: 1 };
  };

  const handleClick = (index: number) => {
    setPlayingIndex(playingIndex === index ? null : index);
  };

  const handleSectionLeave = () => {
    setHoveredIndex(null);
    setPlayingIndex(null); // Reset play state when leaving
  };

  return (
    <section 
      className="relative pb-4 sm:pb-5"
      style={{ background: 'transparent', overflow: 'visible', marginTop: '-20px', paddingTop: '28px' }}
      onMouseLeave={handleSectionLeave}
    >
      {/* Edge fades - extended upward to cover magnified cards */}
      <div 
        className="absolute left-0 bottom-0 w-16 sm:w-24 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #08080C 0%, transparent 100%)', top: '-60px' }}
      />
      <div 
        className="absolute right-0 bottom-0 w-16 sm:w-24 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #08080C 0%, transparent 100%)', top: '-60px' }}
      />

      {/* Marquee - pauses on hover */}
      <div 
        className="flex items-center gap-3 sm:gap-4"
        style={{
          animation: 'marqueeScroll 45s linear infinite',
          animationPlayState: hoveredIndex !== null ? 'paused' : 'running',
          width: 'max-content'
        }}
      >
        {allVideos.map((video, index) => {
          const { scale, zIndex } = getScaleAndZ(index);
          const isPlaying = playingIndex === index;
          const isHovered = hoveredIndex === index;
          
          return (
            <div
              key={`${video.id}-${index}`}
              className="relative flex-shrink-0 cursor-pointer"
              style={{
                width: '75px',
                aspectRatio: '9/16',
                borderRadius: '10px',
                overflow: 'hidden',
                background: `linear-gradient(160deg, ${video.color}25 0%, ${video.color}08 100%)`,
                border: '1px solid rgba(255, 255, 255, 0.06)',
                transform: `scale(${scale}) translateZ(0)`,
                transformOrigin: 'bottom center',
                transition: 'transform 0.15s ease-out, z-index 0s',
                zIndex: zIndex
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleClick(index)}
            >
              {/* Background / Video */}
              <div className="absolute inset-0">
                {isPlaying && video.src ? (
                  <video
                    src={video.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(180deg, ${video.color}30 0%, ${video.color}10 60%, rgba(0,0,0,0.4) 100%)`
                    }}
                  />
                )}
              </div>
              
              {/* Play/Pause icon - only on hover when NOT playing */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  opacity: isHovered && !isPlaying ? 1 : 0,
                  transition: 'opacity 0.15s ease-out'
                }}
              >
                <div 
                  style={{
                    width: scale > 1.4 ? '34px' : '24px',
                    height: scale > 1.4 ? '34px' : '24px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.92)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    transition: 'width 0.15s, height 0.15s'
                  }}
                >
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ marginLeft: '2px' }}>
                    <path d="M9 6L1 11V1L9 6Z" fill="#0A0A0E"/>
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes marqueeScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-33.333%, 0, 0); }
        }
      `}</style>
    </section>
  );
}

// Video Marquee Reverse - runs opposite direction
function VideoMarqueeReverse() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  
  // Different set of videos for variety - "Midnight Jewels" palette
  const videos = [
    { id: 1, color: '#E07A5F', src: 'https://assets.mixkit.co/videos/preview/mixkit-woman-running-above-the-camera-on-a-mirror-32807-large.mp4' },
    { id: 2, color: '#96CEB4', src: 'https://assets.mixkit.co/videos/preview/mixkit-curly-haired-model-looking-at-the-camera-42416-large.mp4' },
    { id: 3, color: '#7B68EE', src: 'https://assets.mixkit.co/videos/preview/mixkit-putting-on-a-virtual-reality-glasses-42895-large.mp4' },
    { id: 4, color: '#F7DC6F', src: 'https://assets.mixkit.co/videos/preview/mixkit-singer-performing-on-a-concert-4467-large.mp4' },
    { id: 5, color: '#DDA0DD', src: 'https://assets.mixkit.co/videos/preview/mixkit-woman-looking-at-the-camera-smoking-42496-large.mp4' },
  ];
  const allVideos = [...videos, ...videos, ...videos];

  const getScaleAndZ = (index: number) => {
    if (hoveredIndex === null) return { scale: 1, zIndex: 1 };
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return { scale: 1.65, zIndex: 30 };
    if (distance === 1) return { scale: 1.28, zIndex: 25 };
    if (distance === 2) return { scale: 1.1, zIndex: 15 };
    return { scale: 1, zIndex: 1 };
  };

  const handleClick = (index: number) => {
    setPlayingIndex(playingIndex === index ? null : index);
  };

  const handleSectionLeave = () => {
    setHoveredIndex(null);
    setPlayingIndex(null);
  };

  return (
    <section 
      className="relative pb-4 sm:pb-5 pt-4 sm:pt-5"
      style={{ background: 'transparent', overflow: 'visible' }}
      onMouseLeave={handleSectionLeave}
    >
      {/* Edge fades */}
      <div 
        className="absolute left-0 bottom-0 w-16 sm:w-24 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #08080C 0%, transparent 100%)', top: '-60px' }}
      />
      <div 
        className="absolute right-0 bottom-0 w-16 sm:w-24 z-20 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #08080C 0%, transparent 100%)', top: '-60px' }}
      />

      {/* Marquee - runs opposite direction */}
      <div 
        className="flex items-end gap-3 sm:gap-4"
        style={{
          animation: 'marqueeScrollReverse 45s linear infinite',
          animationPlayState: hoveredIndex !== null ? 'paused' : 'running',
          width: 'max-content'
        }}
      >
        {allVideos.map((video, index) => {
          const { scale, zIndex } = getScaleAndZ(index);
          const isPlaying = playingIndex === index;
          const isHovered = hoveredIndex === index;
          
          return (
            <div
              key={`${video.id}-${index}`}
              className="relative flex-shrink-0 cursor-pointer"
              style={{
                width: '75px',
                aspectRatio: '9/16',
                borderRadius: '10px',
                overflow: 'hidden',
                background: `linear-gradient(160deg, ${video.color}25 0%, ${video.color}08 100%)`,
                border: '1px solid rgba(255, 255, 255, 0.06)',
                transform: `scale(${scale}) translateZ(0)`,
                transformOrigin: 'bottom center',
                transition: 'transform 0.15s ease-out, z-index 0s',
                zIndex: zIndex
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleClick(index)}
            >
              {/* Background / Video */}
              <div className="absolute inset-0">
                {isPlaying && video.src ? (
                  <video
                    src={video.src}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(180deg, ${video.color}30 0%, ${video.color}10 60%, rgba(0,0,0,0.4) 100%)`
                    }}
                  />
                )}
              </div>
              
              {/* Play/Pause icon - only on hover when NOT playing */}
              <div 
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  opacity: isHovered && !isPlaying ? 1 : 0,
                  transition: 'opacity 0.15s ease-out'
                }}
              >
                <div 
                  style={{
                    width: scale > 1.4 ? '34px' : '24px',
                    height: scale > 1.4 ? '34px' : '24px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.92)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    transition: 'width 0.15s, height 0.15s'
                  }}
                >
                  <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ marginLeft: '2px' }}>
                    <path d="M9 6L1 11V1L9 6Z" fill="#0A0A0E"/>
                  </svg>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes marqueeScrollReverse {
          0% { transform: translate3d(-33.333%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
      `}</style>
    </section>
  );
}

// Competitor Orbit - JARVIS Style with particles flowing to center
function CompetitorOrbit() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  
  // Mouse parallax for WebSTAR logo
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) / rect.width * 8;
    const offsetY = (e.clientY - centerY) / rect.height * 8;
    setMouseOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    interface Particle {
      x: number;
      y: number;
      size: number;
      alpha: number;
      speed: number;
    }

    const particles: Particle[] = [];
    const centerX = () => canvas.width / 2;
    const centerY = () => canvas.height / 2;

    const createParticle = () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 180 + Math.random() * 120;
      particles.push({
        x: centerX() + Math.cos(angle) * distance,
        y: centerY() + Math.sin(angle) * distance,
        size: 1 + Math.random() * 1.5,
        alpha: 0.4 + Math.random() * 0.3,
        speed: 0.2 + Math.random() * 0.2  // Slower movement
      });
    };

    for (let i = 0; i < 25; i++) createParticle();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, index) => {
        const dx = centerX() - p.x;
        const dy = centerY() - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 40) {
          p.x += (dx / dist) * p.speed;
          p.y += (dy / dist) * p.speed;
          p.alpha -= 0.0015;  // Slower fade
        } else {
          p.alpha -= 0.015;   // Slower fade
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 194, 255, ${p.alpha})`;
        ctx.fill();

        if (p.alpha <= 0) {
          particles.splice(index, 1);
          createParticle();
        }
      });

      requestAnimationFrame(animate);
    };
    animate();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Organic neural network - 6 icons, unsynchronized breathing
  const competitors = [
    { icon: '/behance.png', radius: 34, size: 'lg', angle: 5, breathe: 'a', duration: 7 },
    { icon: '/wix.png', radius: 40, size: 'lg', angle: 58, breathe: 'f', duration: 9 },
    { icon: '/icons/social.png', radius: 32, size: 'lg', angle: 118, breathe: 'b', duration: 6 },
    { icon: '/icons/linkedin.png', radius: 44, size: 'lg', angle: 172, breathe: 'c', duration: 11 },
    { icon: '/linktree.png', radius: 36, size: 'lg', angle: 238, breathe: 'd', duration: 8 },
    { icon: '/icons/soundcloud.png', radius: 38, size: 'lg', angle: 310, breathe: 'e', duration: 10 },
  ];
  
  // Size classes - all bigger now
  const sizeClasses = {
    lg: 'w-9 h-9 sm:w-11 sm:h-11',
    md: 'w-8 h-8 sm:w-10 sm:h-10',
    sm: 'w-7 h-7 sm:w-9 sm:h-9'
  };

  return (
    <section 
      className="relative overflow-hidden py-16 sm:py-24"
      style={{ background: '#08080C' }}
    >
      {/* Top fade - dark gradient from top */}
      <div 
        className="absolute inset-x-0 top-0 h-32 sm:h-40 pointer-events-none z-10"
        style={{ 
          background: 'linear-gradient(180deg, #08080C 0%, #08080C 40%, transparent 100%)'
        }}
      />
      {/* Left vignette - stronger at top, fades toward middle */}
      <div 
        className="absolute left-0 top-0 w-32 sm:w-48 h-[60%] pointer-events-none z-10"
        style={{ 
          background: 'linear-gradient(to right, #08080C 0%, #08080C 30%, transparent 100%)'
        }}
      />
      {/* Right vignette - stronger at top, fades toward middle */}
      <div 
        className="absolute right-0 top-0 w-32 sm:w-48 h-[60%] pointer-events-none z-10"
        style={{ 
          background: 'linear-gradient(to left, #08080C 0%, #08080C 30%, transparent 100%)'
        }}
      />
      {/* Left vignette bottom - stronger, matching top */}
      <div 
        className="absolute left-0 bottom-0 w-32 sm:w-48 h-[60%] pointer-events-none z-10"
        style={{ 
          background: 'linear-gradient(to right, #08080C 0%, #08080C 30%, transparent 100%)'
        }}
      />
      {/* Right vignette bottom - stronger, matching top */}
      <div 
        className="absolute right-0 bottom-0 w-32 sm:w-48 h-[60%] pointer-events-none z-10"
        style={{ 
          background: 'linear-gradient(to left, #08080C 0%, #08080C 30%, transparent 100%)'
        }}
      />
      {/* Bottom fade - dark gradient from bottom */}
      <div 
        className="absolute inset-x-0 bottom-0 h-32 sm:h-40 pointer-events-none z-10"
        style={{ 
          background: 'linear-gradient(0deg, #08080C 0%, #08080C 40%, transparent 100%)'
        }}
      />
      
      {/* Particle Canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.7 }}
      />

      {/* Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(0, 194, 255, 0.04) 0%, transparent 50%),
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 50px 50px, 50px 50px'
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3" style={{ color: '#fff' }}>
            Everything the industry asks of you — in one place.
          </h2>
        </div>

        {/* Orbit Container - Larger for 12 icons */}
        <div 
          ref={containerRef}
          className="relative mx-auto"
          style={{ width: '380px', height: '380px', maxWidth: '90vw', maxHeight: '90vw' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Orbit Rings - Subtle, matching icon distances */}
          <div 
            className="absolute rounded-full"
            style={{
              inset: '0%',
              border: '1px solid rgba(0, 194, 255, 0.05)',
              animation: 'orbitPulse 5s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute rounded-full"
            style={{
              inset: '12%',
              border: '1px solid rgba(0, 194, 255, 0.08)',
              animation: 'orbitPulse 5s ease-in-out infinite 1s'
            }}
          />
          <div 
            className="absolute rounded-full"
            style={{
              inset: '28%',
              border: '1px solid rgba(0, 194, 255, 0.1)',
              animation: 'orbitPulse 5s ease-in-out infinite 2s'
            }}
          />

          {/* Competitor Icons - Full orbit spin, icons counter-rotate to stay upright */}
          <div 
            className="absolute inset-0"
            style={{ animation: 'orbitSpin 120s linear infinite', zIndex: 2 }}
          >
            {competitors.map((comp, i) => {
              const angleRad = (comp.angle * Math.PI) / 180;
              const x = 50 + comp.radius * Math.cos(angleRad);
              const y = 50 + comp.radius * Math.sin(angleRad);
              
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    animation: `breathe${comp.breathe.toUpperCase()} ${comp.duration}s ease-in-out infinite`
                  }}
                >
                  {/* Counter-spin wrapper - keeps icon upright */}
                  <div style={{ animation: 'orbitCounterSpin 120s linear infinite' }}>
                    {/* Sway wrapper - gentle tilt */}
                    <div style={{ animation: `iconSway${comp.breathe.toUpperCase()} ${15 + i * 3}s ease-in-out infinite` }}>
                      {/* Competitor Icon */}
                      <img 
                        src={comp.icon} 
                        alt=""
                        className={`${sizeClasses[comp.size as keyof typeof sizeClasses]} object-contain`}
                        style={{ 
                          filter: 'grayscale(30%) brightness(0.8)',
                          opacity: 0.85
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Connecting Lines SVG - Spins with orbit, behind icons */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ animation: 'orbitSpin 120s linear infinite', zIndex: 1 }}
          >
            {competitors.map((comp, i) => {
              const angleRad = (comp.angle * Math.PI) / 180;
              const x = 50 + comp.radius * Math.cos(angleRad);
              const y = 50 + comp.radius * Math.sin(angleRad);
              return (
                <line
                  key={i}
                  x1="50%"
                  y1="50%"
                  x2={`${x}%`}
                  y2={`${y}%`}
                  stroke="rgba(0, 194, 255, 0.4)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                  style={{
                    animation: `orbitDash 3s linear infinite`,
                    animationDelay: `${i * 0.15}s`
                  }}
                />
              );
            })}
          </svg>

          {/* Center WebSTAR Logo - with mouse parallax */}
          <div 
            className="absolute flex flex-col items-center justify-center group/logo cursor-pointer"
            style={{
              left: '50%',
              top: '52%',
              transform: `translate(calc(-50% + ${mouseOffset.x}px), calc(-50% + ${mouseOffset.y}px))`,
              transition: 'transform 0.15s ease-out',
              zIndex: 10
            }}
          >
            {/* Glow */}
            <div 
              className="absolute w-32 h-32 sm:w-44 sm:h-44 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(0, 194, 255, 0.3) 0%, transparent 70%)',
                filter: 'blur(25px)',
                animation: 'orbitPulse 3s ease-in-out infinite'
              }}
            />
            {/* Logo Container - Tighter frame, hover scale */}
            <div 
              className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl flex items-center justify-center transition-transform duration-200 group-hover/logo:scale-110"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 194, 255, 0.18) 0%, rgba(0, 80, 120, 0.18) 100%)',
                border: '2px solid rgba(0, 194, 255, 0.5)',
                boxShadow: '0 0 50px rgba(0, 194, 255, 0.3), inset 0 0 25px rgba(0, 194, 255, 0.1)'
              }}
            >
              <img 
                src="/webstar-logo.png" 
                alt="WebSTAR" 
                className="w-12 h-12 sm:w-14 sm:h-14"
              />
            </div>
            <span 
              className="mt-2 text-sm sm:text-base font-semibold"
              style={{ color: '#00C2FF' }}
            >
              WebSTAR
            </span>
          </div>
        </div>

        {/* Bottom Tagline */}
        <p 
          className="text-center mt-10 sm:mt-14 text-[11px] sm:text-xs"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          One space. Your rules. Forever.
        </p>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes orbitSway {
          0%, 100% { transform: rotate(-20deg); }
          50% { transform: rotate(20deg); }
        }
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbitCounterSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        /* Icon sway animations - different timings for unsynchronized organic feel */
        @keyframes iconSwayA {
          0%, 100% { transform: rotate(-12deg); }
          50% { transform: rotate(12deg); }
        }
        @keyframes iconSwayB {
          0%, 100% { transform: rotate(10deg); }
          50% { transform: rotate(-14deg); }
        }
        @keyframes iconSwayC {
          0%, 100% { transform: rotate(-8deg); }
          35% { transform: rotate(15deg); }
          70% { transform: rotate(-5deg); }
        }
        @keyframes iconSwayD {
          0%, 100% { transform: rotate(15deg); }
          50% { transform: rotate(-10deg); }
        }
        @keyframes iconSwayE {
          0%, 100% { transform: rotate(-15deg); }
          40% { transform: rotate(8deg); }
          80% { transform: rotate(-12deg); }
        }
        @keyframes iconSwayF {
          0%, 100% { transform: rotate(8deg); }
          50% { transform: rotate(-15deg); }
        }
        @keyframes orbitPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.015); }
        }
        @keyframes orbitDash {
          to { stroke-dashoffset: -18; }
        }
        /* Breathing animations - scale only, lines stay connected */
        @keyframes breatheA {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes breatheB {
          0%, 100% { transform: translate(-50%, -50%) scale(1.1); }
          50% { transform: translate(-50%, -50%) scale(0.9); }
        }
        @keyframes breatheC {
          0%, 100% { transform: translate(-50%, -50%) scale(0.95); }
          50% { transform: translate(-50%, -50%) scale(1.12); }
        }
        @keyframes breatheD {
          0%, 100% { transform: translate(-50%, -50%) scale(1.05); }
          50% { transform: translate(-50%, -50%) scale(0.88); }
        }
        @keyframes breatheE {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          35% { transform: translate(-50%, -50%) scale(1.18); }
          70% { transform: translate(-50%, -50%) scale(0.92); }
        }
        @keyframes breatheF {
          0%, 100% { transform: translate(-50%, -50%) scale(0.9); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </section>
  );
}

// Showcase Profile Card - Glassy next-gen
function ShowcaseCard({ profile }: { profile: { name: string; role: string; avatar: string; coverGradient: string; username: string; } }) {
  return (
    <div
      style={{
        width: '100%',
        background: 'rgba(20, 20, 25, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}
    >
      {/* Preview Content - Mimics a profile page */}
      <div style={{ padding: '16px' }}>
        {/* Header bar mockup */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          marginBottom: '14px'
        }}>
          <div 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: profile.coverGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
          >
            {profile.avatar}
          </div>
          <div>
            <p style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{profile.name}</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>{profile.role}</p>
          </div>
        </div>

        {/* Stats row - Glassy */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '14px',
          padding: '12px 14px',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(8px)',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div>
            <p style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>24</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Projects</p>
          </div>
          <div>
            <p style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>12.4K</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Views</p>
          </div>
          <div>
            <p style={{ color: '#fff', fontSize: '15px', fontWeight: 600 }}>847</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>Followers</p>
          </div>
        </div>

        {/* Content grid mockup - with glow effects */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '5px'
        }}>
          {[1,2,3,4,5,6].map(i => (
            <div 
              key={i}
              style={{
                aspectRatio: '1',
                background: `linear-gradient(135deg, rgba(0,194,255,${0.08 + i*0.02}) 0%, rgba(139,92,246,${0.04 + i*0.01}) 100%)`,
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.04)'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Clean Archetype card
function ArchetypeCard({ 
  icon, 
  title, 
  subtitle, 
  color,
  isSelected,
  onClick
}: { 
  icon: React.ReactNode;
  title: string; 
  subtitle: string;
  color: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className="cursor-pointer transition-all duration-200"
      style={{
        background: isSelected ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
        border: isSelected ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.04)',
        borderRadius: '10px',
        padding: '10px 12px'
      }}
    >
      <div className="flex items-center gap-2.5">
        <div 
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: '28px',
            height: '28px',
            background: isSelected ? `${color}20` : 'rgba(255,255,255,0.04)',
            borderRadius: '7px'
          }}
        >
          <span style={{ color: isSelected ? color : 'rgba(255,255,255,0.4)' }}>{icon}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <h3 className="text-[12px] font-medium truncate" style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)' }}>
            {title}
          </h3>
          <p className="text-[10px] truncate" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>{subtitle}</p>
        </div>
        {isSelected && (
          <div 
            style={{ 
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: color,
              flexShrink: 0
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedArchetype, setSelectedArchetype] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      if (!user.onboarding_completed) {
        router.push('/onboarding');
      } else {
        router.push(`/${user.username}`);
      }
    }
  }, [user, loading, router]);

  // Auto-rotation with progress indicator
  const [rotationProgress, setRotationProgress] = useState(0);
  const progressRef = useRef(0);
  const archetypeRef = useRef(0);
  
  useEffect(() => {
    // Sync ref with state for manual clicks
    archetypeRef.current = selectedArchetype;
  }, [selectedArchetype]);
  
  useEffect(() => {
    const duration = 6000; // 6 seconds
    const tickInterval = 50; // Update progress every 50ms
    const increment = (tickInterval / duration) * 100;
    
    const progressInterval = setInterval(() => {
      progressRef.current += increment;
      
      if (progressRef.current >= 100) {
        progressRef.current = 0;
        // Calculate next archetype: 0 → 1 → 2 → 3 → 4 → 0
        const nextArchetype = (archetypeRef.current + 1) % 5;
        archetypeRef.current = nextArchetype;
        setSelectedArchetype(nextArchetype);
        setRotationProgress(0);
      } else {
        setRotationProgress(progressRef.current);
      }
    }, tickInterval);
    
    return () => clearInterval(progressInterval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080C' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#00C2FF' }}></div>
      </div>
    );
  }

  const archetypes = [
    {
      icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>,
      title: 'Engineer',
      subtitle: 'Code + Design + Docs',
      color: '#00C2FF'
    },
    {
      icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V4.5l-10.5 3v9.75M6 19.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" /></svg>,
      title: 'Sound Maker',
      subtitle: 'Audio + Video + Story',
      color: '#8B5CF6'
    },
    {
      icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>,
      title: 'Visual Artist',
      subtitle: 'Photos + Video',
      color: '#F59E0B'
    },
    {
      icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
      title: 'Communicator',
      subtitle: 'Writing + Speaking',
      color: '#10B981'
    }
  ];

  const profiles = [
    { name: 'Alex Chen', role: 'Full-Stack Engineer', avatar: '👨‍💻', coverGradient: 'linear-gradient(135deg, #00C2FF 0%, #007EA7 100%)', username: 'alexchen' },
    { name: 'Maya Sound', role: 'Music Producer', avatar: '🎵', coverGradient: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)', username: 'mayasound' },
    { name: 'Jordan Arts', role: 'Visual Designer', avatar: '🎨', coverGradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)', username: 'jordanarts' },
    { name: 'Sam Writer', role: 'Content Strategist', avatar: '✍️', coverGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', username: 'samwriter' }
  ];

  return (
    <div className="min-h-screen" style={{ background: '#08080C', overflowX: 'hidden' }}>
      
      {/* ===================== HERO ===================== */}
      <section 
        className="relative overflow-hidden"
        style={{ 
          background: '#08080C'
        }}
      >
        {/* Chaotic Cyan + Pink Glow */}
        <HeroGlow />
        
        {/* Soft gradient glow */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(0, 194, 255, 0.08) 0%, transparent 60%)'
          }}
        />

        {/* Navigation - Glassy with spring effects */}
        <nav className="relative z-20 px-3 sm:px-4 py-3 sm:py-4">
          <div 
            className="max-w-2xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all duration-300 ease-out hover:translate-y-[2px] hover:shadow-lg"
            style={{
              background: 'rgba(15, 20, 30, 0.6)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div className="flex justify-between items-center">
              {/* Logo Block */}
              <div className="flex items-center gap-2 sm:gap-3 transition-transform duration-300 hover:translate-x-[3px]">
                <img 
                  src="/webstar-logo.png" 
                  alt="WebSTAR Logo" 
                  className="transition-transform duration-500 hover:rotate-[8deg] hover:scale-105 h-6 sm:h-8 w-auto"
                />
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-white leading-tight">WebSTAR</p>
                  <p className="text-[8px] sm:text-[10px]" style={{ color: '#00C2FF' }}>Stay Original</p>
                </div>
              </div>

              {/* Right side - Space link + CTA Button */}
              <div className="flex items-center gap-5">
                {/* Space link - subtle, matching button style but thinner */}
                <a 
                  href="#space"
                  className="hidden sm:block text-[13px] font-normal transition-all duration-300 hover:opacity-70"
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.65)'
                  }}
                >
                  Space
                </a>

                {/* CTA Button - compact on mobile */}
                <Link
                  href="/auth"
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ 
                    background: 'linear-gradient(180deg, rgba(0, 194, 255, 0.9) 0%, rgba(0, 160, 210, 0.95) 100%)',
                    color: '#fff',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 3px rgba(0,0,0,0.3)'
                  }}
                >
                  <span className="hidden sm:inline">Enter Your Space</span>
                  <span className="sm:hidden">Enter</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center py-10 sm:py-14 md:py-20 px-4">
          {/* Main headline */}
          <div className="max-w-2xl mx-auto text-center">
            <h1 
              className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-5 leading-tight tracking-tight"
              style={{ color: '#FFFFFF' }}
            >
              One Link for Your Life's Work.
            </h1>
            
            <p 
              className="text-xs sm:text-sm md:text-base mb-6 sm:mb-8 max-w-sm sm:max-w-md mx-auto leading-relaxed"
              style={{ color: 'rgba(255, 255, 255, 0.45)' }}
            >
              Build a professional space that holds everything you do; work, projects, media, and your history – in one place you control.
            </p>

            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ 
                background: 'linear-gradient(180deg, rgba(0, 194, 255, 0.9) 0%, rgba(0, 160, 210, 0.95) 100%)',
                color: '#fff',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.35)'
              }}
            >
              Build Your Space
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Link>

            {/* Stars + 1,000+ professionals */}
            <div className="mt-6 mb-4">
              <div className="flex items-center justify-center gap-0.5 mb-1.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-3.5 h-3.5" style={{ color: '#FFD700', fill: '#FFD700' }} viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                1,000+ professionals building their space
              </p>
          </div>

            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {['⚡ 5 Min', '🎨 All Formats', '🔗 One Link', '💼 Convert'].map((badge, i) => (
                <span 
                  key={i} 
                  className="text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full"
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.5)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  {badge}
                </span>
              ))}
                  </div>
                </div>
                  </div>
      </section>

      {/* ===================== VIDEO MARQUEE - Infinite Scroll ===================== */}
      <VideoMarquee />

      {/* ===================== STATEMENT SECTION ===================== */}
      <section
        className="relative py-20 sm:py-28 md:py-32 px-4"
        style={{ background: '#08080C' }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <p 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-medium leading-[1.3] tracking-[-0.02em]"
            style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              textWrap: 'balance' as const
            }}
          >
            WebSTAR combines your portfolio, identity, and links into a single professional space.
            <span 
              className="block mt-4 sm:mt-5"
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              Set it up in five minutes, straight from your phone.
            </span>
          </p>
        </div>
      </section>

      {/* ===================== COMPETITOR ORBIT - JARVIS Style ===================== */}
      <CompetitorOrbit />

      {/* ===================== FEATURE SHOWCASE - Apple Quality ===================== */}
      <section 
        id="space"
        className="relative scroll-mt-20"
        style={{ background: '#08080C' }}
      >
        {/* Subtle ambient glow */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: '30%',
            right: '20%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(0, 194, 255, 0.04) 0%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />

        <div className="relative z-10 py-12 sm:py-16 md:py-20 px-4">
          <div className="max-w-2xl mx-auto">

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 md:gap-6 items-start">
              
              {/* LEFT COLUMN - Header + Tabs on desktop, Header only on mobile */}
              <div className="order-1">
                {/* Section Header */}
                <div className="text-left mb-6">
                  <p 
                    className="text-[10px] font-medium uppercase tracking-widest mb-2 md:mb-3"
                    style={{ color: '#00C2FF' }}
                  >
                    Your Space
                  </p>
                  <h2 
                    className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 md:mb-3 tracking-tight leading-tight"
                    style={{ color: '#FFFFFF' }}
                  >
                    Everything you do,<br />in one place.
                  </h2>
                  <p 
                    className="text-[11px] sm:text-xs"
                    style={{ color: 'rgba(255, 255, 255, 0.5)', maxWidth: '340px' }}
                  >
                    Showcase work, document projects, tell your story.
                  </p>
                </div>

                {/* VERTICAL TABS - Hidden on mobile, shown on desktop */}
                <div className="hidden md:block space-y-1">
                  {[
                    { id: 'overview', label: 'Overview', desc: 'Your professional identity at a glance. Name, role, and what makes you unique.' },
                    { id: 'portfolio', label: 'Portfolio', desc: 'Showcase your best work in a beautiful masonry grid. Images, videos, and more.' },
                    { id: 'projects', label: 'Projects', desc: 'Document your journey. Case studies, milestones, and the story behind your work.' },
                    { id: 'about', label: 'About', desc: 'Tell your story. Background, skills, experience — everything that defines you.' },
                    { id: 'ctas', label: 'CTA', desc: 'Drive action. Custom buttons that connect visitors to what matters most.' }
                  ].map((feature, i) => (
                    <div
                      key={feature.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => { setSelectedArchetype(i); setRotationProgress(0); progressRef.current = 0; }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedArchetype(i); setRotationProgress(0); progressRef.current = 0; } }}
                      className="group relative"
                      style={{ 
                        padding: '8px 6px 8px 8px',
                        cursor: 'pointer',
                        outline: 'none',
                        borderRadius: '0 6px 6px 0',
                        background: selectedArchetype === i 
                          ? 'linear-gradient(90deg, rgba(0, 194, 255, 0.08) 0%, rgba(0, 194, 255, 0.02) 50%, transparent 70%)'
                          : 'transparent',
                        transition: 'background 0.3s ease'
                      }}
                    >
                      {/* Progress bar - absolute, full height matching gradient */}
                      <div 
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '3px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          overflow: 'hidden'
                        }}
                      >
                        <div 
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: selectedArchetype === i ? `${rotationProgress}%` : '0%',
                            background: 'linear-gradient(180deg, #00C2FF 0%, #0099CC 100%)',
                            transition: 'none'
                          }}
                        />
                      </div>
                      <div className="flex items-stretch gap-2.5">
                        <div className="flex-1">
                          <span 
                            className="text-[14px] font-medium block"
                            style={{ 
                              color: selectedArchetype === i ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                              transition: 'color 0.2s ease'
                            }}
                          >
                            {feature.label}
                          </span>
                          {/* Description - always visible when selected */}
                          <div 
                            style={{
                              maxHeight: selectedArchetype === i ? '50px' : '0px',
                              opacity: selectedArchetype === i ? 1 : 0,
                              overflow: 'hidden',
                              transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
                              marginTop: '3px'
                            }}
                          >
                            <p 
                              className="text-[11px] leading-snug"
                              style={{ color: 'rgba(255, 255, 255, 0.5)', maxWidth: '260px' }}
                            >
                              {feature.desc}
                            </p>
                </div>
                  </div>
                </div>
              </div>
                  ))}
            </div>
          </div>

              {/* PHONE - Second on mobile, RIGHT on desktop */}
              <div className="flex justify-center md:justify-start order-2 w-full md:w-auto">
                <div
                  className="w-[280px] sm:w-[280px] md:w-[280px]"
                  style={{
                    position: 'relative',
                    background: '#1A1A1C',
                    borderRadius: '28px',
                    padding: '4px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  {/* Phone inner screen */}
                  <div 
                    style={{ 
                      borderRadius: '28px', 
                      overflow: 'hidden', 
                      background: '#0D0D11'
                    }}
                  >
                    {/* Profile Cover - glow on Overview */}
                    <div 
                      className="h-[75px] sm:h-[85px] md:h-[90px]"
                      style={{ 
                        position: 'relative',
                        background: selectedArchetype === 0 
                          ? 'linear-gradient(135deg, #1a2a4e 0%, #0f2530 50%, #254550 100%)'
                          : 'linear-gradient(135deg, #1a1a3e 0%, #0f2027 50%, #203a43 100%)',
                        boxShadow: selectedArchetype === 0 ? 'inset 0 0 40px rgba(0, 194, 255, 0.2), 0 0 20px rgba(0, 194, 255, 0.1)' : 'none',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Avatar - glows on Overview (index 0) */}
                      <div 
                        style={{ 
                          position: 'absolute', 
                          bottom: '-26px', 
                          left: '50%', 
                          transform: 'translateX(-50%)',
                          width: '60px', 
                          height: '60px', 
                          borderRadius: '50%', 
                          background: selectedArchetype === 0 
                            ? 'linear-gradient(145deg, #00C2FF 0%, #0077AA 100%)' 
                            : 'linear-gradient(145deg, #2a2a3a 0%, #1a1a2a 100%)',
                          border: '3px solid #0D0D11',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                          color: selectedArchetype === 0 ? '#fff' : 'rgba(255,255,255,0.4)',
                          fontWeight: 600,
                          boxShadow: selectedArchetype === 0 ? '0 4px 15px rgba(0, 194, 255, 0.25)' : 'none',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        D
        </div>
      </div>

                    {/* Profile Info + CTA Buttons */}
                    <div style={{ padding: '34px 16px 12px', textAlign: 'center' }}>
                      {/* Name - glows on Overview (index 0) */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '4px' }}>
                        <span style={{ 
                          fontSize: '15px', 
                          fontWeight: 600, 
                          color: selectedArchetype === 0 ? '#fff' : 'rgba(255,255,255,0.45)',
                          textShadow: selectedArchetype === 0 ? '0 0 8px rgba(255,255,255,0.4)' : 'none',
                          transition: 'all 0.3s ease'
                        }}>Dima Benzin</span>
                        {/* WebSTAR logo icon */}
                        <img 
                          src="/webstar-logo.png" 
                          alt="" 
                          style={{ 
                            width: '14px', 
                            height: '14px', 
                            borderRadius: '2px',
                            opacity: selectedArchetype === 0 ? 1 : 0.4,
                            transition: 'opacity 0.3s ease'
                          }} 
                        />
              </div>
                      {/* Description - glows on Overview (index 0) */}
                      <div style={{ 
                        fontSize: '11px', 
                        color: selectedArchetype === 0 ? '#fff' : 'rgba(255,255,255,0.45)', 
                        marginBottom: '10px',
                        textShadow: selectedArchetype === 0 ? '0 0 10px rgba(255,255,255,0.5)' : 'none',
                        transition: 'all 0.3s ease'
                      }}>
                        Building the future of professional identity.
            </div>
                      {/* Location & Role - glows on Overview (index 0) */}
                      <div style={{ 
                        fontSize: '10px', 
                        color: selectedArchetype === 0 ? '#00C2FF' : 'rgba(255,255,255,0.3)', 
                        marginBottom: '12px',
                        textShadow: selectedArchetype === 0 ? '0 0 8px rgba(0, 194, 255, 0.5)' : 'none',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px'
                      }}>
                        <span>📍 Toronto, Canada</span>
                        <span>💼 Marketing</span>
              </div>
                      
                      {/* CTA Buttons - Tinted by default, bright when CTA selected (index 4) */}
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginBottom: '12px' }}>
                        <span 
                          style={{ 
                            padding: '5px 16px', 
                            borderRadius: '12px', 
                            background: selectedArchetype === 4 
                              ? 'linear-gradient(135deg, #00C2FF 0%, #0099CC 100%)' 
                              : 'linear-gradient(135deg, rgba(0, 194, 255, 0.2) 0%, rgba(0, 153, 204, 0.2) 100%)',
                            fontSize: '10px',
                            color: selectedArchetype === 4 ? '#fff' : 'rgba(255,255,255,0.4)',
                            fontWeight: 500,
                            flex: '0 0 70%',
                            textAlign: 'center',
                            boxShadow: selectedArchetype === 4 ? '0 0 20px rgba(0, 194, 255, 0.5), 0 0 35px rgba(0, 194, 255, 0.2)' : 'none',
                            transform: selectedArchetype === 4 ? 'scale(1.02)' : 'scale(1)',
                            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                          }}
                        >
                          Button
                        </span>
                        <span 
                          style={{ 
                            padding: '5px 8px', 
                            borderRadius: '12px', 
                            background: selectedArchetype === 4 ? 'rgba(0, 194, 255, 0.12)' : 'rgba(255,255,255,0.03)',
                            border: selectedArchetype === 4 ? '1px solid rgba(0, 194, 255, 0.35)' : '1px solid rgba(255,255,255,0.06)',
                            fontSize: '10px',
                            color: selectedArchetype === 4 ? '#00C2FF' : 'rgba(255,255,255,0.35)',
                            fontWeight: 500,
                            flex: '0 0 30%',
                            textAlign: 'center',
                            boxShadow: selectedArchetype === 4 ? '0 0 12px rgba(0, 194, 255, 0.25)' : 'none',
                            transform: selectedArchetype === 4 ? 'scale(1.02)' : 'scale(1)',
                            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                          }}
                        >
                          Email
                        </span>
            </div>
              </div>

                    {/* Tab Menu - Full width, indices: Portfolio=1, Projects=2, About=3 */}
                    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 0 8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {[
                        { label: 'Portfolio', idx: 1 },
                        { label: 'Projects', idx: 2 },
                        { label: 'About', idx: 3 }
                      ].map((tab) => (
                        <span 
                          key={tab.label}
                          onClick={() => { setSelectedArchetype(tab.idx); setRotationProgress(0); progressRef.current = 0; }}
                          style={{ 
                            fontSize: '12px', 
                            color: selectedArchetype === tab.idx ? '#fff' : 'rgba(255,255,255,0.35)',
                            fontWeight: selectedArchetype === tab.idx ? 500 : 400,
                            borderBottom: selectedArchetype === tab.idx ? '2px solid #00C2FF' : '2px solid transparent',
                            paddingBottom: '8px',
                            cursor: 'pointer',
                            flex: 1,
                            textAlign: 'center'
                          }}
                        >
                          {tab.label}
                        </span>
                      ))}
                    </div>

                    {/* Content Area - Fixed height to prevent jumping */}
                    <div className="h-[180px] sm:h-[200px] md:h-[220px]" style={{ padding: '10px', overflow: 'hidden' }}>
                      
                      {/* Overview & CTA - Empty content area to focus on glowing elements above */}
                      {(selectedArchetype === 0 || selectedArchetype === 4) && (
                        <div className="flex flex-col items-center justify-center h-full" />
                      )}
                        
                      {/* Portfolio - Masonry Grid */}
                      {selectedArchetype === 1 && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ height: '80px', borderRadius: '8px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
                            <div style={{ height: '55px', borderRadius: '8px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }} />
                            <div style={{ height: '65px', borderRadius: '8px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }} />
                          </div>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ height: '60px', borderRadius: '8px', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }} />
                            <div style={{ height: '75px', borderRadius: '8px', background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }} />
                            <div style={{ height: '60px', borderRadius: '8px', background: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)' }} />
                          </div>
                        </div>
                      )}

                      {/* Projects - Cards */}
                      {selectedArchetype === 2 && (
                        <div className="space-y-3">
                          {[
                            { icon: '⭐', name: 'WebSTAR', count: '24' },
                            { icon: '📈', name: 'Marketing Cases', count: '12' },
                            { icon: '📷', name: 'Photography', count: '18' }
                          ].map((project, n) => (
                            <div 
                              key={n}
                              style={{ 
                                padding: '10px',
                                borderRadius: '10px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}
                            >
                              <div style={{ 
                                width: '36px', 
                                height: '36px', 
                                borderRadius: '8px', 
                                background: 'rgba(0, 194, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px'
                              }}>
                                {project.icon}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: 500, color: '#fff' }}>{project.name}</div>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>{project.count} posts</div>
                              </div>
                              <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M9 18l6-6-6-6"/>
                              </svg>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* About - Sections */}
                      {selectedArchetype === 3 && (
                        <div className="space-y-3">
                          <div>
                            <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>About</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                              Founder & creator building tools for the next generation of professionals.
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skills</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {['Product', 'Design', 'Strategy', 'Vision'].map(skill => (
                                <span key={skill} style={{ fontSize: '9px', padding: '3px 7px', borderRadius: '5px', background: 'rgba(0, 194, 255, 0.1)', color: 'rgba(255,255,255,0.55)' }}>{skill}</span>
                              ))}
                            </div>
                  </div>
                          <div>
                            <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Focus</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Professional identity infrastructure</div>
                          </div>
                </div>
                      )}

                  </div>
                    
                    {/* Home Indicator - iPhone style */}
                    <div className="py-1 sm:py-1.5" style={{ 
                      display: 'flex', 
                      justifyContent: 'center'
                    }}>
                      <div style={{ 
                        width: '80px', 
                        height: '3px', 
                        borderRadius: '2px', 
                        background: 'rgba(255, 255, 255, 0.2)'
                      }} />
                </div>
                  </div>
                </div>
              </div>

              {/* HORIZONTAL TABS - Mobile only, below phone */}
              <div className="md:hidden order-3 w-full">
                <div className="flex justify-center gap-1 p-2" style={{ background: 'transparent' }}>
                  {[
                    { id: 'overview', short: 'Overview' },
                    { id: 'portfolio', short: 'Portfolio' },
                    { id: 'projects', short: 'Projects' },
                    { id: 'about', short: 'About' },
                    { id: 'ctas', short: 'CTA' }
                  ].map((feature, i) => (
                    <button
                      key={feature.id}
                      onClick={() => { setSelectedArchetype(i); setRotationProgress(0); progressRef.current = 0; }}
                      className="relative flex-1 py-2 px-1 text-center transition-all"
                      style={{ 
                        background: 'transparent',
                        outline: 'none'
                      }}
                    >
                      {/* Horizontal progress bar at bottom */}
                      <div 
                        style={{
                          position: 'absolute',
                          bottom: '4px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '80%',
                          height: '2px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          overflow: 'hidden'
                        }}
                      >
                        <div 
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            width: selectedArchetype === i ? `${rotationProgress}%` : '0%',
                            background: '#00C2FF',
                            transition: 'none'
                          }}
                        />
                      </div>
                      <span 
                        className="text-[11px] font-medium"
                        style={{ 
                          color: selectedArchetype === i ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
                          transition: 'color 0.2s ease'
                        }}
                      >
                        {feature.short}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Mobile description - shows below tabs */}
                <div 
                  className="text-center px-4 mt-2"
                  style={{
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  <p 
                    className="text-[11px] leading-relaxed"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                  >
                    {[
                      'Your professional identity at a glance.',
                      'Showcase your best work beautifully.',
                      'Document your journey and milestones.',
                      'Tell your story and background.',
                      'Drive action with custom buttons.'
                    ][selectedArchetype]}
              </p>
            </div>
          </div>
        </div>
      </div>
        </div>
      </section>

      {/* ===================== VIDEO MARQUEE REVERSE - Opposite Direction ===================== */}
      <VideoMarqueeReverse />

      {/* ===================== QUIZ SECTION ===================== */}
      <section 
        className="relative overflow-hidden"
        style={{ background: '#08080C' }}
      >
        <div className="relative z-10 py-12 sm:py-16 md:py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight"
              style={{ color: '#FFFFFF' }}
            >
              Discover Your Hidden Skills
            </h2>
            <p 
              className="text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              Take our quick assessment to uncover talents you didn't know you had. Get personalized insights about your unique strengths.
            </p>
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ 
                background: 'linear-gradient(180deg, rgba(0, 194, 255, 0.9) 0%, rgba(0, 160, 210, 0.95) 100%)',
                color: '#fff',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.35)'
              }}
            >
              Start Quiz
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== CTA - Clean Dark Section ===================== */}
      <section 
        className="relative overflow-hidden"
        style={{ background: '#08080C' }}
      >
        <style jsx>{`
          @keyframes snitchFloat {
            0% { 
              transform: translate(0%, 0%);
            }
            15% { 
              transform: translate(60%, -30%);
            }
            30% { 
              transform: translate(20%, 40%);
            }
            45% { 
              transform: translate(-50%, 10%);
            }
            60% { 
              transform: translate(-30%, -40%);
            }
            75% { 
              transform: translate(40%, 20%);
            }
            90% { 
              transform: translate(-20%, -20%);
            }
            100% { 
              transform: translate(0%, 0%);
            }
          }
        `}</style>

        <div className="relative z-10 py-8 sm:py-10 md:py-14 px-4">
          {/* Giant Frame - clean */}
          <div 
            className="max-w-lg mx-auto relative overflow-hidden"
            style={{
              padding: '20px 20px',
              borderRadius: '16px',
              background: 'rgba(14, 14, 18, 0.95)',
              border: '1px solid rgba(0, 194, 255, 0.08)',
              backdropFilter: 'blur(20px)'
            }}
          >
            {/* Ghost grid - barely perceptible */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0, 194, 255, 0.008) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0, 194, 255, 0.008) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px',
                borderRadius: '18px'
              }}
            />
            
            {/* Light bluish roaming glow - snitch-like movement */}
            <div 
              className="absolute pointer-events-none"
              style={{
                top: '50%',
                left: '50%',
                width: '200px',
                height: '130px',
                background: 'radial-gradient(ellipse, rgba(180, 220, 255, 0.18) 0%, rgba(100, 180, 255, 0.08) 40%, transparent 70%)',
                borderRadius: '50%',
                filter: 'blur(40px)',
                animation: 'snitchFloat 18s cubic-bezier(0.4, 0, 0.2, 1) infinite'
              }}
            />

            <div className="relative z-10 text-center">
              <h2 
                className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-5 tracking-tight"
                style={{ color: '#FFFFFF' }}
              >
                Ready to own your space?
          </h2>
              
          <Link
                href="/auth"
                className="inline-flex items-center px-5 py-2.5 sm:px-7 sm:py-3 text-sm font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] mb-5 sm:mb-6"
                style={{ 
                  background: 'linear-gradient(180deg, rgba(0, 194, 255, 0.9) 0%, rgba(0, 160, 210, 0.95) 100%)',
                  color: '#fff',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.35)'
                }}
              >
                Build Your Space
          </Link>

              {/* Checklist */}
              <div className="flex flex-wrap justify-center gap-3 sm:gap-5 mb-5 sm:mb-6">
                {[
                  'Free forever',
                  '5 minutes',
                  'One link',
                  'Business ready'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span className="text-[11px]" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{item}</span>
        </div>
                ))}
      </div>

              <div className="flex items-center justify-center gap-0.5 mb-1.5">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-3 h-3" style={{ color: '#FFD700', fill: '#FFD700' }} viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-[10px]" style={{ color: 'rgba(255, 255, 255, 0.35)' }}>
                1,000+ professionals building their space
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER - Ultra Compact ===================== */}
      <footer style={{ background: '#08080C' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          
          {/* Two rows - super tight, stacks on mobile */}
          <div className="flex flex-col items-center gap-2 sm:gap-3">
            
            {/* Row 1: Logo + tagline + email */}
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src="/webstar-logo.png" 
                  alt="" 
                  style={{ height: '14px', width: '14px', opacity: 0.4 }}
                />
                <span className="text-[8px] sm:text-[9px]" style={{ color: 'rgba(255, 255, 255, 0.25)' }}>
                  Make original the only standard.
                </span>
              </div>
              <span className="hidden sm:inline" style={{ color: 'rgba(255, 255, 255, 0.1)' }}>|</span>
              <a 
                href="mailto:hello@webstar.com" 
                className="text-[8px] sm:text-[9px] transition-colors hover:text-white"
                style={{ color: 'rgba(255, 255, 255, 0.25)' }}
              >
                hello@webstar.com
              </a>
      </div>

            {/* Row 2: Copyright + links */}
            <div className="flex flex-wrap justify-center items-center gap-1 sm:gap-2">
              <span className="text-[7px] sm:text-[8px]" style={{ color: 'rgba(255, 255, 255, 0.12)' }}>
                © 2026 WebSTAR Inc.
              </span>
              <span className="text-[7px] sm:text-[8px]" style={{ color: 'rgba(255, 255, 255, 0.08)' }}>·</span>
              <a 
                href="#" 
                className="text-[7px] sm:text-[8px] transition-colors hover:text-white"
                style={{ color: 'rgba(255, 255, 255, 0.12)' }}
              >
                Privacy
              </a>
              <span className="text-[7px] sm:text-[8px]" style={{ color: 'rgba(255, 255, 255, 0.08)' }}>·</span>
              <a 
                href="#" 
                className="text-[7px] sm:text-[8px] transition-colors hover:text-white"
                style={{ color: 'rgba(255, 255, 255, 0.12)' }}
              >
                Terms
              </a>
        </div>

      </div>

        </div>
      </footer>
    </div>
  );
}
