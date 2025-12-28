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
import AboutSection from '@/components/AboutSection';
import CreateContentModal from '@/components/CreateContentModal';
import NotificationsPanel from '@/components/NotificationsPanel';
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
  CheckBadgeIcon
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
  const [hideHeaderText, setHideHeaderText] = useState(false);
  
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
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
    <div className="min-h-screen bg-black text-white">
      {/* Mobile Header */}
      {!hideHeaderText && (
        <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-gray-800">
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
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center text-[10px] font-bold">
                    3
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Cover Image Area */}
      <div className="relative">
        {/* Cover gradient */}
        <div className={`${hideHeaderText ? 'h-48 sm:h-64' : 'h-24 sm:h-36'} bg-gradient-to-br from-cyan-500/20 to-blue-500/20 relative overflow-hidden transition-all duration-300`}>
          <div className="absolute inset-0 bg-[url('/api/placeholder/1200/400')] bg-cover bg-center opacity-20" />
          
          {/* View and Settings Icons */}
          {isOwnProfile && (
            <div className="absolute top-2 left-2 right-2 flex justify-between">
              <button 
                onClick={() => setHideHeaderText(!hideHeaderText)}
                className="p-2 bg-gray-800/60 backdrop-blur-md rounded-full hover:bg-gray-700/60 transition"
              >
                <EyeIcon className="w-4 h-4 text-white" />
              </button>
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-2 bg-gray-800/60 backdrop-blur-md rounded-full hover:bg-gray-700/60 transition"
              >
                <Cog6ToothIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Profile Picture - Overlapping */}
        <div className={`relative px-3 pb-3 transition-all duration-300 ${hideHeaderText ? '-mt-20 sm:-mt-24' : '-mt-12 sm:-mt-16'}`}>
          <div className="flex items-end justify-between">
            <div className="relative">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.display_name || username}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 border-black object-cover"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 border-black bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {(profile.display_name || username).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Points Badge - Desktop */}
            {isOwnProfile && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-full mb-1">
                <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">MY DASHBOARD</div>
                  <div className="text-sm text-cyan-400 font-bold">{profile.total_points?.toLocaleString() || 0}</div>
                </div>
                <button 
                  onClick={() => router.push('/profile/edit')}
                  className="p-1 hover:bg-gray-800 rounded transition"
                  title="Edit profile"
                >
                  <PencilIcon className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      {!hideHeaderText && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold">{profile.display_name || username}</h1>
            {profile.expertise_badge && (
              <CheckBadgeIcon className="w-5 h-5 text-cyan-400" />
            )}
          </div>
          
          <p className="text-sm text-gray-400 mb-2">
            Make original the only standard.
          </p>

          <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
            {profile.role && (
              <div className="flex items-center gap-1">
                <MapPinIcon className="w-3.5 h-3.5" />
                <span>Paris, France</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <BriefcaseIcon className="w-3.5 h-3.5" />
              <span>Creator</span>
            </div>
          </div>

          {/* Points Badge - Mobile */}
          {isOwnProfile && (
            <div className="sm:hidden flex items-center gap-2 p-3 bg-gray-900 border border-gray-800 rounded-xl mb-3">
              <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <div className="flex-1">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">My Dashboard</div>
                <div className="text-xl font-bold text-cyan-400">{profile.total_points?.toLocaleString() || '12.5K'}</div>
              </div>
              <button 
                onClick={() => router.push('/profile/edit')}
                className="p-1.5 hover:bg-gray-800 rounded transition"
                title="Edit profile"
              >
                <PencilIcon className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            {isOwnProfile ? (
              <>
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg font-semibold transition"
                >
                  Message Me
                </button>
                <button className="flex-1 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg font-semibold transition">
                  Email
                </button>
              </>
            ) : (
              <>
                <button className="flex-1 py-2 text-sm bg-cyan-500 hover:bg-cyan-600 rounded-lg font-semibold transition">
                  Follow
                </button>
                <button className="flex-1 py-2 text-sm bg-gray-900 border border-gray-800 rounded-lg font-semibold transition">
                  Message
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="sticky top-[49px] z-30 bg-black/90 backdrop-blur-md border-b border-gray-800">
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
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Portfolio</h2>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-900 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-cyan-500' : ''}`}
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-cyan-500' : ''}`}
                  >
                    <ListBulletIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {portfolioItems.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
                {portfolioItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-gray-900 rounded-lg overflow-hidden group cursor-pointer"
                    onClick={() => {
                      setSelectedPortfolioItem(item);
                      setShowPortfolioDetail(true);
                    }}
                  >
                    <div className={`${viewMode === 'grid' ? 'aspect-square' : 'aspect-video'} bg-gray-800 relative overflow-hidden`}>
                      {item.content_type === 'photo' && item.content_url && (
                        <img
                          src={item.content_url.startsWith('http') ? item.content_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${item.content_url}`}
                          alt={'Portfolio item'}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            console.error('Failed to load image:', item.content_url);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      {item.content_type === 'video' && item.content_url && (
                        <video 
                          src={item.content_url.startsWith('http') ? item.content_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${item.content_url}`}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      )}
                      {item.content_type === 'audio' && item.content_url && (
                        <div className="flex items-center justify-center w-full h-full bg-gray-800">
                          <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                        </div>
                      )}
                      {item.content_type === 'link' && item.content_url && (
                        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                          <LinkIcon className="w-10 h-10 text-cyan-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition" />
                    </div>
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
              <div className="space-y-3">
                {projects.map((project) => (
                  <div key={project.id} className="bg-gray-900 rounded-lg overflow-hidden">
                    {project.cover_image && (
                      <div className="aspect-video bg-gray-800">
                        <img
                          src={project.cover_image}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-1.5">
                        <h3 className="text-base font-semibold flex-1">{project.title}</h3>
                        <span className="px-2 py-0.5 bg-gray-800 rounded text-xs">24</span>
                      </div>
                      {project.description && (
                        <p className="text-gray-400 text-xs mb-2">{project.description}</p>
                      )}
                      {project.tags && (
                        <div className="flex flex-wrap gap-1.5">
                          {project.tags.split(',').slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gray-800 rounded-full text-xs"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
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
    </div>
  );
}
