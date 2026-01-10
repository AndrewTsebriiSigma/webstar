'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminTeamPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteUsername, setPromoteUsername] = useState('');
  const [promoteRole, setPromoteRole] = useState<'moderator' | 'admin'>('moderator');

  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      toast.error('Super admin access required');
      router.push('/admin');
      return;
    }
    if (user) {
      loadAdmins();
    }
  }, [user, router]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const res = await fetch(`${baseUrl}/api/admin/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setAdmins(await res.json());
      }
    } catch (error) {
      console.error('Failed to load admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async () => {
    if (!promoteUsername.trim()) return;

    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // First find user by username
      const usersRes = await fetch(`${baseUrl}/api/admin/users?search=${encodeURIComponent(promoteUsername)}&limit=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!usersRes.ok) {
        toast.error('User not found');
        return;
      }

      const usersData = await usersRes.json();
      if (usersData.users.length === 0) {
        toast.error('User not found');
        return;
      }

      const targetUser = usersData.users[0];

      const res = await fetch(`${baseUrl}/api/admin/admins/${targetUser.id}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ new_role: promoteRole })
      });

      if (res.ok) {
        toast.success(`${promoteUsername} is now a ${promoteRole}`);
        setShowPromoteModal(false);
        setPromoteUsername('');
        loadAdmins();
      } else {
        const data = await res.json();
        toast.error(data.detail || 'Failed to promote user');
      }
    } catch (error) {
      toast.error('Failed to promote user');
    }
  };

  const handleDemote = async (adminId: number, username: string) => {
    if (!confirm(`Are you sure you want to demote ${username} to regular user?`)) return;

    try {
      const token = localStorage.getItem('access_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const res = await fetch(`${baseUrl}/api/admin/admins/${adminId}/demote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success(`${username} has been demoted`);
        loadAdmins();
      } else {
        const data = await res.json();
        toast.error(data.detail || 'Failed to demote user');
      }
    } catch (error) {
      toast.error('Failed to demote user');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      super_admin: { bg: 'rgba(255, 59, 48, 0.15)', color: '#FF3B30', label: '👑 Super Admin' },
      admin: { bg: 'rgba(255, 149, 0, 0.15)', color: '#FF9500', label: '⭐ Admin' },
      moderator: { bg: 'rgba(0, 194, 255, 0.15)', color: '#00C2FF', label: '🛡️ Moderator' }
    };
    const style = styles[role] || styles.moderator;
    
    return (
      <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: style.bg, color: style.color }}>
        {style.label}
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
          <Link href="/admin/reports" className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80" style={{ 
            background: 'rgba(255, 255, 255, 0.05)', 
            color: 'rgba(255, 255, 255, 0.7)' 
          }}>
            Reports
          </Link>
          <Link href="/admin/team" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ 
            background: '#00C2FF', 
            color: '#000' 
          }}>
            Admin Team
          </Link>
        </div>

        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
            Admin Team
          </h2>
          <button
            onClick={() => setShowPromoteModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#00C2FF', color: '#000' }}
          >
            + Add Admin
          </button>
        </div>

        {/* Admins List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
          ) : (
            admins.map((admin) => (
              <div 
                key={admin.id} 
                className="flex items-center justify-between rounded-xl p-4"
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                    {admin.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <Link href={`/${admin.username}`} className="font-medium hover:underline" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                      @{admin.username}
                    </Link>
                    <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>{admin.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {getRoleBadge(admin.role)}
                  
                  {admin.role !== 'super_admin' && admin.id !== user?.id && (
                    <button
                      onClick={() => handleDemote(admin.id, admin.username)}
                      className="text-xs px-3 py-1.5 rounded-lg transition hover:opacity-80"
                      style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30' }}
                    >
                      Demote
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Promote Info */}
        <div className="mt-8 rounded-xl p-6" style={{ 
          background: 'rgba(0, 194, 255, 0.05)',
          border: '1px solid rgba(0, 194, 255, 0.2)'
        }}>
          <h3 className="font-semibold mb-2" style={{ color: '#00C2FF' }}>Role Permissions</h3>
          <ul className="space-y-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            <li><strong style={{ color: '#FF9500' }}>Admin:</strong> Ban/unban users, delete content, resolve reports</li>
            <li><strong style={{ color: '#00C2FF' }}>Moderator:</strong> View reports, delete content, resolve reports</li>
          </ul>
        </div>
      </div>

      {/* Promote Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="rounded-2xl p-6 max-w-md w-full mx-4" style={{ 
            background: '#1C1C1E',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              Add Admin/Moderator
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Username</label>
                <input
                  type="text"
                  placeholder="Enter username..."
                  value={promoteUsername}
                  onChange={(e) => setPromoteUsername(e.target.value)}
                  className="w-full p-3 rounded-lg text-sm"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Role</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPromoteRole('moderator')}
                    className="flex-1 py-3 rounded-lg text-sm font-medium transition"
                    style={{
                      background: promoteRole === 'moderator' ? 'rgba(0, 194, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: promoteRole === 'moderator' ? '1px solid #00C2FF' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: promoteRole === 'moderator' ? '#00C2FF' : 'rgba(255, 255, 255, 0.6)'
                    }}
                  >
                    🛡️ Moderator
                  </button>
                  <button
                    onClick={() => setPromoteRole('admin')}
                    className="flex-1 py-3 rounded-lg text-sm font-medium transition"
                    style={{
                      background: promoteRole === 'admin' ? 'rgba(255, 149, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: promoteRole === 'admin' ? '1px solid #FF9500' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: promoteRole === 'admin' ? '#FF9500' : 'rgba(255, 255, 255, 0.6)'
                    }}
                  >
                    ⭐ Admin
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPromoteModal(false); setPromoteUsername(''); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.7)' }}
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={!promoteUsername.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: '#00C2FF', color: '#000' }}
              >
                Add to Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
