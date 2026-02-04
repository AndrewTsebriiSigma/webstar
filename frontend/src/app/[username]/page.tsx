'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { profileAPI, portfolioAPI, projectsAPI, economyAPI, analyticsAPI, quizAPI } from '@/lib/api';
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
import SetupChecklist from '@/components/SetupChecklist';
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
  FlagIcon,
  EllipsisHorizontalIcon,
  ClipboardIcon,
  CurrencyDollarIcon,
  LinkIcon as LinkChainIcon,
  Bars3Icon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

// Action Button type for customizable profile buttons
interface ActionButton {
  id: string;
  label: string;
  url: string;
  type: 'link' | 'email'; // 'message' type removed - non-functional feature
}

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('portfolio');
  
  // Swipe navigation for bottom bar (Profile ↔ Dashboard)
  const bottomSwipeStartX = useRef<number>(0);
  const bottomSwipeEndX = useRef<number>(0);
  
  const handleBottomSwipeStart = (e: React.TouchEvent) => {
    bottomSwipeStartX.current = e.touches[0].clientX;
  };
  
  const handleBottomSwipeMove = (e: React.TouchEvent) => {
    bottomSwipeEndX.current = e.touches[0].clientX;
  };
  
  const handleBottomSwipeEnd = () => {
    const swipeDistance = bottomSwipeStartX.current - bottomSwipeEndX.current;
    const minSwipeDistance = 50;
    
    // Swipe left → go to analytics
    if (swipeDistance > minSwipeDistance) {
      router.push('/analytics');
    }
  };
  
  // Swipe navigation for tabs (Portfolio ↔ Projects ↔ About)
  const tabSwipeStartX = useRef<number>(0);
  const tabSwipeEndX = useRef<number>(0);
  const tabs = ['portfolio', 'projects', 'about'];
  
  const handleTabSwipeStart = (e: React.TouchEvent) => {
    tabSwipeStartX.current = e.touches[0].clientX;
  };
  
  const handleTabSwipeMove = (e: React.TouchEvent) => {
    tabSwipeEndX.current = e.touches[0].clientX;
  };
  
  const handleTabSwipeEnd = () => {
    const swipeDistance = tabSwipeStartX.current - tabSwipeEndX.current;
    const minSwipeDistance = 50;
    const currentIndex = tabs.indexOf(activeTab);
    
    if (swipeDistance > minSwipeDistance && currentIndex < tabs.length - 1) {
      // Swipe left → next tab
      setActiveTab(tabs[currentIndex + 1]);
    } else if (swipeDistance < -minSwipeDistance && currentIndex > 0) {
      // Swipe right → previous tab
      setActiveTab(tabs[currentIndex - 1]);
    }
  };
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [points, setPoints] = useState<PointsBalance | null>(null);
  const [metrics, setMetrics] = useState<ProfileMetrics | null>(null);
  const [totalViews, setTotalViews] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  // Share Modal removed - non-functional feature
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<'media' | 'audio' | 'pdf' | 'text' | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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
  const [showGuestMenu, setShowGuestMenu] = useState(false);
  const [feedInitialPostId, setFeedInitialPostId] = useState<number | undefined>(undefined);
  const [currentAudioTrack, setCurrentAudioTrack] = useState<any>(null);
  const [isMiniPlayerMuted, setIsMiniPlayerMuted] = useState(true); // Default muted (red button)
  const [showMiniPlayerUI, setShowMiniPlayerUI] = useState(false); // Hide mini player UI by default
  const [audioPlaybackPositions, setAudioPlaybackPositions] = useState<Record<number, number>>({}); // Track audio positions for resume
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDetail, setShowProjectDetail] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [navPushUp, setNavPushUp] = useState(0);
  
  // Quiz results for setup checklist
  const [quizResults, setQuizResults] = useState<Array<{ id: number }>>([]);
  
  // Customization panel state
  const [showCustomizePanel, setShowCustomizePanel] = useState(false);
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(3);
  const [gridGap, setGridGap] = useState(5); // 0-20px
  const [gridRadius, setGridRadius] = useState(0); // 0-24px
  const [layoutMode, setLayoutMode] = useState<'uniform' | 'masonry'>('uniform');
  const [gridAspectRatio, setGridAspectRatio] = useState<'1x1' | '4x5' | '5x4' | '4x6' | '3x4' | '16x9' | '4x3'>('1x1'); // Global aspect ratio for grid mode
  
  // Profile theme customization
  type ProfileTheme = 'default' | 'monochrome' | 'custom';
  const [profileTheme, setProfileTheme] = useState<ProfileTheme>('default');
  const [showThemeCustomization, setShowThemeCustomization] = useState(false);
  
  // Size picker state for portfolio items
  type WidgetSize = '1x1' | '4x5' | '5x4' | '4x6' | '3x4' | '16x9' | '4x3';
  const [showSizePicker, setShowSizePicker] = useState(false);
  const [selectedItemForResize, setSelectedItemForResize] = useState<PortfolioItem | null>(null);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<PortfolioItem | null>(null);
  const [sizePickerPosition, setSizePickerPosition] = useState({ x: 0, y: 0 });
  
  // Drag & drop state for portfolio reordering
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);
  const [isDraggingPortfolio, setIsDraggingPortfolio] = useState(false);
  
  // Action menu state (for mobile long-press / desktop hover)
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
  
  // Highlight state for editable fields
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  
  // Custom color palette state
  const [customThemeColor, setCustomThemeColor] = useState<string>('#00C2FF');
  
  // HSL Color Harmony Functions
  const hexToHsl = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };
  
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };
  
  // Generate harmonious colors from base color
  const generateHarmoniousColors = (baseHex: string) => {
    const [h, s, l] = hexToHsl(baseHex);
    
    // Complementary (180°)
    const complementary = hslToHex((h + 180) % 360, s, l);
    
    // Analogous (30° and -30°)
    const analogous1 = hslToHex((h + 30) % 360, s, l);
    const analogous2 = hslToHex((h - 30 + 360) % 360, s, l);
    
    // Triadic (120° and 240°)
    const triadic1 = hslToHex((h + 120) % 360, s, l);
    const triadic2 = hslToHex((h + 240) % 360, s, l);
    
    // Lighter and darker variants
    const lighter = hslToHex(h, s, Math.min(95, l + 20));
    const darker = hslToHex(h, s, Math.max(5, l - 20));
    
    return {
      base: baseHex,
      complementary,
      analogous1,
      analogous2,
      triadic1,
      triadic2,
      lighter,
      darker
    };
  };
  
  const dashboardRef = useRef<HTMLDivElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  const saveCustomizationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const isOwnProfile = user?.username === username;
  
  // Scroll animation calculations
  const heightReduction = Math.min(scrollY / 100, 1);
  const isScrolled = scrollY > 5;

  // Load grid customization from backend profile (for both owner and guests)
  useEffect(() => {
    if (profile?.portfolio_customization) {
      try {
        const custom = JSON.parse(profile.portfolio_customization);
        if (custom.gridColumns) setGridColumns(custom.gridColumns);
        if (custom.gridGap !== undefined) setGridGap(custom.gridGap);
        if (custom.gridRadius !== undefined) setGridRadius(custom.gridRadius);
        if (custom.layoutMode) setLayoutMode(custom.layoutMode);
        if (custom.gridAspectRatio) setGridAspectRatio(custom.gridAspectRatio);
        if (custom.theme) setProfileTheme(custom.theme);
      } catch (e) {
        // Invalid JSON, fallback to localStorage
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
            } catch (e2) {
              // Invalid JSON, ignore
            }
          }
        }
      }
    } else if (typeof window !== 'undefined') {
      // Fallback to localStorage if backend doesn't have it
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
  }, [profile, username]);

  // Save grid customization to backend and localStorage when changed (only for own profile)
  useEffect(() => {
    if (isOwnProfile && typeof window !== 'undefined') {
      const customization = {
        gridColumns,
        gridGap,
        gridRadius,
        layoutMode,
        gridAspectRatio,
        theme: profileTheme
      };
      
      // Save to localStorage immediately for instant access
      localStorage.setItem(`portfolio_customization_${username}`, JSON.stringify(customization));
      
      // Debounce backend save (wait 1 second after last change)
      if (saveCustomizationTimeoutRef.current) {
        clearTimeout(saveCustomizationTimeoutRef.current);
      }
      
      saveCustomizationTimeoutRef.current = setTimeout(async () => {
        try {
          await profileAPI.updateMe({ portfolio_customization: JSON.stringify(customization) });
          // Optionally refresh profile to ensure sync
          loadProfile(true);
        } catch (error) {
          console.error('Failed to save portfolio customization to backend:', error);
          // Continue using localStorage as fallback
        }
      }, 1000);
      
      return () => {
        if (saveCustomizationTimeoutRef.current) {
          clearTimeout(saveCustomizationTimeoutRef.current);
        }
      };
    }
  }, [gridColumns, gridGap, gridRadius, layoutMode, gridAspectRatio, profileTheme, isOwnProfile, username]);

  // Reset theme customization when customize panel closes
  useEffect(() => {
    if (!showCustomizePanel) {
      setShowThemeCustomization(false);
    }
  }, [showCustomizePanel]);

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

  // Load quiz results for setup checklist
  useEffect(() => {
    if (isOwnProfile) {
      const loadQuizResults = async () => {
        try {
          const response = await quizAPI.getResults();
          setQuizResults(response.data || []);
        } catch (error) {
          console.error('Failed to load quiz results:', error);
        }
      };
      loadQuizResults();
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

  // === DRAG & DROP HANDLERS FOR PORTFOLIO REORDERING ===
  const handlePortfolioDragStart = (e: React.DragEvent, itemId: number) => {
    if (!showCustomizePanel || !isOwnProfile) return;
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(itemId);
    setIsDraggingPortfolio(true);
    // Add visual feedback
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
  };

  const handlePortfolioDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    setDraggedItemId(null);
    setDragOverItemId(null);
    setIsDraggingPortfolio(false);
  };

  const handlePortfolioDragOver = (e: React.DragEvent, itemId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItemId && draggedItemId !== itemId) {
      setDragOverItemId(itemId);
    }
  };

  const handlePortfolioDragLeave = () => {
    setDragOverItemId(null);
  };

  const handlePortfolioDrop = async (e: React.DragEvent, targetItemId: number) => {
    e.preventDefault();
    if (!draggedItemId || draggedItemId === targetItemId) return;

    // Find the actual indexes in portfolioItems array
    const draggedIndex = portfolioItems.findIndex(item => item.id === draggedItemId);
    const targetIndex = portfolioItems.findIndex(item => item.id === targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create new array and swap the items at their positions
    const newItems = [...portfolioItems];
    [newItems[draggedIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[draggedIndex]];

    // Update local state immediately for smooth UX
    setPortfolioItems(newItems);
    
    toast.success('Position swapped!');
    
    // Clear drag state
    setDraggedItemId(null);
    setDragOverItemId(null);
    setIsDraggingPortfolio(false);
    
    // TODO: Optionally save new order to backend
    // await portfolioAPI.reorderItems(newItems.map(item => item.id));
  };

  // === EDIT PORTFOLIO ITEM ===
  const handleEditItem = (item: PortfolioItem) => {
    setEditingPortfolioItem(item);
    setShowUploadModal(true);
    setShowActionMenu(null);
  };

  // === DELETE PORTFOLIO ITEM ===
  const handleDeleteItem = async (itemId: number) => {
    try {
      await portfolioAPI.deleteItem(itemId);
      setPortfolioItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item deleted');
      setShowActionMenu(null);
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete item');
    }
  };

  // === PROJECT HANDLERS ===
  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowProjectDetail(false);
    setSelectedProject(null);
    setShowProjectModal(true);
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      await projectsAPI.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success('Project deleted');
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  // === HANDLE EDIT PROJECT FROM URL QUERY ===
  useEffect(() => {
    const editProjectId = searchParams.get('editProject');
    
    if (editProjectId && projects.length > 0 && !editingProject && !showProjectModal) {
      const projectToEdit = projects.find(p => p.id === parseInt(editProjectId));
      
      if (projectToEdit) {
        setEditingProject(projectToEdit);
        setShowProjectModal(true);
        
        // Clean up the URL (remove query param) without triggering navigation
        const url = new URL(window.location.href);
        url.searchParams.delete('editProject');
        window.history.replaceState({}, '', url.pathname);
      }
    }
  }, [searchParams, projects, editingProject, showProjectModal]);

  // === LONG PRESS HANDLER FOR MOBILE ACTION MENU ===
  const handleLongPressStart = (e: React.TouchEvent, item: PortfolioItem) => {
    if (!showCustomizePanel || !isOwnProfile) return;
    
    const touch = e.touches[0];
    longPressTimerRef.current = setTimeout(() => {
      setShowActionMenu(item.id);
      setActionMenuPosition({ 
        x: Math.min(touch.clientX, window.innerWidth - 160),
        y: Math.min(touch.clientY, window.innerHeight - 120)
      });
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleLongPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Handle playing media in mini-player (for video/audio)
  // showUI: if true, shows the mini player UI; if false, just plays audio without UI
  // startTime: optional position to resume from (in seconds)
  const handlePlayInMiniPlayer = (item: PortfolioItem, showUI: boolean = true, startTime?: number) => {
    if (item.content_url) {
      // Use provided startTime if > 0, otherwise check saved position
      const resumeTime = (startTime !== undefined && startTime > 0) 
        ? startTime 
        : (audioPlaybackPositions[item.id] ?? 0);
      
      setCurrentAudioTrack({
        id: item.id,
        title: item.title || (item.content_type === 'video' ? 'Video' : 'Audio Track'),
        url: item.content_url.startsWith('http') 
          ? item.content_url 
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${item.content_url}`,
        thumbnail: item.thumbnail_url || undefined,
        startTime: resumeTime // Pass resume position to MiniPlayer
      });
      setShowMiniPlayerUI(showUI);
      // Unmute when playing
      setIsMiniPlayerMuted(false);
    }
  };
  
  // Callback to save audio position when track is paused/stopped
  const handleAudioPositionChange = (trackId: number, position: number) => {
    setAudioPlaybackPositions(prev => ({
      ...prev,
      [trackId]: position
    }));
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

  // handleShare removed - functionality moved to Copy Link button

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
          data.features.map((feature: any) => {
            // Extract city and country from context
            const context = feature.context || [];
            let city = '';
            let country = '';
            
            // Find city (place) and country from context
            context.forEach((ctx: any) => {
              if (ctx.id?.startsWith('place')) {
                city = ctx.text;
              } else if (ctx.id?.startsWith('country')) {
                country = ctx.text;
              }
            });
            
            // If no city found, use the feature text as city
            if (!city && feature.text) {
              city = feature.text;
            }
            
            // Format as "City, Country" or just city if no country
            const formattedLocation = country ? `${city}, ${country}` : city;
            
            return {
              place_name: formattedLocation,
              id: feature.id
            };
          })
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
      className={`min-h-screen min-h-screen-safe text-white ${profileTheme === 'monochrome' ? 'theme-monochrome' : ''} ${isOwnProfile && showCustomizePanel ? 'customize-mode' : ''}`} 
      style={{ 
        background: '#111111',
        ...themeStyles,
      }}
    >
      {/* Responsive wrapper for centered content on larger screens */}
      {/* Header area is swipeable for page navigation (Profile ↔ Dashboard) */}
      <div 
        className="w-full max-w-content-default mx-auto lg:max-w-content-wide xl:max-w-content-xl"
        onTouchStart={isOwnProfile ? handleBottomSwipeStart : undefined}
        onTouchMove={isOwnProfile ? handleBottomSwipeMove : undefined}
        onTouchEnd={isOwnProfile ? handleBottomSwipeEnd : undefined}
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
          {/* Settings Menu - Left */}
            {isOwnProfile ? (
              <button 
                onClick={() => router.push('/settings')}
              className="nav-btn"
              >
              <Bars3Icon 
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
          
          {/* Notifications for owners, 3 dots menu for guests - Right */}
          {isOwnProfile ? (
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
              <span 
                className="nav-badge"
                style={{ transform: `scale(${1 - (0.15 * heightReduction)})` }}
              >3</span>
            </button>
          ) : (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowGuestMenu(!showGuestMenu)}
                className="nav-btn"
              >
                <EllipsisHorizontalIcon 
                  className="text-white" 
                  style={{ 
                    width: `${22 - (3 * heightReduction)}px`, 
                    height: `${22 - (3 * heightReduction)}px` 
                  }} 
                />
              </button>
              {showGuestMenu && (
                <>
                  <div 
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 998
                    }}
                    onClick={() => setShowGuestMenu(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      zIndex: 999,
                      background: 'rgba(22, 22, 24, 0.95)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      padding: '4px',
                      minWidth: '160px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                      animation: 'fadeIn 0.2s ease-out'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/${username}`;
                        navigator.clipboard.writeText(url);
                        toast.success('Link copied to clipboard!');
                        setShowGuestMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'rgba(255, 255, 255, 0.95)',
                        fontSize: '14px',
                        fontWeight: 400,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <ClipboardIcon style={{ width: '18px', height: '18px', color: 'rgba(255, 255, 255, 0.7)' }} />
                      <span>Copy Link</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!user) {
                          sessionStorage.setItem('returnAfterAuth', `/${username}`);
                          router.push('/auth');
                          return;
                        }
                        setShowReportModal(true);
                        setShowGuestMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'rgba(255, 255, 255, 0.95)',
                        fontSize: '14px',
                        fontWeight: 400,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <FlagIcon style={{ width: '18px', height: '18px', color: 'rgba(255, 255, 255, 0.7)' }} />
                      <span>Report</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
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

      {/* Customize Mode - No intrusive bar, just visual hints via CSS classes */}

      {/* Cover Image Area - Responsive height */}
      <div className="relative">
        <div 
          className={`h-40 sm:h-48 lg:h-56 xl:h-64 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 relative overflow-hidden ${isOwnProfile && showCustomizePanel ? 'banner-editable' : ''}`}
          style={{
            cursor: isOwnProfile && showCustomizePanel ? 'pointer' : 'default',
            position: 'relative',
            zIndex: 10
          }}
          onClick={(e) => {
            // Only trigger if NOT clicking a button
            const target = e.target as HTMLElement;
            if (target.closest('.banner-action-btn')) {
              return; // Button handles its own click
            }
            // Make entire banner clickable
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
              style={{ 
                pointerEvents: 'none',
                position: 'relative',
                zIndex: 1
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/30 via-blue-500/20 to-purple-600/30" style={{ pointerEvents: 'none' }} />
          )}
          
          {/* Banner upload indicator - subtle camera icon only when uploading */}
          {isOwnProfile && showCustomizePanel && isUploadingBanner && (
            <div 
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                pointerEvents: 'none',
              }}
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C2FF]"></div>
            </div>
          )}
          
          {/* Viewer Mode & Settings - Bigger buttons - Always on top */}
          {isOwnProfile && (
            <div className="absolute top-4 left-4 right-4 flex justify-between" style={{ zIndex: 20, pointerEvents: 'none' }}>
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
                  transition: 'all 150ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                  pointerEvents: 'auto'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title={viewerMode ? 'Exit viewer mode' : 'Enter viewer mode'}
              >
                <EyeIcon className="w-[20px] h-[20px]" />
              </button>
              {/* Copy Link button - Hide in viewer mode */}
              {!viewerMode && (
              <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = `${window.location.origin}/${username}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Link copied!');
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
                  transition: 'all 150ms cubic-bezier(0.22, 0.61, 0.36, 1)',
                  pointerEvents: 'auto'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                title="Copy profile link"
              >
                  <LinkChainIcon className="w-[17px] h-[17px]" />
              </button>
              )}
            </div>
          )}
        </div>

        {/* Avatar - Responsive size with banner overlap */}
        <div className="relative px-4 -mt-[90px] sm:-mt-[100px] lg:-mt-[110px]" style={{ zIndex: 15 }}>
          <div className="flex items-center justify-center">
            <div 
              className="relative w-[150px] h-[150px]"
              style={{
                cursor: isOwnProfile && showCustomizePanel ? 'pointer' : 'default',
                borderRadius: '50%',
                background: '#111111'
              }}
              onClick={() => {
                if (isOwnProfile && showCustomizePanel && !isUploadingProfilePic) {
                  profilePicInputRef.current?.click();
                }
              }}
            >
            {profile.profile_picture ? (
              <div
                className={`w-full h-full rounded-full overflow-hidden ${isOwnProfile && showCustomizePanel ? 'avatar-editable' : ''}`}
                style={{
                  border: '5px solid #111111',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                  background: '#111111'
                }}
              >
              <img
                src={profile.profile_picture}
                alt={profile.display_name || username}
                  className="w-full h-full object-cover"
                  style={{ display: 'block' }}
                />
              </div>
            ) : (
              <div 
                className={`w-full h-full rounded-full flex items-center justify-center text-white text-4xl font-bold ${isOwnProfile && showCustomizePanel ? 'avatar-editable' : ''}`}
                style={{
                  border: '5px solid #111111',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)'
                }}
              >
                {(profile.display_name || username).charAt(0).toUpperCase()}
              </div>
            )}
              
            {/* Profile picture upload overlay - only show when uploading */}
            {isOwnProfile && showCustomizePanel && isUploadingProfilePic && (
              <div 
                className="absolute inset-0 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(0, 0, 0, 0.5)',
                  pointerEvents: 'none'
                }}
              >
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C2FF]"></div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info - Compact design */}
      <div className="profile-info" style={{ padding: '0 24px 12px', textAlign: 'center' }}>
        {/* Name + Badge - Centered together as unit */}
        <div className="flex items-center justify-center pt-2" style={{ marginBottom: '8px' }}>
          <div className="inline-flex items-center gap-1.5">
            <span className="relative inline-block">
              {isOwnProfile && showCustomizePanel && (
                <div className="sparkle-field">
                  <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                  <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                  <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                  <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                </div>
              )}
              <h1 
                contentEditable={isOwnProfile && showCustomizePanel}
                suppressContentEditableWarning
                onFocus={(e) => {
                  if (isOwnProfile && showCustomizePanel) {
                    // Mac folder rename: select all text on focus
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(e.currentTarget);
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                  }
                }}
                onBlur={(e) => {
                  if (isOwnProfile && showCustomizePanel) {
                    setEditedName(e.currentTarget.textContent || '');
                    handleProfileFieldBlur();
                  }
                }}
                className="text-xl font-bold" 
                style={{ 
                  color: 'rgba(245, 245, 245, 0.95)', 
                  letterSpacing: '-0.2px',
                  outline: 'none',
                  cursor: isOwnProfile && showCustomizePanel ? 'text' : 'default'
                }}
              >
                {isOwnProfile && showCustomizePanel ? editedName : (profile.display_name || username)}
          </h1>
            </span>
          {profile.expertise_badge && !showCustomizePanel && (
              <CheckBadgeIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" style={{ marginTop: '-1px' }} />
          )}
          </div>
        </div>
        
        {/* Bio/Headline - only show if bio exists OR in customize mode */}
        {(profile.bio || (isOwnProfile && showCustomizePanel)) && (
          <div className="flex justify-center px-4" style={{ marginBottom: '16px' }}>
            <div 
              className="w-full"
              style={{ 
                maxWidth: '320px',
                borderBottom: isOwnProfile && showCustomizePanel ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                paddingBottom: isOwnProfile && showCustomizePanel ? '6px' : '0'
              }}
            >
              <div className="flex items-end justify-between gap-3">
                <span className="relative flex-1">
                  {isOwnProfile && showCustomizePanel && (
                    <div className="sparkle-field">
                      <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                      <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                      <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                      <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                    </div>
                  )}
                  <p 
                    contentEditable={isOwnProfile && showCustomizePanel}
                    suppressContentEditableWarning
                    data-placeholder="Add headline..."
                    onFocus={(e) => {
                      if (isOwnProfile && showCustomizePanel) {
                        const selection = window.getSelection();
                        const range = document.createRange();
                        range.selectNodeContents(e.currentTarget);
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                      }
                    }}
                    onBlur={(e) => {
                      if (isOwnProfile && showCustomizePanel) {
                        const text = (e.currentTarget.textContent || '').slice(0, 70);
                        setEditedBio(text);
                        handleProfileFieldBlur();
                      }
                    }}
                    style={{ 
          color: 'rgba(255, 255, 255, 0.75)',
          fontSize: '15px',
                      lineHeight: '1.5',
                      outline: 'none',
                      cursor: isOwnProfile && showCustomizePanel ? 'text' : 'default',
                      textAlign: isOwnProfile && showCustomizePanel ? 'left' : 'center',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                    className={isOwnProfile && showCustomizePanel && !editedBio ? 'bio-editable' : ''}
                  >
                    {isOwnProfile && showCustomizePanel ? editedBio : profile.bio}
                  </p>
                </span>
                {isOwnProfile && showCustomizePanel && (
                  <span 
                    className="text-xs flex-shrink-0"
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.35)',
                      marginBottom: '2px'
                    }}
                  >
                    {(editedBio || '').length}/70
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Location & Role - 14px to dashboard - Standardized heights */}
        <div className="flex items-center justify-center gap-2 flex-wrap px-2" style={{ marginBottom: '14px' }}>
          <div 
            className="flex items-center gap-1 relative" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.75)', 
              fontSize: '13px',
              height: '24px',
              minWidth: '120px',
              maxWidth: '200px'
            }}
            onClick={() => {
              if (isOwnProfile && showCustomizePanel) {
                setHighlightedField(highlightedField === 'location' ? null : 'location');
              }
            }}
          >
            <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="relative flex-1">
              {isOwnProfile && showCustomizePanel && highlightedField === 'location' && (
                <div className="sparkle-field" style={{ top: '-4px', left: '-6px', right: '-6px', bottom: '-4px', display: 'block' }}>
                  <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                  <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                  <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                  <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                </div>
              )}
              <span
                contentEditable={isOwnProfile && showCustomizePanel}
                suppressContentEditableWarning
                onInput={(e) => {
                  if (isOwnProfile && showCustomizePanel) {
                    const text = e.currentTarget.textContent || '';
                    // Only update for search, don't re-render text content
                    searchLocation(text);
                  }
                }}
                onFocus={(e) => {
                  if (isOwnProfile && showCustomizePanel) {
                    setHighlightedField('location');
                    // Mac folder rename: select all text on focus
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(e.currentTarget);
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                    if (locationSuggestions.length > 0) {
                      setShowLocationDropdown(true);
                    }
                  }
                }}
                onBlur={(e) => {
                  // Save the location value on blur
                  if (isOwnProfile && showCustomizePanel) {
                    setEditedLocation(e.currentTarget.textContent || '');
                    setTimeout(() => setHighlightedField(null), 100);
                  }
                  setTimeout(() => setShowLocationDropdown(false), 200);
                  handleProfileFieldBlur();
                }}
                style={{ 
                  outline: 'none',
                  cursor: isOwnProfile && showCustomizePanel ? 'text' : 'default'
                }}
              >
                {isOwnProfile && showCustomizePanel ? (editedLocation || profile.location || 'Paris, France') : (profile.location || 'Paris, France')}
              </span>
              {/* Location dropdown */}
              {isOwnProfile && showCustomizePanel && showLocationDropdown && locationSuggestions.length > 0 && (
                <div 
                  className="absolute left-0 mt-1 rounded-lg overflow-hidden shadow-xl"
                  style={{
                    background: 'rgba(20, 25, 35, 0.98)',
                    border: '1px solid rgba(87, 191, 249, 0.3)',
                    backdropFilter: 'blur(20px)',
                    zIndex: 100,
                    width: 'calc(100vw - 48px)',
                    maxWidth: '320px',
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
            </span>
          </div>
          
          <div style={{ color: 'rgba(255, 255, 255, 0.3)', fontSize: '12px', opacity: 0.5 }}>•</div>
          
          <div 
            className="flex items-center gap-1 relative" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.75)', 
              fontSize: '13px',
              height: '24px',
              minWidth: '120px',
              maxWidth: '200px'
            }}
            onClick={() => {
              if (isOwnProfile && showCustomizePanel) {
                setHighlightedField(highlightedField === 'role' ? null : 'role');
              }
            }}
          >
            <BriefcaseIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="relative flex-1">
              {isOwnProfile && showCustomizePanel && highlightedField === 'role' && (
                <div className="sparkle-field" style={{ top: '-4px', left: '-6px', right: '-6px', bottom: '-4px', display: 'block' }}>
                  <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                  <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                  <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                  <span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span><span className="s">✦</span>
                </div>
              )}
              <span
                contentEditable={isOwnProfile && showCustomizePanel}
                suppressContentEditableWarning
                onFocus={(e) => {
                  if (isOwnProfile && showCustomizePanel) {
                    setHighlightedField('role');
                    // Mac folder rename: select all text on focus
                    const selection = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(e.currentTarget);
                    selection?.removeAllRanges();
                    selection?.addRange(range);
                  }
                }}
                onBlur={(e) => {
                  if (isOwnProfile && showCustomizePanel) {
                    setEditedRole(e.currentTarget.textContent || '');
                    setTimeout(() => setHighlightedField(null), 100);
                    handleProfileFieldBlur();
                  }
                }}
                style={{ 
                  outline: 'none',
                  cursor: isOwnProfile && showCustomizePanel ? 'text' : 'default'
                }}
              >
                {isOwnProfile && showCustomizePanel ? editedRole : (profile.role || 'Creator')}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Dashboard Strip - Compact for owner only - Clickable to Analytics */}
      {isOwnProfile && !viewerMode && (
        <div 
          ref={dashboardRef}
          className="dashboard-strip"
          style={{ position: 'relative' }}
        >
          <div
          onClick={() => {
            if (!showCustomizePanel) {
              router.push('/analytics');
            }
            // If customize mode, do nothing (no visual change)
          }}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderBottom: showCustomizePanel ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: showCustomizePanel ? 'none' : '0 4px 16px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            borderRadius: showCustomizePanel ? '16px 16px 0 0' : '16px',
            cursor: showCustomizePanel ? 'default' : 'pointer',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            padding: '10px 16px 10px 24px',
            margin: showCustomizePanel ? '0 16px 0' : '0 16px 8px',
            width: 'calc(100% - 32px)',
            height: '60px'
          }}
          onMouseEnter={(e) => {
            if (!showCustomizePanel) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'scale(1.01)';
            }
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
            {/* Monetization Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                router.push('/subscribe');
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
                const svg = e.currentTarget.querySelector('svg');
                if (svg) (svg as SVGElement).style.opacity = '0.95';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#2A2A2A';
                e.currentTarget.style.borderColor = '#414141';
                e.currentTarget.style.color = '#707070';
                const svg = e.currentTarget.querySelector('svg');
                if (svg) (svg as SVGElement).style.opacity = '0.44';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.94)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Monetization"
            >
              {/* Gem Icon - matches palette.svg stroke weight */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.44, transition: 'opacity 0.15s' }}>
                <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
                <path d="M2 9h20" />
                <path d="M12 21L8.5 9 12 3l3.5 6L12 21z" />
              </svg>
            </button>

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

          {/* Theme Customization - Slides from Dashboard */}
          {showCustomizePanel && (
        <div 
          className="theme-bar-pulse"
          style={{ 
                position: 'absolute',
                top: '100%',
                left: '16px',
                right: '16px',
            display: 'flex',
            flexDirection: 'column',
            width: 'calc(100% - 32px)',
                marginTop: '0',
            overflow: 'hidden',
            boxSizing: 'border-box',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: showThemeCustomization ? 'translateY(0)' : 'translateY(-100%)',
                opacity: showThemeCustomization ? 1 : 0,
                pointerEvents: showThemeCustomization ? 'auto' : 'none',
                zIndex: 100
          }}
        >
          {/* Toggle Button - Thin strip connecting to dashboard, blue text */}
          <button
            onClick={() => setShowThemeCustomization(!showThemeCustomization)}
            style={{
              width: '100%',
              height: '28px',
              borderRadius: showThemeCustomization ? '0' : '0 0 16px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderTop: 'none',
              color: '#00C2FF',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0 16px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
          >
            <span>Theme</span>
            <svg 
              width="10" height="10" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#00C2FF" 
              strokeWidth="2.5"
              style={{ 
                transform: showThemeCustomization ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
              }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          
          {/* Theme Options - Collapsible */}
          <div style={{ 
            maxHeight: showThemeCustomization ? '70px' : '0',
            opacity: showThemeCustomization ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
            background: 'rgba(255, 255, 255, 0.03)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            borderBottom: showThemeCustomization ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
            borderRadius: '0 0 16px 16px',
            padding: showThemeCustomization ? '12px 12px 10px' : '0 12px',
            backdropFilter: 'blur(20px)',
          }}>
            {/* Theme Options Row */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '32px' }}>
          {/* Dark Button */}
          <button
            onClick={() => {
              setProfileTheme('default');
              // Reset to default colors
              document.documentElement.style.setProperty('--accent', '#00C2FF');
              document.documentElement.style.setProperty('--blue', '#00C2FF');
              document.documentElement.style.setProperty('--blue-hover', '#33D1FF');
              document.documentElement.style.setProperty('--blue-pressed', '#0099CC');
            }}
            className="theme-btn-dark"
            style={{
              flex: 1,
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0 10px',
              border: profileTheme === 'default' ? '1px solid #00C2FF' : '1px solid rgba(255, 255, 255, 0.08)',
              background: profileTheme === 'default' ? 'rgba(0, 194, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (profileTheme !== 'default') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }
            }}
            onMouseLeave={(e) => {
              if (profileTheme !== 'default') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {/* Moon Icon */}
            <svg 
              width="14" height="14" viewBox="0 0 24 24" fill="none" 
              stroke={profileTheme === 'default' ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)'} 
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'stroke 0.15s ease' }}
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              letterSpacing: '-0.2px',
              color: profileTheme === 'default' ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)',
              transition: 'color 0.15s ease'
            }}>
              Dark
            </span>
          </button>

          {/* Light Button */}
          <button
            onClick={() => {
              setProfileTheme('monochrome');
              // Reset to default colors
              document.documentElement.style.setProperty('--accent', '#00C2FF');
              document.documentElement.style.setProperty('--blue', '#00C2FF');
              document.documentElement.style.setProperty('--blue-hover', '#33D1FF');
              document.documentElement.style.setProperty('--blue-pressed', '#0099CC');
            }}
            className="theme-btn-light"
            style={{
              flex: 1,
              height: '32px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0 10px',
              border: profileTheme === 'monochrome' ? '1px solid #00C2FF' : '1.5px solid rgba(255, 255, 255, 0.15)',
              background: profileTheme === 'monochrome' ? 'rgba(0, 194, 255, 0.15)' : '#FFFFFF',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (profileTheme !== 'monochrome') {
                e.currentTarget.style.background = '#FAFAFA';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }
            }}
            onMouseLeave={(e) => {
              if (profileTheme !== 'monochrome') {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {/* Sun Icon */}
            <svg 
              width="14" height="14" viewBox="0 0 24 24" fill="none" 
              stroke={profileTheme === 'monochrome' ? '#00C2FF' : '#666'} 
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'stroke 0.15s ease' }}
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
            <span style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              letterSpacing: '-0.2px',
              color: profileTheme === 'monochrome' ? '#00C2FF' : '#333',
              transition: 'color 0.15s ease'
            }}>
              Light
            </span>
          </button>

          {/* Custom Color Picker */}
          <div
            style={{
              flex: '0 0 auto',
              minWidth: '72px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '0 10px',
              border: profileTheme === 'custom' ? '1px solid #00C2FF' : '1px solid rgba(255, 255, 255, 0.08)',
              background: profileTheme === 'custom' ? 'rgba(0, 194, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              position: 'relative'
            }}
            onClick={() => {
              setProfileTheme('custom');
              const colors = generateHarmoniousColors(customThemeColor);
              // Apply custom colors to CSS variables
              document.documentElement.style.setProperty('--accent', colors.base);
              document.documentElement.style.setProperty('--blue', colors.base);
              document.documentElement.style.setProperty('--blue-hover', colors.lighter);
              document.documentElement.style.setProperty('--blue-pressed', colors.darker);
            }}
            onMouseEnter={(e) => {
              if (profileTheme !== 'custom') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }
            }}
            onMouseLeave={(e) => {
              if (profileTheme !== 'custom') {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }
            }}
          >
            {/* Color Preview */}
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                background: customThemeColor,
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            />
            <span style={{ 
              fontSize: '13px', 
              fontWeight: 600, 
              letterSpacing: '-0.2px',
              color: profileTheme === 'custom' ? '#00C2FF' : 'rgba(255, 255, 255, 0.5)',
              transition: 'color 0.15s ease'
            }}>
              Custom
            </span>
            {/* Color Picker Input (hidden) */}
            <input
              type="color"
              value={customThemeColor}
              onChange={(e) => {
                setCustomThemeColor(e.target.value);
                if (profileTheme === 'custom') {
                  const colors = generateHarmoniousColors(e.target.value);
                  document.documentElement.style.setProperty('--accent', colors.base);
                  document.documentElement.style.setProperty('--blue', colors.base);
                  document.documentElement.style.setProperty('--blue-hover', colors.lighter);
                  document.documentElement.style.setProperty('--blue-pressed', colors.darker);
                }
              }}
              style={{
                position: 'absolute',
                opacity: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer'
              }}
            />
          </div>
            </div>
          </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Action Buttons - Visible when buttons exist OR in Customize Mode */}
      {isOwnProfile && (actionButtons.length > 0 || showCustomizePanel) && (
      <div 
        className="dashboard-actions-wrapper"
        style={{
          position: 'relative',
          padding: '0 16px',
          marginBottom: '12px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Action Buttons Row */}
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            {/* Owner view - dynamic buttons (clickable in customize mode) */}
            <>
              {/* Empty state placeholder when no buttons and not in customize mode - Only show for owners */}
              {isOwnProfile && actionButtons.length === 0 && !showCustomizePanel && (
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
              {/* COMMENTED OUT - Copy profile link button removed
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
              */}
            </>
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
      )}

      {/* Visitor Action Buttons - Only custom action buttons or empty space */}
      {!isOwnProfile && actionButtons.length > 0 && (
        <div style={{ padding: '0 16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
            {actionButtons.map((button, index) => (
              <a
                key={button.id}
                href={button.type === 'email' ? `mailto:${button.url}` : button.url}
                target={button.type === 'link' ? '_blank' : undefined}
                rel={button.type === 'link' ? 'noopener noreferrer' : undefined}
                className={`action-btn ${getButtonSizeClass(index, actionButtons.length)}`}
                style={{
                  flex: actionButtons.length === 2 
                    ? '1 1 calc(50% - 4px)' 
                    : actionButtons.length === 3 
                    ? '1 1 calc(33.333% - 6px)' 
                    : actionButtons.length === 4
                    ? '1 1 calc(25% - 6px)'
                    : '1 1 auto',
                  minWidth: '60px',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: 'rgba(0, 194, 255, 0.1)',
                  border: '1px solid rgba(0, 194, 255, 0.2)',
                  color: '#00C2FF',
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 194, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.3)';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 194, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(0, 194, 255, 0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {button.label}
              </a>
            ))}
            <button 
              onClick={() => {
                if (!user) {
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
        </div>
      </div>
      )}

      {/* Tabs */}
      <div 
        className="z-30 backdrop-blur-md border-b border-gray-800"
        style={{ background: '#111111', marginTop: '20px' }}
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

      {/* Tab Content - Swipeable between tabs */}
      <div 
        className={`${activeTab === 'portfolio' ? 'pt-[5px]' : activeTab === 'projects' ? '' : 'py-4 px-3'}`} 
        style={{ paddingBottom: '140px' }}
        onTouchStart={handleTabSwipeStart}
        onTouchMove={handleTabSwipeMove}
        onTouchEnd={handleTabSwipeEnd}
      >
        {activeTab === 'about' && (
          <AboutSection
            isOwnProfile={isOwnProfile}
            isCustomizeMode={showCustomizePanel}
            profile={profile}
            onUpdate={() => loadProfile(true)}
            onActivateCustomize={() => setShowCustomizePanel(true)}
          />
        )}

        {activeTab === 'portfolio' && (
          <div style={{ 
            margin: '0 auto',
            width: '100%',
            padding: '10px'
          }}>
            {/* Grid Customization Controls - Visible to all viewers, editable only by owner */}
            {!viewerMode && showCustomizePanel && (
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
                      onClick={() => isOwnProfile && setGridColumns(cols as 2 | 3 | 4)}
                      disabled={!isOwnProfile}
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
                        cursor: isOwnProfile ? 'pointer' : 'default',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        flexShrink: 0,
                        opacity: isOwnProfile ? 1 : 0.6
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
                    onClick={() => isOwnProfile && setLayoutMode('uniform')}
                    disabled={!isOwnProfile}
                    style={{
                      width: '42px',
                      height: '32px',
                      background: layoutMode === 'uniform' ? 'rgba(0, 194, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: layoutMode === 'uniform' ? '1px solid #00C2FF' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isOwnProfile ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                      padding: 0,
                      flexShrink: 0,
                      opacity: isOwnProfile ? 1 : 0.6
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
                    onClick={() => isOwnProfile && setLayoutMode('masonry')}
                    disabled={!isOwnProfile}
                    style={{
                      width: '42px',
                      height: '32px',
                      background: layoutMode === 'masonry' ? 'rgba(0, 194, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: layoutMode === 'masonry' ? '1px solid #00C2FF' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isOwnProfile ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                      padding: 0,
                      flexShrink: 0,
                      opacity: isOwnProfile ? 1 : 0.6
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
                      onChange={(e) => isOwnProfile && setGridGap(parseInt(e.target.value))}
                      disabled={!isOwnProfile}
                      style={{
                        flex: 1,
                        height: '4px',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #00C2FF 0%, #00C2FF ${(gridGap / 16) * 100}%, rgba(255,255,255,0.08) ${(gridGap / 16) * 100}%, rgba(255,255,255,0.08) 100%)`,
                        borderRadius: '2px',
                        cursor: isOwnProfile ? 'pointer' : 'default',
                        minWidth: '50px',
                        outline: 'none',
                        opacity: isOwnProfile ? 1 : 0.6
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
                      onChange={(e) => isOwnProfile && setGridRadius(parseInt(e.target.value))}
                      disabled={!isOwnProfile}
                      style={{
                        flex: 1,
                        height: '4px',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        background: `linear-gradient(to right, #00C2FF 0%, #00C2FF ${(gridRadius / 24) * 100}%, rgba(255,255,255,0.08) ${(gridRadius / 24) * 100}%, rgba(255,255,255,0.08) 100%)`,
                        borderRadius: '2px',
                        cursor: isOwnProfile ? 'pointer' : 'default',
                        minWidth: '50px',
                        outline: 'none',
                        opacity: isOwnProfile ? 1 : 0.6
                      }}
                      className="compact-slider"
                    />
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
                      className={`portfolio-grid-item ${showCustomizePanel && isOwnProfile ? 'customize-mode' : ''} ${selectedItemForResize?.id === item.id ? 'selected-for-resize' : ''} ${dragOverItemId === item.id ? 'drag-over' : ''}`}
                      // Drag & drop handlers (customize mode only)
                      draggable={showCustomizePanel && isOwnProfile}
                      onDragStart={(e) => showCustomizePanel && isOwnProfile && handlePortfolioDragStart(e, item.id)}
                      onDragEnd={handlePortfolioDragEnd}
                      onDragOver={(e) => showCustomizePanel && isOwnProfile && handlePortfolioDragOver(e, item.id)}
                      onDragLeave={handlePortfolioDragLeave}
                      onDrop={(e) => showCustomizePanel && isOwnProfile && handlePortfolioDrop(e, item.id)}
                      // Touch handlers for mobile
                      onTouchStart={(e) => handleLongPressStart(e, item)}
                      onTouchEnd={handleLongPressEnd}
                      onTouchMove={handleLongPressEnd}
                    onClick={(e) => {
                        if (showCustomizePanel && isOwnProfile) {
                          // In customize mode: show size picker on click
                          e.stopPropagation();
                          setSelectedItemForResize(item);
                          setShowSizePicker(true);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setSizePickerPosition({ 
                            x: Math.min(rect.left + rect.width / 2 - 90, window.innerWidth - 180), 
                            y: Math.min(rect.bottom + 8, window.innerHeight - 200)
                          });
                        } else if (!showActionMenu) {
                          // Normal mode: open feed modal
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
                        cursor: showCustomizePanel && isOwnProfile ? 'grab' : 'pointer',
                        // Spring animation for aspect ratio changes (Apple-style)
                        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease',
                        border: selectedItemForResize?.id === item.id 
                          ? '2px solid #00C2FF' 
                          : dragOverItemId === item.id
                            ? '2px dashed #00C2FF'
                            : showCustomizePanel && isOwnProfile 
                              ? '1px solid rgba(0, 194, 255, 0.3)' 
                              : 'none',
                        transform: dragOverItemId === item.id ? 'scale(1.03)' : draggedItemId === item.id ? 'scale(0.95)' : 'scale(1)',
                        boxShadow: dragOverItemId === item.id ? '0 0 20px rgba(0, 194, 255, 0.4)' : 'none'
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
                      
                      {/* Customize mode overlay - drag handle and size badge */}
                      {showCustomizePanel && (
                        <>
                          {/* Drag handle indicator at top */}
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '40px',
                            height: '4px',
                            background: 'rgba(0, 194, 255, 0.6)',
                            borderRadius: '2px',
                            cursor: 'grab',
                            pointerEvents: 'none'
                          }} />
                          
                          {/* Size badge showing current aspect ratio */}
                          <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(8px)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
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
                        background: 'rgba(255, 255, 255, 0.02)',
                        color: 'rgba(255, 255, 255, 0.4)',
                        width: '130px',
                        height: '48px',
                        fontSize: '13px',
                        fontWeight: 500,
                        borderRadius: '12px',
                        border: '2px dashed rgba(255, 255, 255, 0.15)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      + Add Post
                    </button>
                  </>
                ) : (
                  <div style={{
                    padding: '16px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '10px',
                    border: '2px dashed rgba(255, 255, 255, 0.15)',
                  }}>
                    <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>No portfolio items yet</span>
                  </div>
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
                        background: 'rgba(255, 255, 255, 0.02)',
                        color: 'rgba(255, 255, 255, 0.4)',
                        width: '130px',
                        height: '48px',
                        fontSize: '13px',
                        fontWeight: 500,
                        borderRadius: '12px',
                        border: '2px dashed rgba(255, 255, 255, 0.15)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      + Add Project
                    </button>
                  </>
                ) : (
                  <div style={{
                    padding: '16px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '10px',
                    border: '2px dashed rgba(255, 255, 255, 0.15)',
                  }}>
                    <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.4)' }}>No projects yet</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share Modal - Removed: Non-functional feature, removed until functionality is built */}

            </div>

      {/* Modals - Outside responsive wrapper for full-screen behavior */}
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
          setEditingPortfolioItem(null);
        }}
        onSuccess={() => {
          loadProfile(true);
          setEditingPortfolioItem(null);
        }}
        initialContentType={selectedPostType}
        editingDraft={editingPortfolioItem}
      />

      <CreateProjectModal
        isOpen={showProjectModal}
        onClose={() => {
          setShowProjectModal(false);
          setEditingProject(null);
        }}
        onSuccess={() => {
          loadProfile(true);
          setEditingProject(null);
        }}
        editingProject={editingProject}
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
        isOwnProfile={isOwnProfile}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
      />

      {/* Mini Audio Player - Persistent at page level */}
      {currentAudioTrack && (
        <MiniPlayer
          track={currentAudioTrack}
          onClose={() => setCurrentAudioTrack(null)}
          onPositionChange={handleAudioPositionChange}
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
          hidden={!showMiniPlayerUI}
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
            
            {/* Delete button - below size grid */}
            <button
              onClick={() => {
                if (selectedItemForResize && confirm('Delete this item?')) {
                  handleDeleteItem(selectedItemForResize.id);
                  setShowSizePicker(false);
                  setSelectedItemForResize(null);
                }
              }}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '10px',
                background: 'rgba(255, 59, 48, 0.15)',
                border: '1px solid rgba(255, 59, 48, 0.3)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                color: '#FF3B30',
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
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

      {/* Mobile Action Menu (Long Press) */}
      {showActionMenu && (
        <>
          {/* Backdrop */}
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 998
            }}
            onClick={() => setShowActionMenu(null)}
          />
          
          {/* Action Menu */}
          <div 
            style={{
              position: 'fixed',
              left: `${actionMenuPosition.x}px`,
              top: `${actionMenuPosition.y}px`,
              zIndex: 1000,
              background: 'rgba(40, 40, 42, 0.98)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              minWidth: '140px',
              animation: 'actionMenuPop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {/* Edit option */}
            <button
              onClick={() => {
                const item = portfolioItems.find(p => p.id === showActionMenu);
                if (item) {
                  handleEditItem(item);
                }
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                color: 'white',
                fontSize: '14px'
              }}
            >
              <PencilIcon style={{ width: '16px', height: '16px' }} />
              Edit
            </button>

            {/* Resize option */}
            <button
              onClick={() => {
                const item = portfolioItems.find(p => p.id === showActionMenu);
                if (item) {
                  handleItemContextMenu({ preventDefault: () => {}, stopPropagation: () => {}, currentTarget: { getBoundingClientRect: () => ({ left: actionMenuPosition.x, bottom: actionMenuPosition.y }) } } as any, item);
                }
                setShowActionMenu(null);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                color: 'white',
                fontSize: '14px'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="2">
                <path d="M21 21l-6-6m6 6v-4.8m0 4.8h-4.8"/>
                <path d="M3 16.2V21h4.8"/>
                <path d="M21 7.8V3h-4.8"/>
                <path d="M3 3l6 6m-6-6v4.8M3 3h4.8"/>
              </svg>
              Resize
            </button>
            
            {/* Delete option */}
            <button
              onClick={() => {
                if (showActionMenu && confirm('Delete this item?')) {
                  handleDeleteItem(showActionMenu);
                }
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                color: '#FF453A',
                fontSize: '14px'
              }}
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
          
          <style jsx>{`
            @keyframes actionMenuPop {
              from {
                opacity: 0;
                transform: scale(0.8);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </>
      )}

      {/* Bottom Navigation Bar - Bar passes BEHIND the CREATE circle */}
      {isOwnProfile && !viewerMode && (
        <>
          <style>{`
            @keyframes createButtonPulse {
              0%, 100% { box-shadow: 0 4px 18px rgba(0, 194, 255, 0.25), 0 0 28px rgba(0, 194, 255, 0.12); }
              50% { box-shadow: 0 6px 24px rgba(0, 194, 255, 0.35), 0 0 36px rgba(0, 194, 255, 0.18); }
            }
          `}</style>
          
          {/* Bottom swipe zone + fade gradient */}
          <div
            onTouchStart={handleBottomSwipeStart}
            onTouchMove={handleBottomSwipeMove}
            onTouchEnd={handleBottomSwipeEnd}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '120px',
              background: 'linear-gradient(to top, rgba(17, 17, 17, 0.95) 0%, rgba(17, 17, 17, 0.7) 40%, transparent 100%)',
              zIndex: 999
            }}
          />
          
          {/* The glassy bar - passes BEHIND the CREATE button */}
          <div
            style={{
              position: 'fixed',
              bottom: '24px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '110px',
              padding: '6px 32px',
              background: 'rgba(30, 30, 34, 0.65)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderRadius: '18px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
              zIndex: 1000
            }}
          >
            {/* Profile Button - ACTIVE (blue) */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <UserIcon style={{ width: '20px', height: '20px', color: '#00C2FF' }} />
            </button>

            {/* Dashboard Button */}
            <button
              onClick={() => router.push('/analytics')}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 194, 255, 0.15)';
                const icon = e.currentTarget.querySelector('svg');
                if (icon) (icon as SVGElement).style.color = '#00C2FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                const icon = e.currentTarget.querySelector('svg');
                if (icon) (icon as SVGElement).style.color = 'rgba(255, 255, 255, 0.65)';
              }}
            >
              <ChartBarIcon style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.65)', transition: 'color 0.15s ease' }} />
            </button>
          </div>

          {/* CREATE Button - Rounded rect positioned IN FRONT of the bar */}
          <button
            onClick={() => setShowCreateContentModal(true)}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '58px',
              height: '54px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #00C2FF 0%, #00A8E8 50%, #0090D0 100%)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'createButtonPulse 3s ease-in-out infinite',
              zIndex: 1001
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              e.currentTarget.style.animation = 'none';
              e.currentTarget.style.boxShadow = '0 6px 28px rgba(0, 194, 255, 0.4), 0 0 40px rgba(0, 194, 255, 0.22)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              e.currentTarget.style.animation = 'createButtonPulse 3s ease-in-out infinite';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
            }}
          >
            <img 
              src="/webstar-logo.png" 
              alt="Create" 
              style={{ 
                width: '32px', 
                height: '32px', 
                filter: 'brightness(0) invert(1) drop-shadow(0 0 16px rgba(255, 255, 255, 1)) drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))'
              }} 
            />
          </button>
        </>
      )}

      {/* Setup Checklist - Only for own profile */}
      {isOwnProfile && (
        <SetupChecklist
          profile={profile}
          portfolioItems={portfolioItems}
          projects={projects}
          quizResults={quizResults}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onActivateCustomize={() => setShowCustomizePanel(true)}
        />
      )}
      
    </div>
  );
}
