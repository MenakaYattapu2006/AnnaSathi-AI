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
import { resolveAddressCoordinates, resolveStateFromLocation } from '../../utils/geocoding';
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
  const [category, setCategory] = useState<FoodCategory | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState<QuantityUnit | ''>('');
  const [dietaryType, setDietaryType] = useState<'veg' | 'non-veg'>('veg');
  const [preparationTime, setPreparationTime] = useState<string>('');
  const [expiryTime, setExpiryTime] = useState<string>('');

  const [street, setStreet] = useState(user?.profile?.address || '');
  const [city, setCity] = useState(user?.profile?.city || '');
  const [pincode, setPincode] = useState(user?.profile?.pincode || '');
  const [landmark, setLandmark] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick-action time presets
  const handleSetPrepNow = () => {
    setPreparationTime(nowIsoLocal());
  };

  const handleSetExpiryHours = (hours: number) => {
    const baseTime = preparationTime ? new Date(preparationTime).getTime() : Date.now();
    const d = new Date(baseTime + hours * 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setExpiryTime(d.toISOString().slice(0, 16));
  };

  // Real-time rule-based Urgency Score calculation preview
  const [aiUrgency, setAiUrgency] = useState<{
    urgencyScore: number;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    explanation: string;
    disclaimer?: string;
    isExpired?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!category || !preparationTime || !expiryTime) {
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
    if (!category || !preparationTime || !expiryTime) {
      return {
        score: 0,
        level: 'low' as const,
        explanation: 'Select food category and enter preparation & expiry times to compute live urgency.',
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
      newErrors.foodName = 'Enter food item name or description.';
    }

    if (!category) {
      newErrors.category = 'Select a food category.';
    }

    if (quantity === '' || Number(quantity) <= 0) {
      newErrors.quantity = 'Enter a valid quantity greater than zero.';
    }

    if (!unit) {
      newErrors.unit = 'Select a unit of measurement.';
    }

    if (!preparationTime) {
      newErrors.preparationTime = 'Select preparation date and time.';
    }

    if (!expiryTime) {
      newErrors.expiryTime = 'Select expiry date and time.';
    }

    if (preparationTime && expiryTime) {
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
    }

    if (!street.trim()) {
      newErrors.street = 'Enter pickup street address.';
    }
    if (!city.trim()) {
      newErrors.city = 'Enter city name.';
    }
    if (pincode.trim() && !/^\d{6}$/.test(pincode.trim())) {
      newErrors.pincode = 'Pincode must be a 6-digit number.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user || !category || !unit) return;

    setIsSubmitting(true);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.submit;
      return copy;
    });

    const fullAddress = `${street.trim()}, ${city.trim()}`;
    const coords = await resolveAddressCoordinates(fullAddress);

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
        state: resolveStateFromLocation(fullAddress, pincode.trim()),
        pincode: pincode.trim() || '500001',
        latitude: coords.latitude,
        longitude: coords.longitude,
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
              placeholder="Enter food name or description (e.g. Vegetable Dum Biryani, Mixed Dal)"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              error={errors.foodName}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Food Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FoodCategory)}
                  className={`w-full rounded-xl border bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm transition-all focus:border-emerald-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-blue-500/20 ${
                    errors.category ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-[#1E293B]'
                  }`}
                >
                  <option value="" disabled>Select food category</option>
                  {FOOD_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{errors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dietary Preference *
                </label>
                <div className="flex gap-4 mt-2.5">
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
                placeholder="Enter quantity (e.g. 50)"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                error={errors.quantity}
              />

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Unit of Measurement *
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as QuantityUnit)}
                  className={`w-full rounded-xl border bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 px-3.5 py-2.5 text-sm transition-all focus:border-emerald-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-emerald-600/20 dark:focus:ring-blue-500/20 ${
                    errors.unit ? 'border-red-500 dark:border-red-500' : 'border-slate-200 dark:border-[#1E293B]'
                  }`}
                >
                  <option value="" disabled>Select unit of measurement</option>
                  {UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
                {errors.unit && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">{errors.unit}</p>
                )}
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
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Preparation Time *
                </label>
                <button
                  type="button"
                  onClick={handleSetPrepNow}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Set to Now
                </button>
              </div>
              <Input
                type="datetime-local"
                value={preparationTime}
                onChange={(e) => setPreparationTime(e.target.value)}
                error={errors.preparationTime}
                wrapperClassName="!mb-0"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Expiry / Best Before Time *
                </label>
                <div className="flex items-center gap-1 text-[11px] text-primary">
                  <span>Presets:</span>
                  <button type="button" onClick={() => handleSetExpiryHours(4)} className="hover:underline font-medium">+4h</button>
                  <span>•</span>
                  <button type="button" onClick={() => handleSetExpiryHours(6)} className="hover:underline font-medium">+6h</button>
                  <span>•</span>
                  <button type="button" onClick={() => handleSetExpiryHours(12)} className="hover:underline font-medium">+12h</button>
                </div>
              </div>
              <Input
                type="datetime-local"
                value={expiryTime}
                onChange={(e) => setExpiryTime(e.target.value)}
                error={errors.expiryTime}
                wrapperClassName="!mb-0"
              />
            </div>
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
              placeholder="Enter pickup street address (e.g. Building, Flat/Door No., Street/Road, Area)"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              error={errors.street}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City *"
                placeholder="Enter city (e.g. Hyderabad)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                error={errors.city}
              />
              <Input
                label="Pincode"
                placeholder="Enter 6-digit pincode (e.g. 500034)"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                error={errors.pincode}
              />
              <Input
                label="Landmark (Optional)"
                placeholder="Enter nearby landmark (e.g. Near Metro Pillar 42)"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Additional Pickup Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Enter additional pickup instructions (e.g. Collect from kitchen back entrance, call upon arrival)"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full rounded-md border border-border dark:border-[#1E293B] bg-white dark:bg-[#0F172A] text-primary-text dark:text-slate-100 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
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



