import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  MapPin,
  Phone,
  Mail,
  FileText,
  Edit2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Refrigerator,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapNgoFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import type { NGO } from '../../types/ngo';

const isProduction = Boolean((import.meta as any).env?.PROD);

const AVAILABLE_CATEGORIES = [
  { id: 'cooked_meals', label: 'Cooked Meals' },
  { id: 'raw_groceries', label: 'Raw Groceries' },
  { id: 'bakery_items', label: 'Bakery Items' },
  { id: 'packaged_food', label: 'Packaged Food' },
  { id: 'fruits_vegetables', label: 'Fruits & Vegetables' },
  { id: 'dairy_products', label: 'Dairy Products' },
];

const OrganizationProfile: React.FC = () => {
  const { user } = useAuth();
  const [ngo, setNgo] = useState<NGO | undefined>(() =>
    user ? mockDataService.getNGOByUserId(user.id) : undefined
  );

  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    organizationName: ngo?.organizationName || user?.profile?.organizationName || '',
    contactPerson: ngo?.contactPerson || user?.name || '',
    contactEmail: ngo?.contactEmail || user?.email || '',
    contactPhone: ngo?.contactPhone || user?.phone || '',
    description:
      ngo?.description ||
      'Dedicated community welfare non-profit providing nutritional assistance and warm meals to vulnerable families.',
    street: ngo?.address?.street || 'Plot 45, Jubilee Enclave, Road No. 36',
    city: ngo?.address?.city || 'Hyderabad',
    state: ngo?.address?.state || 'Telangana',
    pincode: ngo?.address?.pincode || '500081',
    serviceArea: ngo?.serviceArea ? ngo.serviceArea.join(', ') : 'Jubilee Hills, Madhapur, Kondapur',
    maxDailyMeals: ngo?.capacity?.maxDailyMeals ?? 500,
    hasColdStorage: ngo?.capacity?.hasColdStorage ?? true,
    acceptedCategories: ngo?.foodRequirements?.map((r) => r.category) || ['cooked_meals', 'bakery_items'],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    let isMounted = true;
    async function fetchNgo() {
      try {
        const res = await apiClient.ngo.getMe();
        if (res?.ngo && isMounted) {
          const mapped = mapNgoFromDb(res.ngo);
          setNgo(mapped);
          setFormData({
            organizationName: mapped.organizationName,
            contactPerson: mapped.contactPerson,
            contactEmail: mapped.contactEmail,
            contactPhone: mapped.contactPhone,
            description: mapped.description || '',
            street: mapped.address.street,
            city: mapped.address.city,
            state: mapped.address.state,
            pincode: mapped.address.pincode,
            serviceArea: mapped.serviceArea ? mapped.serviceArea.join(', ') : '',
            maxDailyMeals: mapped.capacity.maxDailyMeals,
            hasColdStorage: mapped.capacity.hasColdStorage,
            acceptedCategories: mapped.foodRequirements?.map((r) => r.category) || ['cooked_meals'],
          });
        }
      } catch {
        if (user && (user as any).ngo && isMounted) {
          const mapped = mapNgoFromDb((user as any).ngo);
          setNgo(mapped);
        } else if (!isProduction && user && isMounted) {
          const mock = mockDataService.getNGOByUserId(user.id);
          if (mock) setNgo(mock);
        }
      }
    }
    fetchNgo();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user || !ngo) {
    return (
      <div className="p-6">
        <PageHeader title="Organization Profile" description="NGO profile not found." />
        <Card className="p-6 text-center text-secondary-text">
          No NGO organization record associated with this account.
        </Card>
      </div>
    );
  }

  const verificationStatus = ngo.verificationStatus;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.organizationName.trim()) {
      errors.organizationName = 'Organization name is required.';
    }
    if (!formData.contactPerson.trim()) {
      errors.contactPerson = 'Contact representative name is required.';
    }
    if (!formData.contactEmail.trim() || !formData.contactEmail.includes('@')) {
      errors.contactEmail = 'Valid contact email is required.';
    }
    if (!formData.contactPhone.trim()) {
      errors.contactPhone = 'Contact phone number is required.';
    }
    if (!formData.city.trim()) {
      errors.city = 'City is required.';
    }
    if (isNaN(Number(formData.maxDailyMeals)) || Number(formData.maxDailyMeals) < 0) {
      errors.maxDailyMeals = 'Capacity must be a positive number of meals.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setFeedback(null);
    if (!validateForm() || !ngo) return;

    const parsedAreas = formData.serviceArea
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updates = {
      organizationName: formData.organizationName.trim(),
      contactPerson: formData.contactPerson.trim(),
      contactEmail: formData.contactEmail.trim(),
      contactPhone: formData.contactPhone.trim(),
      description: formData.description.trim(),
      street: formData.street.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      pincode: formData.pincode.trim(),
      serviceAreas: parsedAreas,
      maxDailyMeals: Number(formData.maxDailyMeals),
      hasColdStorage: formData.hasColdStorage,
    };

    try {
      try {
        const response = await apiClient.ngo.updateMe(updates);
        if (response?.success) {
          setFeedback({
            type: 'success',
            message: 'Organization profile updated and persisted successfully to live database.',
          });
          const fresh = await apiClient.ngo.getMe().catch(() => null);
          if (fresh?.ngo) setNgo(mapNgoFromDb(fresh.ngo));
          setIsEditing(false);
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Failed to update profile.' });
          return;
        }
      }

      const result = mockDataService.updateNGOProfile(ngo.id, user.id, updates as any);
      if (!result.success) {
        setFeedback({ type: 'error', message: result.error || 'Failed to update profile.' });
      } else {
        setFeedback({
          type: 'success',
          message: 'Organization profile updated and persisted successfully.',
        });
        if (result.ngo) {
          setNgo(result.ngo);
        }
        setIsEditing(false);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    }
  };

  const handleCancel = () => {
    // Reset form to active NGO state
    setFormData({
      organizationName: ngo.organizationName,
      contactPerson: ngo.contactPerson,
      contactEmail: ngo.contactEmail,
      contactPhone: ngo.contactPhone,
      description:
        ngo.description ||
        'Dedicated community welfare non-profit providing nutritional assistance and warm meals to vulnerable families.',
      street: ngo.address?.street || '',
      city: ngo.address?.city || '',
      state: ngo.address?.state || 'Telangana',
      pincode: ngo.address?.pincode || '',
      serviceArea: ngo.serviceArea ? ngo.serviceArea.join(', ') : '',
      maxDailyMeals: ngo.capacity?.maxDailyMeals ?? 500,
      hasColdStorage: ngo.capacity?.hasColdStorage ?? true,
      acceptedCategories: ngo.foodRequirements?.map((r) => r.category) || ['cooked_meals'],
    });
    setFormErrors({});
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="Organization Profile"
          description="Review and update your NGO operational details and distribution capacity"
          className="mb-0"
        />
        {!isEditing ? (
          <Button
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Edit2 size={15} />
            <span>Edit Profile</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X size={15} className="mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save size={15} className="mr-1" />
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Action Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-start justify-between gap-3 border ${
            feedback.type === 'success'
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm font-medium">{feedback.message}</p>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-current hover:opacity-75 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Organization Summary Card */}
        <Card className="p-6 h-fit">
          <div className="text-center mb-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
              <Building2 size={36} />
            </div>
            <h2 className="text-xl font-bold text-primary-text">{ngo.organizationName}</h2>
            <p className="text-xs text-secondary-text mt-1">Non-Governmental Organization</p>

            <div className="mt-4 flex justify-center">
              {verificationStatus === 'verified' && (
                <Badge variant="success" size="md" className="flex items-center gap-1 px-3 py-1">
                  <ShieldCheck size={16} />
                  <span>Verified NGO</span>
                </Badge>
              )}
              {verificationStatus === 'pending' && (
                <Badge variant="warning" size="md" className="flex items-center gap-1 px-3 py-1">
                  <AlertTriangle size={16} />
                  <span>Pending Verification</span>
                </Badge>
              )}
              {verificationStatus === 'rejected' && (
                <Badge variant="danger" size="md" className="flex items-center gap-1 px-3 py-1">
                  <XCircle size={16} />
                  <span>Verification Rejected</span>
                </Badge>
              )}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3 text-xs text-secondary-text">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-primary flex-shrink-0" />
              <span className="truncate">{ngo.contactEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-primary flex-shrink-0" />
              <span>{ngo.contactPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-primary flex-shrink-0" />
              <span>
                {ngo.address.city}, {ngo.address.state}
              </span>
            </div>
          </div>

          {/* Verification Status Explainer (Read-Only) */}
          <div className="mt-6 p-3 bg-surface-container-low rounded-lg border border-border text-xs space-y-1">
            <span className="font-semibold text-primary-text block">Verification Governance:</span>
            <span className="text-secondary-text block">
              Organization verification status is assigned and audited by platform administrators. NGOs cannot modify their own verification status.
            </span>
          </div>
        </Card>

        {/* Right Column: Profile Form / Details (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Organization & Contact Info */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-primary-text flex items-center gap-2 border-b border-border pb-3">
              <FileText size={18} className="text-primary" />
              <span>Organization Identity & Contact</span>
            </h3>

            {isEditing ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-primary-text mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) =>
                      setFormData({ ...formData, organizationName: e.target.value })
                    }
                    className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {formErrors.organizationName && (
                    <span className="text-danger text-[11px] mt-0.5 block">
                      {formErrors.organizationName}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-primary-text mb-1">
                      Contact Representative *
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {formErrors.contactPerson && (
                      <span className="text-danger text-[11px] mt-0.5 block">
                        {formErrors.contactPerson}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-primary-text mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="text"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {formErrors.contactPhone && (
                      <span className="text-danger text-[11px] mt-0.5 block">
                        {formErrors.contactPhone}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-primary-text mb-1">
                    Official Contact Email *
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {formErrors.contactEmail && (
                    <span className="text-danger text-[11px] mt-0.5 block">
                      {formErrors.contactEmail}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-primary-text mb-1">
                    Organization Mission & Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-surface-container-low p-3 rounded-md">
                  <span className="block text-secondary-text font-semibold uppercase text-[10px]">
                    Registration Number
                  </span>
                  <span className="font-mono font-medium text-primary-text text-sm">
                    {ngo.registrationNumber}
                  </span>
                </div>

                <div className="bg-surface-container-low p-3 rounded-md">
                  <span className="block text-secondary-text font-semibold uppercase text-[10px]">
                    Verification Status
                  </span>
                  <span className="font-semibold capitalize text-primary-text text-sm">
                    {ngo.verificationStatus}
                  </span>
                </div>

                <div className="bg-surface-container-low p-3 rounded-md">
                  <span className="block text-secondary-text font-semibold uppercase text-[10px]">
                    Contact Representative
                  </span>
                  <span className="font-medium text-primary-text text-sm">
                    {ngo.contactPerson}
                  </span>
                </div>

                <div className="bg-surface-container-low p-3 rounded-md">
                  <span className="block text-secondary-text font-semibold uppercase text-[10px]">
                    Registration Date
                  </span>
                  <span className="font-medium text-primary-text text-sm">
                    {new Date(ngo.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="sm:col-span-2 bg-surface-container-low p-3 rounded-md">
                  <span className="block text-secondary-text font-semibold uppercase text-[10px] mb-1">
                    Organization Mission
                  </span>
                  <p className="text-secondary-text text-xs leading-relaxed">
                    {ngo.description ||
                      'Dedicated community welfare non-profit providing nutritional assistance and warm meals to vulnerable families.'}
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Section 2: Address & Service Area */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-primary-text flex items-center gap-2 border-b border-border pb-3">
              <MapPin size={18} className="text-primary" />
              <span>Address & Coverage Areas</span>
            </h3>

            {isEditing ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-primary-text mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-primary-text mb-1">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-primary-text mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-primary-text mb-1">Pincode</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-primary-text mb-1">
                    Service Areas (comma-separated neighborhoods)
                  </label>
                  <input
                    type="text"
                    value={formData.serviceArea}
                    onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                    placeholder="e.g. Jubilee Hills, Madhapur, Gachibowli"
                    className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-secondary-text block">Physical Address:</span>
                  <span className="font-medium text-primary-text">
                    {ngo.address.street}, {ngo.address.city}, {ngo.address.state} - {ngo.address.pincode}
                  </span>
                </div>

                <div>
                  <span className="text-secondary-text block mb-1.5">Active Service Zones:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ngo.serviceArea.map((area, idx) => (
                      <Badge key={idx} variant="neutral" size="sm">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Section 3: Distribution Capacity & Cold Storage */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-primary-text flex items-center gap-2 border-b border-border pb-3">
              <Refrigerator size={18} className="text-primary" />
              <span>Daily Meal Capacity & Storage</span>
            </h3>

            {isEditing ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-primary-text mb-1">
                    Daily Meal Distribution Capacity *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.maxDailyMeals}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDailyMeals: Number(e.target.value) })
                    }
                    className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {formErrors.maxDailyMeals && (
                    <span className="text-danger text-[11px] mt-0.5 block">
                      {formErrors.maxDailyMeals}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="coldStorageToggle"
                    checked={formData.hasColdStorage}
                    onChange={(e) =>
                      setFormData({ ...formData, hasColdStorage: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="coldStorageToggle" className="font-semibold text-primary-text">
                    Equipped with temperature-controlled cold storage facilities
                  </label>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-surface-container-low p-3.5 rounded-md">
                  <span className="block text-secondary-text font-semibold uppercase text-[10px]">
                    Daily Meal Capacity
                  </span>
                  <span className="font-bold text-lg text-primary">
                    {ngo.capacity?.maxDailyMeals || 300} meals/day
                  </span>
                </div>

                <div className="bg-surface-container-low p-3.5 rounded-md">
                  <span className="block text-secondary-text font-semibold uppercase text-[10px]">
                    Cold Storage Facility
                  </span>
                  <span className="font-medium text-primary-text text-sm">
                    {ngo.capacity?.hasColdStorage ? 'Equipped on-site' : 'No cold storage on-site'}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrganizationProfile;
