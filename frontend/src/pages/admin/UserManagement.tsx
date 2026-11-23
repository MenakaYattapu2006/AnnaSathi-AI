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
  Edit2,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Table, type TableColumn } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapUserFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import { Loading } from '../../components/common/Loading';
import type { User, UserRole, UserStatus } from '../../types';

const isProduction = Boolean((import.meta as any).env?.PROD);

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

  // Edit User state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'donor' as UserRole,
    status: 'active' as UserStatus,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete User state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.admin.listUsers();
      if (response?.data?.users) {
        setUsers(response.data.users.map(mapUserFromDb));
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load user accounts from server.' });
    } finally {
      setIsLoading(false);
    }
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

  const handleStatusChange = async () => {
    if (!confirmStatusModal || !currentAdmin) return;
    const { targetUser, newStatus } = confirmStatusModal;

    try {
      try {
        const response = await apiClient.admin.updateUserStatus(targetUser.id, newStatus === 'active');
        if (response?.success) {
          setFeedback({
            type: 'success',
            message: `Account status for ${targetUser.name} updated to "${newStatus}".`,
          });
          setConfirmStatusModal(null);
          loadUsers();
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Failed to update user status.' });
          return;
        }
      }

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
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update user status.' });
    } finally {
      setConfirmStatusModal(null);
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    try {
      const response = await apiClient.admin.updateUserDetails(editingUser.id, editFormData);
      if (response?.success) {
        setFeedback({
          type: 'success',
          message: `User ${editFormData.name} successfully updated.`,
        });
        setEditingUser(null);
        loadUsers();
      } else {
        setFeedback({ type: 'error', message: response?.error || 'Failed to update user details.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating user details.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    setIsDeleting(true);
    try {
      const response = await apiClient.admin.deleteUser(deleteConfirmUser.id);
      if (response?.success) {
        setFeedback({
          type: 'success',
          message: `User ${deleteConfirmUser.name} has been permanently deleted.`,
        });
        setDeleteConfirmUser(null);
        loadUsers();
      } else {
        setFeedback({ type: 'error', message: response?.error || 'Failed to delete user.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error deleting user.' });
    } finally {
      setIsDeleting(false);
    }
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
            {!isSelf && (
              <Button
                variant="outline"
                size="sm"
                className="text-primary border-primary/40 hover:bg-primary/10 flex items-center gap-1"
                onClick={() => handleOpenEdit(u)}
                title="Edit User Details"
              >
                <Edit2 size={13} />
                Edit
              </Button>
            )}
            {!isSelf && (
              <Button
                variant="outline"
                size="sm"
                className="text-danger border-danger/40 hover:bg-danger/10 flex items-center gap-1"
                onClick={() => setDeleteConfirmUser(u)}
                title="Delete User Completely"
              >
                <Trash2 size={13} />
                Delete
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

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Edit User: ${editingUser.name}`}
        >
          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1">Full Name</label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-primary-text focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1">Email Address</label>
              <input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-primary-text focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary-text mb-1">Phone Number</label>
              <input
                type="text"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-primary-text focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-secondary-text mb-1">Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-primary-text focus:outline-none focus:border-primary"
                >
                  <option value="donor">Donor</option>
                  <option value="ngo">NGO</option>
                  <option value="volunteer">Volunteer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary-text mb-1">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as UserStatus })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-surface text-primary-text focus:outline-none focus:border-primary"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setEditingUser(null)} disabled={isUpdating}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveEdit} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <Modal
          isOpen={!!deleteConfirmUser}
          onClose={() => setDeleteConfirmUser(null)}
          title="Delete User Account"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Irreversible Action</p>
                <p className="text-xs mt-0.5">
                  Are you sure you want to permanently delete user{' '}
                  <strong>{deleteConfirmUser.name}</strong> ({deleteConfirmUser.email})? This will remove all their account records completely.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setDeleteConfirmUser(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="bg-danger text-white border-danger hover:bg-danger/90"
                onClick={handleDeleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete User Permanently'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
