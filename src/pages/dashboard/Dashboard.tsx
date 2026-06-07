import React, { useState, useCallback, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  MapPin,
  Cpu,
  Thermometer,
  Route,
  AlertTriangle,
  ClipboardList,
  CheckCircle,
  XCircle,
  ArrowUpRight,
} from 'lucide-react';
import { useZoneStore } from '@/store/useZoneStore';
import { useDeviceStore } from '@/store/useDeviceStore';
import { useAlarmStore } from '@/store/useAlarmStore';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { useRefresh } from '@/hooks/useRefresh';
import { formatDateTime, getStatusBgColor, getLevelColor } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const StatCard: React.FC<{
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
  onClick?: () => void;
}> = ({ title, value, unit, icon: Icon, color, trend, onClick }) => (
  <div
    onClick={onClick}
    className={`card-gradient-border p-5 cursor-pointer hover:scale-[1.02] transition-transform`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-dark-text3 text-sm mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className={`text-3xl font-bold font-mono count-number ${color}`}>
            {value}
          </span>
          {unit && <span className="text-dark-text3 text-sm">{unit}</span>}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight
              className={`w-4 h-4 ${trend >= 0 ? 'text-success' : 'text-danger'}`}
            />
            <span
              className={`text-xs ${trend >= 0 ? 'text-success' : 'text-danger'}`}
            >
              {trend >= 0 ? '+' : ''}
              {trend}%
            </span>
          </div>
        )}
      </div>
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          color.includes('blue')
            ? 'bg-blue-900/30'
            : color.includes('green')
            ? 'bg-green-900/30'
            : color.includes('yellow')
            ? 'bg-yellow-900/30'
            : color.includes('red')
            ? 'bg-red-900/30'
            : 'bg-cyan-900/30'
        }`}
      >
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { zones, environmentData, refreshEnvironmentData } = useZoneStore();
  const { devices, getRunningCount, getFaultCount } = useDeviceStore();
  const { getUnconfirmedCount, alarms } = useAlarmStore();
  const { getPendingCount, inspectionTasks, workOrders } = useWorkOrderStore();

  const [lastUpdate, setLastUpdate] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  const refreshData = useCallback(() => {
    refreshEnvironmentData();
    setLastUpdate(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  }, [refreshEnvironmentData]);

  useRefresh(refreshData, 5000);

  const runningCount = getRunningCount();
  const faultCount = getFaultCount();
  const unconfirmedAlarmCount = getUnconfirmedCount();
  const pendingWorkOrderCount = getPendingCount();

  const completedTasks = inspectionTasks.filter((t) => t.status === 'completed').length;
  const totalTasks = inspectionTasks.length;
  const inspectionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const normalEnvironmentCount = Object.values(environmentData).filter((e) => e?.isNormal).length;
  const avgEnvironmentRate =
    zones.length > 0 ? Math.round((normalEnvironmentCount / zones.length) * 100) : 0;

  const recentAlarms = alarms.filter((a) => a.status !== 'resolved').slice(0, 8);
  const totalDevices = devices.length;

  const environmentTrend = useMemo(() => {
    const now = dayjs();
    return Array.from({ length: 24 }, (_, i) => ({
      time: now.subtract(23 - i, 'hour').format('HH:00'),
      value: 88 + Math.floor(((i * 7) % 13)),
    }));
  }, []);

  const alarmHeatmap = useMemo(() => {
    const heatmap: number[][] = [];
    for (let z = 0; z < zones.length; z++) {
      const row: number[] = [];
      for (let h = 0; h < 24; h++) {
        const zoneAlarms = alarms.filter(
          (a) =>
            a.zoneId === zones[z].id &&
            dayjs(a.createdAt).hour() === h &&
            dayjs(a.createdAt).isAfter(dayjs().subtract(24, 'hour'))
        ).length;
        row.push(zoneAlarms);
      }
      heatmap.push(row);
    }
    return heatmap;
  }, [alarms, zones]);

  const getZoneOption = () => ({
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1E293B',
      borderColor: '#475569',
      textStyle: { color: '#F1F5F9' },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#94A3B8' },
    },
    series: [
      {
        name: '环境达标率',
        type: 'pie',
        radius: ['55%', '80%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#1E293B',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            color: '#F1F5F9',
          },
        },
        data: [
          { value: avgEnvironmentRate, name: '达标', itemStyle: { color: '#00A896' } },
          {
            value: 100 - avgEnvironmentRate,
            name: '超标',
            itemStyle: { color: '#D62828' },
          },
        ],
      },
    ],
    graphic: {
      type: 'text',
      left: 'center',
      top: '40%',
      style: {
        text: `${avgEnvironmentRate}%`,
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#F1F5F9',
      },
    },
  });

  const getTrendOption = () => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1E293B',
      borderColor: '#475569',
      textStyle: { color: '#F1F5F9' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: environmentTrend.map((d) => d.time),
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94A3B8', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      min: 80,
      max: 100,
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94A3B8' },
      splitLine: { lineStyle: { color: '#334155' } },
    },
    series: [
      {
        name: '环境达标率',
        type: 'line',
        smooth: true,
        data: environmentTrend.map((d) => d.value),
        lineStyle: { color: '#3E92CC', width: 2 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(62, 146, 204, 0.3)' },
              { offset: 1, color: 'rgba(62, 146, 204, 0)' },
            ],
          },
        },
        itemStyle: { color: '#3E92CC' },
      },
    ],
  });

  const getHeatmapOption = () => {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const zoneNames = zones.map((z) => z.name.split('-')[0]);

    const data: [number, number, number][] = [];
    alarmHeatmap.forEach((row, zoneIdx) => {
      row.forEach((value, hourIdx) => {
        if (value > 0) {
          data.push([hourIdx, zoneIdx, value]);
        }
      });
    });

    return {
      tooltip: {
        position: 'top',
        backgroundColor: '#1E293B',
        borderColor: '#475569',
        textStyle: { color: '#F1F5F9' },
        formatter: (params: any) => {
          return `${zoneNames[params.data[1]]} ${hours[params.data[0]]}<br/>告警数: ${params.data[2]}`;
        },
      },
      grid: {
        left: '15%',
        right: '5%',
        top: '10%',
        bottom: '15%',
      },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94A3B8', fontSize: 9, interval: 2 },
        splitArea: { show: false },
      },
      yAxis: {
        type: 'category',
        data: zoneNames,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94A3B8', fontSize: 11 },
        splitArea: { show: false },
      },
      visualMap: {
        min: 0,
        max: 5,
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        textStyle: { color: '#94A3B8' },
        inRange: {
          color: ['#1E293B', '#3E92CC', '#F77F00', '#D62828'],
        },
      },
      series: [
        {
          name: '告警数',
          type: 'heatmap',
          data,
          itemStyle: {
            borderColor: '#0F172A',
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(62, 146, 204, 0.5)',
            },
          },
        },
      ],
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">管廊运行总览</h1>
          <p className="text-dark-text3 text-sm mt-1">
            最后更新：{lastUpdate} · 数据每5秒自动刷新
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="管廊分区"
          value={zones.length}
          unit="个"
          icon={MapPin}
          color="text-accent-400"
          onClick={() => navigate('/zone/list')}
        />
        <StatCard
          title="环境达标率"
          value={avgEnvironmentRate}
          unit="%"
          icon={Thermometer}
          color="text-success"
          trend={2.5}
          onClick={() => navigate('/environment/realtime')}
        />
        <StatCard
          title="巡检完成率"
          value={inspectionRate}
          unit="%"
          icon={Route}
          color="text-warning"
          onClick={() => navigate('/inspection/tasks')}
        />
        <StatCard
          title="设备运行"
          value={`${runningCount}/${totalDevices}`}
          icon={Cpu}
          color="text-info"
          onClick={() => navigate('/device/list')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">运行中设备</p>
              <p className="text-xl font-bold text-success font-mono">{runningCount}</p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">故障设备</p>
              <p className="text-xl font-bold text-danger font-mono">{faultCount}</p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">待确认告警</p>
              <p className="text-xl font-bold text-warning font-mono">
                {unconfirmedAlarmCount}
              </p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">待处理工单</p>
              <p className="text-xl font-bold text-info font-mono">{pendingWorkOrderCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-gradient-border p-5">
          <h3 className="text-lg font-semibold text-dark-text mb-4">环境达标率总览</h3>
          <ReactECharts option={getZoneOption()} style={{ height: '250px' }} />
        </div>

        <div className="card-gradient-border p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-dark-text mb-4">24小时环境趋势</h3>
          <ReactECharts option={getTrendOption()} style={{ height: '250px' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-gradient-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-text">实时告警</h3>
            <button
              onClick={() => navigate('/alarm/realtime')}
              className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto">
            {recentAlarms.length === 0 ? (
              <div className="text-center py-8 text-dark-text3">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无告警信息</p>
              </div>
            ) : (
              recentAlarms.map((alarm) => (
                <div
                  key={alarm.id}
                  className="p-3 rounded-lg bg-dark-bg3/50 hover:bg-dark-bg3 cursor-pointer transition-colors animate-fade-in-up"
                  onClick={() => navigate('/alarm/realtime')}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        alarm.level === 'urgent'
                          ? 'bg-danger animate-pulse'
                          : alarm.level === 'serious'
                          ? 'bg-warning'
                          : 'bg-info'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-dark-text truncate">{alarm.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs ${getLevelColor(alarm.level)}`}>
                          {alarm.levelLabel}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusBgColor(alarm.status)}`}>
                          {alarm.statusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-dark-text3 mt-1">
                        {formatDateTime(alarm.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-gradient-border p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-dark-text mb-4">24小时告警热力图</h3>
          <ReactECharts option={getHeatmapOption()} style={{ height: '320px' }} />
        </div>
      </div>

      <div className="card-gradient-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-text">分区运行状态</h3>
          <button
            onClick={() => navigate('/zone/list')}
            className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
          >
            管理分区
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {zones.slice(0, 8).map((zone, idx) => {
            const env = environmentData[zone.id];
            return (
              <div
                key={zone.id}
                className="p-4 rounded-xl bg-dark-bg3/50 hover:bg-dark-bg3 cursor-pointer transition-all hover:scale-[1.02]"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => navigate(`/zone/detail/${zone.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-dark-text text-sm">{zone.name}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      zone.status === 'normal'
                        ? 'bg-success'
                        : zone.status === 'restricted'
                        ? 'bg-warning'
                        : 'bg-danger'
                    }`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-dark-text3">温度</span>
                    <p className={`font-mono ${env?.temperature > 28 ? 'text-danger' : 'text-dark-text'}`}>
                      {env?.temperature?.toFixed(1)}°C
                    </p>
                  </div>
                  <div>
                    <span className="text-dark-text3">湿度</span>
                    <p className={`font-mono ${env?.humidity > 70 ? 'text-danger' : 'text-dark-text'}`}>
                      {env?.humidity?.toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-dark-text3">氧气</span>
                    <p className={`font-mono ${(env?.oxygen || 0) < 19.5 ? 'text-danger' : 'text-dark-text'}`}>
                      {env?.oxygen?.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-dark-text3">甲烷</span>
                    <p className={`font-mono ${(env?.methane || 0) >= 1 ? 'text-danger' : 'text-dark-text'}`}>
                      {env?.methane?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
