import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Table, type TableColumn } from '../../components/common/Table';
import { EmptyState } from '../../components/common/EmptyState';
import { DonationDetailsModal } from '../../components/donor/DonationDetailsModal';
import { History, Eye, Calendar, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapDonationFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import type { Donation, DonationStatus } from '../../types/donation';

const isProduction = Boolean((import.meta as any).env?.PROD);

const statusBadgeMap: Record<DonationStatus, { variant: 'success' | 'warning' | 'info' | 'neutral' | 'danger'; label: string }> = {
  CREATED: { variant: 'neutral', label: 'Created' },
  NGO_MATCHED: { variant: 'info', label: 'Matched' },
  NGO_ACCEPTED: { variant: 'success', label: 'Accepted' },
  VOLUNTEER_ASSIGNED: { variant: 'info', label: 'Volunteer Assigned' },
  PICKED_UP: { variant: 'warning', label: 'Picked Up' },
  DELIVERED: { variant: 'success', label: 'Delivered' },
  RECEIPT_CONFIRMED: { variant: 'success', label: 'Receipt Confirmed' },
  CANCELLED: { variant: 'danger', label: 'Cancelled' },
};

const DonorDonationHistory: React.FC = () => {
  const { user } = useAuth();
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await apiClient.donations.getAll();
        if (res?.donations && isMounted) {
          setDonations(res.donations.map(mapDonationFromDb));
          setIsLoading(false);
          return;
        }
      } catch {
        if (isProduction) {
          if (isMounted) setIsLoading(false);
          return;
        }
      }
      if (user && isMounted) {
        setDonations(mockDataService.getDonationsByDonor(user.id));
      }
      if (isMounted) setIsLoading(false);
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const historyDonations = useMemo(() => {
    return donations
      .filter(
        (d) =>
          d.status === 'DELIVERED' ||
          d.status === 'RECEIPT_CONFIRMED' ||
          d.status === 'CANCELLED'
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [donations]);

  const columns: TableColumn<Donation>[] = [
    {
      header: 'Food Item',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-primary-text">{row.foodName}</p>
          <p className="text-xs text-secondary-text capitalize">{row.category.replace('_', ' ')}</p>
        </div>
      ),
    },
    {
      header: 'Quantity',
      accessor: (row) => (
        <span className="font-medium text-primary-text">
          {row.quantity} {row.unit}
        </span>
      ),
    },
    {
      header: 'Outcome / Status',
      accessor: (row) => {
        const conf = statusBadgeMap[row.status] || { variant: 'neutral', label: row.status };
        return <Badge variant={conf.variant} size="sm">{conf.label}</Badge>;
      },
    },
    {
      header: 'Recipient NGO',
      accessor: (row) => {
        const ngoName = (row as any).matched_ngo_name;
        const ngo = (!ngoName && row.matchedNgoId) ? mockDataService.getNGOById(row.matchedNgoId) : undefined;
        return (
          <span className="text-xs text-secondary-text font-medium">
            {ngoName || (ngo ? ngo.organizationName : row.status === 'CANCELLED' ? 'None (Cancelled)' : 'Community Distribution')}
          </span>
        );
      },
    },
    {
      header: 'Date',
      accessor: (row) => (
        <span className="text-xs text-secondary-text flex items-center gap-1">
          <Calendar size={13} className="text-primary" />
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Action',
      accessor: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedDonation(row);
            setIsDetailsOpen(true);
          }}
          className="flex items-center gap-1 text-xs"
        >
          <Eye size={12} />
          Receipt / Details
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Donation History"
        description="Archive of completed distributions, verified receipts, and past donation records"
      />

      <Card className="p-0 overflow-hidden">
        <Table
          columns={columns}
          data={historyDonations}
          emptyState={
            <EmptyState
              icon={<History size={48} className="text-primary" />}
              title="No past donation history"
              description="Completed and delivered food donations will automatically be archived here with proof of receipt."
            />
          }
        />
      </Card>

      <DonationDetailsModal
        donation={selectedDonation}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        currentUserId={user?.id}
      />
    </div>
  );
};

export default DonorDonationHistory;



