import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import { useAlarmStore } from '@/store/useAlarmStore';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';

function App() {
  const startEscalateTimer = useAlarmStore((state) => state.startEscalateTimer);
  const startOverdueTimer = useWorkOrderStore((state) => state.startOverdueTimer);

  useEffect(() => {
    const cleanupAlarm = startEscalateTimer();
    const cleanupWorkOrder = startOverdueTimer();

    return () => {
      cleanupAlarm();
      cleanupWorkOrder();
    };
  }, [startEscalateTimer, startOverdueTimer]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#3E92CC',
          colorInfo: '#3E92CC',
          colorSuccess: '#00A896',
          colorWarning: '#F77F00',
          colorError: '#D62828',
          borderRadius: 8,
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
