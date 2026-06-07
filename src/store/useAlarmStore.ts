import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Alarm } from '@/types';
import { mockAlarms } from '@/api/mock';
import dayjs from 'dayjs';

const FIRST_ESCALATE_MINUTES = 30;
const SECOND_ESCALATE_MINUTES = 60;

interface AlarmState {
  alarms: Alarm[];
  setAlarms: (alarms: Alarm[]) => void;
  addAlarm: (alarm: Omit<Alarm, 'escalateLogs' | 'escalateLevel' | 'escalateLevelLabel'>) => void;
  confirmAlarm: (id: string, userId: string, userName: string) => void;
  resolveAlarm: (id: string) => void;
  escalateAlarm: (id: string, targetLevel: number) => void;
  getUnconfirmedCount: () => number;
  checkAndEscalateAlarms: () => void;
  startEscalateTimer: () => () => void;
}

export const useAlarmStore = create<AlarmState>()(
  persist(
    (set, get) => ({
      alarms: mockAlarms,

      setAlarms: (alarms) => set({ alarms }),

      addAlarm: (alarm) =>
        set((state) => {
          const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
          const newAlarm: Alarm = {
            ...alarm,
            escalateLevel: 0,
            escalateLevelLabel: '巡线员',
            escalateLogs: [
              {
                level: 0,
                levelLabel: '巡线员',
                time: now,
                note: '告警产生，推送给巡线员',
              },
            ],
          };
          return {
            alarms: [newAlarm, ...state.alarms],
          };
        }),

      confirmAlarm: (id, userId, userName) =>
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: 'confirmed',
                  statusLabel: '已确认',
                  confirmedBy: userName,
                  confirmedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                }
              : a
          ),
        })),

      resolveAlarm: (id) =>
        set((state) => ({
          alarms: state.alarms.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: 'resolved',
                  statusLabel: '已解除',
                  resolvedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                }
              : a
          ),
        })),

      escalateAlarm: (id, targetLevel) =>
        set((state) => {
          const levelLabels = ['巡线员', '分区组长', '总控中心'];
          const notes = [
            '',
            '30分钟未确认，自动升级到分区组长',
            '60分钟未确认，自动升级到总控中心',
          ];
          const now = dayjs().format('YYYY-MM-DD HH:mm:ss');

          return {
            alarms: state.alarms.map((a) => {
              if (a.id === id && a.status === 'unconfirmed' && a.escalateLevel < targetLevel) {
                const newLogs = [...a.escalateLogs];
                for (let i = a.escalateLevel + 1; i <= targetLevel; i++) {
                  newLogs.push({
                    level: i,
                    levelLabel: levelLabels[i],
                    time: now,
                    note: notes[i],
                  });
                }
                return {
                  ...a,
                  escalateLevel: targetLevel,
                  escalateLevelLabel: levelLabels[targetLevel],
                  escalateLogs: newLogs,
                  firstEscalateAt: targetLevel >= 1 ? now : a.firstEscalateAt,
                  secondEscalateAt: targetLevel >= 2 ? now : a.secondEscalateAt,
                };
              }
              return a;
            }),
          };
        }),

      getUnconfirmedCount: () => {
        return get().alarms.filter((a) => a.status === 'unconfirmed').length;
      },

      checkAndEscalateAlarms: () => {
        const { alarms, escalateAlarm } = get();
        const now = dayjs();

        alarms.forEach((alarm) => {
          if (alarm.status !== 'unconfirmed') return;

          const minutesSinceCreated = now.diff(dayjs(alarm.createdAt), 'minute');

          if (minutesSinceCreated >= SECOND_ESCALATE_MINUTES && alarm.escalateLevel < 2) {
            escalateAlarm(alarm.id, 2);
          } else if (minutesSinceCreated >= FIRST_ESCALATE_MINUTES && alarm.escalateLevel < 1) {
            escalateAlarm(alarm.id, 1);
          }
        });
      },

      startEscalateTimer: () => {
        const interval = setInterval(() => {
          get().checkAndEscalateAlarms();
        }, 60000);

        get().checkAndEscalateAlarms();

        return () => clearInterval(interval);
      },
    }),
    {
      name: 'alarm-storage',
    }
  )
);
