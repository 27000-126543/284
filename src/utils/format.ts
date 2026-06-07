import dayjs from 'dayjs';

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatDate = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm:ss');
};

export const formatNumber = (num: number, decimals = 0): string => {
  return num.toFixed(decimals);
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    normal: 'text-success',
    restricted: 'text-warning',
    suspended: 'text-danger',
    running: 'text-success',
    stopped: 'text-gray-400',
    fault: 'text-danger',
    unconfirmed: 'text-danger',
    confirmed: 'text-warning',
    resolved: 'text-success',
    pending: 'text-warning',
    accepted: 'text-info',
    processing: 'text-warning',
    completed: 'text-success',
    overdue: 'text-danger',
    in_progress: 'text-info',
  };
  return colorMap[status] || 'text-gray-400';
};

export const getStatusBgColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    normal: 'bg-green-900/30 text-green-400',
    restricted: 'bg-yellow-900/30 text-yellow-400',
    suspended: 'bg-red-900/30 text-red-400',
    running: 'bg-green-900/30 text-green-400',
    stopped: 'bg-gray-700/50 text-gray-400',
    fault: 'bg-red-900/30 text-red-400',
    unconfirmed: 'bg-red-900/30 text-red-400',
    confirmed: 'bg-yellow-900/30 text-yellow-400',
    resolved: 'bg-green-900/30 text-green-400',
    pending: 'bg-yellow-900/30 text-yellow-400',
    accepted: 'bg-blue-900/30 text-blue-400',
    processing: 'bg-yellow-900/30 text-yellow-400',
    completed: 'bg-green-900/30 text-green-400',
    overdue: 'bg-red-900/30 text-red-400',
    in_progress: 'bg-blue-900/30 text-blue-400',
  };
  return colorMap[status] || 'bg-gray-700/50 text-gray-400';
};

export const getLevelColor = (level: string): string => {
  const colorMap: Record<string, string> = {
    normal: 'bg-blue-900/30 text-blue-400',
    serious: 'bg-orange-900/30 text-orange-400',
    urgent: 'bg-red-900/30 text-red-400',
  };
  return colorMap[level] || 'bg-gray-700/50 text-gray-400';
};

export const getPriorityColor = (priority: string): string => {
  const colorMap: Record<string, string> = {
    normal: 'bg-blue-900/30 text-blue-400',
    urgent: 'bg-orange-900/30 text-orange-400',
    critical: 'bg-red-900/30 text-red-400',
  };
  return colorMap[priority] || 'bg-gray-700/50 text-gray-400';
};
