import React, { useState, useMemo } from 'react';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  Switch,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { useZoneStore } from '@/store/useZoneStore';
import { usePermission } from '@/hooks/usePermission';
import { useNavigate } from 'react-router-dom';
import { getStatusBgColor } from '@/utils/format';
import type { Zone } from '@/types';

const { Option } = Select;

const statusMap: Record<string, string> = {
  normal: '正常',
  restricted: '受限',
  suspended: '停用',
};

const pipelineTypeOptions = ['电力', '通信', '给水', '排水', '燃气', '热力'];

const ZoneList: React.FC = () => {
  const navigate = useNavigate();
  const { zones, addZone, updateZone, deleteZone, toggleAccess } = useZoneStore();
  const { isAdmin, isControl, checkZoneAccess } = usePermission();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [form] = Form.useForm();

  const canEdit = isAdmin || isControl;

  const filteredZones = useMemo(() => {
    return zones.filter((zone) => {
      const matchSearch =
        zone.name.toLowerCase().includes(searchText.toLowerCase());
      const matchStatus = !statusFilter || zone.status === statusFilter;
      const matchPermission = checkZoneAccess(zone.id);
      return matchSearch && matchStatus && matchPermission;
    });
  }, [zones, searchText, statusFilter, checkZoneAccess]);

  const handleAdd = () => {
    setEditingZone(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: Zone) => {
    setEditingZone(record);
    form.setFieldsValue({
      name: record.name,
      length: record.length,
      pipelineTypes: record.pipelineTypes,
      sectionWidth: record.sectionSize.width,
      sectionHeight: record.sectionSize.height,
      status: record.status,
      accessEnabled: record.accessEnabled,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteZone(id);
    message.success('删除成功');
  };

  const handleToggleAccess = (id: string) => {
    toggleAccess(id);
    message.success('通行权限已更新');
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingZone) {
        updateZone({
          ...editingZone,
          name: values.name,
          length: values.length,
          pipelineTypes: values.pipelineTypes,
          sectionSize: {
            width: values.sectionWidth,
            height: values.sectionHeight,
          },
          status: values.status,
          accessEnabled: values.accessEnabled,
        });
        message.success('更新成功');
      } else {
        const newZone: Zone = {
          id: `zone-${Date.now()}`,
          name: values.name,
          length: values.length,
          pipelineTypes: values.pipelineTypes,
          sectionSize: {
            width: values.sectionWidth,
            height: values.sectionHeight,
          },
          status: values.status,
          accessEnabled: values.accessEnabled,
          createdAt: new Date().toISOString().split('T')[0],
        };
        addZone(newZone);
        message.success('添加成功');
      }
      setIsModalOpen(false);
    });
  };

  const columns: ColumnsType<Zone> = [
    {
      title: '分区名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div
          className="flex items-center gap-2 cursor-pointer text-accent-400 hover:text-accent-300"
          onClick={() => navigate(`/zone/detail/${record.id}`)}
        >
          <MapPin className="w-4 h-4" />
          {text}
        </div>
      ),
    },
    {
      title: '长度',
      dataIndex: 'length',
      key: 'length',
      render: (text) => `${text}m`,
    },
    {
      title: '管线类型',
      dataIndex: 'pipelineTypes',
      key: 'pipelineTypes',
      render: (types: string[]) => (
        <Space wrap>
          {types.map((type) => (
            <Tag key={type} color="blue">
              {type}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '断面尺寸',
      key: 'sectionSize',
      render: (_, record) =>
        `${record.sectionSize.width}m × ${record.sectionSize.height}m`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`px-2 py-1 rounded text-xs ${getStatusBgColor(status)}`}>
          {statusMap[status]}
        </span>
      ),
    },
    {
      title: '通行权限',
      dataIndex: 'accessEnabled',
      key: 'accessEnabled',
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          onChange={() => handleToggleAccess(record.id)}
          disabled={!canEdit}
          checkedChildren="允许"
          unCheckedChildren="禁止"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
            disabled={!canEdit}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个分区吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            disabled={!canEdit}
          >
            <Button
            type="link"
            size="small"
            danger
            icon={<Trash2 className="w-4 h-4" />}
            disabled={!canEdit}
          >
            删除
          </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">分区管理</h1>
          <p className="text-dark-text3 text-sm mt-1">
            管理管廊分区信息和通行权限
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => message.info('数据已刷新')}
          >
            刷新
          </Button>
          {canEdit && (
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleAdd}
            >
              新增分区
            </Button>
          )}
        </div>
      </div>

      <div className="card-gradient-border p-5">
        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder="搜索分区名称"
            prefix={<Search className="w-4 h-4 text-dark-text3" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-xs"
            allowClear
          />
          <Select
            placeholder="按状态筛选"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="normal">正常</Option>
            <Option value="restricted">受限</Option>
            <Option value="suspended">停用</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredZones}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </div>

      <Modal
        title={editingZone ? '编辑分区' : '新增分区'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" initialValues={{ accessEnabled: true, status: 'normal' }}>
          <Form.Item
            name="name"
            label="分区名称"
            rules={[{ required: true, message: '请输入分区名称' }]}
          >
            <Input placeholder="请输入分区名称" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="length"
              label="长度(m)"
              rules={[{ required: true, message: '请输入长度' }]}
            >
              <Input type="number" placeholder="请输入长度" />
            </Form.Item>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select>
                <Option value="normal">正常</Option>
                <Option value="restricted">受限</Option>
                <Option value="suspended">停用</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item
            name="pipelineTypes"
            label="管线类型"
            rules={[{ required: true, message: '请选择管线类型' }]}
          >
            <Select mode="multiple" placeholder="请选择管线类型">
              {pipelineTypeOptions.map((type) => (
              <Option key={type} value={type}>
                {type}
              </Option>
            ))}
            </Select>
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="sectionWidth"
              label="断面宽度(m)"
              rules={[{ required: true, message: '请输入断面宽度' }]}
            >
              <Input type="number" step="0.1" placeholder="请输入断面宽度" />
            </Form.Item>
            <Form.Item
              name="sectionHeight"
              label="断面高度(m)"
              rules={[{ required: true, message: '请输入断面高度' }]}
            >
              <Input type="number" step="0.1" placeholder="请输入断面高度" />
            </Form.Item>
          </div>
          <Form.Item
            name="accessEnabled"
            label="通行权限"
            valuePropName="checked"
          >
            <Switch checkedChildren="允许" unCheckedChildren="禁止" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ZoneList;
