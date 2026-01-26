'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { analyticsAPI, quizAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

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

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadAnalytics();
    loadMediaCounts();
    loadProjectsCount();
    loadQuizResults();
  }, [user]);

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

  // Graph dimensions - adjusted to show pulsing dot
  const GRAPH_WIDTH = 260; // Leave room for pulsing dot
  const GRAPH_VIEWBOX_WIDTH = 280; // Total viewBox width
  const GRAPH_HEIGHT = 64;
  const GRAPH_PADDING_LEFT = 5;

  const prepareGraphData = (type: 'views' | 'clicks'): GraphPoint[] => {
    if (dailyData.length === 0) return [];
    
    const values = dailyData.map(d => type === 'views' ? d.profile_views : d.link_clicks);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;
    
    const dataLength = dailyData.length;
    const pointSpacing = GRAPH_WIDTH / (dataLength - 1 || 1);
    
    return dailyData.map((d, i) => {
      const value = type === 'views' ? d.profile_views : d.link_clicks;
      const normalized = (value - minValue) / range;
      const yPos = GRAPH_HEIGHT - (normalized * 50) - 7;
      
      return {
        x: GRAPH_PADDING_LEFT + (pointSpacing * i),
        y: yPos,
        yPos,
        value,
        date: d.date,
        index: i
      };
    });
  };

  const handleGraphClick = (e: React.MouseEvent<SVGSVGElement>, type: 'views' | 'clicks') => {
    e.stopPropagation();
    const graphRef = type === 'views' ? viewsGraphRef : clicksGraphRef;
    if (!graphRef.current || dailyData.length === 0) return;
    
    const rect = graphRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * GRAPH_VIEWBOX_WIDTH;
    const graphData = prepareGraphData(type);
    
    if (graphData.length === 0) return;
    
    // Find nearest data point
    let nearestIndex = 0;
    let minDistance = Infinity;
    
    graphData.forEach((point, i) => {
      const distance = Math.abs(clickX - point.x);
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

  const handleDataPointClick = (
    e: React.MouseEvent<SVGCircleElement>, 
    type: 'views' | 'clicks',
    index: number
  ) => {
    e.stopPropagation();
    const graphData = prepareGraphData(type);
    const point = graphData[index];
    const data = dailyData[index];
    
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

  // Content distribution data - 6 types in 2 rows of 3
  const contentTypes = [
    // Row 1
    { 
      key: 'photo', 
      label: 'Photo', 
      count: mediaCounts.photo, 
      color: '#00C2FF',
      gradient: 'linear-gradient(135deg, rgba(0, 80, 120, 0.8) 0%, rgba(0, 50, 80, 0.9) 100%)',
      icon: (
        <svg width="18" height="18" fill="none" stroke="#00C2FF" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      )
    },
    { 
      key: 'video', 
      label: 'Video', 
      count: mediaCounts.video, 
      color: '#FF006B',
      gradient: 'linear-gradient(135deg, rgba(140, 0, 60, 0.8) 0%, rgba(90, 0, 40, 0.9) 100%)',
      icon: (
        <svg width="18" height="18" fill="none" stroke="#FF006B" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      )
    },
    { 
      key: 'audio', 
      label: 'Audio', 
      count: mediaCounts.audio, 
      color: '#A78BFA',
      gradient: 'linear-gradient(135deg, rgba(80, 50, 140, 0.8) 0%, rgba(50, 30, 90, 0.9) 100%)',
      icon: (
        <svg width="18" height="18" fill="none" stroke="#A78BFA" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V4.5l-10.5 3v9.75M6 19.5a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
        </svg>
      )
    },
    // Row 2
    { 
      key: 'pdf', 
      label: 'PDF', 
      count: mediaCounts.pdf, 
      color: '#22C55E',
      gradient: 'linear-gradient(135deg, rgba(20, 90, 50, 0.8) 0%, rgba(10, 60, 35, 0.9) 100%)',
      icon: (
        <svg width="18" height="18" fill="none" stroke="#22C55E" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
    { 
      key: 'memo', 
      label: 'Memo', 
      count: mediaCounts.text, 
      color: '#FB923C',
      gradient: 'linear-gradient(135deg, rgba(120, 60, 20, 0.8) 0%, rgba(80, 40, 15, 0.9) 100%)',
      icon: (
        <svg width="18" height="18" fill="none" stroke="#FB923C" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      )
    },
    { 
      key: 'projects', 
      label: 'Projects', 
      count: projectsCount, 
      color: '#E879F9',
      gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(236, 72, 153, 0.4) 100%)',
      icon: (
        <svg width="18" height="18" fill="none" stroke="#E879F9" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
      )
    }
  ];

  const maxContentCount = Math.max(...contentTypes.map(t => t.count), 1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B0C' }}>
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
  ) => (
    <svg 
      className="analytics-graph-enhanced" 
      viewBox={`0 0 ${GRAPH_VIEWBOX_WIDTH} ${GRAPH_HEIGHT}`}
      preserveAspectRatio="none" 
      ref={graphRef} 
      onClick={(e) => handleGraphClick(e, type)}
      style={{ cursor: 'pointer', width: '100%', height: '100%', touchAction: 'none' }}
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
      
      <rect width={GRAPH_VIEWBOX_WIDTH} height={GRAPH_HEIGHT} fill={`url(#${gridId})`}/>
      
      {graphData.length > 0 && (
        <>
          {/* Area fill */}
          <path
            d={`M ${graphData[0]?.x || 0},${graphData[0]?.yPos || 32} ${graphData.map((d) => `L ${d.x},${d.yPos}`).join(' ')} L ${graphData[graphData.length - 1]?.x || GRAPH_WIDTH},${GRAPH_HEIGHT} L ${GRAPH_PADDING_LEFT},${GRAPH_HEIGHT} Z`}
            fill={`url(#${gradientId})`}
          />
          
          {/* Main line */}
          <path
            d={`M ${graphData[0]?.x || 0},${graphData[0]?.yPos || 32} ${graphData.map((d) => `L ${d.x},${d.yPos}`).join(' ')}`}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.95"
          />
          
          {/* Visible small dots on line */}
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
          
          {/* Interactive data points - larger invisible hit area */}
          {graphData.map((d, i) => (
            <circle
              key={`hitarea-${i}`}
              cx={d.x}
              cy={d.yPos}
              r="12"
              fill="transparent"
              className="data-point"
              style={{ cursor: 'pointer', pointerEvents: 'all' }}
              onClick={(e) => handleDataPointClick(e, type, i)}
              onTouchEnd={(e) => {
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
          
          {/* Pulsing dot for today (last data point) */}
          <circle 
            cx={graphData[graphData.length - 1]?.x || GRAPH_WIDTH} 
            cy={graphData[graphData.length - 1]?.yPos || 32} 
            r="4" 
            fill={color}
          >
            <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
          </circle>
        </>
      )}
    </svg>
  );

  // Split content types into 2 rows
  const row1 = contentTypes.slice(0, 3);
  const row2 = contentTypes.slice(3, 6);

  const renderCandle = (type: typeof contentTypes[0]) => {
    const heightPercent = maxContentCount > 0 ? (type.count / maxContentCount) * 100 : 0;
    const minBarHeight = type.count > 0 ? 15 : 5;
    
    return (
      <div key={type.key} style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        height: '100%',
        justifyContent: 'flex-end'
      }}>
        {/* Count above candle */}
        <div style={{ 
          fontSize: '13px', 
          fontWeight: '700', 
          color: type.color,
          textShadow: `0 0 10px ${type.color}40`
        }}>
          {type.count}
        </div>
        
        {/* Candle bar */}
        <div style={{
          width: '100%',
          maxWidth: '32px',
          height: `${Math.max(heightPercent, minBarHeight)}%`,
          minHeight: `${minBarHeight}px`,
          background: `linear-gradient(180deg, ${type.color}, ${type.color}50)`,
          borderRadius: '4px 4px 2px 2px',
          transition: 'height 0.3s ease',
          boxShadow: `0 0 10px ${type.color}30`
        }} />
        
        {/* Icon below candle */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: type.gradient,
          flexShrink: 0
        }}>
          {type.icon}
        </div>
        
        {/* Label */}
        <div style={{ 
          fontSize: '9px', 
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '500',
          textAlign: 'center'
        }}>
          {type.label}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: '#0B0B0C', color: '#F5F5F5' }} onClick={clearTooltip}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(11, 11, 12, 0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); router.back(); }}
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: '#F5F5F5',
              cursor: 'pointer',
              transition: 'opacity 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <ArrowLeftIcon style={{ width: '20px', height: '20px' }} />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Analytics</h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px', maxWidth: '430px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Total Views Card */}
          <div 
            className="analytics-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="analytics-split-container">
              {/* LEFT - Metrics */}
              <div className="analytics-left" style={{ paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="analytics-header-inline">
                  <span className="period-inline">TOTAL VIEWS</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto' }}>
                  <div className="analytics-main-value">{formatNumber(totalViews)}</div>
                  <div className="analytics-today-change">+{viewsToday.toLocaleString()} today</div>
                </div>
              </div>

              {/* RIGHT - Graph */}
              <div className="analytics-right">
                <div className="graph-container" style={{ position: 'relative' }}>
                  {renderGraph(viewsGraphData, viewsGraphRef, 'views', '#00C2FF', 'blueGridViews', 'areaGradientViews')}

                  {tooltipData && activeGraph === 'views' && (
                    <div 
                      className="analytics-tooltip-enhanced"
                      style={{
                        position: 'absolute',
                        left: `${Math.min(Math.max((tooltipData.x / GRAPH_VIEWBOX_WIDTH) * 100, 15), 85)}%`,
                        bottom: '70px',
                        transform: 'translateX(-50%)',
                        zIndex: 50
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearTooltip();
                      }}
                    >
                      <div className="tooltip-date-enhanced">{tooltipData.date}</div>
                      <div className="tooltip-row">
                        <span className="tooltip-dot" style={{ background: '#00C2FF' }}></span>
                        <span className="tooltip-label">Views:</span>
                        <span className="tooltip-value">{tooltipData.profileViews.toLocaleString()}</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-dot" style={{ background: '#FF006B' }}></span>
                        <span className="tooltip-label">Clicks:</span>
                        <span className="tooltip-value">{tooltipData.linkClicks.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Link Clicks Card */}
          <div 
            className="analytics-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="analytics-split-container">
              {/* LEFT - Metrics */}
              <div className="analytics-left" style={{ paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="analytics-header-inline">
                  <span className="period-inline">LINK CLICKS</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'auto' }}>
                  <div className="analytics-main-value">{formatNumber(totalClicks)}</div>
                  <div className="analytics-today-change">+{clicksToday.toLocaleString()} today</div>
                </div>
              </div>

              {/* RIGHT - Graph */}
              <div className="analytics-right">
                <div className="graph-container" style={{ position: 'relative' }}>
                  {renderGraph(clicksGraphData, clicksGraphRef, 'clicks', '#FF006B', 'pinkGrid', 'areaGradientClicks')}

                  {tooltipData && activeGraph === 'clicks' && (
                    <div 
                      className="analytics-tooltip-enhanced"
                      style={{
                        position: 'absolute',
                        left: `${Math.min(Math.max((tooltipData.x / GRAPH_VIEWBOX_WIDTH) * 100, 15), 85)}%`,
                        bottom: '70px',
                        transform: 'translateX(-50%)',
                        zIndex: 50
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearTooltip();
                      }}
                    >
                      <div className="tooltip-date-enhanced">{tooltipData.date}</div>
                      <div className="tooltip-row">
                        <span className="tooltip-dot" style={{ background: '#00C2FF' }}></span>
                        <span className="tooltip-label">Views:</span>
                        <span className="tooltip-value">{tooltipData.profileViews.toLocaleString()}</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-dot" style={{ background: '#FF006B' }}></span>
                        <span className="tooltip-label">Clicks:</span>
                        <span className="tooltip-value">{tooltipData.linkClicks.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Distribution - 2 Rows x 3 Candles */}
          <div style={{ marginTop: '16px' }}>
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Content Distribution
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px 12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
            }}>
              {/* Row 1 - Photo, Video, Audio */}
              <div style={{
                display: 'flex',
                gap: '8px',
                height: '130px',
                alignItems: 'flex-end'
              }}>
                {row1.map(renderCandle)}
              </div>
              
              {/* Divider */}
              <div style={{
                height: '1px',
                background: 'rgba(255, 255, 255, 0.06)',
                margin: '0 -4px'
              }} />
              
              {/* Row 2 - PDF, Memo, Projects */}
              <div style={{
                display: 'flex',
                gap: '8px',
                height: '130px',
                alignItems: 'flex-end'
              }}>
                {row2.map(renderCandle)}
              </div>
            </div>
          </div>

          {/* Quiz Results Section */}
          {quizResults.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Quiz Results
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px 12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
              }}>
                {quizResults.map((result) => (
                  <div
                    key={result.id}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#fff',
                        margin: 0
                      }}>
                        {result.quiz_title}
                      </h3>
                      <span style={{
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.4)'
                      }}>
                        {new Date(result.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {result.result_summary && (
                      <p style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        lineHeight: '1.5',
                        margin: 0,
                        marginTop: '8px'
                      }}>
                        {result.result_summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Quiz Results - Show CTA */}
          {quizResults.length === 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Quiz Results
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px 12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: 0,
                  marginBottom: '8px'
                }}>
                  Take our quiz to discover your hidden skills
                </p>
                <Link
                  href="/quiz"
                  style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: 'linear-gradient(180deg, rgba(0, 194, 255, 0.9) 0%, rgba(0, 160, 210, 0.95) 100%)',
                    color: '#fff',
                    textDecoration: 'none',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Start Quiz
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
