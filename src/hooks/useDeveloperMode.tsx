import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DeveloperModeState {
  isDeveloper: boolean;
  isLoading: boolean;
}

export const useDeveloperMode = (): DeveloperModeState => {
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDeveloperStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsDeveloper(false);
          setIsLoading(false);
          return;
        }

        // Check if user has developer or admin role using the has_role function
        const { data: hasDeveloperRole } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'developer'
        });

        const { data: hasAdminRole } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        setIsDeveloper(hasDeveloperRole === true || hasAdminRole === true);
      } catch (error) {
        console.error('Error checking developer status:', error);
        setIsDeveloper(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDeveloperStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkDeveloperStatus();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isDeveloper, isLoading };
};
