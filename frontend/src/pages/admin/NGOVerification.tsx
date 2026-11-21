import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Table, type TableColumn } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapNgoFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import { Loading } from '../../components/common/Loading';
import type { NGO, NGOStatus } from '../../types';

const isProduction = Boolean((import.meta as any).env?.PROD);

export const NGOVerification: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [selectedNgo, setSelectedNgo] = useState<NGO | null>(null);
  const [rejectingNgo, setRejectingNgo] = useState<NGO | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifyConfirmNgo, setVerifyConfirmNgo] = useState<NGO | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const loadNgos = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.admin.listNGOs();
      if (response?.data) {
        setNgos(response.data.map(mapNgoFromDb));
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load NGOs from server.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNgos();
  }, []);

  const counts = useMemo(() => {
    return {
      pending: ngos.filter((n) => n.verificationStatus === 'pending').length,
      verified: ngos.filter((n) => n.verificationStatus === 'verified').length,
      rejected: ngos.filter((n) => n.verificationStatus === 'rejected').length,
      all: ngos.length,
    };
  }, [ngos]);

  const filteredNgos = useMemo(() => {
    return ngos.filter((n) => {
      const matchesTab = activeTab === 'all' || n.verificationStatus === activeTab;
      const matchesSearch =
        n.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.address.city.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [ngos, activeTab, searchQuery]);

  const handleVerify = async (ngo: NGO) => {
    if (!currentAdmin) return;
    try {
      try {
        const response = await apiClient.admin.reviewNGOVerification(ngo.id, 'VERIFIED');
        if (response?.success) {
          mockDataService.verifyNGO(ngo.id, currentAdmin.id);
          setFeedback({
            type: 'success',
            message: `Successfully verified NGO: ${ngo.organizationName}. Organization can now receive donations.`,
          });
          loadNgos();
          setVerifyConfirmNgo(null);
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Failed to verify NGO.' });
          setVerifyConfirmNgo(null);
          return;
        }
        // Dev fallback if backend is offline
        const result = mockDataService.verifyNGO(ngo.id, currentAdmin.id);
        if (result.success) {
          setFeedback({
            type: 'success',
            message: `Verified NGO: ${ngo.organizationName} (offline mock mode). Note: ${apiErr.message}`,
          });
          loadNgos();
          setVerifyConfirmNgo(null);
          return;
        }
        throw apiErr;
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to verify organization.' });
    } finally {
      setVerifyConfirmNgo(null);
    }
  };

  const handleReject = async () => {
    if (!rejectingNgo || !currentAdmin) return;
    if (!rejectionReason.trim()) {
      setFeedback({ type: 'error', message: 'A rejection reason is required.' });
      return;
    }

    try {
      try {
        const response = await apiClient.admin.reviewNGOVerification(rejectingNgo.id, 'REJECTED', rejectionReason.trim());
        if (response?.success) {
          mockDataService.rejectNGO(rejectingNgo.id, currentAdmin.id, rejectionReason.trim());
          setFeedback({
            type: 'success',
            message: `Rejected application for ${rejectingNgo.organizationName}. Reason recorded.`,
          });
          loadNgos();
          setRejectingNgo(null);
          setRejectionReason('');
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Failed to reject NGO.' });
          return;
        }
        const result = mockDataService.rejectNGO(rejectingNgo.id, currentAdmin.id, rejectionReason.trim());
        if (result.success) {
          setFeedback({
            type: 'success',
            message: `Rejected application for ${rejectingNgo.organizationName} (offline mock mode). Note: ${apiErr.message}`,
          });
          loadNgos();
          setRejectingNgo(null);
          setRejectionReason('');
          return;
        }
        throw apiErr;
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reject organization.' });
    } finally {
      setRejectingNgo(null);
      setRejectionReason('');
    }
  };

  const columns: TableColumn<NGO>[] = [
    {
      header: 'Organization',
      accessor: (ngo) => (
        <div>
          <p className="font-semibold text-primary-text">{ngo.organizationName}</p>
          <p className="text-xs text-secondary-text">Reg: {ngo.registrationNumber || 'N/A'}</p>
          <p className="text-xs text-secondary-text">{ngo.address.city}, {ngo.address.state}</p>
        </div>
      ),
    },
    {
      header: 'Contact Person',
      accessor: (ngo) => (
        <div>
          <p className="font-medium text-primary-text text-sm">{ngo.contactPerson}</p>
          <p className="text-xs text-secondary-text">{ngo.contactEmail}</p>
          <p className="text-xs text-secondary-text">{ngo.contactPhone}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (ngo) => (
        <Badge
          size="sm"
          variant={
            ngo.verificationStatus === 'verified'
              ? 'success'
              : ngo.verificationStatus === 'rejected'
              ? 'danger'
              : 'warning'
          }
        >
          {ngo.verificationStatus.toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Capacity & Storage',
      accessor: (ngo) => (
        <div className="text-xs">
          <p className="font-medium text-primary-text">
            {ngo.capacity?.maxDailyMeals || 0} meals/day
          </p>
          <p className="text-secondary-text">
            Cold storage: {ngo.capacity?.hasColdStorage ? 'Available' : 'None'}
          </p>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (ngo) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedNgo(ngo)}>
            Review
          </Button>
          {ngo.verificationStatus === 'pending' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setVerifyConfirmNgo(ngo)}
              >
                Verify
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-danger border-danger/40 hover:bg-danger/10"
                onClick={() => setRejectingNgo(ngo)}
              >
                Reject
              </Button>
            </>
          )}
          {ngo.verificationStatus === 'rejected' && (
            <Button
              variant="outline"
              size="sm"
              className="text-primary"
              onClick={() => setVerifyConfirmNgo(ngo)}
            >
              Re-evaluate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="NGO Verification Management"
        description="Review registration documents, vet credentials, and manage community partner approvals."
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
          <button onClick={() => setFeedback(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary-text hover:text-primary-text'
          }`}
        >
          Pending Review
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-warning/10 text-warning font-bold">
            {counts.pending}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('verified')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'verified'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary-text hover:text-primary-text'
          }`}
        >
          Verified Partners
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-success/10 text-success font-bold">
            {counts.verified}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'rejected'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary-text hover:text-primary-text'
          }`}
        >
          Rejected
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-danger/10 text-danger font-bold">
            {counts.rejected}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary-text hover:text-primary-text'
          }`}
        >
          All Applications ({counts.all})
        </button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-secondary-text" size={18} />
          <input
            type="text"
            placeholder="Search by NGO name, registration #, city, or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-border rounded-md text-sm bg-surface text-primary-text focus:outline-none focus:border-primary"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <Table
          columns={columns}
          data={filteredNgos}
          emptyState={
            <EmptyState
              title={`No ${activeTab !== 'all' ? activeTab : ''} NGO records found`}
              description="All applications in this category have been processed or none match your search."
            />
          }
        />
      </Card>

      {/* Details Modal */}
      {selectedNgo && (
        <Modal
          isOpen={!!selectedNgo}
          onClose={() => setSelectedNgo(null)}
          title={`NGO Details: ${selectedNgo.organizationName}`}
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <p className="font-bold text-lg text-primary-text">{selectedNgo.organizationName}</p>
                <p className="text-xs text-secondary-text">Govt Registration: {selectedNgo.registrationNumber || 'Pending verification'}</p>
              </div>
              <Badge
                variant={
                  selectedNgo.verificationStatus === 'verified'
                    ? 'success'
                    : selectedNgo.verificationStatus === 'rejected'
                    ? 'danger'
                    : 'warning'
                }
              >
                {selectedNgo.verificationStatus.toUpperCase()}
              </Badge>
            </div>

            {selectedNgo.description && (
              <p className="text-secondary-text text-xs italic">{selectedNgo.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-secondary-text block">Contact Person</span>
                <span className="text-primary-text font-medium">{selectedNgo.contactPerson}</span>
              </div>
              <div>
                <span className="text-xs text-secondary-text block">Contact Phone</span>
                <span className="text-primary-text">{selectedNgo.contactPhone}</span>
              </div>
              <div>
                <span className="text-xs text-secondary-text block">Official Email</span>
                <span className="text-primary-text">{selectedNgo.contactEmail}</span>
              </div>
              <div>
                <span className="text-xs text-secondary-text block">Facility Address</span>
                <span className="text-primary-text">
                  {selectedNgo.address.street}, {selectedNgo.address.city}, {selectedNgo.address.state}
                </span>
              </div>
            </div>

            <div className="p-3 bg-surface-hover rounded-md">
              <span className="text-xs font-semibold text-primary-text block mb-1">Operational Capacity</span>
              <p className="text-xs text-secondary-text">
                Max Daily Meals: <strong className="text-primary-text">{selectedNgo.capacity?.maxDailyMeals || 0}</strong>
              </p>
              <p className="text-xs text-secondary-text">
                Cold Storage Equipped:{' '}
                <strong className="text-primary-text">{selectedNgo.capacity?.hasColdStorage ? 'Yes' : 'No'}</strong>
              </p>
              <p className="text-xs text-secondary-text">
                Service Areas: {selectedNgo.serviceArea?.join(', ') || 'Metropolitan district'}
              </p>
            </div>

            {selectedNgo.rejectionReason && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-md text-xs text-danger">
                <strong>Rejection Reason:</strong> {selectedNgo.rejectionReason}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button variant="outline" onClick={() => setSelectedNgo(null)}>
                Close
              </Button>
              {selectedNgo.verificationStatus !== 'verified' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    const target = selectedNgo;
                    setSelectedNgo(null);
                    setVerifyConfirmNgo(target);
                  }}
                >
                  Verify NGO
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Verify Confirmation Modal */}
      {verifyConfirmNgo && (
        <Modal
          isOpen={!!verifyConfirmNgo}
          onClose={() => setVerifyConfirmNgo(null)}
          title="Confirm NGO Approval"
        >
          <div className="space-y-4">
            <p className="text-sm text-secondary-text">
              Are you sure you want to approve{' '}
              <strong className="text-primary-text">{verifyConfirmNgo.organizationName}</strong> as a verified partner?
              This will grant them immediate access to discover and accept surplus food donations across the platform.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <Button variant="outline" onClick={() => setVerifyConfirmNgo(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handleVerify(verifyConfirmNgo)}>
                Confirm Approval
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection Modal with Reason */}
      {rejectingNgo && (
        <Modal
          isOpen={!!rejectingNgo}
          onClose={() => {
            setRejectingNgo(null);
            setRejectionReason('');
          }}
          title={`Reject Verification: ${rejectingNgo.organizationName}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-secondary-text">
              Please specify the reason for rejecting this NGO's verification application. This note will be recorded in the administrative log.
            </p>
            <div>
              <label className="block text-xs font-semibold text-primary-text mb-1">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Mismatched registration credentials, invalid facility address, or insufficient refrigeration compliance..."
                className="w-full p-2.5 border border-border rounded-md text-sm bg-surface text-primary-text focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectingNgo(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-danger border-danger/50 hover:bg-danger/10"
                onClick={handleReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NGOVerification;
