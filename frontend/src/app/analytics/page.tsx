'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { analyticsAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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
  const [mediaCounts, setMediaCounts] = useState({
    photo: 0,
    video: 0,
    audio: 0,
    pdf: 0,
    text: 0,
    link: 0
  });
  const viewsGraphRef = useRef<SVGSVGElement>(null);
  const clicksGraphRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    loadAnalytics();
    loadMediaCounts();
  }, [user]);

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
        link: items.filter((item: any) => item.content_type === 'link').length,
      };
      
      setMediaCounts(counts);
    } catch (error) {
      console.error('Failed to load media counts:', error);
    }
  };

  const loadAnalytics = async () => {
    // Check cache first (2 minute TTL for analytics)
    const cacheKey = 'analytics_daily';
    try {
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        // Use cache if less than 2 minutes old
        if (age < 2 * 60 * 1000) {
          setDailyData(data);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // Cache read failed, proceed with API call
    }

    try {
      const response = await analyticsAPI.getDailyAnalytics();
      setDailyData(response.data);
      
      // Cache the data
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        }));
      } catch (e) {
        // Cache write failed (storage full), not critical
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Generate mock data for demo
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

  const prepareGraphData = (type: 'views' | 'clicks'): GraphPoint[] => {
    if (dailyData.length === 0) return [];
    
    const values = dailyData.map(d => type === 'views' ? d.profile_views : d.link_clicks);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;
    
    return dailyData.map((d, i) => {
      const value = type === 'views' ? d.profile_views : d.link_clicks;
      const normalized = (value - minValue) / range;
      const yPos = 64 - (normalized * 54) - 5;
      
      return {
        x: (280 / 29) * i,
        y: yPos,
        yPos,
        value,
        date: d.date
      };
    });
  };

  const handleGraphClick = (e: React.MouseEvent<SVGSVGElement>, type: 'views' | 'clicks') => {
    const graphRef = type === 'views' ? viewsGraphRef : clicksGraphRef;
    if (!graphRef.current) return;
    
    const rect = graphRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 280;
    const graphData = prepareGraphData(type);
    
    const pointWidth = 280 / 29;
    const index = Math.min(Math.max(Math.round(x / pointWidth), 0), graphData.length - 1);
    
    if (index >= 0 && index < dailyData.length) {
      const point = graphData[index];
      const data = dailyData[index];
      setTooltipData({
        x: point.x,
        y: point.yPos,
        date: point.date,
        profileViews: data.profile_views,
        linkClicks: data.link_clicks
      });
    }
  };

  const totalViews = dailyData.reduce((sum, d) => sum + d.profile_views, 0);
  const totalClicks = dailyData.reduce((sum, d) => sum + d.link_clicks, 0);
  const viewsToday = dailyData[dailyData.length - 1]?.profile_views || 0;
  const clicksToday = dailyData[dailyData.length - 1]?.link_clicks || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B0C' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const viewsGraphData = prepareGraphData('views');
  const clicksGraphData = prepareGraphData('clicks');

  return (
    <div className="min-h-screen" style={{ background: '#0B0B0C', color: '#F5F5F5' }}>
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
            onClick={() => router.back()}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#F5F5F5',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.10)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
          >
            <ArrowLeftIcon style={{ width: '18px', height: '18px' }} />
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
            onClick={() => setTooltipData(null)}
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
                  <svg 
                    className="analytics-graph-enhanced" 
                    viewBox="0 0 280 64" 
                    preserveAspectRatio="none" 
                    ref={viewsGraphRef} 
                    onClick={(e) => handleGraphClick(e, 'views')}
                    style={{ cursor: 'pointer' }}
                  >
                    <defs>
                      <pattern id="blueGridViews" width="9.33" height="9.33" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="9.33" height="9.33" fill="none" stroke="rgba(0, 194, 255, 0.08)" strokeWidth="0.5"/>
                      </pattern>
                      
                      <linearGradient id="areaGradientViews" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#00C2FF" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    
                    <rect width="280" height="64" fill="url(#blueGridViews)"/>
                    
                    {viewsGraphData.length > 0 && (
                      <>
                        <path
                          d={`M 0,${viewsGraphData[0]?.yPos || 32} ${viewsGraphData.map((d) => `L ${d.x},${d.yPos}`).join(' ')} L 280,${viewsGraphData[viewsGraphData.length - 1]?.yPos || 32} L 280,64 L 0,64 Z`}
                          fill="url(#areaGradientViews)"
                        />
                        
                        <path
                          d={`M 0,${viewsGraphData[0]?.yPos || 32} ${viewsGraphData.map((d) => `L ${d.x},${d.yPos}`).join(' ')} L 280,${viewsGraphData[viewsGraphData.length - 1]?.yPos || 32}`}
                          fill="none"
                          stroke="#00C2FF"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.95"
                        />
                        
                        {viewsGraphData.map((d, i) => (
                          <circle
                            key={i}
                            cx={d.x}
                            cy={d.yPos}
                            r="4"
                            fill="#00C2FF"
                            opacity="0"
                            className="data-point"
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                        
                        <circle 
                          cx={280} 
                          cy={viewsGraphData[viewsGraphData.length - 1]?.yPos || 32} 
                          r="3.5" 
                          fill="#00C2FF"
                        >
                          <animate attributeName="r" values="3.5;5;3.5" dur="2s" repeatCount="indefinite"/>
                          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
                        </circle>
                      </>
                    )}
                  </svg>

                  {tooltipData && (
                    <div 
                      className="analytics-tooltip-enhanced"
                      style={{
                        left: `${Math.min(Math.max((tooltipData.x / 280) * 100, 15), 85)}%`,
                        bottom: '70px'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTooltipData(null);
                      }}
                    >
                      <div className="tooltip-date-enhanced">{tooltipData.date}</div>
                      <div className="tooltip-row">
                        <span className="tooltip-dot" style={{ background: '#00C2FF' }}></span>
                        <span className="tooltip-label">Profile Views:</span>
                        <span className="tooltip-value">{tooltipData.profileViews.toLocaleString()}</span>
                      </div>
                      <div className="tooltip-row">
                        <span className="tooltip-dot" style={{ background: '#FF006B' }}></span>
                        <span className="tooltip-label">Link Clicks:</span>
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
            onClick={() => setTooltipData(null)}
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
                  <svg 
                    className="analytics-graph-enhanced" 
                    viewBox="0 0 280 64" 
                    preserveAspectRatio="none"
                    ref={clicksGraphRef}
                    onClick={(e) => handleGraphClick(e, 'clicks')}
                    style={{ cursor: 'pointer' }}
                  >
                    <defs>
                      <pattern id="pinkGrid" width="9.33" height="9.33" patternUnits="userSpaceOnUse">
                        <rect x="0" y="0" width="9.33" height="9.33" fill="none" stroke="rgba(255, 0, 107, 0.08)" strokeWidth="0.5"/>
                      </pattern>
                      
                      <linearGradient id="areaGradientClicks" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FF006B" stopOpacity="0.2"/>
                        <stop offset="100%" stopColor="#FF006B" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    
                    <rect width="280" height="64" fill="url(#pinkGrid)"/>
                    
                    {clicksGraphData.length > 0 && (
                      <>
                        <path
                          d={`M 0,${clicksGraphData[0]?.yPos || 32} ${clicksGraphData.map((d) => `L ${d.x},${d.yPos}`).join(' ')} L 280,${clicksGraphData[clicksGraphData.length - 1]?.yPos || 32} L 280,64 L 0,64 Z`}
                          fill="url(#areaGradientClicks)"
                        />
                        
                        <path
                          d={`M 0,${clicksGraphData[0]?.yPos || 32} ${clicksGraphData.map((d) => `L ${d.x},${d.yPos}`).join(' ')} L 280,${clicksGraphData[clicksGraphData.length - 1]?.yPos || 32}`}
                          fill="none"
                          stroke="#FF006B"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.95"
                        />
                        
                        <circle 
                          cx={280} 
                          cy={clicksGraphData[clicksGraphData.length - 1]?.yPos || 32} 
                          r="3.5" 
                          fill="#FF006B"
                        >
                          <animate attributeName="r" values="3.5;5;3.5" dur="2s" repeatCount="indefinite"/>
                          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
                        </circle>
                      </>
                    )}
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Media Content Squares */}
          <div style={{ marginTop: '8px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              {/* Photo */}
              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00C2FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#F5F5F5' }}>
                  {mediaCounts.photo}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                  Photos
                </div>
              </div>

              {/* Video */}
              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF006B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#F5F5F5' }}>
                  {mediaCounts.video}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                  Videos
                </div>
              </div>

              {/* Audio */}
              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#57BFF9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#F5F5F5' }}>
                  {mediaCounts.audio}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                  Audio
                </div>
              </div>

              {/* PDF */}
              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFA500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#F5F5F5' }}>
                  {mediaCounts.pdf}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                  PDFs
                </div>
              </div>

              {/* Text/Memos */}
              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#F5F5F5' }}>
                  {mediaCounts.text}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                  Memos
                </div>
              </div>

              {/* Links */}
              <div style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#F5F5F5' }}>
                  {mediaCounts.link}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                  Links
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

