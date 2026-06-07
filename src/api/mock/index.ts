import Mock from 'mockjs';
import type {
  Zone,
  Device,
  EnvironmentData,
  Alarm,
  WorkOrder,
  InspectionTask,
  HazardReport,
  User,
  DashboardStats,
  AlarmRule,
  InspectionRoute,
  EscalateLog,
} from '@/types';
import dayjs from 'dayjs';

const zoneNames = ['A区-东一环路', 'B区-西二环路', 'C区-南三环路', 'D区-北四环路', 'E区-中央大道', 'F区-科技路', 'G区-和平街', 'H区-文化路'];
const pipelineTypes = ['电力', '通信', '给水', '排水', '燃气', '热力'];
const deviceTypes = ['lighting', 'water_pump', 'fan', 'fire'];
const deviceTypeLabels: Record<string, string> = {
  lighting: '照明',
  water_pump: '水泵',
  fan: '风机',
  fire: '消防',
};
const deviceStatusLabels: Record<string, string> = {
  running: '运行中',
  stopped: '已停止',
  fault: '故障',
};

export const mockZones: Zone[] = zoneNames.map((name, index) => ({
  id: `zone-${index + 1}`,
  name,
  length: Mock.Random.integer(800, 2500),
  pipelineTypes: Mock.Random.shuffle(pipelineTypes).slice(0, Mock.Random.integer(3, 5)),
  sectionSize: {
    width: Mock.Random.float(3.5, 6.5, 1, 1),
    height: Mock.Random.float(2.8, 4.5, 1, 1),
  },
  status: Mock.Random.pick(['normal', 'normal', 'normal', 'restricted', 'suspended']),
  accessEnabled: Mock.Random.boolean(8, 2),
  createdAt: dayjs().subtract(Mock.Random.integer(100, 500), 'day').format('YYYY-MM-DD'),
  environmentRate: Mock.Random.integer(85, 100),
  deviceCount: Mock.Random.integer(15, 40),
}));

export const mockDevices: Device[] = mockZones.flatMap((zone) => {
  const devices: Device[] = [];
  const count = Mock.Random.integer(15, 35);
  for (let i = 0; i < count; i++) {
    const type = Mock.Random.pick(deviceTypes) as Device['type'];
    devices.push({
      id: `device-${zone.id}-${i + 1}`,
      zoneId: zone.id,
      zoneName: zone.name,
      name: `${deviceTypeLabels[type]}-${String(i + 1).padStart(3, '0')}`,
      type,
      typeLabel: deviceTypeLabels[type],
      status: Mock.Random.pick(['running', 'running', 'running', 'stopped', 'fault']),
      statusLabel: '',
      isRemoteControllable: Mock.Random.boolean(9, 1),
      lastMaintenance: dayjs().subtract(Mock.Random.integer(5, 60), 'day').format('YYYY-MM-DD'),
      installDate: dayjs().subtract(Mock.Random.integer(200, 800), 'day').format('YYYY-MM-DD'),
      model: `${type.toUpperCase()}-${Mock.Random.string('number', 4)}`,
    });
  }
  return devices;
}).map((d) => ({ ...d, statusLabel: deviceStatusLabels[d.status] }));

export const generateEnvironmentData = (zoneId: string): EnvironmentData => {
  const zone = mockZones.find((z) => z.id === zoneId);
  const temp = Mock.Random.float(18, 30, 1, 1);
  const humidity = Mock.Random.float(40, 80, 0, 0);
  const oxygen = Mock.Random.float(19.5, 23.0, 1, 1);
  const methane = Mock.Random.float(0, 5, 2, 2);
  const h2s = Mock.Random.float(0, 8, 2, 2);
  const isNormal = temp <= 28 && humidity <= 70 && oxygen >= 19.5 && methane < 1 && h2s < 5;

  return {
    id: `env-${zoneId}-${Date.now()}`,
    zoneId,
    zoneName: zone?.name,
    temperature: temp,
    humidity,
    oxygen,
    methane,
    hydrogenSulfide: h2s,
    timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    isNormal,
  };
};

const alarmTypes = ['温度超标', '湿度过高', '氧气不足', '甲烷超标', '硫化氢超标', '设备故障', '渗漏预警', '异常入侵'];
const levelLabels: Record<string, string> = {
  normal: '一般',
  serious: '严重',
  urgent: '紧急',
};
const alarmStatusLabels: Record<string, string> = {
  unconfirmed: '未确认',
  confirmed: '已确认',
  resolved: '已解除',
};

