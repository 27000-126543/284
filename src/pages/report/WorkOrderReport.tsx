import React, { useState } from 'react';
import {
  Download,
  Calendar,
  MapPin,
  Filter,
  Search,
} from 'lucide-react';
import { Select, DatePicker, Button, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { useZoneStore } from '@/store/useZoneStore';
import { getStatusBgColor, getPriorityColor, formatDateTime } from '@/utils/format';
import { exportToExcel } from '@/utils/export';
import dayjs from 'dayjs';
import type { WorkOrder } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const WorkOrderReport: React.FC = () => {
  const { workOrders } = useWorkOrderStore();
  const { zones } = useZoneStore();
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  const filteredData = workOrders.filter((wo) => {
    const matchSearch =
      wo.id.toLowerCase().includes(searchText.toLowerCase()) ||
      wo.description.toLowerCase().includes(searchText.toLowerCase());
    const matchType = typeFilter === 'all' || wo.type === typeFilter;
    const matchStatus = statusFilter === 'all' || wo.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || wo.priority === priorityFilter;
    const matchZone = zoneFilter === 'all' || wo.zoneId === zoneFilter;
    return matchSearch && matchType && matchStatus && matchPriority && matchZone;
  });

  const stats = {
    total: workOrders.length,
    repair: workOrders.filter((w) => w.type === 'repair').length,
    rectification: workOrders.filter((w) => w.type === 'rectification').length,
    completed: workOrders.filter((w) => w.status === 'completed').length,
    pending: workOrders.filter((w) => w.status === 'pending').length,
    overdue: workOrders.filter((w) => w.isOverdue).length,
  };

  const columns: ColumnsType<WorkOrder> = [
    {
      title: '工单号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text) => <span className="font-mono text-accent-400">{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (_, record) => (
        <Tag
          className={
            record.type === 'repair'
              ? 'bg-blue-900/30 text-blue-400'
              : 'bg-purple-900/30 text-purple-400'
          }
        >
          {record.typeLabel}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (_, record) => (
        <Tag className={getPriorityColor(record.priority)}>{record.priorityLabel}</Tag>
      ),
    },
    {
      title: '所属分区',
      dataIndex: 'zoneName',
      key: 'zoneName',
      render: (text) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-dark-text3" />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: '关联设备',
      dataIndex: 'deviceName',
      key: 'deviceName',
      render: (text) => text || '-',
    },
    {
      title: '指派人',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => (
        <div className="flex items-center gap-2">
          <Tag className={getStatusBgColor(status)}>{record.statusLabel}</Tag>
          {record.isOverdue && (
            <Tag className="bg-red-900/30 text-red-400 animate-pulse">已超时</Tag>
          )}
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text) => formatDateTime(text),
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      width: 160,
      render: (text) => (text ? formatDateTime(text) : '-'),
    },
  ];

  const handleExport = () => {
    const exportData = filteredData.map((wo) => ({
      工单号: wo.id,
      类型: wo.typeLabel,
      优先级: wo.priorityLabel,
      所属分区: wo.zoneName,
      关联设备: wo.deviceName || '-',
      指派人: wo.assigneeName,
      状态: wo.statusLabel,
      是否超时: wo.isOverdue ? '是' : '否',
      描述: wo.description,
      创建时间: wo.createdAt,
      接单时间: wo.acceptedAt || '-',
      完成时间: wo.completedAt || '-',
    }));

    exportToExcel(exportData, `工单处置明细_${dayjs().format('YYYYMMDD')}`, '工单明细');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">工单处置明细</h1>
          <p className="text-dark-text3 text-sm mt-1">工单数据统计与明细查询</p>
        </div>
        <Button
          type="primary"
          icon={<Download className="w-4 h-4" />}
          onClick={handleExport}
        >
          导出Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="card-gradient-border p-4">
          <p className="text-dark-text3 text-xs mb-1">工单总数</p>
          <p className="text-2xl font-bold font-mono text-dark-text">{stats.total}</p>
        </div>
        <div className="card-gradient-border p-4">
          <p className="text-dark-text3 text-xs mb-1">维修工单</p>
          <p className="text-2xl font-bold font-mono text-accent-400">{stats.repair}</p>
        </div>
        <div className="card-gradient-border p-4">
          <p className="text-dark-text3 text-xs mb-1">整改工单</p>
          <p className="text-2xl font-bold font-mono text-purple-400">
            {stats.rectification}
          </p>
        </div>
        <div className="card-gradient-border p-4">
          <p className="text-dark-text3 text-xs mb-1">已完成</p>
          <p className="text-2xl font-bold font-mono text-success">{stats.completed}</p>
        </div>
        <div className="card-gradient-border p-4">
          <p className="text-dark-text3 text-xs mb-1">待接单</p>
          <p className="text-2xl font-bold font-mono text-warning">{stats.pending}</p>
        </div>
        <div className="card-gradient-border p-4">
          <p className="text-dark-text3 text-xs mb-1">已超时</p>
          <p className="text-2xl font-bold font-mono text-danger">{stats.overdue}</p>
        </div>
      </div>

      <div className="card-gradient-border p-5">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text3" />
            <input
              type="text"
              placeholder="搜索工单号或描述..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-bg3 border border-dark-border rounded-lg text-dark-text placeholder-dark-text3 focus:outline-none focus:border-accent-400 transition-colors"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 120 }}
            className="bg-dark-bg3"
          >
            <Option value="all">全部类型</Option>
            <Option value="repair">维修工单</Option>
            <Option value="rectification">整改工单</Option>
          </Select>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            className="bg-dark-bg3"
          >
            <Option value="all">全部状态</Option>
            <Option value="pending">待接单</Option>
            <Option value="accepted">已接单</Option>
            <Option value="processing">处理中</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            style={{ width: 120 }}
            className="bg-dark-bg3"
          >
            <Option value="all">全部优先级</Option>
            <Option value="normal">一般</Option>
            <Option value="urgent">紧急</Option>
            <Option value="critical">特急</Option>
          </Select>
          <Select
            value={zoneFilter}
            onChange={setZoneFilter}
            style={{ width: 160 }}
            className="bg-dark-bg3"
          >
            <Option value="all">全部分区</Option>
            {zones.map((zone) => (
              <Option key={zone.id} value={zone.id}>
                {zone.name}
              </Option>
            ))}
          </Select>
          <RangePicker
            className="bg-dark-bg3"
            style={{ width: 280 }}
          />
          <Button icon={<Filter className="w-4 h-4" />}>更多筛选</Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </div>
    </div>
  );
};

export default WorkOrderReport;
