import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';
import { useCPIAlert } from '@/hooks/useCPIAlert';

export const RealtimeAlertsProvider = () => {
  useRealtimeAlerts();
  useCPIAlert();
  return null;
};
