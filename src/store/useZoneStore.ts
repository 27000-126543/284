import { create } from 'zustand';
import type { Zone, EnvironmentData } from '@/types';
import { mockZones, generateEnvironmentData } from '@/api/mock';

interface ZoneState {
  zones: Zone[];
  environmentData: Record<string, EnvironmentData>;
  setZones: (zones: Zone[]) => void;
  addZone: (zone: Zone) => void;
  updateZone: (zone: Zone) => void;
  deleteZone: (id: string) => void;
  toggleAccess: (id: string) => void;
  refreshEnvironmentData: () => void;
  getZoneById: (id: string) => Zone | undefined;
}

export const useZoneStore = create<ZoneState>((set, get) => {
  const initialEnvData: Record<string, EnvironmentData> = {};
  mockZones.forEach((zone) => {
    initialEnvData[zone.id] = generateEnvironmentData(zone.id);
  });

  return {
    zones: mockZones,
    environmentData: initialEnvData,

    setZones: (zones) => set({ zones }),

    addZone: (zone) =>
      set((state) => ({
        zones: [...state.zones, zone],
      })),

    updateZone: (zone) =>
      set((state) => ({
        zones: state.zones.map((z) => (z.id === zone.id ? zone : z)),
      })),

    deleteZone: (id) =>
      set((state) => ({
        zones: state.zones.filter((z) => z.id !== id),
      })),

    toggleAccess: (id) =>
      set((state) => ({
        zones: state.zones.map((z) =>
          z.id === id ? { ...z, accessEnabled: !z.accessEnabled } : z
        ),
      })),

    refreshEnvironmentData: () => {
      const newEnvData: Record<string, EnvironmentData> = {};
      get().zones.forEach((zone) => {
        newEnvData[zone.id] = generateEnvironmentData(zone.id);
      });
      set({ environmentData: newEnvData });
    },

    getZoneById: (id) => {
      return get().zones.find((z) => z.id === id);
    },
  };
});
