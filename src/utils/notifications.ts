// Browser Push Notifications Utility

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  onClick?: () => void;
}

class NotificationService {
  private static instance: NotificationService;
  private permissionGranted: boolean = false;

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
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        data: options.data,
      });

      if (options.onClick) {
        notification.onclick = () => {
          window.focus();
          options.onClick?.();
          notification.close();
        };
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
      title: '🚂 Journey Reminder',
      body: `Your ${serviceName} from ${fromLocation} departs at ${departureTime}. Booking: ${bookingRef}`,
      tag: `journey-${bookingRef}`,
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
      ? `💬 New message in ${groupName}` 
      : `💬 Message from ${senderName}`;
    
    this.sendNotification({
      title,
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      tag: `message-${Date.now()}`,
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
