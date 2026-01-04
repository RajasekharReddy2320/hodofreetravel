// Browser Push Notifications Utility for TraviLink

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  actions?: { action: string; title: string }[];
  onClick?: () => void;
}

class NotificationService {
  private static instance: NotificationService;
  private permissionGranted: boolean = false;
  private readonly defaultIcon = '/pwa-192x192.png';
  private readonly defaultBadge = '/pwa-192x192.png';

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private checkPermission(): void {
    if ('Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permissionGranted = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    }

    return false;
  }

  isPermissionGranted(): boolean {
    return this.permissionGranted;
  }

  async sendNotification(options: NotificationOptions): Promise<Notification | null> {
    if (!this.permissionGranted) {
      const granted = await this.requestPermission();
      if (!granted) return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || this.defaultIcon,
        badge: options.badge || this.defaultBadge,
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
      });

      if (options.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
          notification.close();
        };
      }

      // Auto-close after 10 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 10000);
      }

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }

  // Journey reminder notification
  sendJourneyReminder(
    bookingRef: string,
    serviceName: string,
    departureTime: string,
    fromLocation: string,
    onClick?: () => void
  ): void {
    this.sendNotification({
      title: '🚂 Journey Reminder - TraviLink',
      body: `Your ${serviceName} from ${fromLocation} departs at ${departureTime}. Booking: ${bookingRef}`,
      tag: `journey-${bookingRef}`,
      requireInteraction: true,
      onClick,
    });
  }

  // Message notification
  sendMessageNotification(
    senderName: string,
    message: string,
    isGroup: boolean,
    groupName?: string,
    onClick?: () => void
  ): void {
    const title = isGroup 
      ? `💬 ${groupName}` 
      : `💬 ${senderName}`;
    
    const body = isGroup
      ? `${senderName}: ${message.length > 80 ? message.substring(0, 80) + '...' : message}`
      : message.length > 100 ? message.substring(0, 100) + '...' : message;
    
    this.sendNotification({
      title,
      body,
      tag: `message-${Date.now()}`,
      onClick,
    });
  }

  // Booking confirmation notification
  sendBookingConfirmation(
    bookingRef: string,
    serviceName: string,
    departureDate: string,
    fromLocation: string,
    toLocation: string,
    onClick?: () => void
  ): void {
    this.sendNotification({
      title: '✅ Booking Confirmed - TraviLink',
      body: `${serviceName} on ${departureDate}\n${fromLocation} → ${toLocation}\nRef: ${bookingRef}`,
      tag: `booking-${bookingRef}`,
      requireInteraction: true,
      onClick,
    });
  }

  // Booking status update notification
  sendBookingUpdate(
    bookingRef: string,
    status: string,
    serviceName: string,
    onClick?: () => void
  ): void {
    const statusEmoji = status === 'cancelled' ? '❌' : status === 'completed' ? '✅' : '📋';
    
    this.sendNotification({
      title: `${statusEmoji} Booking Update - TraviLink`,
      body: `Your ${serviceName} booking (${bookingRef}) has been ${status}`,
      tag: `booking-update-${bookingRef}`,
      onClick,
    });
  }

  // Payment notification
  sendPaymentNotification(
    amount: number,
    status: 'success' | 'failed' | 'pending',
    bookingRef?: string,
    onClick?: () => void
  ): void {
    const statusMap = {
      success: { emoji: '💳', text: 'Payment successful' },
      failed: { emoji: '❌', text: 'Payment failed' },
      pending: { emoji: '⏳', text: 'Payment pending' },
    };

    const { emoji, text } = statusMap[status];

    this.sendNotification({
      title: `${emoji} ${text} - TraviLink`,
      body: `Amount: ₹${amount.toLocaleString('en-IN')}${bookingRef ? `\nBooking: ${bookingRef}` : ''}`,
      tag: `payment-${Date.now()}`,
      onClick,
    });
  }
}

export const notificationService = NotificationService.getInstance();

// Hook for journey reminders
export function scheduleJourneyReminder(
  bookingRef: string,
  serviceName: string,
  departureDate: string,
  departureTime: string,
  fromLocation: string,
  onNavigate?: () => void
): NodeJS.Timeout | null {
  const departureDateTime = new Date(`${departureDate}T${departureTime}`);
  const reminderTime = new Date(departureDateTime.getTime() - 60 * 60 * 1000); // 1 hour before
  const now = new Date();

  const timeUntilReminder = reminderTime.getTime() - now.getTime();

  if (timeUntilReminder > 0) {
    return setTimeout(() => {
      notificationService.sendJourneyReminder(
        bookingRef,
        serviceName,
        departureTime,
        fromLocation,
        onNavigate
      );
    }, timeUntilReminder);
  }

  return null;
}
