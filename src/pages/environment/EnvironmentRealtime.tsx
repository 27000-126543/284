import React, { useState, useCallback, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Thermometer,
  Droplets,
  Wind,
  Flame,
  AlertTriangle,
  Fan,
  Waves,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { useZoneStore } from '@/store/useZoneStore';
import { useRefresh } from '@/hooks/useRefresh';
import { formatDateTime, formatNumber } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

interface EnvironmentThresholds {
  temperature: { max: number; min: number };
  humidity: { max: number; min: number };
  oxygen: { max: number; min: number };
  methane: { max: number };
  hydrogenSulfide: { max: number };
}

const thresholds: EnvironmentThresholds = {
  temperature: { min: 10, max: 28 },
  humidity: { min: 30, max: 70 },
  oxygen: { min: 19.5, max: 23.5 },
  methane: { max: 1 },
  hydrogenSulfide: { max: 5 },
};

const checkParamStatus = (param: string, value: number): 'normal' | 'warning' | 'danger' => {
  const t = thresholds[param as keyof EnvironmentThresholds];
  if (!t) return 'normal';
  const hasMin = 'min' in t;
  const hasMax = 'max' in t;
  if (hasMin && value < t.min) return 'danger';
  if (hasMax && value > t.max) return 'danger';
  if (hasMin && hasMax && value < t.min + (t.max - t.min) * 0.15) return 'warning';
  if (hasMax && value > t.max * 0.85) return 'warning';
  return 'normal';
};

const getStatusClass = (status: 'normal' | 'warning' | 'danger'): string => {
  if (status === 'danger') return 'text-danger animate-pulse';
  if (status === 'warning') return 'text-warning';
  return 'text-dark-text';
};

const ParamItem: React.FC<{
  label: string;
  value: number;
  unit: string;
  param: string;
  icon: React.ElementType;
}> = ({ label, value, unit, param, icon: Icon }) => {
  const status = checkParamStatus(param, value);
  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${status === 'danger' ? 'text-danger' : status === 'warning' ? 'text-warning' : 'text-accent-400'}`} />
      <div className="flex-1">
        <p className="text-dark-text3 text-xs">{label}</p>
        <p className={`font-mono font-semibold ${getStatusClass(status)}`}>
          {formatNumber(value, param === 'temperature' || param === 'oxygen' ? 1 : param === 'methane' || param === 'hydrogenSulfide' ? 2 : 0)}
          <span className="text-xs text-dark-text3 ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
};

const EnvironmentRealtime: React.FC = () => {
  const navigate = useNavigate();
  const { zones, environmentData, refreshEnvironmentData } = useZoneStore();
  const [selectedZone, setSelectedZone] = useState<string>(zones[0]?.id || '');
  const [lastUpdate, setLastUpdate] = useState(dayjs().format('YYYY-MM-DD HH:mm:ss'));

  const refreshData = useCallback(() => {
    refreshEnvironmentData();
    setLastUpdate(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  }, [refreshEnvironmentData]);

  useRefresh(refreshData, 5000);

  const selectedZoneData = zones.find((z) => z.id === selectedZone);
  const selectedEnvData = environmentData[selectedZone];

  const abnormalCount = useMemo(() => {
    return Object.values(environmentData).filter((d) => !d.isNormal).length;
  }, [environmentData]);

  const getTrendOption = () => {
    const hours = Array.from({ length: 12 }, (_, i) =>
      dayjs().subtract(11 - i, 'hour').format('HH:00')
    );

    const generateSeries = (name: string, color: string, key: string) => ({
      name,
      type: 'line',
      smooth: true,
      data: hours.map(() => {
        const base = selectedEnvData?.[key as keyof typeof selectedEnvData] as number || 0;
        return base + (Math.random() - 0.5) * (base * 0.1);
      }),
      lineStyle: { color, width: 2 },
      itemStyle: { color },
      symbol: 'circle',
      symbolSize: 4,
    });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#1E293B',
        borderColor: '#475569',
        textStyle: { color: '#F1F5F9' },
      },
      legend: {
        top: 0,
        textStyle: { color: '#94A3B8', fontSize: 11 },
        itemWidth: 12,
        itemHeight: 8,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: hours,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94A3B8', fontSize: 10 },
      },
      yAxis: [
        {
          type: 'value',
          name: '温度/湿度(%)',
          axisLine: { lineStyle: { color: '#475569' } },
          axisLabel: { color: '#94A3B8', fontSize: 10 },
          splitLine: { lineStyle: { color: '#334155' } },
        },
        {
          type: 'value',
          name: '气体浓度',
          axisLine: { lineStyle: { color: '#475569' } },
          axisLabel: { color: '#94A3B8', fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        { ...generateSeries('温度(°C)', '#3E92CC', 'temperature'), yAxisIndex: 0 },
        { ...generateSeries('湿度(%)', '#00A896', 'humidity'), yAxisIndex: 0 },
        { ...generateSeries('氧气(%)', '#F77F00', 'oxygen'), yAxisIndex: 1 },
        { ...generateSeries('甲烷(LEL%)', '#D62828', 'methane'), yAxisIndex: 1 },
        { ...generateSeries('硫化氢(ppm)', '#9333EA', 'hydrogenSulfide'), yAxisIndex: 1 },
      ],
    };
  };

  const handleStartVentilation = () => {
    console.log('启动通风设备', selectedZone);
  };

  const handleStartDrainage = () => {
    console.log('启动排水设备', selectedZone);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">环境实时监测</h1>
          <p className="text-dark-text3 text-sm mt-1">
            最后更新：{lastUpdate} · 数据每5秒自动刷新
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-bg3">
            <AlertTriangle className={`w-4 h-4 ${abnormalCount > 0 ? 'text-danger' : 'text-success'}`} />
            <span className="text-sm text-dark-text">
              异常分区：<span className={abnormalCount > 0 ? 'text-danger font-semibold' : 'text-success font-semibold'}>{abnormalCount}</span>/{zones.length}
            </span>
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            手动刷新
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map((zone) => {
          const env = environmentData[zone.id];
          const isSelected = selectedZone === zone.id;
          return (
            <div
              key={zone.id}
              onClick={() => setSelectedZone(zone.id)}
              className={`card-gradient-border p-4 cursor-pointer transition-all hover:scale-[1.02] ${isSelected ? 'ring-2 ring-accent-400' : ''}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${env?.isNormal ? 'bg-success' : 'bg-danger animate-pulse'}`}
                  />
                  <span className="font-medium text-dark-text text-sm">{zone.name}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-dark-text3" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ParamItem label="温度" value={env?.temperature || 0} unit="°C" param="temperature" icon={Thermometer} />
                <ParamItem label="湿度" value={env?.humidity || 0} unit="%" param="humidity" icon={Droplets} />
                <ParamItem label="氧气" value={env?.oxygen || 0} unit="%" param="oxygen" icon={Wind} />
                <ParamItem label="甲烷" value={env?.methane || 0} unit="LEL%" param="methane" icon={Flame} />
              </div>
              <div className="mt-3 pt-3 border-t border-dark-border">
                <ParamItem label="硫化氢" value={env?.hydrogenSulfide || 0} unit="ppm" param="hydrogenSulfide" icon={AlertTriangle} />
              </div>
              {!env?.isNormal && (
                <div className="mt-2 px-2 py-1 rounded bg-danger/10 text-danger text-xs text-center">
                  参数超标
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-gradient-border p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-dark-text">
              {selectedZoneData?.name || '请选择分区'} - 环境参数趋势
            </h3>
          </div>
          {selectedEnvData ? (
            <ReactECharts option={getTrendOption()} style={{ height: '320px' }} />
          ) : (
            <div className="h-[320px] flex items-center justify-center text-dark-text3">
              请选择分区查看趋势图
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4">设备控制</h3>
            <div className="space-y-3">
              <button
                onClick={handleStartVentilation}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-cyan-900/30 hover:bg-cyan-900/50 text-cyan-400 border border-cyan-700/50 transition-colors"
              >
                <Fan className="w-5 h-5" />
                <span className="font-medium">启动通风设备</span>
              </button>
              <button
                onClick={handleStartDrainage}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border border-blue-700/50 transition-colors"
              >
                <Waves className="w-5 h-5" />
                <span className="font-medium">启动排水设备</span>
              </button>
            </div>
          </div>

          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4">分区详情</h3>
            {selectedZoneData && selectedEnvData ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-text3">分区状态</span>
                  <span className={selectedZoneData.status === 'normal' ? 'text-success' : selectedZoneData.status === 'restricted' ? 'text-warning' : 'text-danger'}>
                    {selectedZoneData.status === 'normal' ? '正常' : selectedZoneData.status === 'restricted' ? '受限' : '停用'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-text3">环境达标率</span>
                  <span className="text-dark-text font-mono">{selectedZoneData.environmentRate || 0}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-text3">设备数量</span>
                  <span className="text-dark-text font-mono">{selectedZoneData.deviceCount || 0}台</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-text3">管廊长度</span>
                  <span className="text-dark-text font-mono">{selectedZoneData.length}m</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-dark-text3">采集时间</span>
                  <span className="text-dark-text font-mono text-xs">{formatDateTime(selectedEnvData.timestamp)}</span>
                </div>
                <button
                  onClick={() => navigate(`/zone/detail/${selectedZoneData.id}`)}
                  className="w-full mt-2 px-3 py-2 rounded-lg bg-dark-bg3 hover:bg-dark-border text-dark-text text-sm transition-colors"
                >
                  查看详细信息
                </button>
              </div>
            ) : (
              <div className="text-dark-text3 text-sm text-center py-4">
                请选择分区查看详情
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentRealtime;
