import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Switch,
  Card,
  Table,
  Tag,
  message,
  Space,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import {
  ArrowLeft,
  MapPin,
  Ruler,
  Layers,
  Maximize2,
  Clock,
  Thermometer,
  Droplets,
  Wind,
  Flame,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import { useZoneStore } from '@/store/useZoneStore';
import { useDeviceStore } from '@/store/useDeviceStore';
import { usePermission } from '@/hooks/usePermission';
import { useRefresh } from '@/hooks/useRefresh';
import { formatDateTime, getStatusBgColor, formatDate } from '@/utils/format';
import type { Zone, Device } from '@/types';
import dayjs from 'dayjs';

const statusMap: Record<string, string> = {
  normal: '正常',
  restricted: '受限',
  suspended: '停用',
};

const ZoneDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getZoneById, toggleAccess, environmentData, refreshEnvironmentData } = useZoneStore();
  const { getDevicesByZone } = useDeviceStore();
  const { isAdmin, isControl } = usePermission();
  const [zone, setZone] = useState<Zone | undefined>();
  const [devices, setDevices] = useState<Device[]>([]);
  const [environmentTrend, setEnvironmentTrend] = useState<any[]>([]);

  const canEdit = isAdmin || isControl;

  const fetchData = useCallback(() => {
    if (id) {
      const zoneData = getZoneById(id);
      setZone(zoneData);
      setDevices(getDevicesByZone(id));
      refreshEnvironmentData();

      const trend = Array.from({ length: 24 }, (_, i) => {
        const time = dayjs().subtract(23 - i, 'hour').format('HH:00');
        return {
          time,
          temperature: 18 + Math.random() * 12,
          humidity: 40 + Math.random() * 40,
          oxygen: 19.5 + Math.random() * 3.5,
        };
      });
      setEnvironmentTrend(trend);
    }
  }, [id, getZoneById, getDevicesByZone, refreshEnvironmentData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRefresh(fetchData, 10000);

  const handleToggleAccess = () => {
    if (id) {
      toggleAccess(id);
      setZone(getZoneById(id));
      message.success('通行权限已更新');
    }
  };

  const env = id ? environmentData[id] : null;

  const getTrendOption = () => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1E293B',
      borderColor: '#475569',
      textStyle: { color: '#F1F5F9' },
    },
    legend: {
      data: ['温度(°C)', '湿度(%)', '氧气(%)'],
      textStyle: { color: '#94A3B8' },
      top: 0,
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
      data: environmentTrend.map((d) => d.time),
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94A3B8', fontSize: 10 },
    },
    yAxis: [
      {
        type: 'value',
        name: '温度/氧气',
        min: 0,
        max: 40,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94A3B8' },
        splitLine: { lineStyle: { color: '#334155' } },
      },
      {
        type: 'value',
        name: '湿度',
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94A3B8' },
        splitLine: { lineStyle: { color: '#334155' } },
      },
    ],
    series: [
      {
        name: '温度(°C)',
        type: 'line',
        smooth: true,
        data: environmentTrend.map((d) => d.temperature.toFixed(1)),
        lineStyle: { color: '#F77F00', width: 2 },
        itemStyle: { color: '#F77F00' },
      },
      {
        name: '湿度(%)',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: environmentTrend.map((d) => d.humidity.toFixed(0)),
        lineStyle: { color: '#3E92CC', width: 2 },
        itemStyle: { color: '#3E92CC' },
      },
      {
        name: '氧气(%)',
        type: 'line',
        smooth: true,
        data: environmentTrend.map((d) => d.oxygen.toFixed(1)),
        lineStyle: { color: '#00A896', width: 2 },
        itemStyle: { color: '#00A896' },
      },
    ],
  });

  const deviceColumns: ColumnsType<Device> = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <span
          className="cursor-pointer text-accent-400 hover:text-accent-300"
          onClick={() => navigate(`/device/detail/${record.id}`)}
        >
          {text}
        </span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'typeLabel',
      key: 'typeLabel',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`px-2 py-0.5 rounded text-xs ${getStatusBgColor(status)}`}>
          {status === 'running' ? '运行中' : status === 'stopped' ? '已停止' : '故障'}
        </span>
      ),
    },
    {
      title: '上次维护',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance',
      render: (date) => formatDate(date),
    },
  ];

  if (!zone) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-dark-text3">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/zone/list')}
        >
          返回列表
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-dark-text">{zone.name}</h1>
            <span className={`px-2 py-1 rounded text-xs ${getStatusBgColor(zone.status)}`}>
              {statusMap[zone.status]}
            </span>
          </div>
          <p className="text-dark-text3 text-sm mt-1">
            最后更新：{formatDateTime(new Date())}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4">分区基本信息</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-dark-text3 text-xs">分区长度</p>
                  <p className="text-lg font-bold text-dark-text">{zone.length}m</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-900/30 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-dark-text3 text-xs">管线类型</p>
                  <p className="text-sm font-medium text-dark-text">
                    {zone.pipelineTypes.join('、')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-900/30 flex items-center justify-center">
                  <Maximize2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-dark-text3 text-xs">断面尺寸</p>
                  <p className="text-lg font-bold text-dark-text">
                    {zone.sectionSize.width}×{zone.sectionSize.height}m
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-dark-text3 text-xs">创建时间</p>
                  <p className="text-sm font-medium text-dark-text">{formatDate(zone.createdAt)}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-dark-bg3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-accent-400" />
                  <span className="text-dark-text">通行权限</span>
                </div>
                <Switch
                  checked={zone.accessEnabled}
                  onChange={handleToggleAccess}
                  disabled={!canEdit}
                  checkedChildren="允许"
                  unCheckedChildren="禁止"
                />
              </div>
            </div>
          </div>

          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4">环境数据趋势</h3>
            <ReactECharts option={getTrendOption()} style={{ height: '300px' }} />
          </div>

          <div className="card-gradient-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-text">该分区下的设备</h3>
              <Button
                type="link"
                size="small"
                onClick={() => navigate('/device/list')}
                className="text-accent-400"
              >
                查看全部
              </Button>
            </div>
            <Table
              columns={deviceColumns}
              dataSource={devices}
              rowKey="id"
              size="small"
              pagination={{
                pageSize: 5,
                showSizeChanger: false,
              }}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4">实时环境数据</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg3/50">
                <div className="flex items-center gap-3">
                  <Thermometer className="w-5 h-5 text-orange-400" />
                  <span className="text-dark-text3">温度</span>
                </div>
                <span className={`text-lg font-bold font-mono ${env?.temperature > 28 ? 'text-danger' : 'text-dark-text'}`}>
                  {env?.temperature.toFixed(1)}°C
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg3/50">
                <div className="flex items-center gap-3">
                  <Droplets className="w-5 h-5 text-blue-400" />
                  <span className="text-dark-text3">湿度</span>
                </div>
                <span className={`text-lg font-bold font-mono ${env?.humidity > 70 ? 'text-danger' : 'text-dark-text'}`}>
                  {env?.humidity.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg3/50">
                <div className="flex items-center gap-3">
                  <Wind className="w-5 h-5 text-green-400" />
                  <span className="text-dark-text3">氧气</span>
                </div>
                <span className={`text-lg font-bold font-mono ${(env?.oxygen || 0) < 19.5 ? 'text-danger' : 'text-dark-text'}`}>
                  {env?.oxygen.toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg3/50">
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 text-red-400" />
                  <span className="text-dark-text3">甲烷</span>
                </div>
                <span className={`text-lg font-bold font-mono ${(env?.methane || 0) >= 1 ? 'text-danger' : 'text-dark-text'}`}>
                  {env?.methane.toFixed(2)}% LEL
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg3/50">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span className="text-dark-text3">硫化氢</span>
                </div>
                <span className={`text-lg font-bold font-mono ${(env?.hydrogenSulfide || 0) >= 5 ? 'text-danger' : 'text-dark-text'}`}>
                  {env?.hydrogenSulfide.toFixed(2)} ppm
                </span>
              </div>
            </div>
          </div>

          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4">设备统计</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg3/50">
                <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-info" />
                  <span className="text-dark-text3">设备总数</span>
                </div>
                <span className="text-lg font-bold font-mono text-dark-text">{devices.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg3/50">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <span className="text-dark-text3">运行中</span>
                </div>
                <span className="text-lg font-bold font-mono text-success">
                  {devices.filter((d) => d.status === 'running').length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg3/50">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-danger flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <span className="text-dark-text3">故障</span>
                </div>
                <span className="text-lg font-bold font-mono text-danger">
                  {devices.filter((d) => d.status === 'fault').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneDetail;
