import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Table, type TableColumn } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { apiClient, mapNgoFromDb } from '../../lib/apiClient';
import { Loading } from '../../components/common/Loading';
import type { NGO } from '../../types';

export const NGOVerification: React.FC = () => {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [selectedNgo, setSelectedNgo] = useState<NGO | null>(null);
  const [rejectingNgo, setRejectingNgo] = useState<NGO | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [verifyConfirmNgo, setVerifyConfirmNgo] = useState<NGO | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadNgos = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.admin.listNGOs();
      if (response?.data) {
        setNgos(response.data.map(mapNgoFromDb));
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
    const q = searchQuery.toLowerCase().trim();
    return ngos.filter((ngo) => {
      const matchesTab = activeTab === 'all' || ngo.verificationStatus === activeTab;
      if (!q) return matchesTab;

      const orgName = (ngo.organizationName || '').toLowerCase();
      const contactPerson = (ngo.contactPerson || '').toLowerCase();
      const contactEmail = (ngo.contactEmail || '').toLowerCase();
      const city = (ngo.address?.city || '').toLowerCase();
      const state = (ngo.address?.state || '').toLowerCase();
      const regNumber = (ngo.registrationNumber || '').toLowerCase();

      const matchesSearch =
        orgName.includes(q) ||
        contactPerson.includes(q) ||
        contactEmail.includes(q) ||
        regNumber.includes(q) ||
        `${city} ${state}`.includes(q);

      return matchesTab && matchesSearch;
    });
  }, [ngos, activeTab, searchQuery]);

  const handleVerify = async (ngo: NGO) => {
    setIsSubmitting(true);
    try {
      await apiClient.admin.reviewNGOVerification(ngo.id, 'VERIFIED');
      setFeedback({ type: 'success', message: `Organization "${ngo.organizationName}" has been successfully verified!` });
      setVerifyConfirmNgo(null);
      setSelectedNgo(null);
      await loadNgos();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to verify NGO. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingNgo) return;
    if (!rejectionReason.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a reason for rejection.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.admin.reviewNGOVerification(rejectingNgo.id, 'REJECTED', rejectionReason.trim());
      setFeedback({ type: 'success', message: `Organization "${rejectingNgo.organizationName}" registration was rejected.` });
      setRejectingNgo(null);
      setRejectionReason('');
      setSelectedNgo(null);
      await loadNgos();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to reject NGO. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: TableColumn<NGO>[] = [
    {
      header: 'Organization & Reg Number',
      accessor: (ngo) => (
        <div>
          <p className="font-semibold text-primary-text text-sm flex items-center gap-1.5">
            <Building2 size={15} className="text-primary flex-shrink-0" />
            {ngo.organizationName || 'Unnamed NGO'}
          </p>
          <p className="text-xs text-secondary-text mt-0.5">
            Reg: <span className="font-mono text-slate-700 dark:text-slate-300">{ngo.registrationNumber || 'N/A'}</span>
          </p>
          <p className="text-xs text-secondary-text flex items-center gap-1 mt-0.5">
            <MapPin size={11} />
            {ngo.address?.city || 'Unknown'}, {ngo.address?.state || ''}
          </p>
        </div>
      ),
    },
    {
      header: 'Contact Person',
      accessor: (ngo) => (
        <div className="text-xs space-y-0.5">
          <p className="font-medium text-primary-text text-sm">{ngo.contactPerson || 'N/A'}</p>
          <p className="text-secondary-text flex items-center gap-1">
            <Mail size={11} /> {ngo.contactEmail || 'N/A'}
          </p>
          <p className="text-secondary-text flex items-center gap-1">
            <Phone size={11} /> {ngo.contactPhone || 'N/A'}
          </p>
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
          {(ngo.verificationStatus || 'PENDING').toUpperCase()}
        </Badge>
      ),
    },
    {
      header: 'Capacity & Storage',
      accessor: (ngo) => (
        <div className="text-xs space-y-0.5">
          <p className="font-medium text-primary-text">
            {ngo.capacity?.maxDailyMeals || 100} meals/day
          </p>
          <p className="text-secondary-text">
            Cold storage: {ngo.capacity?.hasColdStorage ? '✓ Available' : '✗ None'}
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
              <Button variant="primary" size="sm" onClick={() => setVerifyConfirmNgo(ngo)}>
                Verify
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-danger border-danger/40 hover:bg-danger/10"
                onClick={() => {
                  setRejectingNgo(ngo);
                  setRejectionReason('');
                }}
              >
                Reject
              </Button>
            </>
          )}
          {ngo.verificationStatus === 'rejected' && (
            <Button variant="outline" size="sm" className="text-primary" onClick={() => setVerifyConfirmNgo(ngo)}>
              Re-verify
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
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-blue-950/40 text-emerald-800 dark:text-blue-300 border border-emerald-500/30'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-500/30'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#1E293B] gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pending'
              ? 'border-emerald-600 text-emerald-700 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Pending Review
          <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold">
            {counts.pending}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('verified')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'verified'
              ? 'border-emerald-600 text-emerald-700 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Verified
          <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-emerald-100 dark:bg-blue-600 text-emerald-700 dark:text-blue-400 font-bold">
            {counts.verified}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rejected'
              ? 'border-emerald-600 text-emerald-700 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Rejected
          <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold">
            {counts.rejected}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'all'
              ? 'border-emerald-600 text-emerald-700 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          All
          <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 font-bold">
            {counts.all}
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by organization name, registration number, contact person, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1E293B] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
      </div>

      {/* Data Table */}
      {isLoading ? (
        <Loading message="Loading NGO partners..." />
      ) : filteredNgos.length === 0 ? (
        <EmptyState
          title="No NGOs Found"
          description={searchQuery ? `No organizations matched "${searchQuery}".` : 'No NGOs found for this filter tab.'}
        />
      ) : (
        <Table data={filteredNgos} columns={columns} />
      )}

      {/* Review Modal */}
      {selectedNgo && (
        <Modal
          isOpen={Boolean(selectedNgo)}
          onClose={() => setSelectedNgo(null)}
          title={`Review NGO: ${selectedNgo.organizationName}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-[#0F172A] p-4 rounded-xl border border-slate-200 dark:border-[#1E293B]">
              <div>
                <span className="text-slate-400 block mb-0.5">Registration Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedNgo.registrationNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Verification Status</span>
                <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">{selectedNgo.verificationStatus}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Contact Person</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedNgo.contactPerson}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Contact Email</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedNgo.contactEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Contact Phone</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedNgo.contactPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Location Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedNgo.address?.street}, {selectedNgo.address?.city}, {selectedNgo.address?.state} - {selectedNgo.address?.pincode}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Daily Meal Capacity</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedNgo.capacity?.maxDailyMeals || 100} meals</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Cold Storage</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedNgo.capacity?.hasColdStorage ? 'Yes' : 'No'}</span>
              </div>
            </div>

            {selectedNgo.rejectionReason && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-500/30 rounded-xl text-xs text-rose-800 dark:text-rose-300">
                <span className="font-bold block mb-1">Previous Rejection Reason:</span>
                <p>{selectedNgo.rejectionReason}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1E293B]">
              <Button variant="outline" onClick={() => setSelectedNgo(null)}>
                Close
              </Button>
              {selectedNgo.verificationStatus === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    className="text-danger border-danger/40 hover:bg-danger/10"
                    onClick={() => {
                      setRejectingNgo(selectedNgo);
                      setRejectionReason('');
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    disabled={isSubmitting}
                    onClick={() => handleVerify(selectedNgo)}
                  >
                    {isSubmitting ? 'Verifying...' : 'Approve & Verify'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Verify Confirmation Modal */}
      {verifyConfirmNgo && (
        <Modal
          isOpen={Boolean(verifyConfirmNgo)}
          onClose={() => setVerifyConfirmNgo(null)}
          title="Confirm NGO Approval"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to approve and verify{' '}
              <strong className="text-slate-900 dark:text-white">{verifyConfirmNgo.organizationName}</strong>?
              This will grant them full access to claim surplus food donations on the platform.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1E293B]">
              <Button variant="outline" onClick={() => setVerifyConfirmNgo(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={isSubmitting}
                onClick={() => handleVerify(verifyConfirmNgo)}
              >
                {isSubmitting ? 'Approving...' : 'Confirm Verification'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectingNgo && (
        <Modal
          isOpen={Boolean(rejectingNgo)}
          onClose={() => setRejectingNgo(null)}
          title="Reject NGO Registration"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Please state the specific reason for rejecting{' '}
              <strong className="text-slate-900 dark:text-white">{rejectingNgo.organizationName}</strong>.
              This reason will be provided to the organization.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Invalid DARPAN ID / Registration documents mismatch..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-[#1E293B] rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1E293B]">
              <Button variant="outline" onClick={() => setRejectingNgo(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                disabled={isSubmitting || !rejectionReason.trim()}
                onClick={handleReject}
              >
                {isSubmitting ? 'Rejecting...' : 'Reject Organization'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default NGOVerification;



