import React, { useState } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Shield,
  MapPin,
  User as UserIcon,
} from 'lucide-react';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useUserStore } from '@/store/useUserStore';
import { useZoneStore } from '@/store/useZoneStore';
import type { User } from '@/types';

const { Option } = Select;

const roleLabels: Record<string, string> = {
  inspector: '巡线员',
  team_leader: '分区组长',
  controller: '总控中心',
  admin: '管理员',
};

const roleColors: Record<string, string> = {
  inspector: 'bg-green-900/30 text-green-400',
  team_leader: 'bg-blue-900/30 text-blue-400',
  controller: 'bg-purple-900/30 text-purple-400',
  admin: 'bg-red-900/30 text-red-400',
};

const UserManagement: React.FC = () => {
  const { users, addUser, updateUser, deleteUser } = useUserStore();
  const { zones } = useZoneStore();
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const filteredData = users.filter((user) => {
    const matchSearch =
      user.username.toLowerCase().includes(searchText.toLowerCase()) ||
      user.realName.toLowerCase().includes(searchText.toLowerCase());
    const matchRole = roleFilter === 'all' || user.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    deleteUser(id);
    message.success('删除成功');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        updateUser({
          ...editingUser,
          ...values,
        });
        message.success('更新成功');
      } else {
        addUser({
          ...values,
          id: `U${String(users.length + 1).padStart(3, '0')}`,
          status: true,
          zoneIds: values.zoneIds || [],
        });
        message.success('添加成功');
      }
      setModalVisible(false);
    } catch {
      // 表单验证失败
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text) => <span className="font-mono text-accent-400">{text}</span>,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
            {record.realName.charAt(0)}
          </div>
          <span className="text-dark-text">{text}</span>
        </div>
      ),
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 100,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role) => (
        <Tag className={roleColors[role]}>
          <Shield className="w-3 h-3 inline mr-1" />
          {roleLabels[role]}
        </Tag>
      ),
    },
    {
      title: '负责分区',
      dataIndex: 'assignedZones',
      key: 'assignedZones',
      render: (zoneIds: string[]) => (
        <div className="flex flex-wrap gap-1">
          {zoneIds.length > 0 ? (
            zoneIds.map((zoneId) => {
              const zone = zones.find((z) => z.id === zoneId);
              return zone ? (
                <Tag key={zoneId} className="bg-dark-bg3 text-dark-text2 text-xs">
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {zone.name}
                </Tag>
              ) : null;
            })
          ) : (
            <span className="text-dark-text3">全部</span>
          )}
        </div>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (text) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            type="link"
            size="small"
            icon={<Edit2 className="w-4 h-4" />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<Trash2 className="w-4 h-4" />}>
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">用户管理</h1>
          <p className="text-dark-text3 text-sm mt-1">系统用户账号与权限管理</p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={handleAdd}
        >
          添加用户
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-dark-text">{users.length}</p>
              <p className="text-dark-text3 text-xs">用户总数</p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-900/30 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-green-400">
                {users.filter((u) => u.role === 'inspector').length}
              </p>
              <p className="text-dark-text3 text-xs">巡线员</p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-purple-400">
                {users.filter((u) => u.role === 'control').length}
              </p>
              <p className="text-dark-text3 text-xs">总控中心</p>
            </div>
          </div>
        </div>
        <div className="card-gradient-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-red-400">
                {users.filter((u) => u.role === 'admin').length}
              </p>
              <p className="text-dark-text3 text-xs">管理员</p>
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
              placeholder="搜索用户名或姓名..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-bg3 border border-dark-border rounded-lg text-dark-text placeholder-dark-text3 focus:outline-none focus:border-accent-400 transition-colors"
            />
          </div>
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            style={{ width: 150 }}
            className="bg-dark-bg3"
          >
            <Option value="all">全部角色</Option>
            <Option value="inspector">巡线员</Option>
            <Option value="leader">分区组长</Option>
            <Option value="control">总控中心</Option>
            <Option value="admin">管理员</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </div>

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item
            name="realName"
            label="真实姓名"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="inspector">巡线员</Option>
              <Option value="team_leader">分区组长</Option>
              <Option value="controller">总控中心</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>
          <Form.Item name="zoneIds" label="负责分区">
            <Select mode="multiple" placeholder="选择负责分区（为空表示全部）">
              {zones.map((zone) => (
                <Option key={zone.id} value={zone.id}>
                  {zone.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
