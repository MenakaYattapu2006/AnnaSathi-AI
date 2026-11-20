import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Sparkles, CheckCircle2, Flame } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapDonationFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import type { FoodCategory, QuantityUnit, Donation } from '../../types/donation';

const isProduction = Boolean((import.meta as any).env?.PROD);

const FOOD_CATEGORIES: { value: FoodCategory; label: string }[] = [
  { value: 'cooked_meals', label: 'Cooked Meals (Catering / Banquet / Buffet)' },
  { value: 'raw_groceries', label: 'Raw Groceries (Rice, Dal, Flour)' },
  { value: 'bakery_items', label: 'Bakery Items (Bread, Buns, Pastries)' },
  { value: 'packaged_food', label: 'Packaged Food (Juices, Canned Goods)' },
  { value: 'fruits_vegetables', label: 'Fruits & Vegetables' },
  { value: 'dairy_products', label: 'Dairy Products (Milk, Paneer, Curd)' },
];

const UNITS: { value: QuantityUnit; label: string }[] = [
  { value: 'meals', label: 'Meals (Servings)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'packets', label: 'Packets' },
  { value: 'liters', label: 'Liters' },
  { value: 'boxes', label: 'Boxes' },
];

const CreateDonation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Helper defaults: preparation = now, expiry = +6 hours
  const nowIsoLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const defaultExpiryLocal = () => {
    const d = new Date(Date.now() + 6 * 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [foodName, setFoodName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('cooked_meals');
  const [quantity, setQuantity] = useState<number | ''>(50);
  const [unit, setUnit] = useState<QuantityUnit>('meals');
  const [dietaryType, setDietaryType] = useState<'veg' | 'non-veg'>('veg');
  const [preparationTime, setPreparationTime] = useState<string>(nowIsoLocal());
  const [expiryTime, setExpiryTime] = useState<string>(defaultExpiryLocal());

  const [street, setStreet] = useState(user?.profile?.address || 'Road No. 12, Banjara Hills');
  const [city, setCity] = useState(user?.profile?.city || 'Hyderabad');
  const [pincode, setPincode] = useState('500034');
  const [landmark, setLandmark] = useState('Near MLA Colony Gate');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time rule-based Urgency Score calculation preview
  const [aiUrgency, setAiUrgency] = useState<{
    urgencyScore: number;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    explanation: string;
    disclaimer?: string;
    isExpired?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!preparationTime || !expiryTime) {
      setAiUrgency(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.ai.predictUrgency({
          foodCategory: category,
          preparationTime: new Date(preparationTime).toISOString(),
          expiryTime: new Date(expiryTime).toISOString(),
          quantity: Number(quantity) || 1,
        });
        if (res?.data) {
          setAiUrgency({
            urgencyScore: res.data.urgencyScore,
            urgencyLevel: res.data.urgencyLevel,
            explanation: res.data.explanation,
            disclaimer: res.data.disclaimer,
            isExpired: res.data.isExpired,
          });
        }
      } catch {
        // graceful offline fallback handled below
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [category, preparationTime, expiryTime, quantity]);

  const urgencyPreview = useMemo(() => {
    if (aiUrgency) {
      return {
        score: aiUrgency.urgencyScore,
        level: aiUrgency.urgencyLevel,
        explanation: aiUrgency.explanation,
        disclaimer: aiUrgency.disclaimer,
      };
    }
    if (!preparationTime || !expiryTime) {
      return {
        score: 50,
        level: 'medium' as const,
        explanation: 'Awaiting valid time window.',
        disclaimer: 'DISCLAIMER: Operational dispatch metric, not a certified laboratory food safety test.',
      };
    }
    const calculated = mockDataService.calculateUrgency(
      category,
      new Date(preparationTime).toISOString(),
      new Date(expiryTime).toISOString()
    );
    return {
      ...calculated,
      disclaimer: 'DISCLAIMER: Operational dispatch metric, not a certified laboratory food safety test.',
    };
  }, [aiUrgency, category, preparationTime, expiryTime]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!foodName.trim()) {
      newErrors.foodName = 'Food name or description is required.';
    }

    if (quantity === '' || Number(quantity) <= 0) {
      newErrors.quantity = 'Quantity must be greater than zero.';
    }

    const prepDate = new Date(preparationTime).getTime();
    const expiryDate = new Date(expiryTime).getTime();
    const now = Date.now();

    if (isNaN(prepDate)) {
      newErrors.preparationTime = 'Valid preparation time is required.';
    }

    if (isNaN(expiryDate)) {
      newErrors.expiryTime = 'Valid expiry time is required.';
    } else {
      if (expiryDate <= prepDate) {
        newErrors.expiryTime = 'Expiry time must be later than preparation time.';
      }
      if (expiryDate <= now) {
        newErrors.expiryTime = 'Expired food cannot be submitted. Expiry must be in the future.';
      }
    }

    if (!street.trim()) {
      newErrors.street = 'Pickup address is required.';
    }
    if (!city.trim()) {
      newErrors.city = 'City is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;

    setIsSubmitting(true);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.submit;
      return copy;
    });

    const donationPayload = {
      foodName: foodName.trim(),
      category,
      quantity: Number(quantity),
      unit,
      numberOfServings: unit === 'meals' ? Number(quantity) : undefined,
      dietaryType,
      preparationTime: new Date(preparationTime).toISOString(),
      expiryTime: new Date(expiryTime).toISOString(),
      pickupAddress: {
        street: street.trim(),
        city: city.trim(),
        state: 'Telangana',
        pincode: pincode.trim() || '500001',
        latitude: 17.4156,
        longitude: 78.4357,
        landmark: landmark.trim() || undefined,
      },
      specialInstructions: specialInstructions.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    };

    try {
      try {
        const response = await apiClient.donations.create(donationPayload);
        if (response?.donation) {
          navigate('/donor/my-donations', {
            state: { newDonationCreated: true, donationId: response.donation.id },
          });
          return;
        }
      } catch (apiErr: any) {
        if (isProduction) {
          setErrors({ submit: apiErr.message || 'Server error: Unable to create donation.' });
          return;
        }
      }

      // Local fallback in non-production mode if backend is offline
      const urgency = mockDataService.calculateUrgency(
        category,
        new Date(preparationTime).toISOString(),
        new Date(expiryTime).toISOString()
      );

      const newDonation: Donation = {
        id: `don-${Date.now().toString(36)}`,
        donorId: user.id,
        ...donationPayload,
        urgencyScore: urgency.score,
        urgencyLevel: urgency.level,
        status: 'CREATED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockDataService.createDonation(newDonation);

      navigate('/donor/my-donations', {
        state: { newDonationCreated: true, donationId: newDonation.id },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const urgencyBadgeVariant =
    urgencyPreview.level === 'critical'
      ? 'danger'
      : urgencyPreview.level === 'high'
        ? 'warning'
        : urgencyPreview.level === 'medium'
          ? 'info'
          : 'neutral';

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Create Food Donation"
        description="List surplus food to connect with nearby verified NGOs and hunger relief centers"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <span className="font-semibold">Submission Error:</span> {errors.submit}
          </div>
        )}
        {/* Section 1: Food Details */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-primary-text mb-4">1. Food Information</h2>

          <div className="space-y-4">
            <Input
              label="Food Item Name / Description *"
              placeholder="e.g. Vegetable Dum Biryani, Mixed Dal, Chapati Packets"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              error={errors.foodName}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-text mb-1">
                  Food Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FoodCategory)}
                  className="w-full rounded-md border border-border dark:border-[#1E293B] bg-white dark:bg-[#131B22] text-primary-text dark:text-slate-100 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {FOOD_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-text mb-1">
                  Dietary Preference *
                </label>
                <div className="flex gap-4 mt-2">
                  <label className="inline-flex items-center gap-2 text-sm text-primary-text cursor-pointer">
                    <input
                      type="radio"
                      name="dietaryType"
                      value="veg"
                      checked={dietaryType === 'veg'}
                      onChange={() => setDietaryType('veg')}
                      className="text-primary focus:ring-primary"
                    />
                    Vegetarian (Veg)
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-primary-text cursor-pointer">
                    <input
                      type="radio"
                      name="dietaryType"
                      value="non-veg"
                      checked={dietaryType === 'non-veg'}
                      onChange={() => setDietaryType('non-veg')}
                      className="text-primary focus:ring-primary"
                    />
                    Non-Vegetarian
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Quantity *"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                error={errors.quantity}
              />

              <div>
                <label className="block text-sm font-medium text-primary-text mb-1">
                  Unit of Measurement *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as QuantityUnit)}
                  className="w-full rounded-md border border-border dark:border-[#1E293B] bg-white dark:bg-[#131B22] text-primary-text dark:text-slate-100 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Time Sensitivity & Urgency Calculation Preview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary-text">2. Shelf Life & Urgency Calculation</h2>
            <div className="flex items-center gap-1.5 text-xs text-secondary-text">
              <Sparkles size={14} className="text-accent" />
              <span>Rule-Based Urgency Engine</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Input
              label="Preparation Time *"
              type="datetime-local"
              value={preparationTime}
              onChange={(e) => setPreparationTime(e.target.value)}
              error={errors.preparationTime}
            />

            <Input
              label="Expiry / Best Before Time *"
              type="datetime-local"
              value={expiryTime}
              onChange={(e) => setExpiryTime(e.target.value)}
              error={errors.expiryTime}
            />
          </div>

          {/* Live Urgency Score Calculation Box */}
          <div className="p-4 bg-surface-container-low rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="text-accent" size={18} />
                <span className="text-sm font-bold text-primary-text">Computed Urgency Score:</span>
                <span className="text-lg font-extrabold text-primary">{urgencyPreview.score} / 100</span>
                <Badge variant={urgencyBadgeVariant} size="sm" className="capitalize">
                  {urgencyPreview.level} Priority
                </Badge>
              </div>
              <p className="text-xs text-secondary-text mt-1">{urgencyPreview.explanation}</p>
            </div>
            <div className="text-[11px] text-secondary-text bg-surface p-2.5 rounded-lg border border-border max-w-sm">
              <span className="font-semibold text-primary block mb-0.5">FSSAI Operational Dispatch Notice:</span>
              <p className="leading-tight">{urgencyPreview.disclaimer}</p>
            </div>
          </div>
        </Card>

        {/* Section 3: Pickup Location */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-primary-text mb-4">3. Pickup Logistics</h2>

          <div className="space-y-4">
            <Input
              label="Pickup Street Address *"
              placeholder="e.g. Grand Palace Banquet Hall, Road No. 12, Banjara Hills"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              error={errors.street}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City *"
                placeholder="e.g. Hyderabad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                error={errors.city}
              />
              <Input
                label="Pincode"
                placeholder="500034"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
              <Input
                label="Landmark (Optional)"
                placeholder="e.g. Near Metro Pillar 42"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-text mb-1">
                Additional Pickup Instructions
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Collect from kitchen back entrance. Bring large crates or thermal food carrier."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full rounded-md border border-border dark:border-[#1E293B] bg-white dark:bg-[#131B22] text-primary-text dark:text-slate-100 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/donor/dashboard')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            <span>{isSubmitting ? 'Submitting Donation...' : 'Publish Food Listing'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateDonation;
