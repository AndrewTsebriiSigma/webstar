'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { profileAPI, portfolioAPI, projectsAPI, economyAPI, analyticsAPI } from '@/lib/api';
import { Profile, PortfolioItem, Project, PointsBalance, ProfileMetrics } from '@/lib/types';
import toast from 'react-hot-toast';
import Link from 'next/link';
import UploadPortfolioModal from '@/components/UploadPortfolioModal';
import CreateProjectModal from '@/components/CreateProjectModal';
import SettingsModal from '@/components/SettingsModal';
import EditAboutModal from '@/components/EditAboutModal';
import PortfolioDetailModal from '@/components/PortfolioDetailModal';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import AboutSection from '@/components/AboutSection';
import CreateContentModal from '@/components/CreateContentModal';
import NotificationsPanel from '@/components/NotificationsPanel';
import ContentDisplay from '@/components/ContentDisplay';
import FeedModal from '@/components/FeedModal';
import MiniPlayer from '@/components/MiniPlayer';
import { 
  Cog6ToothIcon, 
  EyeIcon, 
  PlusIcon,
  LinkIcon,
  PencilIcon,
  MapPinIcon,
  BriefcaseIcon,
  Squares2X2Icon,
  ListBulletIcon,
  BellIcon,
  RectangleStackIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('portfolio');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [points, setPoints] = useState<PointsBalance | null>(null);
  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<'media' | 'audio' | 'pdf' | 'text' | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showEditAboutModal, setShowEditAboutModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [showPortfolioDetail, setShowPortfolioDetail] = useState(false);
  const [showCreateContentModal, setShowCreateContentModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewerMode, setViewerMode] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [feedInitialPostId, setFeedInitialPostId] = useState<number | undefined>(undefined);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [navPushUp, setNavPushUp] = useState(0);
  
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  const isOwnProfile = user?.username === username;
  
  // Scroll animation calculations
  const heightReduction = Math.min(scrollY / 100, 1);
  const isScrolled = scrollY > 5;

  useEffect(() => {
    loadProfile();
  }, [username]);

  // Scroll listener - dashboard acts as ceiling for nav
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      if (dashboardRef.current) {
        const dashboardTop = dashboardRef.current.getBoundingClientRect().top;
        const navHeight = 54;
        if (dashboardTop < navHeight) {
          setNavPushUp(Math.min(navHeight - dashboardTop, 60));
        } else {
          setNavPushUp(0);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadProfile = async () => {
    // Check cache first (5 minute TTL) for instant page loads
    const cacheKey = `profile_${username}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        // Use cache if less than 5 minutes old
        if (age < 5 * 60 * 1000) {
          setProfile(data.profile);
          setPortfolioItems(data.portfolioItems);
          setProjects(data.projects);
          if (data.points) setPoints(data.points);
          if (data.metrics) setMetrics(data.metrics);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // Cache read failed, proceed with API calls
    }

    try {
      // 🚀 PARALLEL CALLS - All requests start at the same time!
      const [profileRes, portfolioRes, projectsRes] = await Promise.all([
        profileAPI.getByUsername(username),
        portfolioAPI.getUserItems(username),
        projectsAPI.getUserProjects(username)
      ]);

      setProfile(profileRes.data);
      setPortfolioItems(portfolioRes.data);
      setProjects(projectsRes.data);
      setLoading(false); // Show content immediately!

      // Non-critical data - load in background without blocking UI
      let pointsData = null;
      let metricsData = null;
      
      if (isOwnProfile) {
        const [pointsRes, metricsRes] = await Promise.allSettled([
          economyAPI.getPoints(),
          analyticsAPI.getProfileAnalytics()
        ]);

        if (pointsRes.status === 'fulfilled') {
          pointsData = pointsRes.value.data;
          setPoints(pointsData);
        }
        if (metricsRes.status === 'fulfilled') {
          metricsData = metricsRes.value.data;
          setMetrics(metricsData);
        }
      }

      // Cache the data for 5 minutes
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: {
            profile: profileRes.data,
            portfolioItems: portfolioRes.data,
            projects: projectsRes.data,
            points: pointsData,
            metrics: metricsData
          },
          timestamp: Date.now()
        }));
      } catch (e) {
        // Cache write failed (e.g., storage full), not critical
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/${username}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-white">Profile not found</h2>
          <Link href="/" className="text-cyan-400 hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#111111' }}>
      {/* Mobile Header - Animated on scroll, hidden in viewer mode */}
      {!viewerMode && (
        <header 
          className={`top-nav ${isScrolled ? 'glassy' : ''}`}
          style={{
            paddingTop: `${11 - (5 * heightReduction)}px`,
            paddingBottom: `${11 - (5 * heightReduction)}px`,
            transform: `translateY(-${navPushUp}px)`
          }}
        >
          {/* Post - Left */}
            {isOwnProfile ? (
              <button 
                onClick={() => setShowCreateContentModal(true)}
              className="nav-btn"
              >
              <PlusIcon 
                className="text-white" 
                style={{ 
                  width: `${22 - (3 * heightReduction)}px`, 
                  height: `${22 - (3 * heightReduction)}px` 
                }} 
              />
              </button>
            ) : (
              <div className="w-8"></div>
            )}
            
          {/* Brand Name - Center */}
          <div className="nav-center">
            <span 
              style={{
                fontSize: `${17 - (2 * heightReduction)}px`,
                fontWeight: 700,
                letterSpacing: '-0.3px',
                color: 'white'
              }}
            >
              WebSTAR
            </span>
          </div>
          
          {/* Notifications - Right */}
              <button 
                onClick={() => setShowNotifications(true)}
            className="nav-btn"
              >
            <BellIcon 
              className="text-white" 
              style={{ 
                width: `${22 - (3 * heightReduction)}px`, 
                height: `${22 - (3 * heightReduction)}px` 
              }} 
            />
                {isOwnProfile && (
              <span 
                className="nav-badge"
                style={{ transform: `scale(${1 - (0.15 * heightReduction)})` }}
              >3</span>
                )}
              </button>
        </header>
      )}

      {/* Cover Image Area - webSTAR: 176px height */}
      <div className="relative">
        <div className="h-40 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 relative overflow-hidden">
          {profile.banner_image ? (
            <img
              src={profile.banner_image}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[url('/api/placeholder/1200/400')] bg-cover bg-center opacity-20" />
          )}
          
          {/* Viewer Mode & Settings - Bigger buttons */}
          {isOwnProfile && (
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <button 
                onClick={() => setViewerMode(!viewerMode)}
                className="banner-action-btn flex items-center justify-center"
                style={{ 
                  width: '37px',
                  height: '37px',
                  borderRadius: '50%',
                  background: viewerMode ? '#00C2FF' : 'rgba(0, 0, 0, 0.35)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  color: 'rgba(255, 255, 255, 0.85)',
                  transition: 'all 150ms cubic-bezier(0.22, 0.61, 0.36, 1)'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title={viewerMode ? 'Exit viewer mode' : 'Enter viewer mode'}
              >
                <EyeIcon className="w-[20px] h-[20px]" />
              </button>
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="banner-action-btn flex items-center justify-center"
                style={{ 
                  width: '37px',
                  height: '37px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.35)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  color: 'rgba(255, 255, 255, 0.85)',
                  transition: 'all 150ms cubic-bezier(0.22, 0.61, 0.36, 1)'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title="Settings"
              >
                <Cog6ToothIcon className="w-[20px] h-[20px]" />
              </button>
            </div>
          )}
        </div>

        {/* Avatar - 166px, 2/3 banner overlap (110px) */}
        <div className="relative px-4 -mt-[110px]">
          <div className="flex items-center justify-center">
            {profile.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt={profile.display_name || username}
                className="w-[150px] h-[150px] rounded-full object-cover"
                style={{
                  border: '6px solid #111111',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
                }}
              />
            ) : (
              <div className="w-[150px] h-[150px] rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold"
                style={{
                  border: '6px solid #111111',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
                }}
              >
                {(profile.display_name || username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info - Compact design */}
      <div className="profile-info" style={{ padding: viewerMode ? '0 24px 12px' : '0 24px 12px', textAlign: 'center' }}>
        {/* Name + Badge - Centered together as unit */}
        <div className="flex items-center justify-center pt-2" style={{ marginBottom: '14px' }}>
          <div className="inline-flex items-center gap-1.5">
            <h1 className="text-xl font-bold" style={{ color: 'rgba(245, 245, 245, 0.95)', letterSpacing: '-0.2px' }}>
              {profile.display_name || username}
            </h1>
            {profile.expertise_badge && (
              <CheckBadgeIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" style={{ marginTop: '-1px' }} />
            )}
          </div>
        </div>
        
        {/* Bio - 10px gap */}
        <p className="text-sm px-2" style={{ 
          color: 'rgba(255, 255, 255, 0.75)',
          fontSize: '15px',
          lineHeight: '1.4',
          opacity: 0.9,
          marginBottom: '8px'
        }}>
          {profile.bio || 'Make original the only standard.'}
        </p>

        {/* Location & Role - 14px to dashboard */}
        <div className="flex items-center justify-center gap-2 flex-wrap px-2" style={{ marginBottom: '14px' }}>
          <div className="flex items-center gap-1" style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px' }}>
            <MapPinIcon className="w-3.5 h-3.5" />
            <span>{profile.location || 'Paris, France'}</span>
          </div>
          
          <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '12px', opacity: 0.5 }}>•</div>
          
          <div className="flex items-center gap-1" style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px' }}>
            <BriefcaseIcon className="w-3.5 h-3.5" />
            <span>{profile.role || 'Creator'}</span>
          </div>
        </div>
      </div>

      {/* Dashboard Strip - Compact for owner only - Clickable to Analytics */}
      {isOwnProfile && !viewerMode && (
        <div 
          ref={dashboardRef}
          className="dashboard-strip"
          onClick={() => router.push('/analytics')}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            padding: '10px 16px 10px 24px',
            margin: '0 16px 8px',
            width: 'calc(100% - 32px)',
            height: '60px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.transform = 'scale(1.01)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <img 
              src="/webstar-logo.png"
              alt="webSTAR"
              className="dashboard-logo"
              style={{ 
                width: '36px',
                height: '36px',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 12px rgba(0, 194, 255, 0.2))',
                flexShrink: 0
              }}
            />
            <div 
              className="dashboard-info"
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start', 
                gap: '3px'
              }}
            >
              <div 
                className="dashboard-label"
                style={{ 
                  fontSize: '9px',
                  fontWeight: '700',
                  color: '#707070',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  lineHeight: '1'
                }}
              >
                MY DASHBOARD
              </div>
              <div 
                className="dashboard-value"
                style={{ 
                  fontSize: '18px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #00C2FF 0%, #0EA5E9 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: '1',
                  filter: 'drop-shadow(0 0 8px rgba(0, 194, 255, 0.15))'
                }}
              >
                {profile.total_points?.toLocaleString() || '12.5K'}
              </div>
            </div>
          </div>
          <div className="dashboard-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button 
              onClick={() => router.push('/drafts')}
              className="action-button"
              style={{
                width: '55px',
                height: '40px',
                borderRadius: '20px',
                background: '#2A2A2A',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid #414141',
                color: '#707070',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = '#f5f5f5';
                const img = e.currentTarget.querySelector('img');
                if (img) (img as HTMLImageElement).style.filter = 'invert(1) opacity(0.95)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2A2A2A';
                e.currentTarget.style.borderColor = '#414141';
                e.currentTarget.style.color = '#707070';
                const img = e.currentTarget.querySelector('img');
                if (img) (img as HTMLImageElement).style.filter = 'invert(1) opacity(0.44)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.94)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Drafts"
            >
              <img src="/layers.svg" alt="Drafts" style={{ width: '20px', height: '20px', filter: 'invert(1) opacity(0.44)' }} />
            </button>
            <button 
              className="action-button"
              style={{
                width: '55px',
                height: '40px',
                borderRadius: '20px',
                background: '#2A2A2A',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid #414141',
                color: '#707070',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = '#f5f5f5';
                const img = e.currentTarget.querySelector('img');
                if (img) (img as HTMLImageElement).style.filter = 'invert(1) opacity(0.95)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2A2A2A';
                e.currentTarget.style.borderColor = '#414141';
                e.currentTarget.style.color = '#707070';
                const img = e.currentTarget.querySelector('img');
                if (img) (img as HTMLImageElement).style.filter = 'invert(1) opacity(0.44)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.94)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Customize"
            >
              <img src="/palette.svg" alt="Customize" style={{ width: '20px', height: '20px', filter: 'invert(1) opacity(0.44)' }} />
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons - Compact */}
      <div style={{ padding: '0 16px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          {isOwnProfile && !viewerMode ? (
            <>
              <button 
                onClick={() => setShowShareModal(true)}
                className="action-btn custom-btn"
                style={{
                  flex: '0 0 calc(65% - 4px)',
                  height: '32px',
                  background: '#1F1F1F',
                  border: '1px solid #353535',
                  color: '#C7C7C7',
                  cursor: 'pointer',
                  padding: '5px 20px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'none',
                  letterSpacing: '-0.2px',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1F1F1F';
                  e.currentTarget.style.borderColor = '#353535';
                  e.currentTarget.style.color = '#C7C7C7';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.96)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Message Me
              </button>
              <button 
                className="action-btn"
                style={{
                  flex: '0 0 calc(35% - 4px)',
                  height: '32px',
                  background: '#1F1F1F',
                  border: '1px solid #353535',
                  color: '#C7C7C7',
                  cursor: 'pointer',
                  padding: '5px 20px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'none',
                  letterSpacing: '-0.2px',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1F1F1F';
                  e.currentTarget.style.borderColor = '#353535';
                  e.currentTarget.style.color = '#C7C7C7';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.96)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Email
              </button>
            </>
          ) : isOwnProfile && viewerMode ? (
            <>
              <button 
                onClick={() => setShowShareModal(true)}
                className="action-btn custom-btn"
                style={{
                  flex: '0 0 calc(65% - 4px)',
                  height: '32px',
                  background: '#1F1F1F',
                  border: '1px solid #353535',
                  color: '#C7C7C7',
                  cursor: 'pointer',
                  padding: '5px 20px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'none',
                  letterSpacing: '-0.2px',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1F1F1F';
                  e.currentTarget.style.borderColor = '#353535';
                  e.currentTarget.style.color = '#C7C7C7';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.96)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Message Me
              </button>
              <button 
                className="action-btn"
                style={{
                  flex: '0 0 calc(35% - 4px)',
                  height: '32px',
                  background: '#1F1F1F',
                  border: '1px solid #353535',
                  color: '#C7C7C7',
                  cursor: 'pointer',
                  padding: '5px 20px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'none',
                  letterSpacing: '-0.2px',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  textAlign: 'center',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1F1F1F';
                  e.currentTarget.style.borderColor = '#353535';
                  e.currentTarget.style.color = '#C7C7C7';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.96)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Email
              </button>
            </>
          ) : (
            <>
              <button className="flex-1 py-2 text-sm bg-cyan-500 hover:bg-cyan-600 rounded-xl font-semibold transition">
                Follow
              </button>
              <button className="flex-1 py-2 text-sm bg-gray-900 border border-gray-800 rounded-xl font-semibold transition">
                Message
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div 
        className="z-30 backdrop-blur-md border-b border-gray-800"
        style={{ background: 'rgba(17, 17, 17, 0.9)', marginTop: '28px' }}
      >
        <div className="flex relative">
          {/* Sliding indicator - solid color */}
          <div 
            className="absolute bottom-0 h-[3px] transition-transform duration-300 ease-out"
            style={{
              width: 'calc(100% / 3)',
              transform: `translateX(${['portfolio', 'projects', 'about'].indexOf(activeTab) * 100}%)`
            }}
          >
            <div className="w-[100px] h-full bg-cyan-500 mx-auto" />
          </div>
          
          {['Portfolio', 'Projects', 'About'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`flex-1 py-3 text-base font-semibold ${
                activeTab === tab.toLowerCase()
                  ? 'text-white'
                  : 'text-gray-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className={`${activeTab === 'portfolio' || activeTab === 'projects' ? 'pt-[5px]' : 'py-4 px-3'}`}>
        {activeTab === 'about' && (
          <AboutSection
            isOwnProfile={isOwnProfile}
            profile={profile}
            onUpdate={loadProfile}
          />
        )}

        {activeTab === 'portfolio' && (
          <div style={{ 
            margin: '0 auto',
            width: '100%',
            padding: '0 5px'
          }}>
            {portfolioItems.length > 0 ? (
              <div 
                className="portfolio-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '5px',
                  width: '100%'
                }}
              >
                {[...portfolioItems].reverse().map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      // Open feed modal for all content types
                      setFeedInitialPostId(item.id);
                      setShowFeedModal(true);
                    }}
                  >
                    <ContentDisplay 
                      item={item} 
                      isActive={false}
                      showAttachments={false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {isOwnProfile ? (
                  <>
                    <p className="mb-3 text-sm">Start showcasing your work</p>
                    <button
                      onClick={() => setShowCreateContentModal(true)}
                      className="px-5 py-2 text-sm bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition"
                    >
                      Add First Item
                    </button>
                  </>
                ) : (
                  <p className="text-sm">No portfolio items yet</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div style={{ padding: '5px' }}>
            {projects.length > 0 ? (
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px'
                }}
              >
                {[...projects].reverse().map((project) => (
                  <div 
                    key={project.id} 
                    onClick={() => {
                      setSelectedProject(project);
                      setShowProjectDetail(true);
                    }}
                    className="cursor-pointer transition-all active:scale-[0.97]"
                    style={{
                      background: '#1A1A1C',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Image Container with Badge - 4:3 aspect ratio */}
                    <div style={{ position: 'relative', aspectRatio: '4 / 3' }}>
                      {project.cover_image ? (
                        <img
                          src={project.cover_image}
                          alt={project.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div 
                          style={{
                            width: '100%',
                            height: '100%',
                            background: 'rgba(255, 255, 255, 0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                          </svg>
                        </div>
                      )}
                      
                      {/* Item Count Badge - smaller, better anchored */}
                      {project.media_count > 0 && (
                        <div 
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            minWidth: '24px',
                            height: '24px',
                            borderRadius: '12px',
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#FFFFFF'
                          }}
                        >
                          {project.media_count}
                        </div>
                      )}
                    </div>
                    
                    {/* Title Below Image - smaller text */}
                    <div style={{ padding: '10px 10px 12px' }}>
                      <h3 
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#FFFFFF',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.3'
                        }}
                      >
                        {project.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                {isOwnProfile ? (
                  <>
                    <p className="mb-3 text-sm">Create your first project</p>
                    <button
                      onClick={() => setShowProjectModal(true)}
                      className="px-5 py-2 text-sm bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition"
                    >
                      Create Project
                    </button>
                  </>
                ) : (
                  <p className="text-sm">No projects yet</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(17, 17, 17, 0.8)' }}
        >
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Share Your Profile</h3>
            <p className="text-gray-400 mb-6">
              Your unique profile link
            </p>
            <div className="bg-gray-800 rounded-lg p-4 mb-6 break-all text-sm text-gray-300">
              {`${typeof window !== 'undefined' ? window.location.origin : ''}/${username}`}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleShare}
                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 font-semibold rounded-lg transition"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateContentModal
        isOpen={showCreateContentModal}
        onClose={() => setShowCreateContentModal(false)}
        onSelectPost={(type) => {
          setSelectedPostType(type || null);
          setShowUploadModal(true);
        }}
        onSelectProject={() => setShowProjectModal(true)}
        navHeightReduction={heightReduction}
      />

      <UploadPortfolioModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedPostType(null);
        }}
        onSuccess={loadProfile}
        initialContentType={selectedPostType}
      />

      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSuccess={loadProfile}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <EditAboutModal
        isOpen={showEditAboutModal}
        onClose={() => setShowEditAboutModal(false)}
        onSuccess={loadProfile}
        currentData={{
          about: profile?.about ?? undefined,
          skills: profile?.skills ?? undefined,
          experience: profile?.experience ? JSON.parse(profile.experience) : [],
          social_links: profile?.social_links ? JSON.parse(profile.social_links) : {},
        }}
      />

      <PortfolioDetailModal
        item={selectedPortfolioItem}
        isOpen={showPortfolioDetail}
        onClose={() => {
          setShowPortfolioDetail(false);
          setSelectedPortfolioItem(null);
        }}
        authorUsername={username}
        authorDisplayName={profile?.display_name || username}
        authorProfilePicture={profile?.profile_picture ?? undefined}
        isOwnItem={isOwnProfile}
      />

      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Feed Modal */}
      <FeedModal
        isOpen={showFeedModal}
        onClose={() => {
          setShowFeedModal(false);
          setFeedInitialPostId(undefined);
          // DON'T clear audio - let it persist
        }}
        posts={portfolioItems}
        initialPostId={feedInitialPostId}
        profile={profile}
        currentAudioTrack={currentAudioTrack}
        onAudioTrackChange={setCurrentAudioTrack}
      />

      {/* Project Detail Modal */}
      <ProjectDetailModal
        isOpen={showProjectDetail}
        onClose={() => {
          setShowProjectDetail(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
      />

      {/* Mini Audio Player - Persistent at page level */}
      {currentAudioTrack && (
        <MiniPlayer
          track={currentAudioTrack}
          onClose={() => setCurrentAudioTrack(null)}
          onThumbnailClick={() => {
            // Open feed modal at the current audio track
            setFeedInitialPostId(currentAudioTrack.id);
            setShowFeedModal(true);
          }}
          onNext={() => {
            // Find next audio track
            const currentIndex = portfolioItems.findIndex(p => p.id === currentAudioTrack.id);
            const nextAudio = portfolioItems.slice(currentIndex + 1).find(p => p.content_type === 'audio');
            if (nextAudio && nextAudio.content_url) {
              setCurrentAudioTrack({
                id: nextAudio.id,
                title: nextAudio.title || 'Audio Track',
                url: nextAudio.content_url.startsWith('http') 
                  ? nextAudio.content_url 
                  : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${nextAudio.content_url}`,
                thumbnail: nextAudio.thumbnail_url || undefined
              });
            }
          }}
          onPrevious={() => {
            // Find previous audio track
            const currentIndex = portfolioItems.findIndex(p => p.id === currentAudioTrack.id);
            const prevAudio = portfolioItems.slice(0, currentIndex).reverse().find(p => p.content_type === 'audio');
            if (prevAudio && prevAudio.content_url) {
              setCurrentAudioTrack({
                id: prevAudio.id,
                title: prevAudio.title || 'Audio Track',
                url: prevAudio.content_url.startsWith('http') 
                  ? prevAudio.content_url 
                  : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${prevAudio.content_url}`,
                thumbnail: prevAudio.thumbnail_url || undefined
              });
            }
          }}
        />
      )}
    </div>
  );
}
