import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useJourneyReminders, useMessageNotifications } from '@/hooks/useNotifications';

export function NotificationInitializer() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize journey reminders for logged-in users
  useJourneyReminders();

  // Initialize message notifications for logged-in users
  useMessageNotifications(userId);

  return null;
}
