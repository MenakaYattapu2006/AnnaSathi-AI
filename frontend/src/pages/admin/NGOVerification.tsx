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
    return ngos.filter((ngo) => {
      const matchesTab = activeTab === 'all' || ngo.verificationStatus === activeTab;
      const matchesSearch =
        ngo.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ngo.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ngo.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${ngo.address.city} ${ngo.address.state}`.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [ngos, activeTab, searchQuery]);

  const columns: TableColumn<NGO>[] = [
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
              <Button variant="primary" size="sm" onClick={() => setVerifyConfirmNgo(ngo)}>
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
            <Button variant="outline" size="sm" className="text-primary" onClick={() => setVerifyConfirmNgo(ngo)}>
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
            activeTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-secondary-text hover:text-primary-text'
          }`}
        >
          Pending Review
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-warning/10 text-warning font-bold">{counts.pending}</span>
        </button>
        <button
          onClick={() => setActiveTab('verified')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'verified' ? 'border-primary text-primary' : 'border-transparent text-secondary-text hover:text-primary-text'
          }`}
        >
          Verified
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-success/10 text-success font-bold">{counts.verified}</span>
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'rejected' ? 'border-primary text-primary' : 'border-transparent text-secondary-text hover:text-primary-text'
          }`}
        >
          Rejected
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-danger/10 text-danger font-bold">{counts.rejected}</span>
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-secondary-text hover:text-primary-text'
          }`}
        >
          All
          <span className="px-1.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-bold">{counts.all}</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-secondary-text" />
        <input
          type="text"
          placeholder="Search NGOs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 p-2 border rounded"
        />
      </div>

      {isLoading ? (
        <Loading />
      ) : filteredNgos.length === 0 ? (
        <EmptyState message="No NGOs match the current filters." />
      ) : (
        <Table data={filteredNgos} columns={columns} />
      )}

      {/* Modals for review, verification, rejection would go here */}
    </div>
  );
};
