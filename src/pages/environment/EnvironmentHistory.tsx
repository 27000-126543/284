import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Calendar,
  Download,
  Filter,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import { useZoneStore } from '@/store/useZoneStore';
import { formatDateTime, formatNumber } from '@/utils/format';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import type { EnvironmentData } from '@/types';

const generateHistoryData = (zoneId: string, zoneName: string, days: number): EnvironmentData[] => {
  const data: EnvironmentData[] = [];
  const now = dayjs();
  
  for (let i = 0; i < days * 24; i += 2) {
    const time = now.subtract(days * 24 - i, 'hour');
    const temp = 18 + Math.random() * 12 + Math.sin(i / 6) * 3;
    const humidity = 40 + Math.random() * 40 + Math.cos(i / 8) * 10;
    const oxygen = 19.5 + Math.random() * 3.5;
    const methane = Math.random() * 3;
    const h2s = Math.random() * 6;
    const isNormal = temp <= 28 && humidity <= 70 && oxygen >= 19.5 && methane < 1 && h2s < 5;
    
    data.push({
      id: `env-history-${zoneId}-${i}`,
      zoneId,
      zoneName,
      temperature: Math.round(temp * 10) / 10,
      humidity: Math.round(humidity),
      oxygen: Math.round(oxygen * 10) / 10,
      methane: Math.round(methane * 100) / 100,
      hydrogenSulfide: Math.round(h2s * 100) / 100,
      timestamp: time.format('YYYY-MM-DD HH:mm:ss'),
      isNormal,
    });
  }
  
  return data;
};

