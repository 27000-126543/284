import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Switch,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Search,
  RefreshCw,
  Cpu,
  Zap,
} from 'lucide-react';
import { useDeviceStore } from '@/store/useDeviceStore';
import { useZoneStore } from '@/store/useZoneStore';
import { usePermission } from '@/hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { getStatusBgColor, formatDate } from '@/utils/format';
import type { Device } from '@/types';

const { Option } = Select;

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

const DeviceList: React.FC = () => {
  const navigate = useNavigate();
  const { devices, toggleDevice } = useDeviceStore();
  const { zones } = useZoneStore();
  const { isAdmin, isControl, isLeader } = usePermission();
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [zoneFilter, setZoneFilter] = useState<string | undefined>();

  const canControl = isAdmin || isControl || isLeader;

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchSearch =
        device.name.toLowerCase().includes(searchText.toLowerCase());
      const matchType = !typeFilter || device.type === typeFilter;
      const matchStatus = !statusFilter || device.status === statusFilter;
      const matchZone = !zoneFilter || device.zoneId === zoneFilter;
      return matchSearch && matchType && matchStatus && matchZone;
    });
  }, [devices, searchText, typeFilter, statusFilter, zoneFilter]);

  const handleToggle = (id: string, isRemoteControllable: boolean, status: string) => {
    if (!isRemoteControllable) {
      message.warning('该设备不支持远程控制');
      return;
    }
    if (status === 'fault') {
      message.warning('故障设备无法远程控制');
      return;
    }
    toggleDevice(id);
    message.success('设备状态已更新');
  };

  const columns: ColumnsType<Device> = [
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div
          className="flex items-center gap-2 cursor-pointer text-accent-400 hover:text-accent-300"
          onClick={() => navigate(`/device/detail/${record.id}`)}
        >
          <Cpu className="w-4 h-4" />
          {text}
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="blue">{typeMap[type]}</Tag>,
    },
    {
      title: '所属分区',
      dataIndex: 'zoneName',
      key: 'zoneName',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`px-2 py-0.5 rounded text-xs ${getStatusBgColor(status)}`}>
          {statusMap[status]}
        </span>
      ),
    },
    {
      title: '是否可远程控制',
      dataIndex: 'isRemoteControllable',
      key: 'isRemoteControllable',
      render: (controllable) => (
        <Tag color={controllable ? 'green' : 'default'}>
          {controllable ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: '远程控制',
      key: 'control',
      render: (_, record) => (
        <Switch
          checked={record.status === 'running'}
          onChange={() => handleToggle(record.id, record.isRemoteControllable, record.status)}
          disabled={!canControl || !record.isRemoteControllable || record.status === 'fault'}
          checkedChildren="运行"
          unCheckedChildren="停止"
        />
      ),
    },
    {
      title: '上次维护时间',
      dataIndex: 'lastMaintenance',
      key: 'lastMaintenance',
      render: (date) => formatDate(date),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">设备管理</h1>
          <p className="text-dark-text3 text-sm mt-1">
            管理管廊内所有设备信息和远程控制
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => message.info('数据已刷新')}
          >
            刷新
          </Button>
        </div>
      </div>

      <div className="card-gradient-border p-5">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <Input
            placeholder="搜索设备名称"
            prefix={<Search className="w-4 h-4 text-dark-text3" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-xs"
            allowClear
          />
          <Select
            placeholder="按设备类型筛选"
            allowClear
            style={{ width: 150 }}
            value={typeFilter}
            onChange={setTypeFilter}
          >
            <Option value="lighting">照明</Option>
            <Option value="water_pump">水泵</Option>
            <Option value="fan">风机</Option>
            <Option value="fire">消防</Option>
          </Select>
          <Select
            placeholder="按状态筛选"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="running">运行中</Option>
            <Option value="stopped">已停止</Option>
            <Option value="fault">故障</Option>
          </Select>
          <Select
            placeholder="按分区筛选"
            allowClear
            style={{ width: 200 }}
            value={zoneFilter}
            onChange={setZoneFilter}
          >
            {zones.map((zone) => (
              <Option key={zone.id} value={zone.id}>
                {zone.name}
              </Option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredDevices}
          rowKey="id"
          rowClassName={(record) =>
            record.status === 'fault' ? 'bg-red-900/10' : ''
          }
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </div>
    </div>
  );
};

export default DeviceList;
