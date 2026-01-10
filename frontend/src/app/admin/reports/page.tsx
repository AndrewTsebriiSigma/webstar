'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface Report {
  id: number;
  reporter_id: number | null;
  target_type: string;
  target_id: number;
  target_user_id: number;
  target_username: string | null;
  reason: string;
  description: string | null;
  status: string;
  resolved_by: number | null;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
}

const REASON_LABELS: Record<string, { label: string; icon: string }> = {
  spam: { label: 'Spam', icon: '🚫' },
  harassment: { label: 'Harassment', icon: '😤' },
  inappropriate: { label: 'Inappropriate', icon: '⚠️' },
  fake: { label: 'Fake Profile', icon: '🎭' },
  copyright: { label: 'Copyright', icon: '©️' },
  other: { label: 'Other', icon: '📝' }
};

export default function AdminReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    const hasAdminRole = user && ['moderator', 'admin', 'super_admin'].includes(user.role || '');
    
    if (user && !hasAdminRole) {
      toast.error('Admin access required');
      router.push('/');
      return;
    }
    if (user) {
      loadReports();
    }
  }, [user, router, page, statusFilter]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter })
      });

      const res = await fetch(`${baseUrl}/api/admin/reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setReports(data.reports);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (action: 'resolve' | 'dismiss') => {
    if (!selectedReport) return;

    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const res = await fetch(`${baseUrl}/api/admin/reports/${selectedReport.id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, resolution_note: resolutionNote || null })
      });

      if (res.ok) {
        toast.success(`Report ${action === 'resolve' ? 'resolved' : 'dismissed'}`);
        setSelectedReport(null);
        setResolutionNote('');
        loadReports();
      } else {
        const data = await res.json();
        toast.error(data.detail || 'Failed to update report');
      }
    } catch (error) {
      toast.error('Failed to update report');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      pending: { bg: 'rgba(255, 149, 0, 0.15)', color: '#FF9500' },
      reviewing: { bg: 'rgba(0, 194, 255, 0.15)', color: '#00C2FF' },
      resolved: { bg: 'rgba(52, 199, 89, 0.15)', color: '#34C759' },
      dismissed: { bg: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.5)' }
    };
    const style = styles[status] || styles.pending;
    
    return (
      <span className="text-xs px-2 py-1 rounded-full capitalize" style={{ background: style.bg, color: style.color }}>
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: '#0B0B0C' }}>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Link href="/admin" className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80" style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            color: 'rgba(255, 255, 255, 0.7)' 
          }}>
            Dashboard
          </Link>
          <Link href="/admin/users" className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80" style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            color: 'rgba(255, 255, 255, 0.7)' 
          }}>
            Users
          </Link>
          <Link href="/admin/reports" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ 
            background: '#00C2FF', 
            color: '#000' 
          }}>
            Reports
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

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['pending', 'reviewing', 'resolved', 'dismissed'].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className="px-4 py-2 rounded-lg text-sm capitalize transition"
              style={{
                background: statusFilter === status ? '#00C2FF' : 'rgba(255, 255, 255, 0.05)',
                color: statusFilter === status ? '#000' : 'rgba(255, 255, 255, 0.7)'
              }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              No {statusFilter} reports
            </div>
          ) : (
            reports.map((report) => (
              <div 
                key={report.id} 
                className="rounded-xl p-4"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{REASON_LABELS[report.reason]?.icon || '📝'}</span>
                      <span className="font-medium" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                        {REASON_LABELS[report.reason]?.label || report.reason}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                    
                    <div className="text-sm mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Reported {report.target_type}: <Link href={`/${report.target_username}`} className="hover:underline" style={{ color: '#00C2FF' }}>@{report.target_username}</Link>
                    </div>
                    
                    {report.description && (
                      <p className="text-sm mb-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        "{report.description}"
                      </p>
                    )}
                    
                    <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                      {new Date(report.created_at).toLocaleString()}
                      {report.reporter_id ? '' : ' • Anonymous report'}
                    </div>
                  </div>
                  
                  {report.status === 'pending' && (
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="px-4 py-2 rounded-lg text-sm font-medium"
                      style={{ background: '#00C2FF', color: '#000' }}
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Previous
            </button>
            <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-sm disabled:opacity-50"
              style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedReport && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="rounded-2xl p-6 max-w-lg w-full mx-4" style={{ 
            background: '#1C1C1E',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              Review Report
            </h3>
            
            <div className="rounded-lg p-4 mb-4" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span>{REASON_LABELS[selectedReport.reason]?.icon}</span>
                <span className="font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {REASON_LABELS[selectedReport.reason]?.label}
                </span>
              </div>
              <p className="text-sm mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Reported user: <span style={{ color: '#00C2FF' }}>@{selectedReport.target_username}</span>
              </p>
              {selectedReport.description && (
                <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  "{selectedReport.description}"
                </p>
              )}
            </div>
            
            <textarea
              placeholder="Resolution note (optional)..."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              className="w-full p-3 rounded-lg mb-4 text-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.9)',
                minHeight: '80px'
              }}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedReport(null); setResolutionNote(''); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve('dismiss')}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Dismiss
              </button>
              <button
                onClick={() => handleResolve('resolve')}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: '#34C759', color: '#FFF' }}
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