const EnvironmentHistory: React.FC = () => {
  const { zones } = useZoneStore();
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [selectedParams, setSelectedParams] = useState<string[]>(['temperature', 'humidity', 'oxygen']);

  const historyData = useMemo(() => {
    const days = dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
    if (selectedZone === 'all') {
      return zones.flatMap((zone) => generateHistoryData(zone.id, zone.name, days));
    }
    const zone = zones.find((z) => z.id === selectedZone);
    return zone ? generateHistoryData(zone.id, zone.name, days) : [];
  }, [selectedZone, startDate, endDate, zones]);

  const chartData = useMemo(() => {
    if (selectedZone === 'all') {
      const grouped: Record<string, EnvironmentData[]> = {};
      historyData.forEach((d) => {
        if (!grouped[d.zoneId]) grouped[d.zoneId] = [];
        grouped[d.zoneId].push(d);
      });
      return grouped;
    }
    return { [selectedZone]: historyData };
  }, [historyData, selectedZone]);

  const getCompareOption = () => {
    const colors = ['#3E92CC', '#00A896', '#F77F00', '#D62828', '#9333EA'];
    const paramLabels: Record<string, string> = {
      temperature: '温度(°C)',
      humidity: '湿度(%)',
      oxygen: '氧气(%)',
      methane: '甲烷(LEL%)',
      hydrogenSulfide: '硫化氢(ppm)',
    };

    const firstZoneData = Object.values(chartData)[0] || [];
    const times = firstZoneData.map((d) => dayjs(d.timestamp).format('MM-DD HH:mm'));

    const series = Object.entries(chartData).flatMap(([zoneId, data], zoneIdx) => {
      const zone = zones.find((z) => z.id === zoneId);
      return selectedParams.map((param, paramIdx) => ({
        name: `${zone?.name || zoneId} - ${paramLabels[param]}`,
        type: 'line',
        smooth: true,
        data: data.map((d) => d[param as keyof EnvironmentData] as number),
        lineStyle: { 
          color: colors[(zoneIdx * selectedParams.length + paramIdx) % colors.length],
          width: 2,
        },
        itemStyle: { color: colors[(zoneIdx * selectedParams.length + paramIdx) % colors.length] },
        symbol: 'circle',
        symbolSize: 3,
      }));
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
        type: 'scroll',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '18%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: times,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94A3B8', fontSize: 10, interval: Math.floor(times.length / 10) },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94A3B8', fontSize: 10 },
        splitLine: { lineStyle: { color: '#334155' } },
      },
      series,
    };
  };

  const toggleParam = (param: string) => {
    setSelectedParams((prev) =>
      prev.includes(param) ? prev.filter((p) => p !== param) : [...prev, param]
    );
  };

  const handleExportExcel = () => {
    const exportData = historyData.map((d) => ({
      分区: d.zoneName,
      温度: d.temperature + '°C',
      湿度: d.humidity + '%',
      氧气: d.oxygen + '%',
      甲烷: d.methane + ' LEL%',
      硫化氢: d.hydrogenSulfide + ' ppm',
      状态: d.isNormal ? '正常' : '超标',
      采集时间: d.timestamp,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '环境历史数据');
    XLSX.writeFile(wb, `环境历史数据_${startDate}_${endDate}.xlsx`);
  };

  const paramOptions = [
    { key: 'temperature', label: '温度', icon: Thermometer, color: 'text-blue-400' },
    { key: 'humidity', label: '湿度', icon: Droplets, color: 'text-green-400' },
    { key: 'oxygen', label: '氧气', icon: Wind, color: 'text-orange-400' },
    { key: 'methane', label: '甲烷', icon: Flame, color: 'text-red-400' },
    { key: 'hydrogenSulfide', label: '硫化氢', icon: AlertTriangle, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">环境历史数据</h1>
          <p className="text-dark-text3 text-sm mt-1">
            查询和分析历史环境监测数据
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          导出Excel
        </button>
      </div>

      <div className="card-gradient-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-accent-400" />
          <h3 className="text-lg font-semibold text-dark-text">筛选条件</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-dark-text3 text-sm mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              选择分区
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-dark-bg3 border border-dark-border text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-400"
            >
              <option value="all">全部分区</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-dark-text3 text-sm mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              开始日期
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-dark-bg3 border border-dark-border text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-400"
            />
          </div>
          <div>
            <label className="block text-dark-text3 text-sm mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              结束日期
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-dark-bg3 border border-dark-border text-dark-text focus:outline-none focus:ring-2 focus:ring-accent-400"
            />
          </div>
          <div>
            <label className="block text-dark-text3 text-sm mb-2">数据参数</label>
            <div className="flex flex-wrap gap-2">
              {paramOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => toggleParam(opt.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                    selectedParams.includes(opt.key)
                      ? 'bg-accent-600 text-white'
                      : 'bg-dark-bg3 text-dark-text3 hover:bg-dark-border'
                  }`}
                >
                  <opt.icon className="w-3 h-3" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card-gradient-border p-5">
        <h3 className="text-lg font-semibold text-dark-text mb-4">多参数对比曲线</h3>
        <ReactECharts option={getCompareOption()} style={{ height: '380px' }} />
      </div>

      <div className="card-gradient-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-text">历史数据记录</h3>
          <span className="text-sm text-dark-text3">
            共 {historyData.length} 条记录
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left py-3 px-4 text-dark-text3 text-sm font-medium">分区</th>
                <th className="text-left py-3 px-4 text-dark-text3 text-sm font-medium">温度</th>
                <th className="text-left py-3 px-4 text-dark-text3 text-sm font-medium">湿度</th>
                <th className="text-left py-3 px-4 text-dark-text3 text-sm font-medium">氧气</th>
                <th className="text-left py-3 px-4 text-dark-text3 text-sm font-medium">甲烷</th>
                <th className="text-left py-3 px-4 text-dark-text3 text-sm font-medium">硫化氢</th>
                <th className="text-left py-3 px-4 text-dark-text3 text-sm font-medium">状态</th>
                <th className="text-left py-3 px-4 text-dark-text3 text-sm font-medium">采集时间</th>
              </tr>
            </thead>
            <tbody>
              {historyData.slice(0, 50).map((record, idx) => (
                <tr
                  key={record.id}
                  className={`border-b border-dark-border/50 hover:bg-dark-bg3/50 transition-colors ${
                    !record.isNormal ? 'bg-danger/5' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-dark-text text-sm">{record.zoneName}</td>
                  <td className="py-3 px-4 font-mono text-sm">
                    {formatNumber(record.temperature, 1)}°C
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">
                    {formatNumber(record.humidity, 0)}%
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">
                    {formatNumber(record.oxygen, 1)}%
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">
                    {formatNumber(record.methane, 2)}
                  </td>
                  <td className="py-3 px-4 font-mono text-sm">
                    {formatNumber(record.hydrogenSulfide, 2)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        record.isNormal
                          ? 'bg-green-900/30 text-green-400'
                          : 'bg-red-900/30 text-red-400'
                      }`}
                    >
                      {record.isNormal ? '正常' : '超标'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-dark-text3 text-sm font-mono text-xs">
                    {formatDateTime(record.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {historyData.length > 50 && (
          <div className="mt-4 text-center text-dark-text3 text-sm">
            仅显示前 50 条记录，点击导出按钮获取完整数据
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentHistory;
