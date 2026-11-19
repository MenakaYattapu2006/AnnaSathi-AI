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
}

const donorNav: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/donor/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Create Donation', href: '/donor/create-donation', icon: <PlusCircle size={20} /> },
  { label: 'My Donations', href: '/donor/my-donations', icon: <Package size={20} /> },
  { label: 'Donation History', href: '/donor/history', icon: <History size={20} /> },
  { label: 'Impact', href: '/donor/impact', icon: <Heart size={20} /> },
];

const ngoNav: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/ngo/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Available Donations', href: '/ngo/available', icon: <Search size={20} /> },
  { label: 'Accepted Donations', href: '/ngo/accepted', icon: <CheckCircle size={20} /> },
  { label: 'Organization Profile', href: '/ngo/profile', icon: <Building2 size={20} /> },
  { label: 'Donation History', href: '/ngo/history', icon: <History size={20} /> },
];

const volunteerNav: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/volunteer/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Available Tasks', href: '/volunteer/available', icon: <ClipboardList size={20} /> },
  { label: 'Assigned Tasks', href: '/volunteer/assigned', icon: <ClipboardCheck size={20} /> },
  { label: 'Volunteer Profile', href: '/volunteer/profile', icon: <Users size={20} /> },
  { label: 'Task History', href: '/volunteer/history', icon: <History size={20} /> },
];

const adminNav: SidebarNavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'User Management', href: '/admin/users', icon: <Users size={20} /> },
  { label: 'NGO Verification', href: '/admin/ngo-verification', icon: <ShieldCheck size={20} /> },
  { label: 'Donation Management', href: '/admin/donations', icon: <Package size={20} /> },
  { label: 'Delivery Monitoring', href: '/admin/deliveries', icon: <Truck size={20} /> },
  { label: 'Reports', href: '/admin/reports', icon: <BarChart3 size={20} /> },
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
