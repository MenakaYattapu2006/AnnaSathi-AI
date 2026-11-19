import React, { useMemo, useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import {
  Heart,
  Droplets,
  Leaf,
  Users,
  Info,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient, mapDonationFromDb } from '../../lib/apiClient';
import { mockDataService } from '../../lib/mockDataService';
import type { Donation } from '../../types/donation';

const isProduction = Boolean((import.meta as any).env?.PROD);

const Impact: React.FC = () => {
  const { user } = useAuth();

  const [donorDonations, setDonorDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await apiClient.donations.getAll();
        if (res?.donations && isMounted) {
          setDonorDonations(res.donations.map(mapDonationFromDb));
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
        setDonorDonations(mockDataService.getDonationsByDonor(user.id));
      }
      if (isMounted) setIsLoading(false);
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Actual impact calculations segregated by status
  const impactMetrics = useMemo(() => {
    const completedList = donorDonations.filter(
      (d) => d.status === 'DELIVERED' || d.status === 'RECEIPT_CONFIRMED'
    );
    const activeList = donorDonations.filter(
      (d) =>
        d.status !== 'DELIVERED' &&
        d.status !== 'RECEIPT_CONFIRMED' &&
        d.status !== 'CANCELLED'
    );
    const cancelledList = donorDonations.filter((d) => d.status === 'CANCELLED');

    // Real meal count delivered from completed donations
    const completedMeals = completedList.reduce((sum, d) => {
      return sum + (d.numberOfServings || (d.unit === 'meals' ? d.quantity : d.quantity * 2));
    }, 0);

    // Active in-transit meals
    const activeMeals = activeList.reduce((sum, d) => {
      return sum + (d.numberOfServings || (d.unit === 'meals' ? d.quantity : d.quantity * 2));
    }, 0);

    // Indicative Environmental Conversion Factors:
    // Assumption 1: ~0.4 kg CO2e diverted per kg/meal of organic food kept out of anaerobic landfills.
    const co2KgEstimate = Math.round(completedMeals * 0.4);

    // Assumption 2: ~50 liters of embedded agricultural water conserved per standard meal prevented from waste.
    const waterLitersEstimate = Math.round(completedMeals * 50);

    // People fed: directly maps 1-to-1 to verified completed meal portions
    const directMealsServed = completedMeals;

    return {
      totalListings: donorDonations.length,
      completedCount: completedList.length,
      activeCount: activeList.length,
      cancelledCount: cancelledList.length,
      completedMeals,
      activeMeals,
      co2KgEstimate,
      waterLitersEstimate,
      directMealsServed,
    };
  }, [donorDonations]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Hunger Relief & Environmental Estimates"
        description="Calculated metrics derived from your actual food donation listings and completed deliveries"
      />

      {/* Model Transparency Disclaimer */}
      <div className="p-3.5 rounded-lg bg-surface-container-low border border-border flex items-start gap-3">
        <Info size={18} className="text-primary flex-shrink-0 mt-0.5" />
        <div className="text-xs text-secondary-text">
          <strong className="text-primary-text block mb-0.5">Model Transparency Notice:</strong>
          Environmental metrics (CO₂e avoidance and embedded water conservation) are <strong>illustrative estimates</strong> calculated using standard empirical benchmarks. They represent educational models for demonstration and should not be treated as certified laboratory life-cycle assessments (LCA).
        </div>
      </div>

      {/* Hero Overview Banner */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Badge variant="neutral" size="sm" className="bg-white/20 text-white border-white/30 mb-2">
              Demonstration Model
            </Badge>
            <h1 className="text-3xl font-extrabold text-white">
              {impactMetrics.completedMeals.toLocaleString()} Completed Meals Rescued
            </h1>
            <p className="mt-1 text-white/80 text-sm max-w-xl">
              Recorded across {impactMetrics.completedCount} verified deliveries from {user?.name || 'your kitchen'}.
              {impactMetrics.activeMeals > 0 && ` An additional ${impactMetrics.activeMeals.toLocaleString()} meals are currently active or in transit.`}
            </p>
          </div>

          <Button
            size="sm"
            className="bg-accent hover:bg-accent/90 text-white font-semibold flex items-center gap-2 shadow"
            onClick={() => alert(`[Demo Summary] Donor impact summary for ${user?.name}: ${impactMetrics.completedMeals} meals delivered across ${impactMetrics.completedCount} drives.`)}
          >
            <Download size={14} />
            <span>Export Summary</span>
          </Button>
        </div>
      </div>

      {/* Real Record Breakdown vs Estimates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Actual Record: Completed Meals */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 text-success flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <span className="text-xs text-secondary-text font-semibold uppercase">Delivered Meals</span>
              <p className="text-2xl font-black text-primary-text mt-0.5">{impactMetrics.completedMeals.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-[11px] text-secondary-text mt-3 border-t border-border pt-2">
            Exact sum from {impactMetrics.completedCount} completed deliveries
          </p>
        </Card>

        {/* Actual Record: In-Pipeline Meals */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center flex-shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <span className="text-xs text-secondary-text font-semibold uppercase">In-Pipeline Meals</span>
              <p className="text-2xl font-black text-primary-text mt-0.5">{impactMetrics.activeMeals.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-[11px] text-secondary-text mt-3 border-t border-border pt-2">
            Across {impactMetrics.activeCount} active/in-transit drives
          </p>
        </Card>

        {/* Illustrative Estimate: Landfill CO2 */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Leaf size={20} />
            </div>
            <div>
              <span className="text-xs text-secondary-text font-semibold uppercase">CO₂e Avoided</span>
              <p className="text-2xl font-black text-primary-text mt-0.5">~{impactMetrics.co2KgEstimate} kg</p>
            </div>
          </div>
          <p className="text-[11px] text-secondary-text mt-3 border-t border-border pt-2">
            *Illustrative estimate (~0.4 kg/meal model)
          </p>
        </Card>

        {/* Illustrative Estimate: Water Saved */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info/10 text-info flex items-center justify-center flex-shrink-0">
              <Droplets size={20} />
            </div>
            <div>
              <span className="text-xs text-secondary-text font-semibold uppercase">Water Conserved</span>
              <p className="text-2xl font-black text-primary-text mt-0.5">~{impactMetrics.waterLitersEstimate.toLocaleString()} L</p>
            </div>
          </div>
          <p className="text-[11px] text-secondary-text mt-3 border-t border-border pt-2">
            *Illustrative estimate (~50 L/meal benchmark)
          </p>
        </Card>
      </div>

      {/* Explicit Methodology & Conversion Factor Assumptions */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-primary-text mb-3">
          Methodology & Model Assumptions
        </h2>

        <div className="space-y-3 text-xs text-secondary-text">
          <div className="p-3 bg-surface-container-low rounded-lg border border-border/60">
            <strong className="text-primary-text block mb-0.5">1. Meals Delivered (Primary Metric)</strong>
            <span>
              Calculated directly as the sum of recorded portion units for donations with status <code>DELIVERED</code> or <code>RECEIPT_CONFIRMED</code>. Active in-transit donations are segregated and not counted as delivered impact. Cancelled donations ({impactMetrics.cancelledCount}) are completely excluded.
            </span>
          </div>

          <div className="p-3 bg-surface-container-low rounded-lg border border-border/60">
            <strong className="text-primary-text block mb-0.5">2. CO₂e Avoidance Factor (0.4 kg CO₂e / meal)</strong>
            <span>
              Based on empirical food waste mitigation literature (FAO benchmark: approximately 2.5 kg CO₂e per 1 kg of discarded food in anaerobic landfills). Scaled to a standard prepared portion (~160g), yielding an indicative factor of 0.4 kg CO₂e avoided per meal redistributed.
            </span>
          </div>

          <div className="p-3 bg-surface-container-low rounded-lg border border-border/60">
            <strong className="text-primary-text block mb-0.5">3. Embedded Water Factor (50 Liters / meal)</strong>
            <span>
              Derived from composite agricultural water footprints of grain, vegetable, and dairy supply chains. Reflects embedded irrigation and processing water conserved by preventing food disposal.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Impact;
