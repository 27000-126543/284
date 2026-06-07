import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  QrCode,
  Plus,
  Search,
  Filter,
  Route,
  ClipboardList,
} from 'lucide-react';
import { Table, Select, DatePicker, Button, Tag, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { useZoneStore } from '@/store/useZoneStore';
import { usePermission } from '@/hooks/usePermission';
import { getStatusBgColor } from '@/utils/format';
import type { InspectionTask } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const InspectionTasks: React.FC = () => {
  const navigate = useNavigate();
  const { inspectionTasks, updateInspectionTask } = useWorkOrderStore();
  const { zones } = useZoneStore();
  const { currentUser, isInspector } = usePermission();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<InspectionTask | null>(null);

  const filteredTasks = inspectionTasks.filter((task) => {
    const matchSearch =
      task.id.toLowerCase().includes(searchText.toLowerCase()) ||
      task.routeName?.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchZone = zoneFilter === 'all' || task.zoneId === zoneFilter;
    return matchSearch && matchStatus && matchZone;
  });

  const handleStartTask = (task: InspectionTask) => {
    if (task.status === 'pending') {
      updateInspectionTask({
        ...task,
        status: 'in_progress',
        statusLabel: '进行中',
        startTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      });
      message.success('巡检任务已开始');
    }
  };

  const handleCheckpoint = (task: InspectionTask) => {
    setSelectedTask(task);
    setShowQrModal(true);
  };

  const handleScanCode = () => {
    if (!selectedTask) return;
    const uncheckedIdx = selectedTask.checkpoints.findIndex((cp) => !cp.checked);
    if (uncheckedIdx !== -1) {
      const newCheckpoints = [...selectedTask.checkpoints];
      newCheckpoints[uncheckedIdx] = {
        ...newCheckpoints[uncheckedIdx],
        checked: true,
        checkedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      };

      const allChecked = newCheckpoints.every((cp) => cp.checked);
      updateInspectionTask({
        ...selectedTask,
        checkpoints: newCheckpoints,
        status: allChecked ? 'completed' : 'in_progress',
        statusLabel: allChecked ? '已完成' : '进行中',
        endTime: allChecked ? dayjs().format('YYYY-MM-DD HH:mm:ss') : undefined,
      });
      message.success('打卡成功');
      setShowQrModal(false);
    } else {
      message.info('所有巡检点已完成打卡');
    }
  };

  const columns: ColumnsType<InspectionTask> = [
    {
      title: '任务编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text) => <span className="font-mono text-accent-400">{text}</span>,
    },
    {
      title: '巡检路线',
      dataIndex: 'routeName',
      key: 'routeName',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Route className="w-4 h-4 text-dark-text3" />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: '所属分区',
      dataIndex: 'zoneName',
      key: 'zoneName',
      render: (text) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-dark-text3" />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: '巡检员',
      dataIndex: 'inspectorName',
      key: 'inspectorName',
      render: (text) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-dark-text3" />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: '巡检日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (text) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-dark-text3" />
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: '打卡进度',
      key: 'progress',
      width: 140,
      render: (_, record) => {
        const checked = record.checkpoints.filter((cp) => cp.checked).length;
        const total = record.checkpoints.length;
        const percent = Math.round((checked / total) * 100);
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-dark-bg3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-400 to-success rounded-full transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-xs text-dark-text2 font-mono">
              {checked}/{total}
            </span>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => (
        <Tag className={getStatusBgColor(status)}>{record.statusLabel}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          {record.status === 'pending' &&
            (isInspector || currentUser?.role !== 'inspector') && (
              <Button
                type="primary"
                size="small"
                icon={<Play className="w-3 h-3" />}
                onClick={() => handleStartTask(record)}
              >
                开始
              </Button>
            )}
          {(record.status === 'in_progress' || record.status === 'pending') && (
            <Button
              size="small"
              icon={<QrCode className="w-3 h-3" />}
              onClick={() => handleCheckpoint(record)}
            >
              打卡
            </Button>
          )}
          <Button
            size="small"
            type="link"
            onClick={() => navigate(`/inspection/report?taskId=${record.id}`)}
          >
            上报隐患
          </Button>
        </div>
      ),
    },
  ];

  const stats = {
    total: inspectionTasks.length,
    pending: inspectionTasks.filter((t) => t.status === 'pending').length,
    inProgress: inspectionTasks.filter((t) => t.status === 'in_progress').length,
    completed: inspectionTasks.filter((t) => t.status === 'completed').length,
    overdue: inspectionTasks.filter((t) => t.status === 'overdue').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">巡检任务</h1>
          <p className="text-dark-text3 text-sm mt-1">管理和执行巡检任务</p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => message.info('功能开发中')}
        >
          生成任务
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">全部任务</p>
              <p className="text-xl font-bold text-info font-mono">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">待执行</p>
              <p className="text-xl font-bold text-warning font-mono">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-900/30 flex items-center justify-center">
              <Play className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">进行中</p>
              <p className="text-xl font-bold text-accent-400 font-mono">
                {stats.inProgress}
              </p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">已完成</p>
              <p className="text-xl font-bold text-success font-mono">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <p className="text-dark-text3 text-xs">已超期</p>
              <p className="text-xl font-bold text-danger font-mono">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-gradient-border p-5">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text3" />
            <input
              type="text"
              placeholder="搜索任务编号或路线名称..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-bg3 border border-dark-border rounded-lg text-dark-text placeholder-dark-text3 focus:outline-none focus:border-accent-400 transition-colors"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 140 }}
            className="bg-dark-bg3"
          >
            <Option value="all">全部状态</Option>
            <Option value="pending">待执行</Option>
            <Option value="in_progress">进行中</Option>
            <Option value="completed">已完成</Option>
            <Option value="overdue">已超期</Option>
          </Select>
          <Select
            value={zoneFilter}
            onChange={setZoneFilter}
            style={{ width: 180 }}
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
            onChange={() => {}}
          />
          <Button icon={<Filter className="w-4 h-4" />}>更多筛选</Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredTasks}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
        />
      </div>

      <Modal
        title="扫码打卡"
        open={showQrModal}
        onCancel={() => setShowQrModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowQrModal(false)}>
            取消
          </Button>,
          <Button key="confirm" type="primary" onClick={handleScanCode}>
            模拟扫码
          </Button>,
        ]}
      >
        {selectedTask && (
          <div className="text-center py-4">
            <div className="w-48 h-48 mx-auto bg-white rounded-xl p-4 mb-4">
              <div className="w-full h-full bg-dark-bg2 rounded flex items-center justify-center">
                <QrCode className="w-32 h-32 text-dark-text" />
              </div>
            </div>
            <p className="text-dark-text mb-2">{selectedTask.routeName}</p>
            <p className="text-dark-text3 text-sm">
              当前进度：
              {selectedTask.checkpoints.filter((cp) => cp.checked).length}/
              {selectedTask.checkpoints.length}
            </p>
            <div className="mt-4 space-y-2">
              {selectedTask.checkpoints.map((cp, idx) => (
                <div
                  key={cp.id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    cp.checked ? 'bg-green-900/20' : 'bg-dark-bg3'
                  }`}
                >
                  <span className={cp.checked ? 'text-success' : 'text-dark-text2'}>
                    {idx + 1}. {cp.name}
                  </span>
                  {cp.checked && <CheckCircle className="w-4 h-4 text-success" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InspectionTasks;
