import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/dashboard/Dashboard';
import ZoneList from '@/pages/zone/ZoneList';
import ZoneDetail from '@/pages/zone/ZoneDetail';
import EnvironmentRealtime from '@/pages/environment/EnvironmentRealtime';
import EnvironmentHistory from '@/pages/environment/EnvironmentHistory';
import DeviceList from '@/pages/device/DeviceList';
import DeviceDetail from '@/pages/device/DeviceDetail';
import InspectionTasks from '@/pages/inspection/InspectionTasks';
import HazardReport from '@/pages/inspection/HazardReport';
import AlarmRealtime from '@/pages/alarm/AlarmRealtime';
import AlarmHistory from '@/pages/alarm/AlarmHistory';
import AlarmDetail from '@/pages/alarm/AlarmDetail';
import WorkOrderList from '@/pages/workorder/WorkOrderList';
import WorkOrderDetail from '@/pages/workorder/WorkOrderDetail';
import OperationReport from '@/pages/report/OperationReport';
import WorkOrderReport from '@/pages/report/WorkOrderReport';
import UserManagement from '@/pages/system/UserManagement';
import RuleConfig from '@/pages/system/RuleConfig';
import { useUserStore } from '@/store/useUserStore';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = useUserStore((state) => state.currentUser);
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <Dashboard /> },
      {
        path: 'zone',
        children: [
          { path: 'list', element: <ZoneList /> },
          { path: 'detail/:id', element: <ZoneDetail /> },
        ],
      },
      {
        path: 'environment',
        children: [
          { path: 'realtime', element: <EnvironmentRealtime /> },
          { path: 'history', element: <EnvironmentHistory /> },
        ],
      },
      {
        path: 'device',
        children: [
          { path: 'list', element: <DeviceList /> },
          { path: 'detail/:id', element: <DeviceDetail /> },
        ],
      },
      {
        path: 'inspection',
        children: [
          { path: 'tasks', element: <InspectionTasks /> },
          { path: 'report', element: <HazardReport /> },
        ],
      },
      {
        path: 'alarm',
        children: [
          { path: 'realtime', element: <AlarmRealtime /> },
          { path: 'history', element: <AlarmHistory /> },
          { path: 'detail/:id', element: <AlarmDetail /> },
        ],
      },
      {
        path: 'workorder',
        children: [
          { path: 'list', element: <WorkOrderList /> },
          { path: 'detail/:id', element: <WorkOrderDetail /> },
        ],
      },
      {
        path: 'report',
        children: [
          { path: 'operation', element: <OperationReport /> },
          { path: 'workorder', element: <WorkOrderReport /> },
        ],
      },
      {
        path: 'system',
        children: [
          { path: 'user', element: <UserManagement /> },
          { path: 'rule', element: <RuleConfig /> },
        ],
      },
    ],
  },
]);

export default router;
