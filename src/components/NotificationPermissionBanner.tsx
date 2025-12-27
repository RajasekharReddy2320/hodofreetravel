import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationPermissionBanner() {
  const { permissionGranted, requestPermission } = useNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner before
    const hasDismissed = localStorage.getItem('notification-banner-dismissed');
    
    // Only show if notifications are not granted and not dismissed
    if (!permissionGranted && !hasDismissed && 'Notification' in window) {
      setShow(true);
    }
  }, [permissionGranted]);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  const handleEnable = async () => {
    await requestPermission();
    setShow(false);
  };

  if (!show || dismissed || permissionGranted) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-primary-foreground/20 rounded-full p-2">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Enable Notifications</h4>
            <p className="text-xs opacity-90 mt-1">
              Get reminders 1 hour before your journey and instant message alerts
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 text-xs"
                onClick={handleEnable}
              >
                Enable
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                onClick={handleDismiss}
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-primary-foreground/60 hover:text-primary-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
