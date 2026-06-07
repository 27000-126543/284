import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  Filter,
  Clock,
  AlertCircle,
  User,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { usePermission } from '@/hooks/usePermission';
import { useZoneStore } from '@/store/useZoneStore';
import {
  formatDateTime,
  getPriorityColor,
  getStatusBgColor,
} from '@/utils/format';
import { Button, Select, Table as AntTable, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { WorkOrder } from '@/types';
import { useNavigate } from 'react-router-dom';

const { Option } = Select;

const WorkOrderList: React.FC = () => {
  const navigate = useNavigate();
  const { workOrders, acceptWorkOrder } = useWorkOrderStore();
  const { currentUser, checkZoneAccess } = usePermission();
  const { zones } = useZoneStore();

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      if (typeFilter !== 'all' && wo.type !== typeFilter) return false;
      if (priorityFilter !== 'all' && wo.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && wo.status !== statusFilter) return false;
      if (zoneFilter !== 'all' && wo.zoneId !== zoneFilter) return false;
      const matchPermission = checkZoneAccess(wo.zoneId);
      return matchPermission;
    });
  }, [workOrders, typeFilter, priorityFilter, statusFilter, zoneFilter, checkZoneAccess]);

  const handleAccept = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUser) {
      acceptWorkOrder(id, currentUser.id, currentUser.realName);
      message.success('接单成功');
    }
  };

  const columns: ColumnsType<WorkOrder> = [
    {
      title: '工单号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: '工单类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (_, record) => (
        <span
          className={`px-2 py-0.5 rounded text-xs ${
            record.type === 'repair'
              ? 'bg-blue-900/30 text-blue-400'
              : 'bg-purple-900/30 text-purple-400'
          }`}
        >
          {record.typeLabel}
        </span>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (_, record) => (
        <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(record.priority)}`}>
          {record.priorityLabel}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <span className={`px-2 py-0.5 rounded text-xs ${getStatusBgColor(record.status)}`}>
            {record.statusLabel}
          </span>
          {record.isOverdue && (
            <Tag color="red" icon={<Clock className="w-3 h-3" />}>
              超时
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: '所属分区',
      dataIndex: 'zoneName',
      key: 'zoneName',
      width: 180,
    },
    {
      title: '指派人',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      width: 100,
      render: (text, record) => (
        <div className="flex items-center gap-1">
          <User className="w-3 h-3 text-dark-text3" />
          <span>{record.status === 'pending' ? '待指派' : text}</span>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text) => formatDateTime(text),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircle className="w-3 h-3" />}
              onClick={(e) => handleAccept(record.id, e)}
            >
              接单
            </Button>
          )}
          <Button
            size="small"
            icon={<Eye className="w-3 h-3" />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/workorder/detail/${record.id}`);
            }}
          >
            详情
          </Button>
        </div>
      ),
    },
  ];

  const stats = useMemo(
    () => ({
      total: workOrders.length,
      pending: workOrders.filter((w) => w.status === 'pending').length,
      processing: workOrders.filter((w) => w.status === 'accepted' || w.status === 'processing').length,
      completed: workOrders.filter((w) => w.status === 'completed').length,
      overdue: workOrders.filter((w) => w.isOverdue).length,
    }),
    [workOrders]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">工单管理</h1>
          <p className="text-dark-text3 text-sm mt-1">
            共 {filteredWorkOrders.length} 条工单记录
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">全部工单</p>
              <p className="text-xl font-bold text-blue-400 font-mono">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">待接单</p>
              <p className="text-xl font-bold text-yellow-400 font-mono">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-900/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">处理中</p>
              <p className="text-xl font-bold text-cyan-400 font-mono">{stats.processing}</p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">已完成</p>
              <p className="text-xl font-bold text-green-400 font-mono">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">已超时</p>
              <p className="text-xl font-bold text-red-400 font-mono">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-gradient-border p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-text3" />
            <span className="text-sm text-dark-text3">筛选：</span>
          </div>
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 120 }}
            size="middle"
          >
            <Option value="all">全部类型</Option>
            <Option value="repair">维修工单</Option>
            <Option value="rectification">整改工单</Option>
          </Select>
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            style={{ width: 120 }}
            size="middle"
          >
            <Option value="all">全部优先级</Option>
            <Option value="normal">一般</Option>
            <Option value="urgent">紧急</Option>
            <Option value="critical">特急</Option>
          </Select>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            size="middle"
          >
            <Option value="all">全部状态</Option>
            <Option value="pending">待接单</Option>
            <Option value="accepted">已接单</Option>
            <Option value="processing">处理中</Option>
            <Option value="completed">已完成</Option>
          </Select>
          <Select
            value={zoneFilter}
            onChange={setZoneFilter}
            style={{ width: 150 }}
            size="middle"
          >
            <Option value="all">全部分区</Option>
            {zones.map((zone) => (
              <Option key={zone.id} value={zone.id}>
                {zone.name}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      <div className="card-gradient-border p-5">
        <AntTable
          columns={columns}
          dataSource={filteredWorkOrders}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1300 }}
          onRow={(record) => ({
            onClick: () => navigate(`/workorder/detail/${record.id}`),
            style: {
              cursor: 'pointer',
              backgroundColor: record.isOverdue ? 'rgba(220, 38, 38, 0.1)' : undefined,
            },
          })}
          rowClassName={(record) =>
            record.isOverdue ? 'bg-red-900/10 hover:bg-red-900/20!' : ''
          }
        />
      </div>
    </div>
  );
};

export default WorkOrderList;
