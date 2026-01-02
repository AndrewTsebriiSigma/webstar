'use client';

import { useState, useEffect } from 'react';
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
  CheckBadgeIcon,
  RectangleStackIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

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
  
  const isOwnProfile = user?.username === username;

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      const profileRes = await profileAPI.getByUsername(username);
      setProfile(profileRes.data);

      const portfolioRes = await portfolioAPI.getUserItems(username);
      setPortfolioItems(portfolioRes.data);

      const projectsRes = await projectsAPI.getUserProjects(username);
      setProjects(projectsRes.data);

      if (isOwnProfile) {
        const pointsRes = await economyAPI.getPoints();
        setPoints(pointsRes.data);

        const metricsRes = await analyticsAPI.getProfileAnalytics();
        setMetrics(metricsRes.data);
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
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
      {/* Mobile Header - Hidden in viewer mode */}
      {!viewerMode && (
        <header 
          className="sticky top-0 z-40 backdrop-blur-md border-b border-gray-800"
          style={{ background: 'rgba(17, 17, 17, 0.9)' }}
        >
          <div className="px-3 py-2 flex items-center justify-between">
            {isOwnProfile ? (
              <button 
                onClick={() => setShowCreateContentModal(true)}
                className="p-1.5"
              >
                <PlusIcon className="w-5 h-5 text-white" />
              </button>
            ) : (
              <div className="w-8"></div>
            )}
            
            <Link href="/" className="text-lg font-bold">
              webSTAR
            </Link>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowNotifications(true)}
                className="p-1.5 relative"
              >
                <BellIcon className="w-5 h-5 text-white" />
                {isOwnProfile && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-cyan-500 rounded-full flex items-center justify-center text-[8px] font-bold">
                    3
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Cover Image Area - webSTAR: 176px height */}
      <div className="relative">
        <div className="h-44 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 relative overflow-hidden">
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
                className={`w-9 h-9 rounded-full flex items-center justify-center ${viewerMode ? 'bg-cyan-500' : ''}`}
                style={{ 
                  background: viewerMode ? '#00C2FF' : 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  color: '#FFFFFF',
                  transition: 'all 150ms cubic-bezier(0.22, 0.61, 0.36, 1)'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title={viewerMode ? 'Exit viewer mode' : 'Enter viewer mode'}
              >
                <EyeIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  color: '#FFFFFF',
                  transition: 'all 150ms cubic-bezier(0.22, 0.61, 0.36, 1)'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title="Settings"
              >
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Avatar - webSTAR: 144px, -80px overlap */}
        <div className="relative px-4 -mt-20">
          <div className="flex items-center justify-center">
            {profile.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt={profile.display_name || username}
                className="w-36 h-36 rounded-full object-cover"
                style={{
                  border: '6px solid #111111',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
                }}
              />
            ) : (
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold"
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
      <div className="profile-info" style={{ padding: '12px 24px 32px', textAlign: 'center' }}>
        {/* Name + Badge */}
        <div className="flex items-center justify-center gap-1.5 mb-1 pt-3">
          <h1 className="text-xl font-bold" style={{ color: 'rgba(245, 245, 245, 0.95)', letterSpacing: '-0.2px' }}>
            {profile.display_name || username}
          </h1>
          {profile.expertise_badge && (
            <CheckBadgeIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          )}
        </div>
        
        {/* Bio - Smaller font */}
        <p className="text-sm mb-3 px-2" style={{ 
          color: 'rgba(255, 255, 255, 0.75)',
          fontSize: '15px',
          lineHeight: '1.4',
          opacity: 0.9
        }}>
          {profile.bio || 'Make original the only standard.'}
        </p>

        {/* Location & Role - Compact */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-3 px-2">
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

      {/* Dashboard Strip - Compact for owner only */}
      {isOwnProfile && (
        <div 
          className="dashboard-strip"
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
            margin: '0 16px 3px',
            width: 'calc(100% - 32px)',
            height: '60px'
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
                gap: '8px'
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
              onClick={() => router.push('/profile/edit')}
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
                if (img) (img as HTMLImageElement).style.filter = 'invert(1) brightness(0.26)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.94)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Portfolio"
            >
              <img src="/layers.svg" alt="Portfolio" style={{ width: '20px', height: '20px', filter: 'invert(1) brightness(0.26)', transition: 'filter 0.1s ease-out' }} />
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
                if (img) (img as HTMLImageElement).style.filter = 'invert(1) brightness(0.26)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.94)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Customize"
            >
              <img src="/palette.svg" alt="Customize" style={{ width: '20px', height: '20px', filter: 'invert(1) brightness(0.26)', transition: 'filter 0.1s ease-out' }} />
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons - Compact */}
      <div style={{ padding: '0 16px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          {isOwnProfile ? (
            <>
              <button 
                onClick={() => setShowShareModal(true)}
                className="action-btn custom-btn"
                style={{
                  flex: '0 0 calc(65% - 4px)',
                  height: '30px',
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
                  height: '30px',
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
        className="sticky top-[49px] z-30 backdrop-blur-md border-b border-gray-800"
        style={{ background: 'rgba(17, 17, 17, 0.9)' }}
      >
        <div className="flex">
          {['Portfolio', 'Projects', 'About'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`flex-1 py-3 text-sm font-semibold transition relative ${
                activeTab === tab.toLowerCase()
                  ? 'text-white'
                  : 'text-gray-500'
              }`}
            >
              {tab}
              {activeTab === tab.toLowerCase() && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-3 py-4">
        {activeTab === 'about' && (
          <AboutSection
            isOwnProfile={isOwnProfile}
            profile={profile}
            onUpdate={loadProfile}
          />
        )}

        {activeTab === 'portfolio' && (
          <div style={{ 
            maxWidth: '430px', 
            margin: '0 auto',
            width: '100%',
            padding: '0 12px'
          }}>
            {portfolioItems.length > 0 ? (
              <div 
                className="portfolio-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
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
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Projects</h2>
            </div>

            {projects.length > 0 ? (
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                  padding: '0'
                }}
              >
                {[...projects].reverse().map((project) => (
                  <div 
                    key={project.id} 
                    onClick={() => {
                      setSelectedProject(project);
                      setShowProjectDetail(true);
                    }}
                    className="bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition"
                    style={{
                      aspectRatio: '4 / 5',
                      position: 'relative'
                    }}
                  >
                    {project.cover_image && (
                      <img
                        src={project.cover_image}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div 
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '16px',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                        color: '#FFFFFF'
                      }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold flex-1">{project.title}</h3>
                        <span className="px-2 py-0.5 rounded text-xs ml-2" style={{ background: 'rgba(17, 17, 17, 0.5)' }}>24</span>
                      </div>
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
        onSelectPost={() => setShowUploadModal(true)}
        onSelectProject={() => setShowProjectModal(true)}
      />

      <UploadPortfolioModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={loadProfile}
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
          setCurrentAudioTrack(null); // Clear audio when closing feed
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
    </div>
  );
}
