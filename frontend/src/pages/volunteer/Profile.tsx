import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import {
  User,
  Phone,
  Mail,
  Truck,
  MapPin,
  Star,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  X,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapVolunteerFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import type { Volunteer, VolunteerAvailability } from '../../types/volunteer';

const isProduction = Boolean((import.meta as any).env?.PROD);

const VEHICLE_OPTIONS: { id: 'two_wheeler' | 'four_wheeler' | 'van' | 'none'; label: string }[] = [
  { id: 'two_wheeler', label: 'Two-Wheeler (Motorcycle / Scooter)' },
  { id: 'four_wheeler', label: 'Four-Wheeler (Car / Hatchback)' },
  { id: 'van', label: 'Cargo Van / Commercial Vehicle' },
  { id: 'none', label: 'No Vehicle (On Foot / Bicycle)' },
];

const AVAILABILITY_OPTIONS: { id: VolunteerAvailability; label: string }[] = [
  { id: 'available', label: 'Available for Dispatches' },
  { id: 'busy', label: 'Busy (On Active Delivery)' },
  { id: 'offline', label: 'Offline / Resting' },
];

const VolunteerProfile: React.FC = () => {
  const { user } = useAuth();
  const [volunteer, setVolunteer] = useState<Volunteer | undefined>(() =>
    user ? mockDataService.getVolunteerByUserId(user.id) : undefined
  );

  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const defaultServiceArea =
    volunteer?.serviceArea && volunteer.serviceArea.length > 0
      ? volunteer.serviceArea.join(', ')
      : [user?.profile?.city || (user as any)?.city, user?.profile?.pincode || (user as any)?.pincode]
          .filter(Boolean)
          .join(' - ');

  const [formData, setFormData] = useState({
    name: volunteer?.name || user?.name || '',
    email: volunteer?.email || user?.email || '',
    phone: volunteer?.phone || user?.phone || '',
    vehicleType: volunteer?.vehicleType || 'two_wheeler',
    availability: volunteer?.availability || 'available',
    serviceArea: defaultServiceArea,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    let isMounted = true;
    async function loadVolunteer() {
      try {
        const res = await apiClient.volunteer.getMe();
        if (res?.volunteer && isMounted) {
          const mapped = mapVolunteerFromDb(res.volunteer);
          setVolunteer(mapped);
          setFormData({
            name: mapped.name,
            email: mapped.email,
            phone: mapped.phone,
            vehicleType: mapped.vehicleType,
            availability: mapped.availability,
            serviceArea: mapped.serviceArea ? mapped.serviceArea.join(', ') : '',
          });
        }
      } catch {
        if (!isProduction && user && isMounted) {
          const mock = mockDataService.getVolunteerByUserId(user.id);
          if (mock) setVolunteer(mock);
        }
      }
    }
    loadVolunteer();
    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user || !volunteer) {
    return (
      <div className="p-6">
        <PageHeader title="Volunteer Profile" description="Profile record not found." />
        <Card className="p-6 text-center text-secondary-text">
          No volunteer profile associated with this account.
        </Card>
      </div>
    );
  }

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Full name is required.';
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errors.email = 'Valid email address is required.';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setFeedback(null);
    if (!validate() || !volunteer) return;

    const parsedAreas = formData.serviceArea
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updates = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      vehicleType: formData.vehicleType,
      availability: formData.availability,
      serviceAreas: parsedAreas,
    };

    try {
      try {
        const [updateRes, availRes] = await Promise.all([
          apiClient.volunteer.updateMe(updates),
          apiClient.volunteer.updateAvailability(formData.availability),
        ]);

        if (updateRes?.success || availRes?.success) {
          setFeedback({
            type: 'success',
            message: 'Volunteer profile updated and persisted successfully to live database.',
          });
          const fresh = await apiClient.volunteer.getMe().catch(() => null);
          if (fresh?.volunteer) setVolunteer(mapVolunteerFromDb(fresh.volunteer));
          setIsEditing(false);
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setFeedback({ type: 'error', message: apiErr.message || 'Server error: Failed to update profile.' });
          return;
        }
      }

      const result = mockDataService.updateVolunteerProfile(volunteer.id, user.id, updates as any);
      if (!result.success) {
        setFeedback({ type: 'error', message: result.error || 'Failed to update profile.' });
      } else {
        setFeedback({
          type: 'success',
          message: 'Volunteer profile updated and persisted successfully.',
        });
        if (result.volunteer) {
          setVolunteer(result.volunteer);
        }
        setIsEditing(false);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone,
      vehicleType: volunteer.vehicleType,
      availability: volunteer.availability,
      serviceArea: volunteer.serviceArea ? volunteer.serviceArea.join(', ') : '',
    });
    setFormErrors({});
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="Volunteer Profile"
          description="Manage your rescue credentials, vehicle configuration, and service availability"
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

      {/* Feedback Banner */}
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
        {/* Left Column: Profile Card */}
        <Card className="p-6 h-fit">
          <div className="text-center mb-6">
            <div className="h-20 w-20 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
              <User size={36} />
            </div>
            <h2 className="text-xl font-bold text-primary-text">{volunteer.name}</h2>
            <p className="text-xs text-secondary-text mt-1">Community Delivery Volunteer</p>

            <div className="mt-3 flex justify-center gap-2">
              <Badge
                variant={volunteer.availability === 'available' ? 'success' : 'warning'}
                size="md"
                className="capitalize"
              >
                {volunteer.availability}
              </Badge>
              <Badge variant="neutral" size="md" className="capitalize">
                {volunteer.status}
              </Badge>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3 text-xs text-secondary-text">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-primary flex-shrink-0" />
              <span className="truncate">{volunteer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={15} className="text-primary flex-shrink-0" />
              <span>{volunteer.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={15} className="text-primary flex-shrink-0" />
              <span className="capitalize">{volunteer.vehicleType.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Read-Only Verified Stats */}
          <div className="mt-6 p-3 bg-surface-container-low rounded-lg border border-border text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-secondary-text">Community Rating:</span>
              <span className="font-bold text-primary flex items-center gap-1">
                <Star size={13} className="fill-warning text-warning" />
                <span>{volunteer.rating ? volunteer.rating.toFixed(1) : '4.9'} / 5.0</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-text">Completed Deliveries:</span>
              <span className="font-bold text-primary">
                {volunteer.totalDeliveriesCompleted || 0} runs
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-secondary-text">Registration Date:</span>
              <span className="text-primary-text font-medium">
                {new Date(volunteer.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs flex items-center justify-center gap-1.5"
                onClick={() => {
                  if (!navigator.geolocation) {
                    setFeedback({ type: 'error', message: 'Geolocation is not supported by your browser.' });
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      try {
                        await apiClient.volunteer.updateLocation({
                          latitude: position.coords.latitude,
                          longitude: position.coords.longitude,
                          speed: position.coords.speed || 0,
                          heading: position.coords.heading || 0,
                        });
                        setFeedback({
                          type: 'success',
                          message: `Location shared successfully (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}).`,
                        });
                      } catch {
                        setFeedback({ type: 'error', message: 'Failed to update live coordinates on server.' });
                      }
                    },
                    (geoErr) => {
                      setFeedback({
                        type: 'error',
                        message: `Location consent not granted: ${geoErr.message}`,
                      });
                    },
                    { enableHighAccuracy: true }
                  );
                }}
              >
                <MapPin size={14} className="text-primary" />
                <span>Update GPS Location (Consent-Based)</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* Right Column: Editable Profile Details (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-primary-text flex items-center gap-2 border-b border-border pb-3">
              <User size={18} className="text-primary" />
              <span>Personal Information</span>
            </h3>

            {isEditing ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-primary-text mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {formErrors.name && (
                    <span className="text-danger text-[11px] mt-0.5 block">{formErrors.name}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-primary-text mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {formErrors.email && (
                      <span className="text-danger text-[11px] mt-0.5 block">{formErrors.email}</span>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-primary-text mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {formErrors.phone && (
                      <span className="text-danger text-[11px] mt-0.5 block">{formErrors.phone}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-surface-container-low p-3 rounded-md">
                  <span className="block text-secondary-text font-semibold uppercase text-[10px]">
                    Full Name
                  </span>
                  <span className="font-semibold text-primary-text text-sm">{volunteer.name}</span>
                </div>

                <div className="bg-surface-container-low p-3 rounded-md">
                  <span className="block text-secondary-text font-semibold uppercase text-[10px]">
                    Account Role
                  </span>
                  <span className="font-medium text-primary capitalize text-sm">Volunteer</span>
                </div>

                <div className="bg-surface-container-low p-3 rounded-md">
                  <span className="block text-secondary-text font-semibold uppercase text-[10px]">
                    Email Address
                  </span>
                  <span className="font-medium text-primary-text">{volunteer.email}</span>
                </div>

                <div className="bg-surface-container-low p-3 rounded-md">
                  <span className="block text-secondary-text font-semibold uppercase text-[10px]">
                    Phone Number
                  </span>
                  <span className="font-medium text-primary-text">{volunteer.phone}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Section 2: Logistics & Dispatch Availability */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-primary-text flex items-center gap-2 border-b border-border pb-3">
              <Truck size={18} className="text-primary" />
              <span>Vehicle & Dispatch Availability</span>
            </h3>

            {isEditing ? (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-primary-text mb-1">
                    Registered Vehicle Type
                  </label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicleType: e.target.value as any })
                    }
                    className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {VEHICLE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-primary-text mb-1">
                    Current Dispatch Availability
                  </label>
                  <select
                    value={formData.availability}
                    onChange={(e) =>
                      setFormData({ ...formData, availability: e.target.value as any })
                    }
                    className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-primary-text mb-1">
                    Preferred Service Areas (comma-separated neighborhoods)
                  </label>
                  <input
                    type="text"
                    value={formData.serviceArea}
                    onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                    placeholder="e.g. City Name, Pincode, Local Areas"
                    className="w-full p-2.5 rounded-md border border-border bg-surface text-primary-text focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-surface-container-low p-3 rounded-md">
                    <span className="block text-secondary-text font-semibold uppercase text-[10px]">
                      Vehicle Type
                    </span>
                    <span className="font-semibold text-primary-text capitalize text-sm">
                      {volunteer.vehicleType.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="bg-surface-container-low p-3 rounded-md">
                    <span className="block text-secondary-text font-semibold uppercase text-[10px]">
                      Current Availability
                    </span>
                    <span className="font-semibold capitalize text-primary-text text-sm">
                      {volunteer.availability}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-secondary-text block mb-1.5 font-semibold text-[11px]">
                    Preferred Service Neighborhoods:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {volunteer.serviceArea.map((area, idx) => (
                      <Badge key={idx} variant="neutral" size="sm">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfile;
