import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ClipboardList,
  MapPin,
  User,
  Calendar,
  AlertCircle,
  Clock,
  Upload,
  Plus,
  Trash2,
  Image,
  CheckCircle,
  FileText,
  Wrench,
} from 'lucide-react';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { useUserStore } from '@/store/useUserStore';
import {
  formatDateTime,
  getPriorityColor,
  getStatusBgColor,
} from '@/utils/format';
import {
  Button,
  Steps,
  Timeline,
  Form,
  Input,
  InputNumber,
  Table,
  Upload as AntUpload,
  message,
  Card,
} from 'antd';
import type { UploadProps } from 'antd';
import type { WorkOrder, MaterialItem } from '@/types';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

const { Step } = Steps;
const { TextArea } = Input;

const WorkOrderDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { workOrders, completeWorkOrder } = useWorkOrderStore();
  const { currentUser } = useUserStore();
  const [form] = Form.useForm();

  const [materials, setMaterials] = useState<MaterialItem[]>([
    { name: '', quantity: 1, unit: '个' },
  ]);
  const [photos, setPhotos] = useState<string[]>([]);

  const workOrder = useMemo(
    () => workOrders.find((w) => w.id === id),
    [workOrders, id]
  );

  const handleAddMaterial = () => {
    setMaterials([...materials, { name: '', quantity: 1, unit: '个' }]);
  };

  const handleRemoveMaterial = (index: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((_, i) => i !== index));
    }
  };

  const handleMaterialChange = (index: number, field: keyof MaterialItem, value: any) => {
    const newMaterials = [...materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setMaterials(newMaterials);
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos([...photos, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
      return false;
    },
    showUploadList: false,
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    try {
      const validMaterials = materials.filter((m) => m.name.trim() !== '');
      completeWorkOrder(workOrder!.id, photos, validMaterials);
      message.success('工单已完成');
      navigate('/workorder/list');
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getCurrentStep = () => {
    if (!workOrder) return 0;
    const stepMap: Record<string, number> = {
      pending: 0,
      accepted: 1,
      processing: 2,
      completed: 3,
    };
    return stepMap[workOrder.status] || 0;
  };

  const getTimelineItems = () => {
    if (!workOrder) return [];
    const items = [
      {
        color: 'green',
        children: (
          <div>
            <p className="text-dark-text font-medium">工单创建</p>
            <p className="text-xs text-dark-text3">{formatDateTime(workOrder.createdAt)}</p>
            <p className="text-xs text-dark-text3 mt-1">系统自动创建</p>
          </div>
        ),
      },
    ];

    if (workOrder.acceptedAt) {
      items.push({
        color: 'blue',
        children: (
          <div>
            <p className="text-dark-text font-medium">工单已接单</p>
            <p className="text-xs text-dark-text3">{formatDateTime(workOrder.acceptedAt)}</p>
            <p className="text-xs text-dark-text3 mt-1">接单人：{workOrder.assigneeName}</p>
          </div>
        ),
      });
    }

    if (workOrder.status === 'processing' || workOrder.status === 'completed') {
      items.push({
        color: 'orange',
        children: (
          <div>
            <p className="text-dark-text font-medium">处理中</p>
            <p className="text-xs text-dark-text3">正在进行现场处置</p>
          </div>
        ),
      });
    }

    if (workOrder.completedAt) {
      items.push({
        color: 'green',
        children: (
          <div>
            <p className="text-dark-text font-medium">工单已完成</p>
            <p className="text-xs text-dark-text3">{formatDateTime(workOrder.completedAt)}</p>
          </div>
        ),
      });
    }

    return items;
  };

  if (!workOrder) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-dark-text3 opacity-30" />
          <p className="text-dark-text3">工单不存在</p>
          <Button
            type="primary"
            className="mt-4"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/workorder/list')}
          >
            返回列表
          </Button>
        </div>
      </div>
    );
  }

  const columns = [
    {
      title: '材料名称',
      dataIndex: 'name',
      key: 'name',
      render: (_: any, _record: any, index: number) => (
        <Input
          placeholder="请输入材料名称"
          value={materials[index]?.name}
          onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
        />
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (_: any, _record: any, index: number) => (
        <InputNumber
          min={1}
          value={materials[index]?.quantity}
          onChange={(value) => handleMaterialChange(index, 'quantity', value || 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
      width: 120,
      render: (_: any, _record: any, index: number) => (
        <Input
          placeholder="单位"
          value={materials[index]?.unit}
          onChange={(e) => handleMaterialChange(index, 'unit', e.target.value)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, _record: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<Trash2 className="w-4 h-4" />}
          onClick={() => handleRemoveMaterial(index)}
          disabled={materials.length <= 1}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/workorder/list')}
        >
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-dark-text">工单详情</h1>
          <p className="text-dark-text3 text-sm mt-1">
            工单号：<span className="font-mono">{workOrder.id}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-accent-400" />
              工单基本信息
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dark-bg3 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-dark-text3" />
                </div>
                <div>
                  <p className="text-xs text-dark-text3">工单类型</p>
                  <p className="text-dark-text">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        workOrder.type === 'repair'
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-purple-900/30 text-purple-400'
                      }`}
                    >
                      {workOrder.typeLabel}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dark-bg3 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-dark-text3" />
                </div>
                <div>
                  <p className="text-xs text-dark-text3">优先级</p>
                  <p className="text-dark-text">
                    <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(workOrder.priority)}`}>
                      {workOrder.priorityLabel}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dark-bg3 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-dark-text3" />
                </div>
                <div>
                  <p className="text-xs text-dark-text3">所属分区</p>
                  <p className="text-dark-text">{workOrder.zoneName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dark-bg3 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4 text-dark-text3" />
                </div>
                <div>
                  <p className="text-xs text-dark-text3">关联设备</p>
                  <p className="text-dark-text">{workOrder.deviceName || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dark-bg3 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-dark-text3" />
                </div>
                <div>
                  <p className="text-xs text-dark-text3">指派人</p>
                  <p className="text-dark-text">{workOrder.assigneeName || '待指派'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dark-bg3 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-dark-text3" />
                </div>
                <div>
                  <p className="text-xs text-dark-text3">创建时间</p>
                  <p className="text-dark-text">{formatDateTime(workOrder.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-dark-bg3 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-dark-text3" />
                </div>
                <div>
                  <p className="text-xs text-dark-text3">状态</p>
                  <p className="text-dark-text">
                    <span className={`px-2 py-0.5 rounded text-xs ${getStatusBgColor(workOrder.status)}`}>
                      {workOrder.statusLabel}
                    </span>
                    {workOrder.isOverdue && (
                      <span className="ml-2 text-xs text-danger">已超时</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-dark-bg3">
              <p className="text-xs text-dark-text3 mb-1">问题描述</p>
              <p className="text-dark-text">{workOrder.description}</p>
            </div>
          </div>

          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-accent-400" />
              状态流转
            </h3>
            <Steps
              current={getCurrentStep()}
              items={[
                { title: '待接单', icon: <Clock className="w-4 h-4" /> },
                { title: '已接单', icon: <User className="w-4 h-4" /> },
                { title: '处理中', icon: <Wrench className="w-4 h-4" /> },
                { title: '已完成', icon: <CheckCircle className="w-4 h-4" /> },
              ]}
              className="steps-dark"
            />
          </div>

          {workOrder.status !== 'completed' && (
            <>
              <div className="card-gradient-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-dark-text flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent-400" />
                    材料消耗登记
                  </h3>
                  <Button
                    type="dashed"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={handleAddMaterial}
                  >
                    添加材料
                  </Button>
                </div>
                <Table
                  columns={columns}
                  dataSource={materials.map((m, i) => ({ ...m, key: i }))}
                  pagination={false}
                  rowKey="key"
                />
              </div>

              <div className="card-gradient-border p-5">
                <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5 text-accent-400" />
                  修复照片上传
                </h3>
                <div className="flex flex-wrap gap-4">
                  <AntUpload {...uploadProps}>
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-dark-bg3 flex flex-col items-center justify-center cursor-pointer hover:border-accent-400 transition-colors">
                      <Upload className="w-6 h-6 text-dark-text3" />
                      <p className="text-xs text-dark-text3 mt-1">上传照片</p>
                    </div>
                  </AntUpload>
                  {photos.map((photo, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden group">
                      <img
                        src={photo}
                        alt={`修复照片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => handleRemovePhoto(index)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button onClick={() => navigate('/workorder/list')}>
                  取消
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircle className="w-4 h-4" />}
                  onClick={handleComplete}
                >
                  完成工单
                </Button>
              </div>
            </>
          )}

          {workOrder.status === 'completed' && workOrder.materials && (
            <div className="card-gradient-border p-5">
              <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-400" />
                材料消耗记录
              </h3>
              <Table
                columns={[
                  { title: '材料名称', dataIndex: 'name', key: 'name' },
                  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 120 },
                  { title: '单位', dataIndex: 'unit', key: 'unit', width: 120 },
                ]}
                dataSource={workOrder.materials.map((m, i) => ({ ...m, key: i }))}
                pagination={false}
                rowKey="key"
              />
            </div>
          )}

          {workOrder.status === 'completed' && workOrder.repairPhotos && workOrder.repairPhotos.length > 0 && (
            <div className="card-gradient-border p-5">
              <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-accent-400" />
                修复照片
              </h3>
              <div className="flex flex-wrap gap-4">
                {workOrder.repairPhotos.map((photo, index) => (
                  <div key={index} className="w-32 h-32 rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`修复照片 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent-400" />
              处置记录
            </h3>
            <Timeline items={getTimelineItems()} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkOrderDetail;
