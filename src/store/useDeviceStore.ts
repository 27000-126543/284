import { create } from 'zustand';
import type { Device } from '@/types';
import { mockDevices } from '@/api/mock';

interface DeviceState {
  devices: Device[];
  setDevices: (devices: Device[]) => void;
  toggleDevice: (id: string) => void;
  updateDeviceStatus: (id: string, status: Device['status']) => void;
  addDevice: (device: Device) => void;
  updateDevice: (device: Device) => void;
  deleteDevice: (id: string) => void;
  getDevicesByZone: (zoneId: string) => Device[];
  getDevicesByType: (type: Device['type']) => Device[];
  getRunningCount: () => number;
  getFaultCount: () => number;
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: mockDevices,

  setDevices: (devices) => set({ devices }),

  toggleDevice: (id) =>
    set((state) => ({
      devices: state.devices.map((d) => {
        if (d.id === id && d.isRemoteControllable && d.status !== 'fault') {
          const newStatus = d.status === 'running' ? 'stopped' : 'running';
          return {
            ...d,
            status: newStatus,
            statusLabel: newStatus === 'running' ? '运行中' : '已停止',
          };
        }
        return d;
      }),
    })),

  updateDeviceStatus: (id, status) => {
    const statusLabels: Record<string, string> = {
      running: '运行中',
      stopped: '已停止',
      fault: '故障',
    };
    set((state) => ({
      devices: state.devices.map((d) =>
        d.id === id
          ? {
              ...d,
              status,
              statusLabel: statusLabels[status],
            }
          : d
      ),
    }));
  },

  addDevice: (device) =>
    set((state) => ({
      devices: [...state.devices, device],
    })),

  updateDevice: (device) =>
    set((state) => ({
      devices: state.devices.map((d) => (d.id === device.id ? device : d)),
    })),

  deleteDevice: (id) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== id),
    })),

  getDevicesByZone: (zoneId) => {
    return get().devices.filter((d) => d.zoneId === zoneId);
  },

  getDevicesByType: (type) => {
    return get().devices.filter((d) => d.type === type);
  },

  getRunningCount: () => {
    return get().devices.filter((d) => d.status === 'running').length;
  },

  getFaultCount: () => {
    return get().devices.filter((d) => d.status === 'fault').length;
  },
}));
