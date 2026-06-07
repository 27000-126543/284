import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Tag,
  Tabs,
  Table,
  Switch,
  Timeline,
  Space,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeft,
  Cpu,
  Calendar,
  MapPin,
  Wrench,
  Power,
  PowerOff,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { useDeviceStore } from '@/store/useDeviceStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { usePermission } from '@/hooks/usePermission';
import { useRefresh } from '@/hooks/useRefresh';
import { formatDateTime, formatDate, getStatusBgColor, getPriorityColor } from '@/utils/format';
import type { Device, WorkOrder } from '@/types';
import dayjs from 'dayjs';

const typeMap: Record<string, string> = {
  lighting: '照明',
  water_pump: '水泵',
  fan: '风机',
  fire: '消防',
};

const statusMap: Record<string, string> = {
  running: '运行中',
  stopped: '已停止',
  fault: '故障',
};

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { devices, toggleDevice } = useDeviceStore();
  const { zones } = useZoneStore();
  const { workOrders } = useWorkOrderStore();
  const { isAdmin, isControl, isLeader } = usePermission();
  const [device, setDevice] = useState<Device | undefined>();
  const [controlHistory, setControlHistory] = useState<any[]>([]);
  const [runLogs, setRunLogs] = useState<any[]>([]);

  const canControl = isAdmin || isControl || isLeader;

  const fetchData = useCallback(() => {
    if (id) {
      const deviceData = devices.find((d) => d.id === id);
      setDevice(deviceData);

      const logs = Array.from({ length: 10 }, (_, i) => {
        const isStart = i % 2 === 0;
        return {
          id: `log-${i}`,
          type: isStart ? 'start' : 'stop',
          time: dayjs().subtract(i * 2 + Math.random() * 2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          operator: ['张三', '李四', '王五', '系统'][Math.floor(Math.random() * 4)],
          remark: isStart ? '远程启动设备' : '远程停止设备',
        };
      });
      setControlHistory(logs);

      const runLogData = Array.from({ length: 15 }, (_, i) => {
        const types = ['status_change', 'maintenance', 'fault', 'recovery', 'info'];
        const type = types[Math.floor(Math.random() * types.length)];
        return {
          id: `runlog-${i}`,
          type,
          time: dayjs().subtract(i * 8 + Math.random() * 4, 'hour').format('YYYY-MM-DD HH:mm:ss'),
          content: [
            '设备状态变更为运行中',
            '完成例行维护检查',
            '设备故障，温度过高',
            '设备故障已恢复',
            '设备正常运行',
          ][types.indexOf(type)],
          operator: ['张三', '李四', '王五', '系统'][Math.floor(Math.random() * 4)],
        };
      });
      setRunLogs(runLogData);
    }
  }, [id, devices]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRefresh(fetchData, 10000);

  const handleToggle = () => {
    if (device && id) {
      if (!device.isRemoteControllable) {
        message.warning('该设备不支持远程控制');
        return;
      }
      if (device.status === 'fault') {
        message.warning('故障设备无法远程控制');
        return;
      }
      toggleDevice(id);
      const updatedDevice = devices.find((d) => d.id === id);
      setDevice(updatedDevice);
      message.success('设备状态已更新');
    }
  };

  const deviceWorkOrders = workOrders.filter((wo) => wo.deviceId === id);

  const workOrderColumns: ColumnsType<WorkOrder> = [
    {
      title: '工单编号',
      dataIndex: 'id',
      key: 'id',
      render: (text) => <span className="font-mono text-xs">{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'typeLabel',
      key: 'typeLabel',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(priority)}`}>
          {priority === 'normal' ? '一般' : priority === 'urgent' ? '紧急' : '特急'}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`px-2 py-0.5 rounded text-xs ${getStatusBgColor(status)}`}>
          {status === 'pending' ? '待接单' : status === 'accepted' ? '已接单' : status === 'processing' ? '处理中' : '已完成'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => navigate(`/workorder/detail/${record.id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  const getTimelineColor = (type: string) => {
    const colorMap: Record<string, string> = {
      start: 'green',
      stop: 'gray',
      status_change: 'blue',
      maintenance: 'purple',
      fault: 'red',
      recovery: 'green',
      info: 'blue',
    };
    return colorMap[type] || 'blue';
  };

  const getTimelineIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      start: <Power className="w-4 h-4" />,
      stop: <PowerOff className="w-4 h-4" />,
      status_change: <CheckCircle className="w-4 h-4" />,
      maintenance: <Wrench className="w-4 h-4" />,
      fault: <AlertCircle className="w-4 h-4" />,
      recovery: <CheckCircle className="w-4 h-4" />,
      info: <FileText className="w-4 h-4" />,
    };
    return iconMap[type] || <Clock className="w-4 h-4" />;
  };

  if (!device) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-dark-text3">加载中...</div>
      </div>
    );
  }

  const zone = zones.find((z) => z.id === device.zoneId);

  const tabItems = [
    {
      key: 'logs',
      label: '运行日志',
      children: (
        <div className="card-gradient-border p-5">
          <h3 className="text-lg font-semibold text-dark-text mb-4">运行日志时间线</h3>
          <Timeline
            items={runLogs.map((log) => ({
              color: getTimelineColor(log.type),
              dot: getTimelineIcon(log.type),
              children: (
                <div className="pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-dark-text font-medium">{log.content}</span>
                    <span className="text-dark-text3 text-xs">{log.time}</span>
                  </div>
                  <p className="text-dark-text3 text-sm">操作人：{log.operator}</p>
                </div>
              ),
            }))}
          />
        </div>
      ),
    },
    {
      key: 'control',
      label: '控制历史',
      children: (
        <div className="card-gradient-border p-5">
          <h3 className="text-lg font-semibold text-dark-text mb-4">远程控制历史记录</h3>
          <Timeline
            items={controlHistory.map((log) => ({
              color: log.type === 'start' ? 'green' : 'gray',
              dot: log.type === 'start' ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />,
              children: (
                <div className="pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-dark-text font-medium">
                      {log.type === 'start' ? '启动设备' : '停止设备'}
                    </span>
                    <span className="text-dark-text3 text-xs">{log.time}</span>
                  </div>
                  <p className="text-dark-text3 text-sm">操作人：{log.operator}</p>
                  <p className="text-dark-text3 text-xs mt-1">备注：{log.remark}</p>
                </div>
              ),
            }))}
          />
        </div>
      ),
    },
    {
      key: 'workorders',
      label: '关联工单',
      children: (
        <div className="card-gradient-border p-5">
          <h3 className="text-lg font-semibold text-dark-text mb-4">关联工单列表</h3>
          <Table
            columns={workOrderColumns}
            dataSource={deviceWorkOrders}
            rowKey="id"
            pagination={{
              pageSize: 5,
              showSizeChanger: false,
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/device/list')}
        >
          返回列表
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-dark-text">{device.name}</h1>
            <span className={`px-2 py-1 rounded text-xs ${getStatusBgColor(device.status)}`}>
              {statusMap[device.status]}
            </span>
            <Tag color={device.isRemoteControllable ? 'green' : 'default'}>
              {device.isRemoteControllable ? '可远程控制' : '不可远程控制'}
            </Tag>
          </div>
          <p className="text-dark-text3 text-sm mt-1">
            最后更新：{formatDateTime(new Date())}
          </p>
        </div>
        {canControl && (
          <Switch
            checked={device.status === 'running'}
            onChange={handleToggle}
            disabled={!device.isRemoteControllable || device.status === 'fault'}
            checkedChildren="运行"
            unCheckedChildren="停止"
            size="default"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card-gradient-border p-5 mb-6">
            <h3 className="text-lg font-semibold text-dark-text mb-4">设备基本信息</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-dark-text3 text-xs">设备型号</p>
                  <p className="text-sm font-medium text-dark-text">{device.model || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-900/30 flex items-center justify-center">
                  <Tag color="blue" className="m-0">{typeMap[device.type]}</Tag>
                </div>
                <div>
                  <p className="text-dark-text3 text-xs">设备类型</p>
                  <p className="text-sm font-medium text-dark-text">{typeMap[device.type]}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-900/30 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-dark-text3 text-xs">所属分区</p>
                  <p
                    className="text-sm font-medium text-dark-text cursor-pointer text-accent-400 hover:text-accent-300"
                    onClick={() => navigate(`/zone/detail/${device.zoneId}`)}
                  >
                    {zone?.name || device.zoneName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-900/30 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-dark-text3 text-xs">安装日期</p>
                  <p className="text-sm font-medium text-dark-text">
                    {device.installDate ? formatDate(device.installDate) : '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-900/30 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-dark-text3 text-xs">上次维护</p>
                  <p className="text-sm font-medium text-dark-text">
                    {formatDate(device.lastMaintenance)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Tabs items={tabItems} defaultActiveKey="logs" />
        </div>

        <div className="space-y-6">
          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4">设备状态</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg3/50">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    device.status === 'running'
                      ? 'bg-success animate-pulse'
                      : device.status === 'fault'
                      ? 'bg-danger'
                      : 'bg-gray-400'
                  }`} />
                  <span className="text-dark-text3">运行状态</span>
                </div>
                <span className={`font-medium ${
                  device.status === 'running'
                    ? 'text-success'
                    : device.status === 'fault'
                    ? 'text-danger'
                    : 'text-gray-400'
                }`}>
                  {statusMap[device.status]}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg3/50">
                <div className="flex items-center gap-3">
                  <Power className="w-5 h-5 text-green-400" />
                  <span className="text-dark-text3">远程控制</span>
                </div>
                <span className={device.isRemoteControllable ? 'text-success' : 'text-gray-400'}>
                  {device.isRemoteControllable ? '已启用' : '未启用'}
                </span>
              </div>
            </div>
          </div>

          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4">关联统计</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg3/50">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="text-dark-text3">关联工单</span>
                </div>
                <span className="text-lg font-bold font-mono text-dark-text">
                  {deviceWorkOrders.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-dark-bg3/50">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  <span className="text-dark-text3">待处理工单</span>
                </div>
                <span className="text-lg font-bold font-mono text-warning">
                  {deviceWorkOrders.filter((wo) => wo.status !== 'completed').length}
                </span>
              </div>
            </div>
          </div>

          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4">快捷操作</h3>
            <div className="space-y-3">
              <Button
                block
                icon={<Wrench className="w-4 h-4" />}
                onClick={() => message.info('创建维修工单功能开发中')}
              >
                创建维修工单
              </Button>
              <Button
                block
                icon={<Calendar className="w-4 h-4" />}
                onClick={() => message.info('安排维护计划功能开发中')}
              >
                安排维护计划
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetail;
