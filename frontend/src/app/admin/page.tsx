'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface AdminStats {
  total_users: number;
  users_today: number;
  users_this_week: number;
  total_profiles: number;
  total_portfolio_items: number;
  total_projects: number;
  pending_reports: number;
  banned_users: number;
}

interface ActivityItem {
  id: number;
  admin_username: string;
  action_type: string;
  target_type: string;
  target_id: number;
  details: any;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check admin access
    const hasAdminRole = user && ['moderator', 'admin', 'super_admin'].includes(user.role || '');
    
    if (user && !hasAdminRole) {
      toast.error('Admin access required');
      router.push('/');
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, router]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const [statsRes, activityRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/stats`, { headers }),
        fetch(`${baseUrl}/api/admin/activity?limit=10`, { headers })
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (activityRes.ok) {
        setActivity(await activityRes.json());
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (action: string) => {
    const actions: Record<string, string> = {
      'ban': '🚫 Banned user',
      'unban': '✅ Unbanned user',
      'delete': '🗑️ Deleted',
      'role_change': '👑 Changed role',
      'report_resolve': '✓ Resolved report',
      'report_dismiss': '✗ Dismissed report'
    };
    return actions[action] || action;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0B0C' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-screen-safe" style={{ background: '#0B0B0C' }}>
      {/* Responsive container for admin */}
      <div className="w-full max-w-content-wide lg:max-w-content-xl xl:max-w-content-2xl mx-auto">
      {/* Header */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.02)', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 24px'
      }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              WebSTAR
            </Link>
            <span className="text-sm px-3 py-1 rounded-full" style={{ 
              background: 'rgba(0, 194, 255, 0.1)', 
              color: '#00C2FF',
              border: '1px solid rgba(0, 194, 255, 0.3)'
            }}>
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {user?.username} ({user?.role})
            </span>
            <Link 
              href={`/${user?.username}`}
              className="text-sm px-4 py-2 rounded-lg transition hover:opacity-80"
              style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Back to Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Link href="/admin" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ 
            background: '#00C2FF', 
            color: '#000' 
          }}>
            Dashboard
          </Link>
          <Link href="/admin/users" className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80" style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            color: 'rgba(255, 255, 255, 0.7)' 
          }}>
            Users
          </Link>
          <Link href="/admin/reports" className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80 relative" style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            color: 'rgba(255, 255, 255, 0.7)' 
          }}>
            Reports
            {stats && stats.pending_reports > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center" style={{
                background: '#FF3B30',
                color: '#FFF'
              }}>
                {stats.pending_reports}
              </span>
            )}
          </Link>
          {user?.role === 'super_admin' && (
            <Link href="/admin/team" className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80" style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              color: 'rgba(255, 255, 255, 0.7)' 
            }}>
              Admin Team
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Users" value={stats?.total_users || 0} icon="👥" />
          <StatCard title="New Today" value={stats?.users_today || 0} icon="📈" color="#00C2FF" />
          <StatCard title="This Week" value={stats?.users_this_week || 0} icon="📊" />
          <StatCard title="Pending Reports" value={stats?.pending_reports || 0} icon="⚠️" color={stats?.pending_reports ? '#FF9500' : undefined} />
          <StatCard title="Portfolio Items" value={stats?.total_portfolio_items || 0} icon="🖼️" />
          <StatCard title="Projects" value={stats?.total_projects || 0} icon="📁" />
          <StatCard title="Banned Users" value={stats?.banned_users || 0} icon="🚫" color={stats?.banned_users ? '#FF3B30' : undefined} />
          <StatCard title="Profiles" value={stats?.total_profiles || 0} icon="👤" />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Pending Reports */}
          <div className="rounded-2xl p-6" style={{ 
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                ⚠️ Pending Reports
              </h3>
              <Link href="/admin/reports" className="text-sm" style={{ color: '#00C2FF' }}>
                View all →
              </Link>
            </div>
            {stats?.pending_reports === 0 ? (
              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                No pending reports 🎉
              </p>
            ) : (
              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {stats?.pending_reports} reports waiting for review
              </p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl p-6" style={{ 
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <h3 className="font-semibold mb-4" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              📋 Recent Activity
            </h3>
            {activity.length === 0 ? (
              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      {formatAction(item.action_type)}
                    </span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                      by {item.admin_username}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>{/* End responsive container */}
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ 
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{title}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: color || 'rgba(255, 255, 255, 0.95)' }}>
        {value.toLocaleString()}
      </p>
    </div>
  );
}
