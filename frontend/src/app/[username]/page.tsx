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
  PaintBrushIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  FlagIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

// Action Button type for customizable profile buttons
interface ActionButton {
  id: string;
  label: string;
  url: string;
  type: 'link' | 'email' | 'message';
}

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
  const [totalViews, setTotalViews] = useState<number>(0);
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
  const [skipToPostTypes, setSkipToPostTypes] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [viewerMode, setViewerMode] = useState(false);
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [feedInitialPostId, setFeedInitialPostId] = useState<number | undefined>(undefined);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<any>(null);
  const [isMiniPlayerMuted, setIsMiniPlayerMuted] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [navPushUp, setNavPushUp] = useState(0);
  
  // Customization panel state
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(3);
  const [gridGap, setGridGap] = useState(5); // 0-20px
  const [gridRadius, setGridRadius] = useState(0); // 0-24px
  const [layoutMode, setLayoutMode] = useState<'uniform' | 'masonry'>('uniform');
  const [gridAspectRatio, setGridAspectRatio] = useState<'1x1' | '4x5' | '5x4' | '4x6' | '3x4' | '16x9' | '4x3'>('1x1'); // Global aspect ratio for grid mode
  
  // Profile theme customization
  type ProfileTheme = 'default' | 'monochrome';
  const [profileTheme, setProfileTheme] = useState<ProfileTheme>('default');
  
  // Size picker state for portfolio items
  type WidgetSize = '1x1' | '4x5' | '5x4' | '4x6' | '3x4' | '16x9' | '4x3';
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [selectedItemForResize, setSelectedItemForResize] = useState<PortfolioItem | null>(null);
  const [sizePickerPosition, setSizePickerPosition] = useState({ x: 0, y: 0 });
  
  // Action buttons customization state - empty by default, users add their own
  const [actionButtons, setActionButtons] = useState<ActionButton[]>([]);
  const [editingButtonId, setEditingButtonId] = useState<string | null>(null);
  
  // Profile info editing state (in customize mode)
  const [editedName, setEditedName] = useState('');
  const [editedBio, setEditedBio] = useState('');
  const [editedLocation, setEditedLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<Array<{place_name: string; id: string}>>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [editedRole, setEditedRole] = useState('');
  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  
  const dashboardRef = useRef<HTMLDivElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const isOwnProfile = user?.username === username;
  
  // Scroll animation calculations
  const heightReduction = Math.min(scrollY / 100, 1);
  const isScrolled = scrollY > 5;

  // Load grid customization from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`portfolio_customization_${username}`);
      if (saved) {
        try {
          const { gridColumns: gc, gridGap: gg, gridRadius: gr, layoutMode: lm, gridAspectRatio: gar, theme: th } = JSON.parse(saved);
          if (gc) setGridColumns(gc);
          if (gg !== undefined) setGridGap(gg);
          if (gr !== undefined) setGridRadius(gr);
          if (lm) setLayoutMode(lm);
          if (gar) setGridAspectRatio(gar);
          if (th) setProfileTheme(th);
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
  }, [username]);

  // Save grid customization to localStorage when changed (only for own profile)
  useEffect(() => {
    if (isOwnProfile && typeof window !== 'undefined') {
      localStorage.setItem(`portfolio_customization_${username}`, JSON.stringify({
        gridColumns,
        gridGap,
        gridRadius,
        layoutMode,
        gridAspectRatio,
        theme: profileTheme
      }));
    }
  }, [gridColumns, gridGap, gridRadius, layoutMode, gridAspectRatio, profileTheme, isOwnProfile, username]);

  useEffect(() => {
    loadProfile();
  }, [username]);

  // Fetch analytics when user loads (isOwnProfile might be false initially)
  useEffect(() => {
    if (isOwnProfile && totalViews === 0) {
      // User just loaded, fetch analytics
      const fetchAnalytics = async () => {
        try {
          const dailyRes = await analyticsAPI.getDailyAnalytics();
          const total = dailyRes.data.reduce((sum: number, d: { profile_views: number }) => sum + d.profile_views, 0);
          setTotalViews(total);
        } catch (e) {
          console.error('Failed to fetch analytics:', e);
        }
      };
      fetchAnalytics();
    }
  }, [isOwnProfile]);

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

  // Widget size helper - converts size to aspect ratio
  const getAspectRatio = (size: WidgetSize | string | null | undefined): number => {
    switch (size) {
      case '1x1': return 1;        // Square
      case '4x5': return 0.8;      // Portrait
      case '5x4': return 1.25;     // Landscape
      case '4x6': return 0.66;     // Tall
      case '3x4': return 0.75;     // Tall Portrait
      case '16x9': return 1.777;   // Widescreen
      case '4x3': return 1.333;    // Landscape
      default: return 0.8;         // Default to 4:5 portrait
    }
  };

  // Size picker label helper
  const getSizeLabel = (size: WidgetSize): string => {
    switch (size) {
      case '1x1': return '1:1';
      case '4x5': return '4:5';
      case '5x4': return '5:4';
      case '4x6': return '4:6';
      case '3x4': return '3:4';
      case '16x9': return '16:9';
      case '4x3': return '4:3';
      default: return '4:5';
    }
  };

  // Handle right-click context menu for size picker
  const handleItemContextMenu = (e: React.MouseEvent, item: PortfolioItem) => {
    if (isOwnProfile && showCustomizePanel) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedItemForResize(item);
      setShowSizePicker(true);
      // Position picker near the click
      const rect = e.currentTarget.getBoundingClientRect();
      setSizePickerPosition({ 
        x: Math.min(rect.left, window.innerWidth - 180), 
        y: Math.min(rect.bottom + 8, window.innerHeight - 200)
      });
    }
  };

  // Handle size change for portfolio item
  const handleSizeChange = async (newSize: WidgetSize) => {
    if (!selectedItemForResize) return;
    
    try {
      if (layoutMode === 'uniform') {
        // Grid mode: update global aspect ratio (affects ALL items uniformly)
        setGridAspectRatio(newSize);
        toast.success('Grid aspect ratio updated');
      } else {
        // Masonry mode: update individual item's aspect ratio
        await portfolioAPI.updateItem(selectedItemForResize.id, { aspect_ratio: newSize });
        
        // Update local state
        setPortfolioItems(prev => prev.map(item => 
          item.id === selectedItemForResize.id 
            ? { ...item, aspect_ratio: newSize }
            : item
        ));
        
        toast.success('Size updated');
      }
    } catch (error) {
      console.error('Failed to update size:', error);
      toast.error('Failed to update size');
    }
    
    setShowSizePicker(false);
    setSelectedItemForResize(null);
  };

  // Handle playing media in mini-player (for video/audio)
  const handlePlayInMiniPlayer = (item: PortfolioItem) => {
    if (item.content_url) {
      setCurrentAudioTrack({
        id: item.id,
        title: item.title || (item.content_type === 'video' ? 'Video' : 'Audio Track'),
        url: item.content_url.startsWith('http') 
          ? item.content_url 
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${item.content_url}`,
        thumbnail: item.thumbnail_url || undefined
      });
    }
  };

  const loadProfile = async (forceRefresh = false) => {
    // Check cache first (5 minute TTL) for instant page loads
    const cacheKey = `profile_${username}`;
    
    // Skip cache if forceRefresh is true (e.g., after creating new content)
    if (!forceRefresh) {
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
            if (data.totalViews !== undefined) setTotalViews(data.totalViews);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        // Cache read failed, proceed with API calls
      }
    } else {
      // Clear cache when force refreshing
      sessionStorage.removeItem(cacheKey);
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
      let totalViewsData = 0;
      
      if (isOwnProfile) {
        const [pointsRes, metricsRes, dailyRes] = await Promise.allSettled([
          economyAPI.getPoints(),
          analyticsAPI.getProfileAnalytics(),
          analyticsAPI.getDailyAnalytics()
        ]);

        if (pointsRes.status === 'fulfilled') {
          pointsData = pointsRes.value.data;
          setPoints(pointsData);
        }
        if (metricsRes.status === 'fulfilled') {
          metricsData = metricsRes.value.data;
          setMetrics(metricsData);
        }
        // Calculate total views from daily analytics (same as analytics page)
        if (dailyRes.status === 'fulfilled') {
          const dailyData = dailyRes.value.data;
          totalViewsData = dailyData.reduce((sum: number, d: { profile_views: number }) => sum + d.profile_views, 0);
          setTotalViews(totalViewsData);
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
            metrics: metricsData,
            totalViews: totalViewsData
          },
          timestamp: Date.now()
        }));
      } catch (e) {
        // Cache write failed (e.g., storage full), not critical
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      
      // Check if this is a 404 for the user's OWN profile (corrupted OAuth session)
      // This happens when OAuth creates a user with temp username but profile doesn't exist
      const is404 = error?.response?.status === 404;
      const isOwnBrokenProfile = user?.username === username;
      
      if (is404 && isOwnBrokenProfile) {
        // Corrupted session - user's profile doesn't exist in database
        // Clear localStorage and redirect to login to break the redirect loop
        toast.error('Your session was corrupted. Please sign in again.');
        logout();
        router.push('/auth/login');
        return;
      }
      
      toast.error('Failed to load profile');
      setLoading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/${username}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
  };

  // Action button handlers
  const handleAddButton = () => {
    if (actionButtons.length >= 4) {
      toast.error('Maximum 4 buttons allowed');
      return;
    }
    const newButton: ActionButton = {
      id: Date.now().toString(),
      label: 'New Button',
      url: '',
      type: 'link'
    };
    setActionButtons([...actionButtons, newButton]);
    setEditingButtonId(newButton.id);
  };

  const handleUpdateButton = (id: string, updates: Partial<ActionButton>) => {
    setActionButtons(buttons => 
      buttons.map(btn => btn.id === id ? { ...btn, ...updates } : btn)
    );
  };

  const handleDeleteButton = (id: string) => {
    setActionButtons(buttons => buttons.filter(btn => btn.id !== id));
    if (editingButtonId === id) {
      setEditingButtonId(null);
    }
  };

  const handleButtonClick = (button: ActionButton) => {
    if (button.type === 'email' && button.url) {
      window.location.href = `mailto:${button.url}`;
    } else if (button.type === 'message') {
      setShowShareModal(true);
    } else if (button.url) {
      window.open(button.url, '_blank');
    }
  };

  const getButtonSizeClass = (index: number, total: number) => {
    if (total === 2) {
      return index === 0 ? 'btn-primary-70' : 'btn-secondary-30';
    } else if (total === 3) {
      return 'btn-third';
    } else if (total === 4) {
      return 'btn-quarter';
    }
    return '';
  };

  // Profile info editing handlers
  const initializeProfileEditing = () => {
    if (profile) {
      setEditedName(profile.display_name || username);
      setEditedBio(profile.bio || '');
      setEditedLocation(profile.location || '');
      setEditedRole(profile.role || '');
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const setUploading = type === 'profile' ? setIsUploadingProfilePic : setIsUploadingBanner;
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('media_type', 'photo');

      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/uploads/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');
      
      const uploadData = await uploadResponse.json();
      const imageUrl = uploadData.url;

      // Update profile with new image
      const updateData = type === 'profile' 
        ? { profile_picture: imageUrl }
        : { banner_image: imageUrl };

      await profileAPI.updateMe(updateData);
      
      // Refresh profile
      const response = await profileAPI.getByUsername(username);
      setProfile(response.data);
      
      toast.success(`${type === 'profile' ? 'Profile picture' : 'Banner'} updated!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      // Reset input
      if (e.target) e.target.value = '';
    }
  };

  const saveProfileInfo = async () => {
    if (!profile) return;
    
    try {
      await profileAPI.updateMe({
        display_name: editedName || profile.display_name,
        bio: editedBio,
        location: editedLocation,
        role: editedRole
      });
      
      // Refresh profile
      const response = await profileAPI.getByUsername(username);
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save changes');
    }
  };

  // Auto-save profile info on blur
  const handleProfileFieldBlur = () => {
    saveProfileInfo();
  };

  // Mapbox location search
  const MAPBOX_TOKEN = 'pk.eyJ1Ijoid2Vic3RhcnVzZXIiLCJhIjoiY21rNmF2NDluMDFzaDNlcG5tOHVzN2xsMCJ9.VZVvRWxM2wScW3M1D299fQ';

  const searchLocation = async (query: string) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      setShowLocationDropdown(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood,address&limit=5`
      );
      const data = await response.json();
      
      if (data.features) {
        setLocationSuggestions(
          data.features.map((feature: any) => ({
            place_name: feature.place_name,
            id: feature.id
          }))
        );
        setShowLocationDropdown(true);
      }
    } catch (error) {
      console.error('Location search error:', error);
      setLocationSuggestions([]);
    }
  };

  const handleLocationSelect = (placeName: string) => {
    setEditedLocation(placeName);
    setShowLocationDropdown(false);
    setLocationSuggestions([]);
    // Auto-save after selection
    handleProfileFieldBlur();
  };

  // Report profile handler
  const handleReportSubmit = async () => {
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }
    
    setReportSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${baseUrl}/api/profiles/${username}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription || null
        })
      });

      if (response.ok) {
        toast.success('Report submitted. Our team will review it.');
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to submit report');
      }
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
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

  // Theme CSS variables
  const themeStyles = profileTheme === 'monochrome' ? {
    '--blue': '#FFFFFF',
    '--blue-hover': '#E5E5E5',
    '--blue-pressed': '#CCCCCC',
    '--blue-10': 'rgba(255, 255, 255, 0.1)',
    '--blue-20': 'rgba(255, 255, 255, 0.2)',
  } as React.CSSProperties : {};

  return (
    <div 
      className={`min-h-screen text-white ${profileTheme === 'monochrome' ? 'theme-monochrome' : ''}`} 
      style={{ 
        background: '#111111',
        ...themeStyles
      }}
    >
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

      {/* Hidden file inputs for image uploads */}
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleProfileImageUpload(e, 'banner')}
      />
      <input
        ref={profilePicInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleProfileImageUpload(e, 'profile')}
      />

      {/* Customize Mode Indicator Bar */}
      {isOwnProfile && showCustomizePanel && (
        <div 
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: 'linear-gradient(90deg, rgba(0, 194, 255, 0.15), rgba(123, 104, 238, 0.15))',
            borderBottom: '1px solid rgba(0, 194, 255, 0.3)',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: '#00C2FF',
                animation: 'pulse 2s infinite'
              }} 
            />
            <span style={{ color: '#00C2FF', fontSize: '13px', fontWeight: 600 }}>
              Customize Mode
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
              Tap elements to edit
            </span>
          </div>
          <button
            onClick={() => {
              saveProfileInfo();
              setShowCustomizePanel(false);
              toast.success('Changes saved!');
            }}
            style={{
              background: 'linear-gradient(135deg, #00C2FF, #7B68EE)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 16px',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.15s ease'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Done
          </button>
        </div>
      )}

      {/* Cover Image Area - webSTAR: 176px height */}
      <div className="relative">
        <div 
          className={`h-40 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 relative overflow-hidden ${isOwnProfile && showCustomizePanel ? 'magic-editable-container' : ''}`}
          style={{
            cursor: isOwnProfile && showCustomizePanel ? 'pointer' : 'default'
          }}
          onClick={() => {
            if (isOwnProfile && showCustomizePanel && !isUploadingBanner) {
              bannerInputRef.current?.click();
            }
          }}
        >
          {profile.banner_image ? (
            <img
              src={profile.banner_image}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/30 via-blue-500/20 to-purple-600/30" />
          )}
          
          {/* Banner upload overlay - shows in customize mode */}
          {isOwnProfile && showCustomizePanel && (
            <div 
              className="absolute inset-0 flex items-center justify-center transition-all duration-300"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                pointerEvents: 'none',
                borderBottom: '3px solid #57BFF9',
                boxShadow: 'inset 0 0 30px rgba(87, 191, 249, 0.2)'
              }}
            >
              {isUploadingBanner ? (
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#57BFF9]"></div>
              ) : (
                <div className="flex flex-col items-center gap-2" style={{ color: '#57BFF9' }}>
                  <div 
                    className="rounded-full p-3"
                    style={{ 
                      background: 'rgba(87, 191, 249, 0.15)', 
                      border: '2px solid #57BFF9',
                      animation: 'magicShimmer 2s infinite ease-in-out'
                    }}
                  >
                    <CameraIcon className="w-8 h-8" />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 600, textShadow: '0 0 10px rgba(87, 191, 249, 0.5)' }}>
                    Click to Change Banner
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Viewer Mode & Settings - Bigger buttons - Always on top */}
          {isOwnProfile && (
            <div className="absolute top-4 left-4 right-4 flex justify-between" style={{ zIndex: 10 }}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setViewerMode(!viewerMode);
                }}
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
              {/* Hide settings gear icon in viewer mode */}
              {!viewerMode && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettingsModal(true);
                  }}
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
              )}
            </div>
          )}
        </div>

        {/* Avatar - 166px, 2/3 banner overlap (110px) */}
        <div className="relative px-4 -mt-[110px]">
          <div className="flex items-center justify-center">
            <div 
              className="relative"
              style={{
                cursor: isOwnProfile && showCustomizePanel ? 'pointer' : 'default'
              }}
              onClick={() => {
                if (isOwnProfile && showCustomizePanel && !isUploadingProfilePic) {
                  profilePicInputRef.current?.click();
                }
              }}
            >
            {profile.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt={profile.display_name || username}
                  className={`w-[150px] h-[150px] rounded-full object-cover ${isOwnProfile && showCustomizePanel ? 'magic-editable' : ''}`}
                style={{
                  border: '6px solid #111111',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
                }}
              />
            ) : (
                <div className={`w-[150px] h-[150px] rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold ${isOwnProfile && showCustomizePanel ? 'magic-editable' : ''}`}
                style={{
                  border: '6px solid #111111',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
                }}
              >
                {(profile.display_name || username).charAt(0).toUpperCase()}
              </div>
              )}
              
              {/* Profile picture upload overlay */}
              {isOwnProfile && showCustomizePanel && (
                <div 
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    pointerEvents: 'none'
                  }}
                >
                  {isUploadingProfilePic ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  ) : (
                    <CameraIcon className="w-10 h-10" style={{ color: '#57BFF9' }} />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info - Compact design */}
      <div className="profile-info" style={{ padding: viewerMode ? '0 24px 12px' : '0 24px 12px', textAlign: 'center' }}>
        {/* Name + Badge - Centered together as unit */}
        <div className="flex items-center justify-center pt-2" style={{ marginBottom: '14px' }}>
          <div className="inline-flex items-center gap-1.5">
            {isOwnProfile && showCustomizePanel ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleProfileFieldBlur}
                placeholder="Your name"
                className="text-xl font-bold text-center magic-editable"
                style={{ 
                  color: 'rgba(245, 245, 245, 0.95)', 
                  letterSpacing: '-0.2px',
                  background: 'transparent',
                  borderRadius: '8px',
                  padding: '4px 12px',
                  minWidth: '120px',
                  maxWidth: '250px'
                }}
              />
            ) : (
            <h1 className="text-xl font-bold" style={{ color: 'rgba(245, 245, 245, 0.95)', letterSpacing: '-0.2px' }}>
              {profile.display_name || username}
            </h1>
            )}
            {profile.expertise_badge && (
              <CheckBadgeIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" style={{ marginTop: '-1px' }} />
            )}
          </div>
        </div>
        
        {/* Bio - 10px gap */}
        {isOwnProfile && showCustomizePanel ? (
          <textarea
            value={editedBio}
            onChange={(e) => setEditedBio(e.target.value)}
            onBlur={handleProfileFieldBlur}
            placeholder="Write your bio..."
            rows={2}
            className="text-sm px-2 w-full magic-editable"
            style={{ 
              color: 'rgba(255, 255, 255, 0.75)',
              fontSize: '15px',
              lineHeight: '1.4',
              marginBottom: '8px',
              background: 'transparent',
              borderRadius: '8px',
              padding: '8px 12px',
              resize: 'none',
              textAlign: 'center'
            }}
          />
        ) : (
        <p className="text-sm px-2" style={{ 
          color: 'rgba(255, 255, 255, 0.75)',
          fontSize: '15px',
          lineHeight: '1.4',
          opacity: 0.9,
          marginBottom: '8px'
        }}>
          {profile.bio || 'Make original the only standard.'}
        </p>
        )}

        {/* Location & Role - 14px to dashboard */}
        <div className="flex items-center justify-center gap-2 flex-wrap px-2" style={{ marginBottom: '14px' }}>
          <div className="flex items-center gap-1 relative" style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px' }}>
            <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {isOwnProfile && showCustomizePanel ? (
              <div className="relative">
                <input
                  type="text"
                  value={editedLocation}
                  onChange={(e) => {
                    setEditedLocation(e.target.value);
                    searchLocation(e.target.value);
                  }}
                  onFocus={() => {
                    if (locationSuggestions.length > 0) setShowLocationDropdown(true);
                  }}
                  onBlur={() => {
                    // Delay to allow click on dropdown
                    setTimeout(() => setShowLocationDropdown(false), 200);
                  }}
                  placeholder="Search location..."
                  className="magic-editable"
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.75)',
                    fontSize: '13px',
                    background: 'transparent',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    minWidth: '150px'
                  }}
                />
                {/* Location dropdown */}
                {showLocationDropdown && locationSuggestions.length > 0 && (
                  <div 
                    className="absolute left-0 mt-1 rounded-lg overflow-hidden shadow-xl"
                    style={{
                      background: 'rgba(20, 25, 35, 0.98)',
                      border: '1px solid rgba(87, 191, 249, 0.3)',
                      backdropFilter: 'blur(20px)',
                      zIndex: 100,
                      minWidth: '280px',
                      top: '100%'
                    }}
                  >
                    {locationSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => handleLocationSelect(suggestion.place_name)}
                        className="w-full text-left px-3 py-2 transition-all duration-150 hover:bg-[#57BFF9]/20"
                        style={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontSize: '13px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-[#57BFF9] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{suggestion.place_name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
            <span>{profile.location || 'Paris, France'}</span>
            )}
          </div>
          
          <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '12px', opacity: 0.5 }}>•</div>
          
          <div className="flex items-center gap-1" style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '13px' }}>
            <BriefcaseIcon className="w-3.5 h-3.5 flex-shrink-0" />
            {isOwnProfile && showCustomizePanel ? (
              <input
                type="text"
                value={editedRole}
                onChange={(e) => setEditedRole(e.target.value)}
                onBlur={handleProfileFieldBlur}
                placeholder="Role"
                className="magic-editable"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.75)',
                  fontSize: '13px',
                  background: 'transparent',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  width: '100px'
                }}
              />
            ) : (
            <span>{profile.role || 'Creator'}</span>
            )}
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
                {totalViews.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="dashboard-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* ================================================================
                FEATURE_DISABLED: DRAFTS
                ================================================================
                Drafts feature temporarily hidden for V1 release.
                To re-enable: uncomment the button below.
                Backend endpoints remain active: /api/portfolio/drafts, /api/projects/drafts
                Route still accessible: /drafts (for testing)
                ================================================================
            <button 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/drafts');
              }}
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
            END FEATURE_DISABLED: DRAFTS */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const newState = !showCustomizePanel;
                setShowCustomizePanel(newState);
                // Initialize or reset editing states
                if (newState) {
                  initializeProfileEditing();
                } else {
                  setEditingButtonId(null);
                  // Save any pending profile changes
                  saveProfileInfo();
                }
              }}
              className="action-button"
              style={{
                width: '55px',
                height: '40px',
                borderRadius: '20px',
                background: showCustomizePanel ? '#57BFF9' : '#2A2A2A',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: showCustomizePanel ? '1px solid #57BFF9' : '1px solid #414141',
                color: showCustomizePanel ? '#FFFFFF' : '#707070',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: 0
              }}
              onMouseEnter={(e) => {
                if (!showCustomizePanel) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = '#f5f5f5';
                const img = e.currentTarget.querySelector('img');
                if (img) (img as HTMLImageElement).style.filter = 'invert(1) opacity(0.95)';
                }
              }}
              onMouseLeave={(e) => {
                if (!showCustomizePanel) {
                e.currentTarget.style.background = '#2A2A2A';
                e.currentTarget.style.borderColor = '#414141';
                e.currentTarget.style.color = '#707070';
                const img = e.currentTarget.querySelector('img');
                if (img) (img as HTMLImageElement).style.filter = 'invert(1) opacity(0.44)';
                }
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.94)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Customize"
            >
              <img src="/palette.svg" alt="Customize" style={{ width: '20px', height: '20px', filter: showCustomizePanel ? 'invert(1) opacity(1)' : 'invert(1) opacity(0.44)' }} />
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons - Editable in Customize Mode */}
      <div 
        className={`dashboard-actions-wrapper ${isOwnProfile && showCustomizePanel ? 'customize-active' : ''}`}
                style={{
          position: 'relative',
          padding: isOwnProfile && showCustomizePanel ? '12px' : '0 16px',
          marginBottom: isOwnProfile && showCustomizePanel ? '20px' : '12px',
          marginLeft: isOwnProfile && showCustomizePanel ? '16px' : '0',
          marginRight: isOwnProfile && showCustomizePanel ? '16px' : '0',
          background: isOwnProfile && showCustomizePanel ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
          border: isOwnProfile && showCustomizePanel ? '1px solid rgba(0, 194, 255, 0.25)' : 'none',
          borderRadius: isOwnProfile && showCustomizePanel ? '16px' : '0',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Action Buttons Row */}
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          {isOwnProfile ? (
            // Owner view - dynamic buttons (clickable in customize mode)
            <>
              {/* Empty state placeholder when no buttons and not in customize mode */}
              {actionButtons.length === 0 && !showCustomizePanel && (
                <div 
                style={{
                    flex: 1,
                  height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  Tap Customize to add action buttons
                </div>
              )}
              {actionButtons.map((button, index) => (
              <button 
                  key={button.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (showCustomizePanel) {
                      // Toggle editing this button
                      setEditingButtonId(editingButtonId === button.id ? null : button.id);
                    } else {
                      handleButtonClick(button);
                    }
                  }}
                  className={`action-btn ${getButtonSizeClass(index, actionButtons.length)}`}
                style={{
                    flex: actionButtons.length === 2 
                      ? (index === 0 ? '0 0 calc(65% - 4px)' : '0 0 calc(35% - 4px)')
                      : actionButtons.length === 3 
                      ? '1 1 33.333%'
                      : actionButtons.length === 4
                      ? '1 1 25%'
                      : '1 1 100%',
                  height: '32px',
                    background: showCustomizePanel && editingButtonId === button.id 
                      ? 'rgba(0, 194, 255, 0.15)' 
                      : '#1F1F1F',
                    border: showCustomizePanel && editingButtonId === button.id 
                      ? '1px solid rgba(0, 194, 255, 0.5)' 
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    color: showCustomizePanel && editingButtonId === button.id 
                      ? '#00C2FF' 
                      : 'rgba(255, 255, 255, 0.75)',
                  cursor: 'pointer',
                    padding: '5px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'none',
                  letterSpacing: '-0.2px',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    textAlign: 'center'
                }}
                onMouseEnter={(e) => {
                    if (!showCustomizePanel) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 1)';
                    } else if (editingButtonId !== button.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.3)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!showCustomizePanel) {
                  e.currentTarget.style.background = '#1F1F1F';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                    } else if (editingButtonId !== button.id) {
                      e.currentTarget.style.background = '#1F1F1F';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }
                }}
                onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                  {button.label}
              </button>
              ))}
              
              {/* Add Button - shows as a button slot when < 4 buttons */}
              {showCustomizePanel && actionButtons.length < 4 && (
              <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddButton();
                  }}
                style={{
                    flex: actionButtons.length === 0 ? '1 1 100%' : actionButtons.length === 1 ? '0 0 calc(35% - 4px)' : '0 0 auto',
                    minWidth: actionButtons.length === 0 ? 'auto' : '60px',
                  height: '32px',
                    background: 'transparent',
                    border: '1.5px dashed rgba(0, 194, 255, 0.4)',
                    color: '#00C2FF',
                  cursor: 'pointer',
                    padding: '5px 12px',
                  borderRadius: '12px',
                    fontSize: '13px',
                  fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 194, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.6)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.4)';
                  }}
                >
                  <PlusIcon style={{ width: '14px', height: '14px', strokeWidth: 2.5 }} />
                  Add
              </button>
              )}
              
              {/* Copy Link Button - Always visible for owner */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Profile link copied!');
                }}
                style={{
                  height: '32px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  padding: '5px 12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                }}
                title="Copy profile link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Copy Link
              </button>
            </>
          ) : (
            // Visitor view - Follow & Copy Link buttons
            <>
              <button 
                onClick={() => {
                  if (!user) {
                    // Guest user - redirect to auth with return URL
                    sessionStorage.setItem('returnAfterAuth', `/${username}`);
                    router.push('/auth');
                    return;
                  }
                  // TODO: Implement actual follow logic when backend is ready
                  toast.success(`Following ${profile?.display_name || username}!`);
                }}
                className="flex-1 py-2 text-sm bg-cyan-500 hover:bg-cyan-600 rounded-xl font-semibold transition"
              >
                Follow
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Profile link copied!');
                }}
                className="flex-1 py-2 text-sm rounded-xl font-semibold transition flex items-center justify-center gap-2"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.06)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)' 
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Copy Link
              </button>
              <button 
                onClick={() => {
                  if (!user) {
                    // Guest user - redirect to auth with return URL
                    sessionStorage.setItem('returnAfterAuth', `/${username}`);
                    router.push('/auth');
                    return;
                  }
                  setShowReportModal(true);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl transition"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)' 
                }}
                title="Report profile"
              >
                <FlagIcon style={{ width: '18px', height: '18px', color: 'rgba(255, 255, 255, 0.5)' }} />
              </button>
            </>
          )}
        </div>

        {/* Inline Button Editor - appears below when editing a button */}
        {isOwnProfile && showCustomizePanel && editingButtonId && (
          <div 
            style={{
              marginTop: '10px',
              padding: '12px',
              background: 'rgba(0, 194, 255, 0.06)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 194, 255, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {actionButtons.filter(b => b.id === editingButtonId).map(button => (
              <div key={button.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Label Input */}
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px', display: 'block' }}>
                    Label
                  </label>
                  <input
                    type="text"
                    value={button.label}
                    onChange={(e) => handleUpdateButton(button.id, { label: e.target.value })}
                    placeholder="Button text"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#FFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
                
                {/* Type Select */}
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px', display: 'block' }}>
                    Type
                  </label>
                  <select
                    value={button.type}
                    onChange={(e) => handleUpdateButton(button.id, { type: e.target.value as ActionButton['type'] })}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#FFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    <option value="link">Link</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                
                {/* URL/Email Input */}
                {button.type !== 'message' && (
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: '4px', display: 'block' }}>
                      {button.type === 'email' ? 'Email Address' : 'URL'}
                    </label>
                    <input
                      type={button.type === 'email' ? 'email' : 'url'}
                      value={button.url}
                      onChange={(e) => handleUpdateButton(button.id, { url: e.target.value })}
                      placeholder={button.type === 'email' ? 'your@email.com' : 'https://...'}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#FFF',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}
                
                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteButton(button.id)}
                  style={{
                    width: '100%',
                    marginTop: '4px',
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(255, 59, 48, 0.1)',
                    border: '1px solid rgba(255, 59, 48, 0.2)',
                    color: '#FF3B30',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 150ms ease'
                  }}
                >
                  <TrashIcon style={{ width: '14px', height: '14px' }} />
                  Delete Button
                </button>
              </div>
            ))}
          </div>
        )}
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
      <div className={`${activeTab === 'portfolio' ? 'pt-[5px]' : activeTab === 'projects' ? '' : 'py-4 px-3'}`}>
        {activeTab === 'about' && (
          <AboutSection
            isOwnProfile={isOwnProfile}
            isCustomizeMode={showCustomizePanel}
            profile={profile}
            onUpdate={() => loadProfile(true)}
          />
        )}

        {activeTab === 'portfolio' && (
          <div style={{ 
            margin: '0 auto',
            width: '100%',
            padding: '10px'
          }}>
            {/* Grid Customization Controls - Figma Template */}
            {isOwnProfile && !viewerMode && showCustomizePanel && (
              <div 
                className="portfolio-customizer-inline"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  marginBottom: '8px',
                  boxSizing: 'border-box'
                }}
              >
                {/* Row 1: Column Count & Layout Mode */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '34px' }}>
                  {/* Column Buttons (2x, 3x, 4x) */}
                  {[2, 3, 4].map((cols) => (
                    <button
                      key={cols}
                      onClick={() => setGridColumns(cols as 2 | 3 | 4)}
                      style={{
                        flex: 1,
                        minWidth: '42px',
                        height: '32px',
                        background: gridColumns === cols ? 'rgba(0, 194, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: gridColumns === cols ? '1px solid #00C2FF' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        color: gridColumns === cols ? '#00C2FF' : 'rgba(255, 255, 255, 0.65)',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        flexShrink: 0
                      }}
                    >
                      {cols}x
                    </button>
                  ))}
                  
                  {/* Divider */}
                  <div style={{ width: '1px', height: '22px', background: 'rgba(255, 255, 255, 0.08)', flexShrink: 0 }} />
                  
                  {/* Layout Mode Buttons */}
                  {/* Uniform Grid */}
                  <button
                    onClick={() => setLayoutMode('uniform')}
                    style={{
                      width: '42px',
                      height: '32px',
                      background: layoutMode === 'uniform' ? 'rgba(0, 194, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: layoutMode === 'uniform' ? '1px solid #00C2FF' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={layoutMode === 'uniform' ? '#00C2FF' : 'rgba(255,255,255,0.65)'} strokeWidth="2.5">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </button>
                  
                  {/* Masonry Grid */}
                  <button
                    onClick={() => setLayoutMode('masonry')}
                    style={{
                      width: '42px',
                      height: '32px',
                      background: layoutMode === 'masonry' ? 'rgba(0, 194, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: layoutMode === 'masonry' ? '1px solid #00C2FF' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      padding: 0,
                      flexShrink: 0
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={layoutMode === 'masonry' ? '#00C2FF' : 'rgba(255,255,255,0.65)'} stroke="none">
                      <rect x="3" y="3" width="7" height="10" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="15" width="7" height="6" rx="1" />
                      <rect x="14" y="12" width="7" height="9" rx="1" />
                    </svg>
                  </button>
                </div>
                
                {/* Row 2: Gap & Radius Sliders */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '34px' }}>
                  {/* Gap Slider Group */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      color: 'rgba(255, 255, 255, 0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>Gap</span>
                    <input
                      type="range"
                      min="0"
                      max="16"
                      value={gridGap}
                      onChange={(e) => setGridGap(parseInt(e.target.value))}
                      style={{
                        flex: 1,
                        height: '4px',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #00C2FF 0%, #00C2FF ${(gridGap / 16) * 100}%, rgba(255,255,255,0.08) ${(gridGap / 16) * 100}%, rgba(255,255,255,0.08) 100%)`,
                        borderRadius: '2px',
                        cursor: 'pointer',
                        minWidth: '50px',
                        outline: 'none'
                      }}
                      className="compact-slider"
                    />
                  </div>
                  
                  {/* Divider */}
                  <div style={{ width: '1px', height: '22px', background: 'rgba(255, 255, 255, 0.08)', flexShrink: 0 }} />
                  
                  {/* Radius Slider Group */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      color: 'rgba(255, 255, 255, 0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.3px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>Radius</span>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      value={gridRadius}
                      onChange={(e) => setGridRadius(parseInt(e.target.value))}
                      style={{
                        flex: 1,
                        height: '4px',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #00C2FF 0%, #00C2FF ${(gridRadius / 24) * 100}%, rgba(255,255,255,0.08) ${(gridRadius / 24) * 100}%, rgba(255,255,255,0.08) 100%)`,
                        borderRadius: '2px',
                        cursor: 'pointer',
                        minWidth: '50px',
                        outline: 'none'
                      }}
                      className="compact-slider"
                    />
                  </div>
                </div>
                
                {/* Row 3: Theme Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '34px' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    color: 'rgba(255, 255, 255, 0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    whiteSpace: 'nowrap'
                  }}>Theme</span>
                  
                  {/* Theme Options */}
                  <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                    <button
                      onClick={() => setProfileTheme('default')}
                      style={{
                        flex: 1,
                        height: '32px',
                        background: profileTheme === 'default' ? 'rgba(0, 194, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: profileTheme === 'default' ? '1px solid #00C2FF' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        color: profileTheme === 'default' ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #00C2FF, #7B68EE)'
                      }} />
                      Color
                    </button>
                    <button
                      onClick={() => setProfileTheme('monochrome')}
                      style={{
                        flex: 1,
                        height: '32px',
                        background: profileTheme === 'monochrome' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        border: profileTheme === 'monochrome' ? '1px solid rgba(255, 255, 255, 0.6)' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        color: profileTheme === 'monochrome' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FFFFFF, #888888)'
                      }} />
                      B&W
                    </button>
                  </div>
                </div>
              </div>
            )}

            {portfolioItems.length > 0 ? (
              <div 
                className="portfolio-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
                  gridAutoRows: layoutMode === 'masonry' ? '10px' : 'auto',
                  gridAutoFlow: layoutMode === 'masonry' ? 'dense' : 'row',
                  gap: `${gridGap}px`,
                  width: '100%'
                }}
              >
                {[...portfolioItems].reverse().map((item, index) => {
                  // Masonry: every 5th item is featured (taller)
                  const isFeatured = layoutMode === 'masonry' && index % 5 === 0;
                  
                  // Determine aspect ratio based on mode:
                  // Grid mode: ALL items use global gridAspectRatio
                  // Masonry mode: each item uses its own aspect_ratio
                  const displayRatio = layoutMode === 'uniform'
                    ? getAspectRatio(gridAspectRatio)
                    : (isFeatured ? 0.5 : getAspectRatio(item.aspect_ratio as WidgetSize));
                  
                  // Calculate row span for masonry (accounts for gaps to prevent overlaps)
                  // Formula: rows = (height + gap) / (rowUnit + gap)
                  const calculateRowSpan = (ratio: number): number => {
                    const estimatedColWidth = 400 / gridColumns; // Approximate column width
                    const desiredHeight = estimatedColWidth / ratio;
                    const rowUnit = 10; // gridAutoRows: 10px
                    // Correct formula accounting for gaps between rows
                    return Math.ceil((desiredHeight + gridGap) / (rowUnit + gridGap));
                  };
                  
                  const rowSpan = layoutMode === 'masonry' ? calculateRowSpan(displayRatio) : 1;
                  
                  return (
                  <div 
                    key={item.id} 
                      className={`portfolio-grid-item ${showCustomizePanel && isOwnProfile ? 'customize-mode' : ''} ${selectedItemForResize?.id === item.id ? 'selected-for-resize' : ''}`}
                    onClick={() => {
                        // Only open feed modal if not in customize mode or if click wasn't a right-click
                        if (!showCustomizePanel) {
                      setFeedInitialPostId(item.id);
                      setShowFeedModal(true);
                        }
                      }}
                      onContextMenu={(e) => handleItemContextMenu(e, item)}
                      style={{
                        gridColumn: 'span 1',
                        gridRow: layoutMode === 'masonry' ? `span ${rowSpan}` : 'span 1',
                        borderRadius: gridRadius === 0 ? '0px' : `${gridRadius}px`,
                        overflow: 'hidden',
                        position: 'relative',
                        // Grid mode: use aspectRatio CSS for clean rendering
                        // Masonry mode: height controlled by gridRow span only
                        aspectRatio: layoutMode === 'uniform' ? displayRatio : undefined,
                        cursor: showCustomizePanel && isOwnProfile ? 'context-menu' : 'pointer',
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: selectedItemForResize?.id === item.id 
                          ? '2px solid #00C2FF' 
                          : showCustomizePanel && isOwnProfile 
                            ? '1px solid rgba(0, 194, 255, 0.3)' 
                            : 'none'
                    }}
                  >
                    <ContentDisplay 
                      item={item} 
                      isActive={false}
                      showAttachments={false}
                        customRadius={gridRadius}
                        onPlayInMiniPlayer={handlePlayInMiniPlayer}
                        currentPlayingTrackId={currentAudioTrack?.id}
                        isMiniPlayerMuted={isMiniPlayerMuted}
                        onToggleMiniPlayerMute={() => setIsMiniPlayerMuted(!isMiniPlayerMuted)}
                      />
                      
                      {/* Customize mode corner indicators */}
                      {showCustomizePanel && isOwnProfile && (
                        <>
                          <div className="customize-indicator" style={{ position: 'absolute', top: '6px', left: '6px', width: '8px', height: '8px', background: 'rgba(0, 194, 255, 0.6)', borderRadius: '50%', pointerEvents: 'none' }} />
                          <div className="customize-indicator" style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: 'rgba(0, 194, 255, 0.6)', borderRadius: '50%', pointerEvents: 'none' }} />
                          <div className="customize-indicator" style={{ position: 'absolute', bottom: '6px', left: '6px', width: '8px', height: '8px', background: 'rgba(0, 194, 255, 0.6)', borderRadius: '50%', pointerEvents: 'none' }} />
                          <div className="customize-indicator" style={{ position: 'absolute', bottom: '6px', right: '6px', width: '8px', height: '8px', background: 'rgba(0, 194, 255, 0.6)', borderRadius: '50%', pointerEvents: 'none' }} />
                          
                          {/* Size badge showing current aspect ratio */}
                          <div style={{
                            position: 'absolute',
                            bottom: '6px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(8px)',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: 600,
                            color: '#00C2FF',
                            pointerEvents: 'none'
                          }}>
                            {getSizeLabel((item.aspect_ratio as WidgetSize) || '4x5')}
                  </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '280px',
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                {isOwnProfile ? (
                  <>
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'rgba(255, 255, 255, 0.35)', 
                      fontWeight: 400,
                      margin: 0,
                      marginBottom: '16px',
                      lineHeight: 1.4
                    }}>
                      Show what you do here
                    </p>
                    <button
                      onClick={() => {
                        setSkipToPostTypes(true);
                        setShowCreateContentModal(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'transparent',
                        color: 'rgba(255, 255, 255, 0.4)',
                        width: '130px',
                        height: '48px',
                        fontSize: '13px',
                        fontWeight: 500,
                        borderRadius: '12px',
                        border: '1px dashed rgba(255, 255, 255, 0.15)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      + Add Post
                    </button>
                  </>
                ) : (
                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.35)' }}>No portfolio items yet</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'projects' && (
          <div style={{ 
            margin: '0 auto',
            width: '100%',
            padding: '10px'
          }}>
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
                      // Navigate to project page with slug URL
                      const projectSlug = project.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      router.push(`/projects/${projectSlug}`);
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
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '280px',
                padding: '48px 24px',
                textAlign: 'center'
              }}>
                {isOwnProfile ? (
                  <>
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'rgba(255, 255, 255, 0.35)', 
                      fontWeight: 400,
                      margin: 0,
                      marginBottom: '16px',
                      lineHeight: 1.4
                    }}>
                      Tell bigger stories with projects
                    </p>
                    <button
                      onClick={() => setShowProjectModal(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: 'transparent',
                        color: 'rgba(255, 255, 255, 0.4)',
                        width: '130px',
                        height: '48px',
                        fontSize: '13px',
                        fontWeight: 500,
                        borderRadius: '12px',
                        border: '1px dashed rgba(255, 255, 255, 0.15)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      + Add Project
                    </button>
                  </>
                ) : (
                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.35)' }}>No projects yet</p>
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
        onClose={() => {
          setShowCreateContentModal(false);
          setSkipToPostTypes(false);
        }}
        onSelectPost={(type) => {
          setSelectedPostType(type || null);
          setShowUploadModal(true);
        }}
        onSelectProject={() => setShowProjectModal(true)}
        navHeightReduction={heightReduction}
        defaultPostExpanded={skipToPostTypes}
      />

      <UploadPortfolioModal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedPostType(null);
        }}
        onSuccess={() => loadProfile(true)}
        initialContentType={selectedPostType}
      />

      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onSuccess={() => loadProfile(true)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <EditAboutModal
        isOpen={showEditAboutModal}
        onClose={() => setShowEditAboutModal(false)}
        onSuccess={() => loadProfile(true)}
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
        onPlayInMiniPlayer={handlePlayInMiniPlayer}
        isMiniPlayerMuted={isMiniPlayerMuted}
        onToggleMiniPlayerMute={() => setIsMiniPlayerMuted(!isMiniPlayerMuted)}
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
          isMuted={isMiniPlayerMuted}
          onMuteChange={setIsMiniPlayerMuted}
        />
      )}

      {/* Report Profile Modal */}
      {showReportModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
          onClick={(e) => e.target === e.currentTarget && setShowReportModal(false)}
        >
          <div 
            className="rounded-2xl p-6 max-w-md w-full mx-4"
            style={{ 
              background: '#1C1C1E',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                Report Profile
              </h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition"
              >
                <XMarkIcon className="w-5 h-5" style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
              </button>
            </div>
            
            <p className="text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Help us understand what's wrong with @{username}'s profile.
            </p>
            
            <div className="space-y-2 mb-4">
              {[
                { id: 'spam', label: 'Spam or misleading', icon: '🚫' },
                { id: 'harassment', label: 'Harassment or bullying', icon: '😤' },
                { id: 'inappropriate', label: 'Inappropriate content', icon: '⚠️' },
                { id: 'fake', label: 'Fake profile or impersonation', icon: '🎭' },
                { id: 'copyright', label: 'Copyright violation', icon: '©️' },
                { id: 'other', label: 'Other', icon: '📝' }
              ].map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setReportReason(reason.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition"
                  style={{
                    background: reportReason === reason.id ? 'rgba(0, 194, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: reportReason === reason.id ? '1px solid rgba(0, 194, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <span>{reason.icon}</span>
                  <span style={{ color: reportReason === reason.id ? '#00C2FF' : 'rgba(255, 255, 255, 0.7)' }}>
                    {reason.label}
                  </span>
                </button>
              ))}
            </div>
            
            <textarea
              placeholder="Additional details (optional)..."
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              className="w-full p-3 rounded-xl mb-4 text-sm resize-none"
              rows={3}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.9)'
              }}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReportSubmit}
                disabled={!reportReason || reportSubmitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition"
                style={{ background: '#FF3B30', color: '#FFF' }}
              >
                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Size Picker Popup - Compact 2x3 grid matching Figma design */}
      {showSizePicker && selectedItemForResize && (
        <>
          {/* Invisible overlay to catch clicks outside */}
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999
            }}
            onClick={() => {
              setShowSizePicker(false);
              setSelectedItemForResize(null);
            }}
          />
          
          {/* Compact Size Picker Popup */}
          <div 
            style={{
              position: 'fixed',
              left: `${sizePickerPosition.x}px`,
              top: `${sizePickerPosition.y}px`,
              zIndex: 1000,
              background: 'rgba(40, 40, 42, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '14px',
              padding: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              animation: 'sizePickerPop 0.15s ease-out'
            }}
          >
            {/* 2x3 Size Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px'
            }}>
              {/* Row 1 */}
              {/* 1:1 Square */}
              <button
                onClick={() => handleSizeChange('1x1')}
                style={{
                  width: '52px',
                  height: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (selectedItemForResize.aspect_ratio || '4x5') === '1x1' 
                    ? 'rgba(0, 194, 255, 0.15)' 
                    : 'rgba(60, 60, 62, 0.8)',
                  border: (selectedItemForResize.aspect_ratio || '4x5') === '1x1' 
                    ? '2px solid #00C2FF' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: `2px solid ${(selectedItemForResize.aspect_ratio || '4x5') === '1x1' ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)'}`,
                  borderRadius: '3px'
                }} />
              </button>
              
              {/* 4:5 Portrait (default) */}
              <button
                onClick={() => handleSizeChange('4x5')}
                style={{
                  width: '52px',
                  height: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (selectedItemForResize.aspect_ratio || '4x5') === '4x5' 
                    ? 'rgba(0, 194, 255, 0.15)' 
                    : 'rgba(60, 60, 62, 0.8)',
                  border: (selectedItemForResize.aspect_ratio || '4x5') === '4x5' 
                    ? '2px solid #00C2FF' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '16px',
                  height: '20px',
                  border: `2px solid ${(selectedItemForResize.aspect_ratio || '4x5') === '4x5' ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)'}`,
                  borderRadius: '3px'
                }} />
              </button>
              
              {/* 16:9 Wide */}
              <button
                onClick={() => handleSizeChange('16x9')}
                style={{
                  width: '52px',
                  height: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (selectedItemForResize.aspect_ratio || '4x5') === '16x9' 
                    ? 'rgba(0, 194, 255, 0.15)' 
                    : 'rgba(60, 60, 62, 0.8)',
                  border: (selectedItemForResize.aspect_ratio || '4x5') === '16x9' 
                    ? '2px solid #00C2FF' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '26px',
                  height: '14px',
                  border: `2px solid ${(selectedItemForResize.aspect_ratio || '4x5') === '16x9' ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)'}`,
                  borderRadius: '2px'
                }} />
              </button>
              
              {/* Row 2 */}
              {/* 4:6 Tall */}
              <button
                onClick={() => handleSizeChange('4x6')}
                style={{
                  width: '52px',
                  height: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (selectedItemForResize.aspect_ratio || '4x5') === '4x6' 
                    ? 'rgba(0, 194, 255, 0.15)' 
                    : 'rgba(60, 60, 62, 0.8)',
                  border: (selectedItemForResize.aspect_ratio || '4x5') === '4x6' 
                    ? '2px solid #00C2FF' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '14px',
                  height: '22px',
                  border: `2px solid ${(selectedItemForResize.aspect_ratio || '4x5') === '4x6' ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)'}`,
                  borderRadius: '3px'
                }} />
              </button>
              
              {/* More options (3 dots) - could be 5:4 */}
              <button
                onClick={() => handleSizeChange('5x4')}
                style={{
                  width: '52px',
                  height: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  background: (selectedItemForResize.aspect_ratio || '4x5') === '5x4' 
                    ? 'rgba(0, 194, 255, 0.15)' 
                    : 'rgba(60, 60, 62, 0.8)',
                  border: (selectedItemForResize.aspect_ratio || '4x5') === '5x4' 
                    ? '2px solid #00C2FF' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Landscape icon */}
                <div style={{
                  width: '22px',
                  height: '18px',
                  border: `2px solid ${(selectedItemForResize.aspect_ratio || '4x5') === '5x4' ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)'}`,
                  borderRadius: '3px'
                }} />
              </button>
              
              {/* 4:3 Standard */}
              <button
                onClick={() => handleSizeChange('4x3')}
                style={{
                  width: '52px',
                  height: '52px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: (selectedItemForResize.aspect_ratio || '4x5') === '4x3' 
                    ? 'rgba(0, 194, 255, 0.15)' 
                    : 'rgba(60, 60, 62, 0.8)',
                  border: (selectedItemForResize.aspect_ratio || '4x5') === '4x3' 
                    ? '2px solid #00C2FF' 
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Expand arrows icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={(selectedItemForResize.aspect_ratio || '4x5') === '4x3' ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)'} strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          {/* CSS Animation */}
          <style jsx>{`
            @keyframes sizePickerPop {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
