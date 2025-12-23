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
import { 
  Cog6ToothIcon, 
  EyeIcon, 
  PlusIcon,
  LinkIcon,
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
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-gray-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <button className="p-2">
            <PlusIcon className="w-6 h-6 text-white" />
          </button>
          
          <Link href="/" className="text-xl font-bold">
            webSTAR
          </Link>
          
          <div className="flex items-center gap-2">
            <button className="p-2 relative">
              <BellIcon className="w-6 h-6 text-white" />
              {isOwnProfile && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Cover Image Area */}
      <div className="relative">
        {/* Cover gradient */}
        <div className="h-32 sm:h-48 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/api/placeholder/1200/400')] bg-cover bg-center opacity-20" />
          
          {/* View and Settings Icons */}
          {isOwnProfile && (
            <div className="absolute top-4 left-4 right-4 flex justify-between">
              <button className="p-3 bg-gray-800/60 backdrop-blur-md rounded-full">
                <EyeIcon className="w-5 h-5 text-white" />
              </button>
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-3 bg-gray-800/60 backdrop-blur-md rounded-full"
              >
                <Cog6ToothIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Profile Picture - Overlapping */}
        <div className="relative px-4 -mt-16 sm:-mt-20 pb-4">
          <div className="flex items-end justify-between">
            <div className="relative">
              {profile.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt={profile.display_name || username}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-black object-cover"
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-black bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                  {(profile.display_name || username).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Points Badge - Desktop */}
            {isOwnProfile && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-full mb-2">
                <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs text-gray-400">MY DASHBOARD</div>
                  <div className="text-cyan-400 font-bold">{profile.total_points?.toLocaleString() || 0}</div>
                </div>
                <button className="p-1">
                  <LinkIcon className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{profile.display_name || username}</h1>
          {profile.expertise_badge && (
            <CheckBadgeIcon className="w-6 h-6 text-cyan-400" />
          )}
        </div>
        
        <p className="text-gray-400 mb-2">
          Make original the only standard.
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
          {profile.role && (
            <div className="flex items-center gap-1">
              <MapPinIcon className="w-4 h-4" />
              <span>Paris, France</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <BriefcaseIcon className="w-4 h-4" />
            <span>Creator</span>
          </div>
        </div>

        {/* Points Badge - Mobile */}
        {isOwnProfile && (
          <div className="sm:hidden flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <div className="flex-1">
              <div className="text-xs text-gray-400 uppercase tracking-wide">My Dashboard</div>
              <div className="text-2xl font-bold text-cyan-400">{profile.total_points?.toLocaleString() || '12.5K'}</div>
            </div>
            <button className="p-2">
              <LinkIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          {isOwnProfile ? (
            <>
              <button 
                onClick={() => setShowShareModal(true)}
                className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl font-semibold transition"
              >
                Message Me
              </button>
              <button className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl font-semibold transition">
                Email
              </button>
            </>
          ) : (
            <>
              <button className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl font-semibold transition">
                Follow
              </button>
              <button className="flex-1 py-3 bg-gray-900 border border-gray-800 rounded-xl font-semibold transition">
                Message
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[57px] z-30 bg-black/90 backdrop-blur-md border-b border-gray-800">
        <div className="flex">
          {['Portfolio', 'Projects', 'About'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`flex-1 py-4 font-semibold transition relative ${
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
      <div className="px-4 py-6">
        {activeTab === 'about' && (
          <div className="space-y-8">
            {/* Edit Button for Own Profile */}
            {isOwnProfile && (
              <button
                onClick={() => setShowEditAboutModal(true)}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl transition"
              >
                Edit Profile
              </button>
            )}

            {/* About Section */}
            {profile.about && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="font-semibold mb-3 text-white text-lg">About</h3>
                <p className="text-gray-400 leading-relaxed">{profile.about}</p>
              </div>
            )}

            {/* Experience Section */}
            {profile.experience && (() => {
              try {
                const experiences = JSON.parse(profile.experience);
                if (experiences && experiences.length > 0) {
                  return (
                    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                      <h3 className="font-semibold mb-4 text-white text-lg">Experience</h3>
                      <div className="space-y-6">
                        {experiences.map((exp: any, index: number) => (
                          <div key={index} className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:bg-cyan-500 before:rounded-full">
                            <h4 className="font-semibold text-white">{exp.title}</h4>
                            <p className="text-cyan-400 text-sm">{exp.company}</p>
                            <p className="text-gray-500 text-sm mb-2">{exp.period}</p>
                            {exp.description && (
                              <p className="text-gray-400 text-sm leading-relaxed">{exp.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              } catch {}
              return null;
            })()}

            {/* Skills Section */}
            {profile.skills && (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="font-semibold mb-4 text-white text-lg">Skills</h3>
                <div className="space-y-4">
                  {profile.skills.split(',').map((skill, index) => {
                    const level = 85 + (index * 3); // Sample levels
                    return (
                      <div key={skill}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{skill.trim()}</span>
                          <span className="text-cyan-400 font-bold">{level}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full transition-all"
                            style={{ width: `${level}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Connect Section */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="font-semibold mb-4 text-white text-lg">Connect</h3>
              <div className="grid grid-cols-3 gap-4">
                {(() => {
                  // Parse social_links JSON
                  let socialLinks: any = {};
                  try {
                    if (profile.social_links) {
                      socialLinks = JSON.parse(profile.social_links);
                    }
                  } catch (e) {
                    // If parsing fails, use empty object
                    socialLinks = {};
                  }

                  return [
                    { icon: '📧', label: 'Email', url: socialLinks.email ? `mailto:${socialLinks.email}` : null },
                    { icon: '💼', label: 'LinkedIn', url: profile.linkedin_url },
                    { icon: '📸', label: 'Instagram', url: profile.instagram_url },
                    { icon: '🎵', label: 'TikTok', url: socialLinks.tiktok || null },
                    { icon: '📺', label: 'YouTube', url: socialLinks.youtube || null },
                    { icon: '𝕏', label: 'X', url: socialLinks.twitter || null },
                  ].map((link) => (
                    link.url ? (
                      <a
                        key={link.label}
                        href={link.url}
                        target={link.url.startsWith('mailto:') ? '_self' : '_blank'}
                        rel={link.url.startsWith('mailto:') ? '' : 'noopener noreferrer'}
                        className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition"
                      >
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                          {link.icon}
                        </div>
                        <span className="text-xs text-gray-400">{link.label}</span>
                      </a>
                    ) : null
                  ));
                })()}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 bg-gray-800 hover:bg-gray-750 rounded-xl transition"
                  >
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                      🌐
                    </div>
                    <span className="text-xs text-gray-400">Website</span>
                  </a>
                )}
              </div>
            </div>

            {/* Empty State */}
            {!profile.about && !profile.skills && !profile.experience && isOwnProfile && (
              <div className="text-center py-12 text-gray-500">
                <p className="mb-4">Complete your profile to stand out!</p>
                <button
                  onClick={() => setShowEditAboutModal(true)}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold transition"
                >
                  Add Information
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Portfolio</h2>
              <div className="flex items-center gap-2">
                {isOwnProfile && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="p-2 bg-cyan-500 rounded-lg"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                )}
                <div className="flex bg-gray-900 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-cyan-500' : ''}`}
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-cyan-500' : ''}`}
                  >
                    <ListBulletIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {portfolioItems.length > 0 ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-4' : 'space-y-4'}>
                {portfolioItems.map((item) => (
                  <div key={item.id} className="bg-gray-900 rounded-xl overflow-hidden group cursor-pointer">
                    <div className={`${viewMode === 'grid' ? 'aspect-square' : 'aspect-video'} bg-gray-800 relative overflow-hidden`}>
                      {item.content_type === 'photo' && item.content_url && (
                        <img
                          src={item.content_url}
                          alt={item.title || 'Portfolio item'}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      )}
                      {item.content_type === 'video' && item.content_url && (
                        <video src={item.content_url} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    {item.title && viewMode === 'list' && (
                      <div className="p-4">
                        <h3 className="font-semibold">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                {isOwnProfile ? (
                  <>
                    <p className="mb-4">Start showcasing your work</p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl font-semibold transition"
                    >
                      Add First Item
                    </button>
                  </>
                ) : (
                  <p>No portfolio items yet</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Projects</h2>
              {isOwnProfile && (
                <button
                  onClick={() => setShowProjectModal(true)}
                  className="p-2 bg-cyan-500 rounded-lg"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {projects.length > 0 ? (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="bg-gray-900 rounded-xl overflow-hidden">
                    {project.cover_image && (
                      <div className="aspect-video bg-gray-800">
                        <img
                          src={project.cover_image}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold flex-1">{project.title}</h3>
                        <span className="px-2 py-1 bg-gray-800 rounded text-xs">24</span>
                      </div>
                      {project.description && (
                        <p className="text-gray-400 text-sm mb-3">{project.description}</p>
                      )}
                      {project.tags && (
                        <div className="flex flex-wrap gap-2">
                          {project.tags.split(',').slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-3 py-1 bg-gray-800 rounded-full text-xs"
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
              <div className="text-center py-16 text-gray-500">
                {isOwnProfile ? (
                  <>
                    <p className="mb-4">Create your first project</p>
                    <button
                      onClick={() => setShowProjectModal(true)}
                      className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl font-semibold transition"
                    >
                      Create Project
                    </button>
                  </>
                ) : (
                  <p>No projects yet</p>
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
          about: profile?.about,
          skills: profile?.skills,
          experience: profile?.experience ? JSON.parse(profile.experience) : [],
          social_links: profile?.social_links ? JSON.parse(profile.social_links) : {},
        }}
      />
    </div>
  );
}
