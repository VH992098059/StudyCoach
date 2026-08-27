import { toast } from 'sonner';
import i18n from '../../i18n';

export const showTokenExpiredNotification = () => {
  toast.warning(i18n.t('api.loginExpired'), { duration: 4500 });
};
