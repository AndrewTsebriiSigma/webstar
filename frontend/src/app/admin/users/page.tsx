'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [bannedFilter, setBannedFilter] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    const hasAdminRole = user && ['moderator', 'admin', 'super_admin'].includes(user.role || '');
    
    if (user && !hasAdminRole) {
      toast.error('Admin access required');
      router.push('/');
      return;
    }
    if (user) {
      loadUsers();
    }
  }, [user, router, page, search, roleFilter, bannedFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
        ...(bannedFilter && { banned: bannedFilter })
      });

      const res = await fetch(`${baseUrl}/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async () => {
    if (!selectedUser || !banReason.trim()) return;

    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const res = await fetch(`${baseUrl}/api/admin/users/${selectedUser.id}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: banReason })
      });

      if (res.ok) {
        toast.success(`${selectedUser.username} has been banned`);
        setShowBanModal(false);
        setBanReason('');
        setSelectedUser(null);
        loadUsers();
      } else {
        const data = await res.json();
        toast.error(data.detail || 'Failed to ban user');
      }
    } catch (error) {
      toast.error('Failed to ban user');
    }
  };

  const handleUnban = async (userId: number, username: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const res = await fetch(`${baseUrl}/api/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success(`${username} has been unbanned`);
        loadUsers();
      } else {
        const data = await res.json();
        toast.error(data.detail || 'Failed to unban user');
      }
    } catch (error) {
      toast.error('Failed to unban user');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      super_admin: { bg: 'rgba(255, 59, 48, 0.15)', color: '#FF3B30' },
      admin: { bg: 'rgba(255, 149, 0, 0.15)', color: '#FF9500' },
      moderator: { bg: 'rgba(0, 194, 255, 0.15)', color: '#00C2FF' },
      user: { bg: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.5)' }
    };
    const style = styles[role] || styles.user;
    
    return (
      <span className="text-xs px-2 py-1 rounded-full" style={{ background: style.bg, color: style.color }}>
        {role}
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
          <Link href="/admin/users" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ 
            background: '#00C2FF', 
            color: '#000' 
          }}>
            Users
          </Link>
          <Link href="/admin/reports" className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80" style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            color: 'rgba(255, 255, 255, 0.7)' 
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
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.9)',
              minWidth: '200px'
            }}
          />
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select
            value={bannedFilter}
            onChange={(e) => { setBannedFilter(e.target.value); setPage(1); }}
            className="px-4 py-2 rounded-lg text-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            <option value="">All Status</option>
            <option value="false">Active</option>
            <option value="true">Banned</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="rounded-2xl overflow-hidden" style={{ 
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th className="text-left p-4 text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>User</th>
                  <th className="text-left p-4 text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Email</th>
                  <th className="text-left p-4 text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Role</th>
                  <th className="text-left p-4 text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Status</th>
                  <th className="text-left p-4 text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Joined</th>
                  <th className="text-right p-4 text-xs font-medium" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td className="p-4">
                      <div>
                        <Link href={`/${u.username}`} className="font-medium hover:underline" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                          @{u.username}
                        </Link>
                        {u.full_name && (
                          <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>{u.full_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{u.email}</td>
                    <td className="p-4">{getRoleBadge(u.role)}</td>
                    <td className="p-4">
                      {u.is_banned ? (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255, 59, 48, 0.15)', color: '#FF3B30' }}>
                          Banned
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(52, 199, 89, 0.15)', color: '#34C759' }}>
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          href={`/${u.username}`}
                          className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80"
                          style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          View
                        </Link>
                        {['admin', 'super_admin'].includes(user?.role || '') && u.id !== user?.id && (
                          <>
                            {u.is_banned ? (
                              <button
                                onClick={() => handleUnban(u.id, u.username)}
                                className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80"
                                style={{ background: 'rgba(52, 199, 89, 0.15)', color: '#34C759' }}
                              >
                                Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => { setSelectedUser(u); setShowBanModal(true); }}
                                className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80"
                                style={{ background: 'rgba(255, 59, 48, 0.15)', color: '#FF3B30' }}
                              >
                                Ban
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="rounded-2xl p-6 max-w-md w-full mx-4" style={{ 
            background: '#1C1C1E',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 className="text-lg font-bold mb-2" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              Ban @{selectedUser.username}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              This will prevent the user from accessing their account.
            </p>
            <textarea
              placeholder="Reason for ban..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="w-full p-3 rounded-lg mb-4 text-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.9)',
                minHeight: '100px'
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowBanModal(false); setSelectedUser(null); setBanReason(''); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleBan}
                disabled={!banReason.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: '#FF3B30', color: '#FFF' }}
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
