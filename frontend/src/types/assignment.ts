export type AssignmentStatus =
  | 'available'
  | 'assigned'
  | 'in_transit_to_pickup'
  | 'picked_up'
  | 'in_transit_to_drop'
  | 'delivered'
  | 'cancelled';

export interface PickupDetails {
  address: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactPerson: string;
  contactPhone: string;
  estimatedPickupTime: string;
  actualPickupTime?: string;
  verificationOtp?: string;
  latitude?: number;
  longitude?: number;
}

export interface DeliveryDetails {
  ngoName: string;
  address: string;
  street?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactPerson: string;
  contactPhone: string;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  recipientSignatureName?: string;
  latitude?: number;
  longitude?: number;
}

export interface Assignment {
  id: string;
  donationId: string;
  volunteerId?: string;
  ngoId: string;
  status: AssignmentStatus;
  pickup: PickupDetails;
  delivery: DeliveryDetails;
  assignedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  notes?: string;
  foodName?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  urgencyScore?: number;
  urgencyLevel?: string;
  dietaryType?: string;
  expiryTime?: string;
}
