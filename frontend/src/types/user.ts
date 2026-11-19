export type UserRole = 'donor' | 'ngo' | 'volunteer' | 'admin';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserProfile {
  bio?: string;
  organizationName?: string;
  avatarUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  profileImage?: string;
  profile?: UserProfile;
  createdAt: string;
}
