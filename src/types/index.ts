export interface Zone {
  id: string;
  name: string;
  length: number;
  pipelineTypes: string[];
  sectionSize: {
    width: number;
    height: number;
  };
  status: 'normal' | 'restricted' | 'suspended';
  accessEnabled: boolean;
  createdAt: string;
  environmentRate?: number;
  deviceCount?: number;
}

export interface Device {
  id: string;
  zoneId: string;
  zoneName?: string;
  name: string;
  type: 'lighting' | 'water_pump' | 'fan' | 'fire';
  typeLabel?: string;
  status: 'running' | 'stopped' | 'fault';
  statusLabel?: string;
  isRemoteControllable: boolean;
  lastMaintenance: string;
  installDate?: string;
  model?: string;
}

export interface EnvironmentData {
  id: string;
  zoneId: string;
  zoneName?: string;
  temperature: number;
  humidity: number;
  oxygen: number;
  methane: number;
  hydrogenSulfide: number;
  timestamp: string;
  isNormal: boolean;
}

export interface EscalateLog {
  level: number;
  levelLabel: string;
  time: string;
  note: string;
}

export interface Alarm {
  id: string;
  zoneId: string;
  zoneName?: string;
  type: string;
  typeLabel?: string;
  level: 'normal' | 'serious' | 'urgent';
  levelLabel?: string;
  status: 'unconfirmed' | 'confirmed' | 'processing' | 'resolved';
  statusLabel?: string;
  title?: string;
  content: string;
  description?: string;
  createdAt: string;
  confirmedBy?: string;
  confirmedAt?: string;
  resolvedAt?: string;
  deviceId?: string;
  deviceName?: string;
  escalateLevel: number;
  escalateLevelLabel?: string;
  escalateLogs: EscalateLog[];
  firstEscalateAt?: string;
  secondEscalateAt?: string;
}

export interface WorkOrder {
  id: string;
  type: 'repair' | 'rectification';
  typeLabel?: string;
  zoneId: string;
  zoneName?: string;
  deviceId?: string;
  deviceName?: string;
  hazardId?: string;
  alarmId?: string;
  priority: 'normal' | 'urgent' | 'critical';
  priorityLabel?: string;
  status: 'pending' | 'accepted' | 'processing' | 'completed';
  statusLabel?: string;
  assignee: string;
  assigneeName?: string;
  description: string;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  isOverdue: boolean;
  escalated?: boolean;
  repairPhotos?: string[];
  materials?: MaterialItem[];
}

export interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface InspectionTask {
  id: string;
  zoneId: string;
  zoneName?: string;
  routeId: string;
  routeName?: string;
  inspector: string;
  inspectorName?: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  statusLabel?: string;
  startTime?: string;
  endTime?: string;
  checkpoints: Checkpoint[];
}

export interface Checkpoint {
  id: string;
  name: string;
  checked: boolean;
  checkedAt?: string;
  qrCode: string;
}

export interface HazardReport {
  id: string;
  taskId: string;
  zoneId: string;
  zoneName?: string;
  reporter: string;
  reporterName?: string;
  type: 'leakage' | 'crack' | 'other';
  typeLabel?: string;
  description: string;
  photos: string[];
  createdAt: string;
  status: 'pending' | 'processing' | 'resolved';
  statusLabel?: string;
  workOrderId?: string;
}

export interface User {
  id: string;
  username: string;
  realName: string;
  role: 'inspector' | 'leader' | 'control' | 'admin';
  roleLabel?: string;
  zoneIds: string[];
  phone: string;
  status: boolean;
}

export interface DashboardStats {
  zoneCount: number;
  deviceCount: number;
  environmentRate: number;
  inspectionRate: number;
  runningDevices: number;
  faultDevices: number;
  pendingAlarms: number;
  pendingWorkOrders: number;
  zones: Zone[];
  recentAlarms: Alarm[];
  environmentTrend: { time: string; value: number }[];
  alarmHeatmap: number[][];
}

export interface AlarmRule {
  id: string;
  name: string;
  parameter: string;
  threshold: number;
  unit: string;
  level: 'normal' | 'serious' | 'urgent';
  enabled: boolean;
}

export interface InspectionRoute {
  id: string;
  name: string;
  zoneId: string;
  checkpoints: { id: string; name: string; qrCode: string }[];
}
