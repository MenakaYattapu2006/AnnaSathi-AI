export type NGOStatus = 'pending' | 'verified' | 'rejected';

export interface NGOAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
}

export interface FoodRequirement {
  id: string;
  category: string;
  dailyCapacityMeals: number;
  dietaryPreference: 'veg' | 'non-veg' | 'both';
  preferredTimeSlots: string[];
}

export interface NGO {
  id: string;
  userId: string;
  organizationName: string;
  registrationNumber: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  description?: string;
  address: NGOAddress;
  serviceArea: string[];
  foodRequirements: FoodRequirement[];
  capacity: {
    maxDailyMeals: number;
    currentAvailableCapacity: number;
    hasColdStorage: boolean;
  };
  verificationStatus: NGOStatus;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}
