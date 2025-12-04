import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePriceAlertChecker } from '@/hooks/usePriceAlertChecker';

export const PriceAlertWatcher = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Only run the checker if user is authenticated
  if (isAuthenticated) {
    return <PriceAlertCheckerRunner />;
  }

  return null;
};

// Separate component to use the hook only when authenticated
const PriceAlertCheckerRunner = () => {
  usePriceAlertChecker();
  return null;
};
