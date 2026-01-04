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
            group?.title || 'a group',
            () => {
              window.location.href = `/explore?tab=messages`;
            }
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
            false,
            undefined,
            () => {
              window.location.href = `/explore?tab=messages`;
            }
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

// Hook for real-time booking update notifications
export function useBookingNotifications(currentUserId: string | null) {
  useEffect(() => {
    if (!currentUserId) return;

    const bookingChannel = supabase
      .channel('booking-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const updatedBooking = payload.new as any;
          const oldBooking = payload.old as any;

          // Notify on status change
          if (updatedBooking.status !== oldBooking.status) {
            notificationService.sendBookingUpdate(
              updatedBooking.booking_reference,
              updatedBooking.status,
              updatedBooking.service_name,
              () => {
                window.location.href = `/ticket/${updatedBooking.id}`;
              }
            );
          }

          // Notify on payment status change
          if (updatedBooking.payment_status !== oldBooking.payment_status) {
            const statusMap: Record<string, 'success' | 'failed' | 'pending'> = {
              'paid': 'success',
              'failed': 'failed',
              'pending': 'pending',
            };
            
            notificationService.sendPaymentNotification(
              updatedBooking.price_inr,
              statusMap[updatedBooking.payment_status] || 'pending',
              updatedBooking.booking_reference,
              () => {
                window.location.href = `/ticket/${updatedBooking.id}`;
              }
            );
          }
        }
      )
      .subscribe();

    // Subscribe to new bookings
    const newBookingChannel = supabase
      .channel('new-booking-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const newBooking = payload.new as any;

          if (newBooking.status === 'confirmed') {
            notificationService.sendBookingConfirmation(
              newBooking.booking_reference,
              newBooking.service_name,
              newBooking.departure_date,
              newBooking.from_location,
              newBooking.to_location,
              () => {
                window.location.href = `/ticket/${newBooking.id}`;
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingChannel);
      supabase.removeChannel(newBookingChannel);
    };
  }, [currentUserId]);
}
