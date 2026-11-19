export type VolunteerAvailability = 'available' | 'busy' | 'offline';

export type VolunteerStatus = 'active' | 'inactive';

export interface Volunteer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: 'two_wheeler' | 'four_wheeler' | 'van' | 'none';
  serviceArea: string[];
  availability: VolunteerAvailability;
  status: VolunteerStatus;
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: string;
  };
  totalDeliveriesCompleted: number;
  rating: number; // e.g. 4.9 out of 5
  assignedTaskIds: string[]; // references assignment ids
  createdAt: string;
}
