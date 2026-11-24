export type FoodCategory =
  | 'cooked_meals'
  | 'raw_groceries'
  | 'bakery_items'
  | 'packaged_food'
  | 'fruits_vegetables'
  | 'dairy_products';

export type DonationStatus =
  | 'CREATED'
  | 'NGO_MATCHED'
  | 'NGO_ACCEPTED'
  | 'VOLUNTEER_ASSIGNED'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'RECEIPT_CONFIRMED'
  | 'CANCELLED';

export type QuantityUnit = 'kg' | 'meals' | 'packets' | 'liters' | 'boxes';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DonationPickupAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  landmark?: string;
}

export interface Donation {
  id: string;
  donorId: string;
  foodName: string;
  category: FoodCategory;
  quantity: number;
  unit: QuantityUnit;
  numberOfServings?: number;
  dietaryType: 'veg' | 'non-veg';
  preparationTime: string;
  expiryTime: string;
  pickupAddress: DonationPickupAddress;
  matchedNgoId?: string;
  urgencyScore: number; // 0 to 100
  urgencyLevel: UrgencyLevel;
  status: DonationStatus;
  specialInstructions?: string;
  imageUrl?: string;
  donorName?: string;
  donorPhone?: string;
  donorEmail?: string;
  donorOrganization?: string;
  volunteerName?: string;
  volunteerPhone?: string;
  volunteerStatus?: string;
  createdAt: string;
  updatedAt: string;
}
