import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  AlertTriangle,
  Download,
  Filter,
  Calendar,
  BarChart3,
  Table,
} from 'lucide-react';
import { useAlarmStore } from '@/store/useAlarmStore';
import { useZoneStore } from '@/store/useZoneStore';
import { formatDateTime, getLevelColor, getStatusBgColor } from '@/utils/format';
import { Button, Select, DatePicker, Table as AntTable, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Alarm } from '@/types';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AlarmHistory: React.FC = () => {
  const { alarms } = useAlarmStore();
  const { zones } = useZoneStore();

  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const filteredAlarms = useMemo(() => {
    return alarms.filter((alarm) => {
      if (levelFilter !== 'all' && alarm.level !== levelFilter) return false;
      if (statusFilter !== 'all' && alarm.status !== statusFilter) return false;
      if (zoneFilter !== 'all' && alarm.zoneId !== zoneFilter) return false;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const alarmDate = dayjs(alarm.createdAt);
        if (alarmDate.isBefore(dateRange[0]) || alarmDate.isAfter(dateRange[1])) {
          return false;
        }
      }
      return true;
    });
  }, [alarms, levelFilter, statusFilter, zoneFilter, dateRange]);

  const trendData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      return dayjs().subtract(6 - i, 'day').format('MM-DD');
    });

    const normalData = days.map((day) =>
      alarms.filter(
        (a) =>
          a.level === 'normal' && dayjs(a.createdAt).format('MM-DD') === day
      ).length
    );

    const seriousData = days.map((day) =>
      alarms.filter(
        (a) =>
          a.level === 'serious' && dayjs(a.createdAt).format('MM-DD') === day
      ).length
    );

    const urgentData = days.map((day) =>
      alarms.filter(
        (a) =>
          a.level === 'urgent' && dayjs(a.createdAt).format('MM-DD') === day
      ).length
    );

    return { days, normalData, seriousData, urgentData };
  }, [alarms]);

  const getTrendOption = () => ({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1E293B',
      borderColor: '#475569',
      textStyle: { color: '#F1F5F9' },
    },
    legend: {
      data: ['一般', '严重', '紧急'],
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
      data: trendData.days,
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94A3B8' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94A3B8' },
      splitLine: { lineStyle: { color: '#334155' } },
    },
    series: [
      {
        name: '一般',
        type: 'line',
        smooth: true,
        data: trendData.normalData,
        lineStyle: { color: '#3E92CC', width: 2 },
        itemStyle: { color: '#3E92CC' },
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
      },
      {
        name: '严重',
        type: 'line',
        smooth: true,
        data: trendData.seriousData,
        lineStyle: { color: '#F77F00', width: 2 },
        itemStyle: { color: '#F77F00' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(247, 127, 0, 0.3)' },
              { offset: 1, color: 'rgba(247, 127, 0, 0)' },
            ],
          },
        },
      },
      {
        name: '紧急',
        type: 'line',
        smooth: true,
        data: trendData.urgentData,
        lineStyle: { color: '#D62828', width: 2 },
        itemStyle: { color: '#D62828' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(214, 40, 40, 0.3)' },
              { offset: 1, color: 'rgba(214, 40, 40, 0)' },
            ],
          },
        },
      },
    ],
  });

  const columns: ColumnsType<Alarm> = [
    {
      title: '告警ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: '告警内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={`w-4 h-4 shrink-0 ${
              record.level === 'urgent'
                ? 'text-danger'
                : record.level === 'serious'
                ? 'text-warning'
                : 'text-info'
            }`}
          />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (_, record) => (
        <span className={`px-2 py-0.5 rounded text-xs ${getLevelColor(record.level)}`}>
          {record.levelLabel}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <span className={`px-2 py-0.5 rounded text-xs ${getStatusBgColor(record.status)}`}>
          {record.statusLabel}
        </span>
      ),
    },
    {
      title: '所属分区',
      dataIndex: 'zoneName',
      key: 'zoneName',
      width: 180,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => formatDateTime(text),
    },
    {
      title: '确认人',
      dataIndex: 'confirmedBy',
      key: 'confirmedBy',
      width: 100,
      render: (text) => text || '-',
    },
    {
      title: '升级状态',
      dataIndex: 'escalateLevelLabel',
      key: 'escalateLevelLabel',
      width: 100,
    },
  ];

  const handleExport = () => {
    if (filteredAlarms.length === 0) {
      message.warning('没有可导出的数据');
      return;
    }

    const exportData = filteredAlarms.map((alarm) => ({
      告警ID: alarm.id,
      告警内容: alarm.content,
      等级: alarm.levelLabel,
      状态: alarm.statusLabel,
      所属分区: alarm.zoneName,
      创建时间: alarm.createdAt,
      确认人: alarm.confirmedBy || '-',
      确认时间: alarm.confirmedAt || '-',
      升级状态: alarm.escalateLevelLabel,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '告警历史');
    XLSX.writeFile(workbook, `告警历史_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
    message.success('导出成功');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">告警历史</h1>
          <p className="text-dark-text3 text-sm mt-1">
            共 {filteredAlarms.length} 条历史告警记录
          </p>
        </div>
        <Button
          type="primary"
          icon={<Download className="w-4 h-4" />}
          onClick={handleExport}
        >
          导出Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-gradient-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-accent-400" />
            <h3 className="text-lg font-semibold text-dark-text">告警趋势分析</h3>
          </div>
          <ReactECharts option={getTrendOption()} style={{ height: '280px' }} />
        </div>

        <div className="lg:col-span-2 card-gradient-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-accent-400" />
            <h3 className="text-lg font-semibold text-dark-text">筛选条件</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-dark-text3 mb-1 block">告警等级</label>
              <Select
                value={levelFilter}
                onChange={setLevelFilter}
                style={{ width: '100%' }}
                size="middle"
              >
                <Option value="all">全部等级</Option>
                <Option value="normal">一般</Option>
                <Option value="serious">严重</Option>
                <Option value="urgent">紧急</Option>
              </Select>
            </div>
            <div>
              <label className="text-sm text-dark-text3 mb-1 block">处理状态</label>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
                size="middle"
              >
                <Option value="all">全部状态</Option>
                <Option value="unconfirmed">未确认</Option>
                <Option value="confirmed">已确认</Option>
                <Option value="resolved">已解除</Option>
              </Select>
            </div>
            <div>
              <label className="text-sm text-dark-text3 mb-1 block">所属分区</label>
              <Select
                value={zoneFilter}
                onChange={setZoneFilter}
                style={{ width: '100%' }}
                size="middle"
                showSearch
                placeholder="选择分区"
              >
                <Option value="all">全部分区</Option>
                {zones.map((zone) => (
                  <Option key={zone.id} value={zone.id}>
                    {zone.name}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm text-dark-text3 mb-1 block">时间范围</label>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                style={{ width: '100%' }}
                size="middle"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card-gradient-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Table className="w-5 h-5 text-accent-400" />
          <h3 className="text-lg font-semibold text-dark-text">历史告警列表</h3>
        </div>
        <AntTable
          columns={columns}
          dataSource={filteredAlarms}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </div>
    </div>
  );
};

export default AlarmHistory;
