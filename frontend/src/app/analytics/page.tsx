'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { analyticsAPI, quizAPI } from '@/lib/api';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

interface DailyData {
  date: string;
  profile_views: number;
  link_clicks: number;
}

interface GraphPoint {
  x: number;
  y: number;
  yPos: number;
  value: number;
  date: string;
  index: number;
}

interface TooltipData {
  x: number;
  y: number;
  date: string;
  profileViews: number;
  linkClicks: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [activeGraph, setActiveGraph] = useState<'views' | 'clicks' | null>(null);
  const [mediaCounts, setMediaCounts] = useState({
    photo: 0,
    video: 0,
    audio: 0,
    pdf: 0,
    text: 0
  });
  const [projectsCount, setProjectsCount] = useState(0);
  const [quizResults, setQuizResults] = useState<Array<{
    id: number;
    quiz_id: number;
    quiz_title: string;
    total_score: number;
    result_summary: string | null;
    created_at: string;
  }>>([]);
  const viewsGraphRef = useRef<SVGSVGElement>(null);
  const clicksGraphRef = useRef<SVGSVGElement>(null);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [profile, setProfile] = useState<{
    display_name: string | null;
    profile_picture: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadAnalytics();
    loadMediaCounts();
    loadProjectsCount();
    loadQuizResults();
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const { profileAPI } = await import('@/lib/api');
      const response = await profileAPI.getMe();
      setProfile({
        display_name: response.data.display_name,
        profile_picture: response.data.profile_picture
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadQuizResults = async () => {
    try {
      const response = await quizAPI.getResults();
      setQuizResults(response.data || []);
    } catch (error) {
      console.error('Failed to load quiz results:', error);
    }
  };

  const loadMediaCounts = async () => {
    try {
      const { portfolioAPI } = await import('@/lib/api');
      const response = await portfolioAPI.getItems();
      const items = response.data;
      
      const counts = {
        photo: items.filter((item: any) => item.content_type === 'photo').length,
        video: items.filter((item: any) => item.content_type === 'video').length,
        audio: items.filter((item: any) => item.content_type === 'audio').length,
        pdf: items.filter((item: any) => item.content_type === 'pdf').length,
        text: items.filter((item: any) => item.content_type === 'text').length,
      };
      
      setMediaCounts(counts);
    } catch (error) {
      console.error('Failed to load media counts:', error);
    }
  };

  const loadProjectsCount = async () => {
    try {
      const { projectsAPI } = await import('@/lib/api');
      const response = await projectsAPI.getProjects();
      setProjectsCount(response.data?.length || 0);
    } catch (error) {
      console.error('Failed to load projects count:', error);
    }
  };

  const loadAnalytics = async () => {
    const cacheKey = 'analytics_daily';
    try {
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < 2 * 60 * 1000) {
          setDailyData(data);
          setLoading(false);
          return;
        }
      }
    } catch (e) {}

    try {
      const response = await analyticsAPI.getDailyAnalytics();
      setDailyData(response.data);
      
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        }));
      } catch (e) {}
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Generate mock data for demo - exactly 30 days
      const mockData: DailyData[] = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        mockData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          profile_views: Math.floor(Math.random() * 500) + 100,
          link_clicks: Math.floor(Math.random() * 200) + 50
        });
      }
      setDailyData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Graph dimensions - per spec: 280x64
  const GRAPH_WIDTH = 280;
  const GRAPH_HEIGHT = 64;
  const GRAPH_PADDING = 5;

  const prepareGraphData = (type: 'views' | 'clicks'): GraphPoint[] => {
    if (dailyData.length === 0) return [];
    
    const values = dailyData.map(d => type === 'views' ? d.profile_views : d.link_clicks);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;
    
    const dataLength = dailyData.length;
    const pointSpacing = (GRAPH_WIDTH - GRAPH_PADDING * 2) / (dataLength - 1 || 1);
    
    return dailyData.map((d, i) => {
      const value = type === 'views' ? d.profile_views : d.link_clicks;
      const normalized = (value - minValue) / range;
      const yPos = GRAPH_HEIGHT - (normalized * 50) - 7;
      
      return {
        x: GRAPH_PADDING + (pointSpacing * i),
        y: yPos,
        yPos,
        value,
        date: d.date,
        index: i
      };
    });
  };

  const handleGraphHover = (e: React.MouseEvent<SVGSVGElement>, type: 'views' | 'clicks') => {
    e.stopPropagation();
    const graphRef = type === 'views' ? viewsGraphRef : clicksGraphRef;
    if (!graphRef.current || dailyData.length === 0) return;
    
    const rect = graphRef.current.getBoundingClientRect();
    const hoverX = ((e.clientX - rect.left) / rect.width) * GRAPH_WIDTH;
    const graphData = prepareGraphData(type);
    
    if (graphData.length === 0) return;
    
    // Find nearest data point
    let nearestIndex = 0;
    let minDistance = Infinity;
    
    graphData.forEach((point, i) => {
      const distance = Math.abs(hoverX - point.x);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    });
    
    const point = graphData[nearestIndex];
    const data = dailyData[nearestIndex];
    
    setActiveGraph(type);
    setTooltipData({
      x: point.x,
      y: point.yPos,
      date: point.date,
      profileViews: data.profile_views,
      linkClicks: data.link_clicks
    });
  };

  const clearTooltip = () => {
    setTooltipData(null);
    setActiveGraph(null);
  };

  const totalViews = dailyData.reduce((sum, d) => sum + d.profile_views, 0);
  const totalClicks = dailyData.reduce((sum, d) => sum + d.link_clicks, 0);
  const viewsToday = dailyData[dailyData.length - 1]?.profile_views || 0;
  const clicksToday = dailyData[dailyData.length - 1]?.link_clicks || 0;

  // Content distribution data - compact icons for trading view
  const contentTypes = [
    { 
      key: 'photo', 
      count: mediaCounts.photo, 
      color: '#00C2FF',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#00C2FF" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      )
    },
    { 
      key: 'video', 
      count: mediaCounts.video, 
      color: '#FF006B',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#FF006B" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      )
    },
    { 
      key: 'audio', 
      count: mediaCounts.audio, 
      color: '#A78BFA',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#A78BFA" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V4.5l-10.5 3v9.75M6 19.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
        </svg>
      )
    },
    { 
      key: 'pdf', 
      count: mediaCounts.pdf, 
      color: '#22C55E',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#22C55E" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
    { 
      key: 'memo', 
      count: mediaCounts.text, 
      color: '#FB923C',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#FB923C" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      )
    },
    { 
      key: 'projects', 
      count: projectsCount, 
      color: '#E879F9',
      icon: (
        <svg width="16" height="16" fill="none" stroke="#E879F9" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      )
    }
  ];

  const maxContentCount = Math.max(...contentTypes.map(t => t.count), 1);

  // Trading candle renderer - Apple quality, dimmed if zero
  const renderTradingCandle = (type: typeof contentTypes[0]) => {
    const heightPercent = maxContentCount > 0 ? (type.count / maxContentCount) * 100 : 0;
    const isEmpty = type.count === 0;
    const minBarHeight = 6;
    
    return (
      <div key={type.key} style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        opacity: isEmpty ? 0.4 : 1,
        transition: 'opacity 0.2s ease'
      }}>
        {/* Candle section - bar with number floating above */}
        <div style={{
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          position: 'relative'
        }}>
          {/* Count - only show if not zero, positioned above bar */}
          {!isEmpty && (
            <div style={{ 
              fontSize: '11px', 
              fontWeight: '600', 
              color: type.color,
              marginBottom: '4px'
            }}>
              {type.count}
            </div>
          )}
          
          {/* Candle bar */}
          <div style={{
            width: '16px',
            height: isEmpty ? `${minBarHeight}px` : `${Math.max(heightPercent, 12)}%`,
            minHeight: `${minBarHeight}px`,
            background: isEmpty 
              ? 'rgba(255, 255, 255, 0.12)' 
              : `linear-gradient(180deg, ${type.color} 0%, ${type.color}70 100%)`,
            borderRadius: '3px 3px 2px 2px',
            transition: 'height 0.3s ease'
          }} />
        </div>
        
        {/* Icon with color-matched gradient background */}
        <div style={{
          width: '28px',
          height: '28px',
          marginTop: '6px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: type.key === 'photo' 
            ? 'linear-gradient(135deg, rgba(0, 80, 120, 0.8) 0%, rgba(0, 50, 80, 0.9) 100%)'
            : type.key === 'video'
            ? 'linear-gradient(135deg, rgba(120, 0, 60, 0.8) 0%, rgba(80, 0, 40, 0.9) 100%)'
            : type.key === 'audio'
            ? 'linear-gradient(135deg, rgba(80, 50, 140, 0.8) 0%, rgba(50, 30, 90, 0.9) 100%)'
            : type.key === 'pdf'
            ? 'linear-gradient(135deg, rgba(20, 90, 50, 0.8) 0%, rgba(10, 60, 35, 0.9) 100%)'
            : type.key === 'memo'
            ? 'linear-gradient(135deg, rgba(120, 70, 30, 0.8) 0%, rgba(80, 45, 20, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(100, 50, 120, 0.8) 0%, rgba(65, 30, 80, 0.9) 100%)',
          border: `1px solid ${type.color}30`,
          flexShrink: 0
        }}>
          {type.icon}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#151515' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const viewsGraphData = prepareGraphData('views');
  const clicksGraphData = prepareGraphData('clicks');

  const renderGraph = (
    graphData: GraphPoint[], 
    graphRef: React.RefObject<SVGSVGElement>,
    type: 'views' | 'clicks',
    color: string,
    gridId: string,
    gradientId: string
  ) => {
    // Check if this graph has an active tooltip selection
    const isActiveGraph = activeGraph === type;
    const selectedPointIndex = isActiveGraph && tooltipData 
      ? graphData.findIndex(d => d.x === tooltipData.x && d.yPos === tooltipData.y)
      : -1;
    
    return (
      <svg 
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      ref={graphRef} 
      onMouseMove={(e) => handleGraphHover(e, type)}
      onMouseLeave={clearTooltip}
        style={{ 
          cursor: 'pointer', 
          width: '100%', 
          height: '64px',
          borderRadius: '8px',
          overflow: 'visible'
        }}
    >
      <defs>
        <pattern id={gridId} width="9.33" height="9.33" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="9.33" height="9.33" fill="none" stroke={`${color}14`} strokeWidth="0.5"/>
        </pattern>
        
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      
        <rect width={GRAPH_WIDTH} height={GRAPH_HEIGHT} fill={`url(#${gridId})`} rx="8"/>
      
      {graphData.length > 0 && (
        <>
          <path
              d={`M ${graphData[0]?.x || 0},${graphData[0]?.yPos || 32} ${graphData.map((d) => `L ${d.x},${d.yPos}`).join(' ')} L ${graphData[graphData.length - 1]?.x || GRAPH_WIDTH},${GRAPH_HEIGHT} L ${GRAPH_PADDING},${GRAPH_HEIGHT} Z`}
            fill={`url(#${gradientId})`}
          />
          
          <path
            d={`M ${graphData[0]?.x || 0},${graphData[0]?.yPos || 32} ${graphData.map((d) => `L ${d.x},${d.yPos}`).join(' ')}`}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
          
            {/* Small dots on line */}
          {graphData.map((d, i) => (
            <circle
              key={`dot-${i}`}
              cx={d.x}
              cy={d.yPos}
              r="2"
              fill={color}
              opacity="0.5"
            />
          ))}
          
            {/* Interactive hit areas */}
          {graphData.map((d, i) => (
            <circle
              key={`hitarea-${i}`}
              cx={d.x}
              cy={d.yPos}
              r="12"
              fill="transparent"
              style={{ cursor: 'pointer', pointerEvents: 'all' }}
                onMouseEnter={(e) => {
                e.stopPropagation();
                const data = dailyData[i];
                setActiveGraph(type);
                setTooltipData({
                  x: d.x,
                  y: d.yPos,
                  date: d.date,
                  profileViews: data.profile_views,
                  linkClicks: data.link_clicks
                });
              }}
            />
          ))}
          
            {/* Selected point indicator - shows where user clicked */}
            {isActiveGraph && tooltipData && (
              <>
                {/* Vertical line at selected point */}
                <line
                  x1={tooltipData.x}
                  y1={0}
                  x2={tooltipData.x}
                  y2={GRAPH_HEIGHT}
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.3"
                  strokeDasharray="2,2"
                />
                {/* Selected point dot - larger and highlighted */}
          <circle 
                  cx={tooltipData.x} 
                  cy={tooltipData.y} 
                  r="5" 
                  fill={color}
                  stroke="#fff"
                  strokeWidth="2"
                />
              </>
            )}
            
            {/* Pulsing dot for today (last point) - only show if not selected */}
            {(!isActiveGraph || selectedPointIndex !== graphData.length - 1) && (
              <circle 
                cx={graphData[graphData.length - 1]?.x || GRAPH_WIDTH - GRAPH_PADDING} 
            cy={graphData[graphData.length - 1]?.yPos || 32} 
                r="3.5" 
            fill={color}
          >
                <animate attributeName="r" values="3.5;5;3.5" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
          </circle>
            )}
        </>
      )}
    </svg>
  );
  };

  // Icons for labels - colored to match their graphs
  const EyeIcon = () => (
    <svg width="14" height="14" fill="none" stroke="#00C2FF" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const LinkIcon = () => (
    <svg width="14" height="14" fill="none" stroke="#FF006B" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
    
    return (
    <div 
      className="min-h-screen min-h-screen-safe" 
      style={{ 
        background: 'linear-gradient(180deg, #0f0f0f 0%, #151515 50%, #121212 100%)',
        color: 'rgba(255, 255, 255, 0.92)',
        position: 'relative'
      }} 
      onClick={clearTooltip}
    >
      {/* Subtle ambient glow for glassmorphism effect */}
      <div style={{
        position: 'absolute',
        top: '100px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(0, 194, 255, 0.08) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        top: '400px',
        right: '10%',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, rgba(255, 0, 107, 0.06) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      {/* Mobile-first responsive container */}
      <div className="w-full mx-auto" style={{ maxWidth: '540px', position: 'relative', zIndex: 1 }}>
        
        {/* Header - matches profile page top-nav */}
        <div className="px-4 sm:px-5" style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: '55px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(18, 18, 18, 0.95)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid #2D2D2D',
          transition: 'all 0.15s ease'
        }}>
          {/* Close button - absolute left */}
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/${user?.username || ''}`); }}
            style={{
              position: 'absolute',
              left: '16px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
            }}
          >
            <XMarkIcon style={{ width: '20px', height: '20px' }} />
          </button>
          <h1 style={{ 
            fontSize: '17px', 
            fontWeight: '600', 
            margin: 0,
            color: '#fff'
          }}>
            Dashboard
          </h1>
        </div>
        
        {/* Content - mobile-first padding */}
        <div className="px-4 sm:px-5 py-4" style={{
          background: 'transparent'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Profile + Star Pass Row - No outer background */}
        <div style={{
              display: 'flex',
              alignItems: 'stretch',
              gap: '10px'
            }}>
              {/* Left - Profile Badge (stretches to fill) */}
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 16px 10px 10px',
                height: '54px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundImage: 'linear-gradient(168deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
                boxShadow: 'inset 0px 1px 0px 0px rgba(255, 255, 255, 0.05)'
              }}>
                {/* Avatar - Profile Picture or First Letter */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  flexShrink: 0,
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}>
                  {profile?.profile_picture ? (
                    <img
                      src={profile.profile_picture}
                      alt="Avatar"
                      style={{
          width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
        <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#fff'
        }}>
                      {(profile?.display_name || user?.full_name || user?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
        </div>
        
                {/* Name + Username */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                  <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontWeight: 700,
                    fontSize: '15px',
                    color: '#fff',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {profile?.display_name || user?.full_name || 'webSTAR'}
                  </span>
                  <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.45)',
                    letterSpacing: '0.01em'
                  }}>
                    @{user?.username || 'creator'}
                  </span>
        </div>
      </div>
              
              {/* Right - Star Pass (fixed width) */}
              <Link href="/subscribe" style={{ textDecoration: 'none', flexShrink: 0 }}>
      <div style={{
                  position: 'relative',
                  width: '147px',
                  height: '57px',
                  cursor: 'pointer'
                }}>
                  {/* Main progress container */}
                  <div style={{
                    position: 'absolute',
        top: 0,
                    left: 0,
                    width: '147px',
                    height: '57px',
                    border: '2px solid rgba(0, 194, 255, 0.5)',
                    borderRadius: '8px',
                    backgroundImage: 'linear-gradient(158.806deg, rgba(0, 194, 255, 0.2) 0%, rgba(0, 150, 255, 0.1) 100%), linear-gradient(90deg, rgb(17, 17, 17) 0%, rgb(17, 17, 17) 100%)',
                    boxShadow: '0px 4px 16px 0px rgba(0, 194, 255, 0.3), inset 0px 1px 0px 0px rgba(255, 255, 255, 0.1)'
                  }}>
                    {/* Progress bar background */}
                    <div style={{
                      position: 'absolute',
                      top: '13px',
                      left: '23px',
                      width: '110px',
              height: '32px',
                      border: '0.2px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      backgroundImage: 'linear-gradient(163.78deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                      boxShadow: '0px 4px 16px 0px rgba(0, 0, 0, 0.3), inset 0px 1px 0px 0px rgba(255, 255, 255, 0.05)'
                    }} />
                    
                    {/* Progress bar fill */}
                    <div style={{
                      position: 'absolute',
                      top: '13.68px',
                      left: '24px',
                      width: '45px',
                      height: '30.6px',
                      border: '2px solid #3fd1ff',
                      borderRadius: '8px',
                      background: 'linear-gradient(180deg, #3fd1ff 18.295%, #006585 100%)',
                      boxShadow: '0px 4px 16px 0px rgba(0, 0, 0, 0.3), inset 0px 1px 0px 0px rgba(255, 255, 255, 0.05)'
                    }} />
                    
                    {/* Progress text 4/10 */}
                    <p style={{
                      position: 'absolute',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      fontWeight: 800,
                      height: '25px',
                      lineHeight: '36px',
                      left: '81.5px',
                      fontSize: '18px',
                      color: 'rgba(245, 245, 245, 0.95)',
                      textAlign: 'center',
                      textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                      top: '11px',
                      letterSpacing: '0.07px',
                      transform: 'translateX(-50%)',
                      width: '65px',
                      margin: 0
                    }}>4/10</p>
                    
                    {/* Red notification dot */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '10px',
                      width: '8px',
                      height: '8px',
                      background: '#ef4444',
                      borderRadius: '4px'
                    }} />
                    
                    {/* Diamond badge with logo */}
                    <div style={{
                      position: 'absolute',
                      left: '3px',
                      top: '3px',
                      width: '47px',
                      height: '47px',
              display: 'flex',
              alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ transform: 'rotate(45deg)' }}>
                        <div style={{
                          width: '33.24px',
                          height: '33.24px',
                          border: '2px solid #37acd1',
                          borderRadius: '5px',
                          background: 'radial-gradient(circle at 49% 50%, rgba(63,209,255,1) 14.66%, rgba(32,202,255,1) 22%, rgba(16,198,255,1) 25.66%, rgba(0,194,255,1) 29.33%, rgba(0,147,194,1) 64.66%, rgba(0,101,133,1) 100%), linear-gradient(90deg, rgba(0, 126, 167, 0.5) 0%, rgba(0, 126, 167, 0.5) 100%)',
                          boxShadow: '-2px 4px 4px 0px rgba(0, 0, 0, 0.5)'
                        }} />
        </div>
      </div>

                    {/* Logo in diamond */}
                    <img
                      src="/webstar.svg"
                      alt="webSTAR"
                      width={28}
                      height={28}
                      style={{
                        position: 'absolute',
                        left: '26.5px',
                        top: '26.5px',
                        transform: 'translate(-50%, -50%)',
                        filter: 'brightness(0) saturate(100%) invert(22%) sepia(89%) saturate(1063%) hue-rotate(167deg) brightness(91%) contrast(101%)'
                      }}
                    />
        </div>
                </div>
              </Link>
      </div>

            {/* Analytics Section - Views & Clicks */}
            <div style={{ marginTop: '12px' }}>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.4)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Analytics
              </div>
              
              {/* Views Card */}
              <div 
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px'
                }}
            onClick={(e) => e.stopPropagation()}
          >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {/* LEFT - 25% */}
                  <div style={{ 
                    flex: '0 0 25%', 
                    paddingRight: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      color: '#00C2FF'
                    }}>
                      <EyeIcon />
                </div>

                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: '700', 
                      color: '#fff',
                      lineHeight: 1.1
                    }}>
                      {formatNumber(totalViews)}
                    </div>
                    {/* GREEN color for +today */}
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#00FF87',
                      fontWeight: '500'
                    }}>
                      +{viewsToday.toLocaleString()} today
                </div>
              </div>

                  {/* RIGHT - 75% Graph */}
                  <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                  {renderGraph(viewsGraphData, viewsGraphRef, 'views', '#00C2FF', 'blueGridViews', 'areaGradientViews')}

                    {/* Tooltip - positioned beside the clicked point */}
                    {tooltipData && activeGraph === 'views' && (() => {
                      const pointPercent = (tooltipData.x / GRAPH_WIDTH) * 100;
                      const showOnRight = pointPercent < 50;
                      
                      return (
                        <div 
                      style={{
                        position: 'absolute',
                            left: showOnRight ? `${pointPercent + 8}%` : 'auto',
                            right: showOnRight ? 'auto' : `${100 - pointPercent + 8}%`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(17, 17, 17, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            zIndex: 50,
                            backdropFilter: 'blur(12px)',
                            minWidth: '100px',
                            pointerEvents: 'auto'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearTooltip();
                      }}
                    >
                          <div style={{ 
                            fontSize: '11px', 
                            fontWeight: '600', 
                            color: '#fff',
                            marginBottom: '6px'
                          }}>
                            {tooltipData.date}
                      </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C2FF' }}></span>
                            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>Views:</span>
                            <span style={{ fontSize: '10px', fontWeight: '600', color: '#fff', marginLeft: 'auto' }}>
                              {tooltipData.profileViews.toLocaleString()}
                            </span>
                      </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF006B' }}></span>
                            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>Clicks:</span>
                            <span style={{ fontSize: '10px', fontWeight: '600', color: '#fff', marginLeft: 'auto' }}>
                              {tooltipData.linkClicks.toLocaleString()}
                            </span>
                    </div>
                </div>
                      );
                    })()}
              </div>
            </div>
          </div>

              {/* Clicks Card */}
              <div 
                style={{
                  marginTop: '8px',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px'
                }}
            onClick={(e) => e.stopPropagation()}
          >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {/* LEFT - 25% */}
                  <div style={{ 
                    flex: '0 0 25%', 
                    paddingRight: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      color: '#FF006B'
                    }}>
                      <LinkIcon />
                </div>

                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: '700', 
                      color: '#fff',
                      lineHeight: 1.1
                    }}>
                      {formatNumber(totalClicks)}
                    </div>
                    {/* GREEN color for +today */}
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#00FF87',
                      fontWeight: '500'
                    }}>
                      +{clicksToday.toLocaleString()} today
                </div>
              </div>

                  {/* RIGHT - 75% Graph */}
                  <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                  {renderGraph(clicksGraphData, clicksGraphRef, 'clicks', '#FF006B', 'pinkGrid', 'areaGradientClicks')}

                    {/* Tooltip - positioned beside the clicked point */}
                    {tooltipData && activeGraph === 'clicks' && (() => {
                      const pointPercent = (tooltipData.x / GRAPH_WIDTH) * 100;
                      const showOnRight = pointPercent < 50;
                      
                      return (
                        <div 
                      style={{
                        position: 'absolute',
                            left: showOnRight ? `${pointPercent + 8}%` : 'auto',
                            right: showOnRight ? 'auto' : `${100 - pointPercent + 8}%`,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(17, 17, 17, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            zIndex: 50,
                            backdropFilter: 'blur(12px)',
                            minWidth: '100px',
                            pointerEvents: 'auto'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearTooltip();
                      }}
                    >
                          <div style={{ 
                            fontSize: '11px', 
                            fontWeight: '600', 
                            color: '#fff',
                            marginBottom: '6px'
                          }}>
                            {tooltipData.date}
                      </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C2FF' }}></span>
                            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>Views:</span>
                            <span style={{ fontSize: '10px', fontWeight: '600', color: '#fff', marginLeft: 'auto' }}>
                              {tooltipData.profileViews.toLocaleString()}
                            </span>
                      </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF006B' }}></span>
                            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>Clicks:</span>
                            <span style={{ fontSize: '10px', fontWeight: '600', color: '#fff', marginLeft: 'auto' }}>
                              {tooltipData.linkClicks.toLocaleString()}
                            </span>
                    </div>
                        </div>
                      );
                    })()}
                </div>
              </div>
            </div>
          </div>

            {/* Content Distribution - Single Row Trading Candles */}
            <div style={{ marginTop: '12px' }}>
            <div style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.4)',
                marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
                Content
            </div>
              <div style={{
                display: 'flex',
                gap: '2px',
                padding: '14px 10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                height: '130px'
              }}>
                {contentTypes.map(renderTradingCandle)}
              </div>
            </div>

            {/* Quiz Library - Single Column Layout */}
            <div style={{ marginTop: '12px' }}>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.4)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Quizzes
              </div>
              
              {/* Container Block */}
              <div style={{
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px'
              }}>
                {/* Single Column - One Quiz Per Row */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
                  gap: '8px'
                }}>
                  {/* Quiz 1: Hidden Skills */}
                  {(() => {
                    const result = quizResults.find(r => r.quiz_title?.toLowerCase().includes('hidden') || r.quiz_id === 1);
                    const isCompleted = !!result;
                    return (
                      <button
                        onClick={() => { setExpandedQuiz('hidden-skills'); setQuizModalVisible(true); }}
                        style={{
                          padding: '12px',
                          background: isCompleted 
                            ? 'linear-gradient(135deg, rgba(0, 194, 255, 0.12) 0%, rgba(0, 100, 130, 0.06) 100%)' 
                            : 'linear-gradient(135deg, rgba(0, 194, 255, 0.08) 0%, rgba(0, 60, 80, 0.04) 100%)',
                          border: '1px solid rgba(0, 194, 255, 0.2)',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
              gap: '12px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: '44px',
                          height: '44px',
              borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(0, 194, 255, 0.25) 0%, rgba(0, 150, 255, 0.15) 100%)',
                          border: '1px solid rgba(0, 194, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                          flexShrink: 0,
                          position: 'relative'
                        }}>
                          🎯
                          {isCompleted && (
              <div style={{
                              position: 'absolute',
                              top: '-3px',
                              right: '-3px',
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: '#00C2FF',
                display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #111'
                            }}>
                              <svg width="7" height="7" fill="none" stroke="#111" strokeWidth="2.5" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
              </div>
                          )}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '3px' }}>Hidden Skills</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.3 }}>
                            Discover your unique talent combination and strengths
                          </div>
                        </div>
                      </button>
                    );
                  })()}

                  {/* Quiz 2: Brand Strategy */}
                  {(() => {
                    const result = quizResults.find(r => r.quiz_title?.toLowerCase().includes('brand') || r.quiz_id === 2);
                    const isCompleted = !!result;
                    return (
                      <button
                        onClick={() => { setExpandedQuiz('brand-strategy'); setQuizModalVisible(true); }}
                        style={{
                          padding: '12px',
                          background: isCompleted 
                            ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(60, 75, 140, 0.06) 100%)' 
                            : 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(50, 60, 100, 0.04) 100%)',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s ease'
                        }}
                      >
              <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(102, 126, 234, 0.12) 100%)',
                          border: '1px solid rgba(102, 126, 234, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                          flexShrink: 0,
                          position: 'relative'
                        }}>
                          💡
                          {isCompleted && (
              <div style={{
                              position: 'absolute',
                              top: '-3px',
                              right: '-3px',
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: '#667eea',
                display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #111'
                            }}>
                              <svg width="7" height="7" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
              </div>
                          )}
            </div>
                        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '3px' }}>Brand Strategy</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.3 }}>
                            Find your ideal positioning and target audience
          </div>
                        </div>
                      </button>
                    );
                  })()}

                  {/* Quiz 3: Visual Language */}
                  {(() => {
                    const result = quizResults.find(r => r.quiz_title?.toLowerCase().includes('visual') || r.quiz_id === 3);
                    const isCompleted = !!result;
                    return (
                      <button
                        onClick={() => { setExpandedQuiz('visual-language'); setQuizModalVisible(true); }}
                        style={{
                          padding: '12px',
                          background: isCompleted 
                            ? 'linear-gradient(135deg, rgba(255, 0, 107, 0.12) 0%, rgba(130, 0, 55, 0.06) 100%)' 
                            : 'linear-gradient(135deg, rgba(255, 0, 107, 0.08) 0%, rgba(80, 0, 35, 0.04) 100%)',
                          border: '1px solid rgba(255, 0, 107, 0.2)',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.15s ease'
                        }}
                      >
              <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(255, 0, 107, 0.25) 0%, rgba(255, 0, 107, 0.12) 100%)',
                          border: '1px solid rgba(255, 0, 107, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                          flexShrink: 0,
                          position: 'relative'
                        }}>
                          🎨
                          {isCompleted && (
              <div style={{
                              position: 'absolute',
                              top: '-3px',
                              right: '-3px',
                              width: '14px',
                              height: '14px',
                              borderRadius: '50%',
                              background: '#FF006B',
                display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #111'
                            }}>
                              <svg width="7" height="7" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '3px' }}>Visual Language</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', lineHeight: 1.3 }}>
                            Define your aesthetic style and visual identity
                          </div>
                        </div>
                      </button>
                    );
                  })()}

                  {/* Quiz 4: Audience Analysis (Locked - Pro Only) */}
                  <Link
                    href="/subscribe"
                    style={{
                      padding: '12px',
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(40, 40, 45, 0.03) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                gap: '12px',
                      opacity: 0.7,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      flexShrink: 0
                    }}>
                      🔒
                    </div>
                    <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '3px' }}>Audience Analysis</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', lineHeight: 1.3 }}>
                        Understand who your ideal audience is — Star Pass
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Quiz Detail Modal - Bottom Slider */}
      {expandedQuiz && (
        <>
          {/* Backdrop */}
          <div 
            className={`bottom-slider-backdrop ${quizModalVisible ? 'entering' : 'exiting'}`}
            onClick={() => { setQuizModalVisible(false); setTimeout(() => setExpandedQuiz(null), 150); }}
          />
          
          {/* Bottom Slider Content */}
          <div 
            className={`bottom-slider-content ${quizModalVisible ? 'entering' : 'exiting'}`}
                    style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '85vh',
              background: '#111111',
              borderRadius: '20px 20px 0 0',
              zIndex: 60,
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Back Arrow on LEFT */}
                    <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              padding: '16px 20px',
              background: 'rgba(17, 17, 17, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button
                onClick={() => { setQuizModalVisible(false); setTimeout(() => setExpandedQuiz(null), 150); }}
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  marginLeft: '-4px'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span style={{ fontSize: '17px', fontWeight: '600', color: '#fff' }}>
                Clarity Boost
                      </span>
                    </div>
            
            {/* Content - 30/70 Layout */}
            <div style={{ padding: '20px' }}>
              {/* Top Row: Icon | Info - reduced gaps */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                {/* Icon - larger, full fit */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '18px',
                  background: expandedQuiz === 'hidden-skills' 
                    ? 'linear-gradient(135deg, rgba(0, 194, 255, 0.25) 0%, rgba(0, 150, 255, 0.15) 100%)'
                    : expandedQuiz === 'brand-strategy'
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(102, 126, 234, 0.15) 100%)'
                    : 'linear-gradient(135deg, rgba(255, 0, 107, 0.25) 0%, rgba(255, 0, 107, 0.15) 100%)',
                  border: expandedQuiz === 'hidden-skills'
                    ? '1px solid rgba(0, 194, 255, 0.3)'
                    : expandedQuiz === 'brand-strategy'
                    ? '1px solid rgba(102, 126, 234, 0.3)'
                    : '1px solid rgba(255, 0, 107, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  flexShrink: 0
                }}>
                  {expandedQuiz === 'hidden-skills' && '🎯'}
                  {expandedQuiz === 'brand-strategy' && '💡'}
                  {expandedQuiz === 'visual-language' && '🎨'}
                </div>
                
                {/* Title & Short Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>
                    {expandedQuiz === 'hidden-skills' && 'Hidden Skills'}
                    {expandedQuiz === 'brand-strategy' && 'Brand Strategy'}
                    {expandedQuiz === 'visual-language' && 'Visual Language'}
                  </h2>
                  <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                    {expandedQuiz === 'hidden-skills' && 'Discover your unique skill combination'}
                    {expandedQuiz === 'brand-strategy' && 'Find your ideal positioning'}
                    {expandedQuiz === 'visual-language' && 'Define your aesthetic style'}
                  </p>
                  {/* Status */}
                  {(() => {
                    const result = expandedQuiz === 'hidden-skills' 
                      ? quizResults.find(r => r.quiz_title?.toLowerCase().includes('hidden') || r.quiz_id === 1)
                      : expandedQuiz === 'brand-strategy'
                      ? quizResults.find(r => r.quiz_title?.toLowerCase().includes('brand') || r.quiz_id === 2)
                      : quizResults.find(r => r.quiz_title?.toLowerCase().includes('visual') || r.quiz_id === 3);
                    return result ? (
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: expandedQuiz === 'hidden-skills' ? '#00C2FF' : expandedQuiz === 'brand-strategy' ? '#667eea' : '#FF006B',
                        marginTop: '8px'
                      }}>
                        ✓ Completed
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>
              
              {/* Extended Description - no frame, just flowing text */}
              <div style={{ marginBottom: '20px' }}>
                {expandedQuiz === 'hidden-skills' && (
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.7 }}>
                    <p style={{ margin: '0 0 12px 0' }}>
                      This quiz analyzes your strengths, creative approach, and problem-solving style to reveal what makes you uniquely valuable.
                    </p>
                    <p style={{ margin: 0 }}>
                      Understanding your hidden skills helps you position yourself effectively in the creator economy and communicate your unique value to potential collaborators and clients.
                    </p>
                  </div>
                )}
                {expandedQuiz === 'brand-strategy' && (
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.7 }}>
                    <p style={{ margin: '0 0 12px 0' }}>
                      Discover your authentic brand positioning by exploring your values, target audience, and unique selling points.
                    </p>
                    <p style={{ margin: 0 }}>
                      This quiz helps you clarify who you serve, what problems you solve, and how to communicate your value proposition effectively.
                    </p>
                  </div>
                )}
                {expandedQuiz === 'visual-language' && (
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.7 }}>
                    <p style={{ margin: '0 0 12px 0' }}>
                      Define your visual identity by exploring color preferences, typography styles, and aesthetic directions.
                    </p>
                    <p style={{ margin: 0 }}>
                      This quiz helps you establish a consistent visual language that resonates with your audience and reflects your brand personality.
                    </p>
            </div>
          )}
              </div>
              
              {/* Results Block (if completed) */}
              {(() => {
                const result = expandedQuiz === 'hidden-skills' 
                  ? quizResults.find(r => r.quiz_title?.toLowerCase().includes('hidden') || r.quiz_id === 1)
                  : expandedQuiz === 'brand-strategy'
                  ? quizResults.find(r => r.quiz_title?.toLowerCase().includes('brand') || r.quiz_id === 2)
                  : quizResults.find(r => r.quiz_title?.toLowerCase().includes('visual') || r.quiz_id === 3);
                
                if (!result?.result_summary) return null;
                
                const color = expandedQuiz === 'hidden-skills' ? '0, 194, 255' : expandedQuiz === 'brand-strategy' ? '102, 126, 234' : '255, 0, 107';
                const completedDate = result.created_at ? new Date(result.created_at) : new Date();
                const dateStr = completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                return (
              <div style={{
                    padding: '16px',
                    background: `rgba(${color}, 0.08)`,
                    border: `1px solid rgba(${color}, 0.2)`,
                    borderRadius: '12px',
                    marginBottom: '16px'
                  }}>
                    {/* Header with title and date badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px'
                    }}>
                      <div style={{
                        fontSize: '10px',
                        color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                        Your Result
              </div>
              <div style={{
                        fontSize: '10px',
                        color: `rgb(${color})`,
                        background: `rgba(${color}, 0.15)`,
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontWeight: '500'
                      }}>
                        {dateStr}
                      </div>
                    </div>
                <p style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.85)',
                      lineHeight: 1.5,
                      margin: 0
                    }}>
                      {result.result_summary}
                    </p>
                  </div>
                );
              })()}
              
              {/* Action Button */}
                <Link
                  href="/quiz"
                  style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '15px',
                    fontWeight: '600',
                  background: (() => {
                    const result = expandedQuiz === 'hidden-skills' 
                      ? quizResults.find(r => r.quiz_title?.toLowerCase().includes('hidden') || r.quiz_id === 1)
                      : expandedQuiz === 'brand-strategy'
                      ? quizResults.find(r => r.quiz_title?.toLowerCase().includes('brand') || r.quiz_id === 2)
                      : quizResults.find(r => r.quiz_title?.toLowerCase().includes('visual') || r.quiz_id === 3);
                    if (result) return 'rgba(255, 255, 255, 0.06)';
                    if (expandedQuiz === 'hidden-skills') return 'linear-gradient(135deg, rgba(0, 194, 255, 0.9) 0%, rgba(0, 160, 210, 0.95) 100%)';
                    if (expandedQuiz === 'brand-strategy') return 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(102, 126, 234, 0.8) 100%)';
                    return 'linear-gradient(135deg, rgba(255, 0, 107, 0.9) 0%, rgba(200, 0, 85, 0.9) 100%)';
                  })(),
                  border: (() => {
                    const result = expandedQuiz === 'hidden-skills' 
                      ? quizResults.find(r => r.quiz_title?.toLowerCase().includes('hidden') || r.quiz_id === 1)
                      : expandedQuiz === 'brand-strategy'
                      ? quizResults.find(r => r.quiz_title?.toLowerCase().includes('brand') || r.quiz_id === 2)
                      : quizResults.find(r => r.quiz_title?.toLowerCase().includes('visual') || r.quiz_id === 3);
                    return result ? '1px solid rgba(255, 255, 255, 0.1)' : 'none';
                  })(),
                    color: '#fff',
                  textDecoration: 'none'
                }}
              >
                {(() => {
                  const result = expandedQuiz === 'hidden-skills' 
                    ? quizResults.find(r => r.quiz_title?.toLowerCase().includes('hidden') || r.quiz_id === 1)
                    : expandedQuiz === 'brand-strategy'
                    ? quizResults.find(r => r.quiz_title?.toLowerCase().includes('brand') || r.quiz_id === 2)
                    : quizResults.find(r => r.quiz_title?.toLowerCase().includes('visual') || r.quiz_id === 3);
                  return result ? 'Retake Quiz' : 'Take Quiz';
                })()}
                </Link>
              </div>
            </div>
        </>
          )}
    </div>
  );
}
