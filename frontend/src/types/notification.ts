export type NotificationType =
  | 'donation_alert'
  | 'donation_accepted'
  | 'assignment_new'
  | 'pickup_completed'
  | 'delivery_completed'
  | 'verification_status'
  | 'urgent_requirement'
  | 'system_alert';

export type NotificationStatus = 'unread' | 'read';

export interface Notification {
  id: string;
  recipientId: string; // references user id
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  relatedEntityId?: string; // e.g. donationId or assignmentId
  createdAt: string;
  readAt?: string;
}
