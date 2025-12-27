import { useEffect, useState, useCallback } from 'react';
import { notificationService, scheduleJourneyReminder } from '@/utils/notifications';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useNotifications() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setPermissionGranted(notificationService.isPermissionGranted());
  }, []);

  const requestPermission = useCallback(async () => {
    const granted = await notificationService.requestPermission();
    setPermissionGranted(granted);
    
    if (granted) {
      toast({
        title: "Notifications enabled",
        description: "You'll receive journey reminders and message notifications",
      });
    } else {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings",
        variant: "destructive",
      });
    }
    
    return granted;
  }, [toast]);

  return {
    permissionGranted,
    requestPermission,
  };
}

// Hook to schedule reminders for all upcoming bookings
export function useJourneyReminders() {
  const [scheduledReminders, setScheduledReminders] = useState<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const loadAndScheduleBookings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .gte('departure_date', new Date().toISOString().split('T')[0]);

      if (bookings) {
        const newReminders = new Map<string, NodeJS.Timeout>();
        
        bookings.forEach((booking) => {
          const timer = scheduleJourneyReminder(
            booking.booking_reference,
            booking.service_name,
            booking.departure_date,
            booking.departure_time,
            booking.from_location,
            () => {
              window.location.href = `/ticket/${booking.id}`;
            }
          );
          
          if (timer) {
            newReminders.set(booking.id, timer);
          }
        });

        setScheduledReminders(newReminders);
      }
    };

    loadAndScheduleBookings();

    // Cleanup timers on unmount
    return () => {
      scheduledReminders.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return scheduledReminders;
}

// Hook for real-time message notifications
export function useMessageNotifications(currentUserId: string | null) {
  useEffect(() => {
    if (!currentUserId) return;

    // Subscribe to new group messages
    const groupChannel = supabase
      .channel('group-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Don't notify for own messages
          if (newMessage.user_id === currentUserId) return;

          // Get sender info
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMessage.user_id)
            .single();

          // Get group info
          const { data: group } = await supabase
            .from('travel_groups')
            .select('title')
            .eq('id', newMessage.group_id)
            .single();

          notificationService.sendMessageNotification(
            profile?.full_name || 'Someone',
            newMessage.content,
            true,
            group?.title || 'a group'
          );
        }
      )
      .subscribe();

    // Subscribe to direct messages
    const dmChannel = supabase
      .channel('dm-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newMessage = payload.new as any;

          // Get sender info
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMessage.sender_id)
            .single();

          notificationService.sendMessageNotification(
            profile?.full_name || 'Someone',
            newMessage.content,
            false
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(groupChannel);
      supabase.removeChannel(dmChannel);
    };
  }, [currentUserId]);
}
