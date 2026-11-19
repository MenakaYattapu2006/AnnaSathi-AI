import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  History,
  Heart,
  Search,
  CheckCircle,
  Building2,
  ClipboardList,
  ClipboardCheck,
  Users,
  ShieldCheck,
  FileText,
  BarChart3,
  Truck,
} from 'lucide-react';
import type { UserRole } from '../contexts/AuthContext';

export interface SidebarNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

const donorNav: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/donor/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Create Donation', href: '/donor/create-donation', icon: <PlusCircle className="w-5 h-5" /> },
  { label: 'My Donations', href: '/donor/my-donations', icon: <Package className="w-5 h-5" /> },
  { label: 'Donation History', href: '/donor/history', icon: <History className="w-5 h-5" /> },
  { label: 'Impact', href: '/donor/impact', icon: <Heart className="w-5 h-5" /> },
];

const ngoNav: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/ngo/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Available Donations', href: '/ngo/available', icon: <Search className="w-5 h-5" /> },
  { label: 'Accepted Donations', href: '/ngo/accepted', icon: <CheckCircle className="w-5 h-5" /> },
  { label: 'Organization Profile', href: '/ngo/profile', icon: <Building2 className="w-5 h-5" /> },
  { label: 'Donation History', href: '/ngo/history', icon: <History className="w-5 h-5" /> },
];

const volunteerNav: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/volunteer/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Available Tasks', href: '/volunteer/available', icon: <ClipboardList className="w-5 h-5" /> },
  { label: 'Assigned Tasks', href: '/volunteer/assigned', icon: <ClipboardCheck className="w-5 h-5" /> },
  { label: 'Volunteer Profile', href: '/volunteer/profile', icon: <Users className="w-5 h-5" /> },
  { label: 'Task History', href: '/volunteer/history', icon: <History className="w-5 h-5" /> },
];

const adminNav: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'User Management', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
  { label: 'NGO Verification', href: '/admin/ngo-verification', icon: <ShieldCheck className="w-5 h-5" />, badge: 0 },
  { label: 'Donation Management', href: '/admin/donations', icon: <Package className="w-5 h-5" /> },
  { label: 'Delivery Monitoring', href: '/admin/deliveries', icon: <Truck className="w-5 h-5" /> },
  { label: 'Reports & Analytics', href: '/admin/reports', icon: <BarChart3 className="w-5 h-5" /> },
];

/** Returns the sidebar navigation items for a given user role. */
export const getNavItems = (role: UserRole): SidebarNavItem[] => {
  switch (role) {
    case 'donor':
      return donorNav;
    case 'ngo':
      return ngoNav;
    case 'volunteer':
      return volunteerNav;
    case 'admin':
      return adminNav;
  }
};

/** Human-readable role labels. */
export const ROLE_LABELS: Record<UserRole, string> = {
  donor: 'Donor',
  ngo: 'NGO',
  volunteer: 'Volunteer',
  admin: 'Admin',
};
