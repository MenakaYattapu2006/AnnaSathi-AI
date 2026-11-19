import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Shield,
  UserCheck,
  UserX,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Table, type TableColumn } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { mockDataService } from '../../lib/mockDataService';
import type { User, UserRole, UserStatus } from '../../types';

export const UserManagement: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    targetUser: User;
    newStatus: UserStatus;
  } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadUsers = () => {
    setUsers(mockDataService.getUsers());
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone.includes(searchQuery);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleStatusChange = () => {
    if (!confirmStatusModal || !currentAdmin) return;
    const { targetUser, newStatus } = confirmStatusModal;
    const result = mockDataService.updateUserStatus(targetUser.id, newStatus, currentAdmin.id);

    if (result.success) {
      setFeedback({
        type: 'success',
        message: `Account status for ${targetUser.name} updated to "${newStatus}".`,
      });
      loadUsers();
    } else {
      setFeedback({
        type: 'error',
        message: result.error || 'Failed to update user status.',
      });
    }
    setConfirmStatusModal(null);
  };

  const columns: TableColumn<User>[] = [
    {
      header: 'User / Contact',
      accessor: (u) => (
        <div>
          <p className="font-semibold text-primary-text">{u.name}</p>
          <p className="text-xs text-secondary-text">{u.email}</p>
          <p className="text-xs text-secondary-text">{u.phone}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (u) => (
        <Badge
          size="sm"
          variant={
            u.role === 'admin'
              ? 'danger'
              : u.role === 'ngo'
              ? 'info'
              : u.role === 'volunteer'
              ? 'warning'
              : 'neutral'
          }
        >
          {u.role.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Account Status',
      accessor: (u) => (
        <Badge
          size="sm"
          variant={
            u.status === 'active'
              ? 'success'
              : u.status === 'suspended'
              ? 'danger'
              : 'warning'
          }
        >
          {u.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Joined Date',
      accessor: (u) => (
        <span className="text-xs text-secondary-text">
          {new Date(u.createdAt).toLocaleDateString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (u) => {
        const isSelf = currentAdmin?.id === u.id;
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedUser(u)}
            >
              Details
            </Button>
            {!isSelf && u.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                className="text-danger border-danger/40 hover:bg-danger/10"
                onClick={() =>
                  setConfirmStatusModal({ targetUser: u, newStatus: 'suspended' })
                }
              >
                Suspend
              </Button>
            )}
            {!isSelf && u.status !== 'active' && (
              <Button
                variant="outline"
                size="sm"
                className="text-success border-success/40 hover:bg-success/10"
                onClick={() =>
                  setConfirmStatusModal({ targetUser: u, newStatus: 'active' })
                }
              >
                Activate
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Oversee user accounts, verify roles, and manage platform permissions."
      />

      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-success/10 text-success border border-success/30'
              : 'bg-danger/10 text-danger border border-danger/30'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-secondary-text" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-md text-sm bg-surface text-primary-text focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-secondary-text" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-primary-text focus:outline-none focus:border-primary"
              >
                <option value="all">All Roles</option>
                <option value="donor">Donors</option>
                <option value="ngo">NGOs</option>
                <option value="volunteer">Volunteers</option>
                <option value="admin">Administrators</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-primary-text focus:outline-none focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </Card>

      {/* User Directory Table */}
      <Card className="p-0 overflow-hidden">
        <Table
          columns={columns}
          data={filteredUsers}
          emptyState={
            <EmptyState
              title="No users match your criteria"
              description="Try adjusting your search query or filters."
            />
          }
        />
      </Card>

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`User Profile: ${selectedUser.name}`}
          footerAction={{
            label: 'Close',
            onClick: () => setSelectedUser(null),
            variant: 'outline',
          }}
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-base text-primary-text">{selectedUser.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge size="sm" variant="neutral">{selectedUser.role.toUpperCase()}</Badge>
                  <Badge size="sm" variant={selectedUser.status === 'active' ? 'success' : 'danger'}>
                    {selectedUser.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-secondary-text block">User ID</span>
                <span className="font-mono text-xs text-primary-text">{selectedUser.id}</span>
              </div>
              <div>
                <span className="text-xs text-secondary-text block">Joined Date</span>
                <span className="text-primary-text">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-xs text-secondary-text block">Email</span>
                <span className="text-primary-text">{selectedUser.email}</span>
              </div>
              <div>
                <span className="text-xs text-secondary-text block">Phone</span>
                <span className="text-primary-text">{selectedUser.phone}</span>
              </div>
            </div>

            {selectedUser.profile && (
              <div className="p-3 bg-surface-hover rounded-md space-y-1">
                <span className="text-xs font-semibold text-primary-text block">Profile Details</span>
                {selectedUser.profile.organizationName && (
                  <p className="text-xs text-secondary-text">
                    Organization: <strong className="text-primary-text">{selectedUser.profile.organizationName}</strong>
                  </p>
                )}
                {selectedUser.profile.bio && (
                  <p className="text-xs text-secondary-text">Bio: {selectedUser.profile.bio}</p>
                )}
                {selectedUser.profile.city && (
                  <p className="text-xs text-secondary-text">
                    Location: {selectedUser.profile.city}, {selectedUser.profile.state} {selectedUser.profile.pincode}
                  </p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Status Confirmation Modal */}
      {confirmStatusModal && (
        <Modal
          isOpen={!!confirmStatusModal}
          onClose={() => setConfirmStatusModal(null)}
          title="Confirm Account Status Change"
        >
          <div className="space-y-4">
            <p className="text-sm text-secondary-text">
              Are you sure you want to change the status of{' '}
              <strong className="text-primary-text">{confirmStatusModal.targetUser.name}</strong> to{' '}
              <strong className="text-primary-text uppercase">{confirmStatusModal.newStatus}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setConfirmStatusModal(null)}>
                Cancel
              </Button>
              <Button
                variant={confirmStatusModal.newStatus === 'active' ? 'primary' : 'outline'}
                className={confirmStatusModal.newStatus !== 'active' ? 'text-danger border-danger/50' : ''}
                onClick={handleStatusChange}
              >
                Confirm {confirmStatusModal.newStatus}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
