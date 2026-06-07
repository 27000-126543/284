import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkOrder, InspectionTask, HazardReport } from '@/types';
import { mockWorkOrders, mockInspectionTasks, mockHazardReports } from '@/api/mock';
import dayjs from 'dayjs';

const WORKORDER_OVERDUE_HOURS = 2;

interface WorkOrderState {
  workOrders: WorkOrder[];
  inspectionTasks: InspectionTask[];
  hazardReports: HazardReport[];
  setWorkOrders: (workOrders: WorkOrder[]) => void;
  addWorkOrder: (workOrder: Omit<WorkOrder, 'isOverdue' | 'escalated'>) => void;
  acceptWorkOrder: (id: string, userId: string, userName: string) => void;
  completeWorkOrder: (id: string, photos: string[], materials: any[]) => void;
  updateWorkOrder: (workOrder: WorkOrder) => void;
  addInspectionTask: (task: InspectionTask) => void;
  updateInspectionTask: (task: InspectionTask) => void;
  markCheckpoint: (taskId: string, checkpointId: string) => void;
  addHazardReport: (report: HazardReport) => void;
  updateHazardReport: (report: HazardReport) => void;
  getPendingCount: () => number;
  getOverdueCount: () => number;
  checkAndMarkOverdue: () => void;
  startOverdueTimer: () => () => void;
}

export const useWorkOrderStore = create<WorkOrderState>()(
  persist(
    (set, get) => ({
      workOrders: mockWorkOrders.map((wo) => ({
        ...wo,
        isOverdue:
          wo.status === 'pending' &&
          dayjs().diff(dayjs(wo.createdAt), 'hour') >= WORKORDER_OVERDUE_HOURS,
      })),
      inspectionTasks: mockInspectionTasks,
      hazardReports: mockHazardReports,

      setWorkOrders: (workOrders) => set({ workOrders }),

      addWorkOrder: (workOrder) =>
        set((state) => ({
          workOrders: [
            { ...workOrder, isOverdue: false, escalated: false },
            ...state.workOrders,
          ],
        })),

      acceptWorkOrder: (id, userId, userName) =>
        set((state) => ({
          workOrders: state.workOrders.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: 'accepted',
                  statusLabel: '已接单',
                  assignee: userId,
                  assigneeName: userName,
                  acceptedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                }
              : w
          ),
        })),

      completeWorkOrder: (id, photos, materials) =>
        set((state) => ({
          workOrders: state.workOrders.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: 'completed',
                  statusLabel: '已完成',
                  completedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                  repairPhotos: photos,
                  materials,
                }
              : w
          ),
        })),

      updateWorkOrder: (workOrder) =>
        set((state) => ({
          workOrders: state.workOrders.map((w) => (w.id === workOrder.id ? workOrder : w)),
        })),

      addInspectionTask: (task) =>
        set((state) => ({
          inspectionTasks: [task, ...state.inspectionTasks],
        })),

      updateInspectionTask: (task) =>
        set((state) => ({
          inspectionTasks: state.inspectionTasks.map((t) =>
            t.id === task.id ? task : t
          ),
        })),

      markCheckpoint: (taskId, checkpointId) =>
        set((state) => ({
          inspectionTasks: state.inspectionTasks.map((task) => {
            if (task.id !== taskId) return task;
            const newCheckpoints = task.checkpoints.map((cp) =>
              cp.id === checkpointId
                ? { ...cp, checked: true, checkedAt: dayjs().format('YYYY-MM-DD HH:mm:ss') }
                : cp
            );
            const allChecked = newCheckpoints.every((cp) => cp.checked);
            return {
              ...task,
              checkpoints: newCheckpoints,
              status: allChecked ? 'completed' : 'in_progress',
              statusLabel: allChecked ? '已完成' : '进行中',
              endTime: allChecked ? dayjs().format('YYYY-MM-DD HH:mm:ss') : task.endTime,
            };
          }),
        })),

      addHazardReport: (report) =>
        set((state) => ({
          hazardReports: [report, ...state.hazardReports],
        })),

      updateHazardReport: (report) =>
        set((state) => ({
          hazardReports: state.hazardReports.map((h) =>
            h.id === report.id ? report : h
          ),
        })),

      getPendingCount: () => {
        return get().workOrders.filter((w) => w.status === 'pending').length;
      },

      getOverdueCount: () => {
        return get().workOrders.filter((w) => w.isOverdue).length;
      },

      checkAndMarkOverdue: () => {
        const now = dayjs();
        set((state) => ({
          workOrders: state.workOrders.map((wo) => {
            if (wo.status === 'pending' && !wo.isOverdue) {
              const hoursSinceCreated = now.diff(dayjs(wo.createdAt), 'hour');
              if (hoursSinceCreated >= WORKORDER_OVERDUE_HOURS) {
                return { ...wo, isOverdue: true, escalated: true };
              }
            }
            return wo;
          }),
        }));
      },

      startOverdueTimer: () => {
        const interval = setInterval(() => {
          get().checkAndMarkOverdue();
        }, 60000);

        get().checkAndMarkOverdue();

        return () => clearInterval(interval);
      },
    }),
    {
      name: 'workorder-storage',
    }
  )
);
