import { notification } from 'antd';
import i18n from '../../i18n';

export const showTokenExpiredNotification = () => {
  notification.warning({
    title: i18n.t('api.loginExpired'),
    duration: 4.5,
    placement: 'topRight',
  });
};
