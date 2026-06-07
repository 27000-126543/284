import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  Camera,
  AlertTriangle,
  MapPin,
  Send,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { Form, Select, Button, Input, Upload as AntUpload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useUserStore } from '@/store/useUserStore';
import dayjs from 'dayjs';
import type { HazardReport } from '@/types';

const { TextArea } = Input;
const { Option } = Select;

const HazardReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const taskId = searchParams.get('taskId');
  const { addHazardReport, inspectionTasks } = useWorkOrderStore();
  const { zones } = useZoneStore();
  const { currentUser } = useUserStore();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const currentTask = inspectionTasks.find((t) => t.id === taskId);

  const beforeUpload = (file: UploadFile) => {
    const isImage = file.type?.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
      return false;
    }
    const isLt10M = file.size! / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB!');
      return false;
    }
    setFileList([...fileList, file]);
    return false;
  };

  const handleRemove = (file: UploadFile) => {
    setFileList(fileList.filter((f) => f.uid !== file.uid));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const newReport: HazardReport = {
        id: `hazard-${Date.now()}`,
        taskId: taskId || '',
        zoneId: values.zoneId,
        zoneName: zones.find((z) => z.id === values.zoneId)?.name,
        reporter: currentUser?.id || '',
        reporterName: currentUser?.realName || '',
        type: values.type,
        typeLabel: values.type === 'leakage' ? '渗漏' : values.type === 'crack' ? '裂缝' : '其他',
        description: values.description,
        photos: fileList.map((f) => f.name || ''),
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        status: 'pending',
        statusLabel: '待整改',
      };

      addHazardReport(newReport);
      message.success('隐患上报成功，已自动生成整改工单');
      navigate('/workorder/list');
    } catch {
      message.warning('请填写完整信息');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark-text">隐患上报</h1>
            <p className="text-dark-text3 text-sm mt-1">记录巡检发现的安全隐患</p>
          </div>
        </div>

        {currentTask && (
          <div className="card-gradient-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-400/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <p className="text-dark-text font-medium">关联巡检任务</p>
                <p className="text-dark-text3 text-sm">
                  {currentTask.routeName} · {currentTask.zoneName}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="card-gradient-border p-6">
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              zoneId: currentTask?.zoneId,
            }}
          >
            <Form.Item
              name="zoneId"
              label="所属分区"
              rules={[{ required: true, message: '请选择分区' }]}
            >
              <Select placeholder="请选择分区" size="large">
                {zones.map((zone) => (
                  <Option key={zone.id} value={zone.id}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {zone.name}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="type"
              label="隐患类型"
              rules={[{ required: true, message: '请选择隐患类型' }]}
            >
              <Select placeholder="请选择隐患类型" size="large">
                <Option value="leakage">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    渗漏
                  </div>
                </Option>
                <Option value="crack">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                    裂缝
                  </div>
                </Option>
                <Option value="other">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    其他
                  </div>
                </Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="隐患描述"
              rules={[{ required: true, message: '请输入隐患描述' }]}
            >
              <TextArea
                rows={5}
                placeholder="请详细描述隐患情况..."
                size="large"
                style={{ backgroundColor: '#334155', borderColor: '#475569', color: '#F1F5F9' }}
              />
            </Form.Item>

            <Form.Item label="现场照片" required>
              <div>
                <div className="grid grid-cols-4 gap-4">
                  {fileList.map((file) => (
                    <div
                      key={file.uid}
                      className="relative aspect-square rounded-lg overflow-hidden bg-dark-bg3"
                    >
                      {file.type?.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file as unknown as File)}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-dark-text3" />
                        </div>
                      )}
                      <button
                        onClick={() => handleRemove(file)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {fileList.length < 9 && (
                    <AntUpload
                      beforeUpload={beforeUpload}
                      showUploadList={false}
                      accept="image/*"
                    >
                      <div className="aspect-square rounded-lg border-2 border-dashed border-dark-border hover:border-accent-400 flex flex-col items-center justify-center cursor-pointer transition-colors bg-dark-bg3/50 hover:bg-dark-bg3">
                        <Camera className="w-8 h-8 text-dark-text3 mb-2" />
                        <span className="text-xs text-dark-text3">拍照/上传</span>
                        <span className="text-xs text-dark-text3">
                          {fileList.length}/9
                        </span>
                      </div>
                    </AntUpload>
                  )}
                </div>
                <p className="text-xs text-dark-text3 mt-2">
                  支持 JPG、PNG 格式，单张不超过 10MB，最多 9 张
                </p>
              </div>
            </Form.Item>

            <div className="flex justify-end gap-3 mt-8">
              <Button size="large" onClick={() => navigate(-1)}>
                取消
              </Button>
              <Button
                type="primary"
                size="large"
                icon={<Send className="w-4 h-4" />}
                loading={submitting}
                onClick={handleSubmit}
              >
                提交上报
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default HazardReportPage;