export const mockAlarms: Alarm[] = Array.from({ length: 20 }, (_, i) => {
  const zone = Mock.Random.pick(mockZones);
  const level = Mock.Random.pick(['normal', 'serious', 'urgent']) as Alarm['level'];
  const status = Mock.Random.pick(['unconfirmed', 'unconfirmed', 'confirmed', 'resolved']) as Alarm['status'];
  const minutesAgo = Mock.Random.integer(0, 120);
  const createdAt = dayjs().subtract(minutesAgo, 'minute').format('YYYY-MM-DD HH:mm:ss');
  
  let escalateLevel = 0;
  let firstEscalateAt: string | undefined;
  let secondEscalateAt: string | undefined;
  const escalateLogs: EscalateLog[] = [
    {
      level: 0,
      levelLabel: '巡线员',
      time: createdAt,
      note: '告警产生，推送给巡线员',
    },
  ];

  if (minutesAgo >= 30 && status === 'unconfirmed') {
    escalateLevel = 1;
    firstEscalateAt = dayjs().subtract(minutesAgo - 30, 'minute').format('YYYY-MM-DD HH:mm:ss');
    escalateLogs.push({
      level: 1,
      levelLabel: '分区组长',
      time: firstEscalateAt,
      note: '30分钟未确认，自动升级到分区组长',
    });
  }
  if (minutesAgo >= 60 && status === 'unconfirmed') {
    escalateLevel = 2;
    secondEscalateAt = dayjs().subtract(minutesAgo - 60, 'minute').format('YYYY-MM-DD HH:mm:ss');
    escalateLogs.push({
      level: 2,
      levelLabel: '总控中心',
      time: secondEscalateAt,
      note: '60分钟未确认，自动升级到总控中心',
    });
  }

  const alarmType = Mock.Random.pick(alarmTypes);
  return {
    id: `alarm-${i + 1}`,
    zoneId: zone.id,
    zoneName: zone.name,
    type: alarmType,
    typeLabel: alarmType,
    level,
    levelLabel: levelLabels[level],
    status,
    statusLabel: alarmStatusLabels[status],
    title: `${zone.name}${alarmType}告警`,
    content: `${zone.name}${alarmType}，请及时处理`,
    description: `${zone.name}区域检测到${alarmType}异常，已自动推送告警至当班巡线员，请及时确认并处理。`,
    createdAt,
    confirmedBy: status !== 'unconfirmed' ? Mock.Random.pick(['张三', '李四', '王五', '赵六']) : undefined,
    confirmedAt: status !== 'unconfirmed' ? dayjs().subtract(Mock.Random.integer(0, 60), 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
    resolvedAt: status === 'resolved' ? dayjs().subtract(Mock.Random.integer(0, 30), 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
    deviceId: status === 'resolved' ? `device-${Mock.Random.integer(1, 30)}` : undefined,
    deviceName: status === 'resolved' ? `设备-${Mock.Random.integer(1, 30)}` : undefined,
    escalateLevel,
    escalateLevelLabel: ['巡线员', '分区组长', '总控中心'][escalateLevel],
    escalateLogs,
    firstEscalateAt,
    secondEscalateAt,
  };
});

const workOrderPriorities: Record<string, string> = {
  normal: '一般',
  urgent: '紧急',
  critical: '特急',
};
const workOrderStatusLabels: Record<string, string> = {
  pending: '待接单',
  accepted: '已接单',
  processing: '处理中',
  completed: '已完成',
};
const workOrderTypeLabels: Record<string, string> = {
  repair: '维修工单',
  rectification: '整改工单',
};

export const mockWorkOrders: WorkOrder[] = Array.from({ length: 25 }, (_, i) => {
  const zone = Mock.Random.pick(mockZones);
  const device = Mock.Random.pick(mockDevices.filter((d) => d.zoneId === zone.id));
  const type = Mock.Random.pick(['repair', 'rectification']) as WorkOrder['type'];
  const priority = Mock.Random.pick(['normal', 'urgent', 'critical']) as WorkOrder['priority'];
  const status = Mock.Random.pick(['pending', 'accepted', 'processing', 'completed', 'completed']) as WorkOrder['status'];
  return {
    id: `wo-${String(i + 1).padStart(5, '0')}`,
    type,
    typeLabel: workOrderTypeLabels[type],
    zoneId: zone.id,
    zoneName: zone.name,
    deviceId: device?.id,
    deviceName: device?.name,
    priority,
    priorityLabel: workOrderPriorities[priority],
    status,
    statusLabel: workOrderStatusLabels[status],
    assignee: Mock.Random.pick(['user-1', 'user-2', 'user-3', 'user-4', 'user-5']),
    assigneeName: Mock.Random.pick(['张三', '李四', '王五', '赵六', '钱七']),
    description: type === 'repair' ? `${device?.name}故障，需要维修处理` : '巡检发现隐患，需要整改',
    createdAt: dayjs().subtract(Mock.Random.integer(0, 180), 'minute').format('YYYY-MM-DD HH:mm:ss'),
    acceptedAt: status !== 'pending' ? dayjs().subtract(Mock.Random.integer(0, 120), 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
    completedAt: status === 'completed' ? dayjs().subtract(Mock.Random.integer(0, 60), 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
    isOverdue: Mock.Random.boolean(2, 8),
    materials: status === 'completed' ? [
      { name: '密封圈', quantity: Mock.Random.integer(1, 5), unit: '个' },
      { name: '螺栓', quantity: Mock.Random.integer(4, 12), unit: '套' },
    ] : undefined,
  };
});

const inspectionStatusLabels: Record<string, string> = {
  pending: '待执行',
  in_progress: '进行中',
  completed: '已完成',
  overdue: '已超期',
};

export const mockInspectionTasks: InspectionTask[] = Array.from({ length: 15 }, (_, i) => {
  const zone = Mock.Random.pick(mockZones);
  const status = Mock.Random.pick(['pending', 'in_progress', 'completed', 'completed', 'overdue']) as InspectionTask['status'];
  const checkpoints = Array.from({ length: Mock.Random.integer(4, 8) }, (_, j) => ({
    id: `cp-${i}-${j}`,
    name: `巡检点-${j + 1}`,
    checked: status === 'completed' ? true : Mock.Random.boolean(5, 5),
    checkedAt: status !== 'pending' ? dayjs().subtract(Mock.Random.integer(0, 120), 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
    qrCode: `QR-${zone.id}-${j + 1}`,
  }));
  return {
    id: `task-${String(i + 1).padStart(5, '0')}`,
    zoneId: zone.id,
    zoneName: zone.name,
    routeId: `route-${zone.id}`,
    routeName: `${zone.name}巡检路线`,
    inspector: Mock.Random.pick(['user-1', 'user-2', 'user-3']),
    inspectorName: Mock.Random.pick(['张三', '李四', '王五']),
    date: dayjs().subtract(Mock.Random.integer(0, 3), 'day').format('YYYY-MM-DD'),
    status,
    statusLabel: inspectionStatusLabels[status],
    startTime: status !== 'pending' ? dayjs().subtract(Mock.Random.integer(60, 180), 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
    endTime: status === 'completed' ? dayjs().subtract(Mock.Random.integer(0, 30), 'minute').format('YYYY-MM-DD HH:mm:ss') : undefined,
    checkpoints,
  };
});

const hazardTypeLabels: Record<string, string> = {
  leakage: '渗漏',
  crack: '裂缝',
  other: '其他',
};
const hazardStatusLabels: Record<string, string> = {
  pending: '待整改',
  processing: '整改中',
  resolved: '已整改',
};

export const mockHazardReports: HazardReport[] = Array.from({ length: 10 }, (_, i) => {
  const task = Mock.Random.pick(mockInspectionTasks);
  const type = Mock.Random.pick(['leakage', 'crack', 'other']) as HazardReport['type'];
  const status = Mock.Random.pick(['pending', 'processing', 'resolved']) as HazardReport['status'];
  return {
    id: `hazard-${i + 1}`,
    taskId: task.id,
    zoneId: task.zoneId,
    zoneName: task.zoneName,
    reporter: task.inspector,
    reporterName: task.inspectorName,
    type,
    typeLabel: hazardTypeLabels[type],
    description: Mock.Random.pick([
      '发现墙面有渗水痕迹，需要进一步检查',
      '混凝土结构有细微裂缝，需要监测',
      '排水沟有堵塞情况',
      '照明灯具损坏',
    ]),
    photos: [],
    createdAt: dayjs().subtract(Mock.Random.integer(0, 720), 'minute').format('YYYY-MM-DD HH:mm:ss'),
    status,
    statusLabel: hazardStatusLabels[status],
    workOrderId: status !== 'pending' ? `wo-${String(Mock.Random.integer(1, 25)).padStart(5, '0')}` : undefined,
  };
});

const roleLabels: Record<string, string> = {
  inspector: '巡线员',
  leader: '分区组长',
  control: '总控中心',
  admin: '管理员',
};

export const mockUsers: User[] = [
  {
    id: 'user-0',
    username: 'inspector',
    realName: '巡线员测试',
    role: 'inspector',
    roleLabel: roleLabels.inspector,
    zoneIds: ['zone-1', 'zone-2'],
    phone: '13800138000',
    status: true,
  },
  {
    id: 'user-1',
    username: 'inspector1',
    realName: '张三',
    role: 'inspector',
    roleLabel: roleLabels.inspector,
    zoneIds: ['zone-1', 'zone-2'],
    phone: '13800138001',
    status: true,
  },
  {
    id: 'user-2',
    username: 'inspector2',
    realName: '李四',
    role: 'inspector',
    roleLabel: roleLabels.inspector,
    zoneIds: ['zone-3', 'zone-4'],
    phone: '13800138002',
    status: true,
  },
  {
    id: 'user-0-leader',
    username: 'leader',
    realName: '组长测试',
    role: 'leader',
    roleLabel: roleLabels.leader,
    zoneIds: ['zone-1', 'zone-2', 'zone-3', 'zone-4'],
    phone: '13800138010',
    status: true,
  },
  {
    id: 'user-0-control',
    username: 'control',
    realName: '总控测试',
    role: 'control',
    roleLabel: roleLabels.control,
    zoneIds: mockZones.map((z) => z.id),
    phone: '13800138020',
    status: true,
  },
  {
    id: 'user-3',
    username: 'leader1',
    realName: '王五',
    role: 'leader',
    roleLabel: roleLabels.leader,
    zoneIds: ['zone-1', 'zone-2', 'zone-3', 'zone-4'],
    phone: '13800138003',
    status: true,
  },
  {
    id: 'user-4',
    username: 'control1',
    realName: '赵六',
    role: 'control',
    roleLabel: roleLabels.control,
    zoneIds: mockZones.map((z) => z.id),
    phone: '13800138004',
    status: true,
  },
  {
    id: 'user-5',
    username: 'admin',
    realName: '系统管理员',
    role: 'admin',
    roleLabel: roleLabels.admin,
    zoneIds: mockZones.map((z) => z.id),
    phone: '13800138000',
    status: true,
  },
  {
    id: 'user-6',
    username: 'leader2',
    realName: '钱七',
    role: 'leader',
    roleLabel: roleLabels.leader,
    zoneIds: ['zone-5', 'zone-6', 'zone-7', 'zone-8'],
    phone: '13800138005',
    status: true,
  },
];

export const mockAlarmRules: AlarmRule[] = [
  { id: 'rule-1', name: '高温告警', parameter: 'temperature', threshold: 28, unit: '°C', level: 'normal', enabled: true },
  { id: 'rule-2', name: '高湿告警', parameter: 'humidity', threshold: 70, unit: '%', level: 'normal', enabled: true },
  { id: 'rule-3', name: '氧气不足', parameter: 'oxygen', threshold: 19.5, unit: '%', level: 'serious', enabled: true },
  { id: 'rule-4', name: '甲烷超标', parameter: 'methane', threshold: 1, unit: 'LEL%', level: 'urgent', enabled: true },
  { id: 'rule-5', name: '硫化氢超标', parameter: 'hydrogenSulfide', threshold: 5, unit: 'ppm', level: 'serious', enabled: true },
];

export const mockInspectionRoutes: InspectionRoute[] = mockZones.map((zone, index) => ({
  id: `route-${zone.id}`,
  name: `${zone.name}巡检路线`,
  zoneId: zone.id,
  checkpoints: Array.from({ length: 5 + (index % 3) }, (_, i) => ({
    id: `cp-${zone.id}-${i + 1}`,
    name: `巡检点-${i + 1}`,
    qrCode: `QR-${zone.id}-${String(i + 1).padStart(3, '0')}`,
  })),
}));

export const generateDashboardStats = (): DashboardStats => {
  const runningDevices = mockDevices.filter((d) => d.status === 'running').length;
  const faultDevices = mockDevices.filter((d) => d.status === 'fault').length;
  const pendingAlarms = mockAlarms.filter((a) => a.status !== 'resolved').length;
  const pendingWorkOrders = mockWorkOrders.filter((w) => w.status !== 'completed').length;
  const completedTasks = mockInspectionTasks.filter((t) => t.status === 'completed').length;
  const totalTasks = mockInspectionTasks.length;

  const now = dayjs();
  const environmentTrend = Array.from({ length: 24 }, (_, i) => ({
    time: now.subtract(23 - i, 'hour').format('HH:00'),
    value: Mock.Random.integer(90, 100),
  }));

  const alarmHeatmap = Array.from({ length: 8 }, () =>
    Array.from({ length: 24 }, () => Mock.Random.integer(0, 5))
  );

  return {
    zoneCount: mockZones.length,
    deviceCount: mockDevices.length,
    environmentRate: Mock.Random.integer(92, 98),
    inspectionRate: Math.round((completedTasks / totalTasks) * 100),
    runningDevices,
    faultDevices,
    pendingAlarms,
    pendingWorkOrders,
    zones: mockZones,
    recentAlarms: mockAlarms.slice(0, 10),
    environmentTrend,
    alarmHeatmap,
  };
};
