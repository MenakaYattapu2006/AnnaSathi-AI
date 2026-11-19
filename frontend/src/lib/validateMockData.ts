import usersData from '../mocks/users.json';
import ngosData from '../mocks/ngos.json';
import donationsData from '../mocks/donations.json';
import volunteersData from '../mocks/volunteers.json';
import assignmentsData from '../mocks/assignments.json';
import notificationsData from '../mocks/notifications.json';
import dashboardStatsData from '../mocks/dashboard-stats.json';

import type { DonationStatus } from '../types';

export interface ValidationError {
  entity: string;
  id: string;
  field: string;
  message: string;
}

export interface ValidationReport {
  isValid: boolean;
  totalRecordsChecked: number;
  errors: ValidationError[];
  summary: Record<string, number>;
}

const VALID_DONATION_STATUSES: Set<DonationStatus> = new Set([
  'CREATED',
  'NGO_MATCHED',
  'NGO_ACCEPTED',
  'VOLUNTEER_ASSIGNED',
  'PICKED_UP',
  'DELIVERED',
  'RECEIPT_CONFIRMED',
  'CANCELLED',
]);

export function validateMockData(): ValidationReport {
  const errors: ValidationError[] = [];

  const userIds = new Set<string>();
  const ngoIds = new Set<string>();
  const donationIds = new Set<string>();
  const volunteerIds = new Set<string>();
  const assignmentIds = new Set<string>();
  const notificationIds = new Set<string>();

  // 1. Check Users & Duplicate IDs
  for (const user of usersData) {
    if (userIds.has(user.id)) {
      errors.push({ entity: 'User', id: user.id, field: 'id', message: `Duplicate user ID: ${user.id}` });
    }
    userIds.add(user.id);
  }

  // 2. Check NGOs
  for (const ngo of ngosData) {
    if (ngoIds.has(ngo.id)) {
      errors.push({ entity: 'NGO', id: ngo.id, field: 'id', message: `Duplicate NGO ID: ${ngo.id}` });
    }
    ngoIds.add(ngo.id);

    if (!userIds.has(ngo.userId)) {
      errors.push({
        entity: 'NGO',
        id: ngo.id,
        field: 'userId',
        message: `Missing referenced user ID: ${ngo.userId}`,
      });
    }
  }

  // 3. Check Volunteers
  for (const vol of volunteersData) {
    if (volunteerIds.has(vol.id)) {
      errors.push({ entity: 'Volunteer', id: vol.id, field: 'id', message: `Duplicate volunteer ID: ${vol.id}` });
    }
    volunteerIds.add(vol.id);

    if (!userIds.has(vol.userId)) {
      errors.push({
        entity: 'Volunteer',
        id: vol.id,
        field: 'userId',
        message: `Missing referenced user ID: ${vol.userId}`,
      });
    }
  }

  // 4. Check Donations
  for (const don of donationsData) {
    if (donationIds.has(don.id)) {
      errors.push({ entity: 'Donation', id: don.id, field: 'id', message: `Duplicate donation ID: ${don.id}` });
    }
    donationIds.add(don.id);

    if (!userIds.has(don.donorId)) {
      errors.push({
        entity: 'Donation',
        id: don.id,
        field: 'donorId',
        message: `Missing referenced donor user ID: ${don.donorId}`,
      });
    }

    if (don.matchedNgoId && !ngoIds.has(don.matchedNgoId)) {
      errors.push({
        entity: 'Donation',
        id: don.id,
        field: 'matchedNgoId',
        message: `Invalid referenced NGO ID: ${don.matchedNgoId}`,
      });
    }

    if (!VALID_DONATION_STATUSES.has(don.status as DonationStatus)) {
      errors.push({
        entity: 'Donation',
        id: don.id,
        field: 'status',
        message: `Invalid donation status: ${don.status}`,
      });
    }

    if (typeof don.urgencyScore !== 'number' || don.urgencyScore < 0 || don.urgencyScore > 100) {
      errors.push({
        entity: 'Donation',
        id: don.id,
        field: 'urgencyScore',
        message: `Urgency score must be between 0 and 100. Got: ${don.urgencyScore}`,
      });
    }
  }

  // 5. Check Assignments
  for (const asgn of assignmentsData) {
    if (assignmentIds.has(asgn.id)) {
      errors.push({
        entity: 'Assignment',
        id: asgn.id,
        field: 'id',
        message: `Duplicate assignment ID: ${asgn.id}`,
      });
    }
    assignmentIds.add(asgn.id);

    if (!donationIds.has(asgn.donationId)) {
      errors.push({
        entity: 'Assignment',
        id: asgn.id,
        field: 'donationId',
        message: `Invalid referenced donation ID: ${asgn.donationId}`,
      });
    }

    if (!volunteerIds.has(asgn.volunteerId)) {
      errors.push({
        entity: 'Assignment',
        id: asgn.id,
        field: 'volunteerId',
        message: `Invalid referenced volunteer ID: ${asgn.volunteerId}`,
      });
    }

    if (!ngoIds.has(asgn.ngoId)) {
      errors.push({
        entity: 'Assignment',
        id: asgn.id,
        field: 'ngoId',
        message: `Invalid referenced NGO ID: ${asgn.ngoId}`,
      });
    }
  }

  // 6. Check Volunteer Task References
  for (const vol of volunteersData) {
    for (const taskId of vol.assignedTaskIds) {
      if (!assignmentIds.has(taskId)) {
        errors.push({
          entity: 'Volunteer',
          id: vol.id,
          field: 'assignedTaskIds',
          message: `Volunteer references non-existent assignment ID: ${taskId}`,
        });
      }
    }
  }

  // 7. Check Notifications
  for (const notif of notificationsData) {
    if (notificationIds.has(notif.id)) {
      errors.push({
        entity: 'Notification',
        id: notif.id,
        field: 'id',
        message: `Duplicate notification ID: ${notif.id}`,
      });
    }
    notificationIds.add(notif.id);

    if (!userIds.has(notif.recipientId)) {
      errors.push({
        entity: 'Notification',
        id: notif.id,
        field: 'recipientId',
        message: `Notification references non-existent user ID: ${notif.recipientId}`,
      });
    }
  }

  const summary = {
    users: usersData.length,
    ngos: ngosData.length,
    donations: donationsData.length,
    volunteers: volunteersData.length,
    assignments: assignmentsData.length,
    notifications: notificationsData.length,
    dashboardStats: Object.keys(dashboardStatsData).length,
  };

  const totalRecordsChecked = Object.values(summary).reduce((a, b) => a + b, 0);

  return {
    isValid: errors.length === 0,
    totalRecordsChecked,
    errors,
    summary,
  };
}
