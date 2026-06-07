import React, { useState } from 'react';
import {
  Bell,
  Clock,
  MapPin,
  Save,
  Settings,
  AlertTriangle,
  Wind,
  Thermometer,
} from 'lucide-react';
import { Card, Form, InputNumber, Switch, Select, Button, Tabs, message, Divider } from 'antd';
import type { TabsProps } from 'antd';

const { Option } = Select;

const RuleConfig: React.FC = () => {
  const [alarmForm] = Form.useForm();
  const [inspectionForm] = Form.useForm();
  const [deviceForm] = Form.useForm();

  const [alarmConfig, setAlarmConfig] = useState({
    enabled: true,
    firstLevelMinutes: 30,
    secondLevelMinutes: 60,
    pushSound: true,
    autoUpgrade: true,
  });

  const [inspectionConfig, setInspectionConfig] = useState({
    autoGenerate: true,
    generateTime: '06:00',
    maxCheckinDeviation: 30,
    overdueSuspendAccess: true,
    photoRequired: true,
  });

  const [environmentConfig, setEnvironmentConfig] = useState({
    tempMax: 40,
    tempMin: 5,
    humidityMax: 85,
    o2Min: 19.5,
    ch4Max: 0.5,
    h2sMax: 10,
    autoVentilation: true,
    autoDrainage: true,
  });

  const handleAlarmSave = () => {
    message.success('告警规则保存成功');
  };

  const handleInspectionSave = () => {
    message.success('巡检规则保存成功');
  };

  const handleEnvironmentSave = () => {
    message.success('环境阈值保存成功');
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'alarm',
      label: (
        <span className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          告警升级规则
        </span>
      ),
      children: (
        <div className="max-w-2xl">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              多级告警升级配置
            </h3>
            <p className="text-dark-text3 text-sm mb-6">
              配置告警未确认时的自动升级策略，确保紧急问题及时处理
            </p>
          </div>

          <Form form={alarmForm} layout="vertical" initialValues={alarmConfig}>
            <div className="card-gradient-border p-5 mb-6">
              <h4 className="text-dark-text font-medium mb-4">基础设置</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-text">启用告警推送</p>
                    <p className="text-dark-text3 text-sm">开启后告警将实时推送给相关人员</p>
                  </div>
                  <Switch
                    checked={alarmConfig.enabled}
                    onChange={(checked) => setAlarmConfig({ ...alarmConfig, enabled: checked })}
                  />
                </div>
                <Divider className="my-2 bg-dark-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-text">自动升级</p>
                    <p className="text-dark-text3 text-sm">超时未确认自动升级到上一级</p>
                  </div>
                  <Switch
                    checked={alarmConfig.autoUpgrade}
                    onChange={(checked) => setAlarmConfig({ ...alarmConfig, autoUpgrade: checked })}
                  />
                </div>
                <Divider className="my-2 bg-dark-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-text">声音提醒</p>
                    <p className="text-dark-text3 text-sm">新告警时播放提示音</p>
                  </div>
                  <Switch
                    checked={alarmConfig.pushSound}
                    onChange={(checked) => setAlarmConfig({ ...alarmConfig, pushSound: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="card-gradient-border p-5 mb-6">
              <h4 className="text-dark-text font-medium mb-4">升级时间配置</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item
                  name="firstLevelMinutes"
                  label={
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-warning" />
                      <span>第一级升级时间（分钟）</span>
                    </div>
                  }
                  extra="一般告警超过该时间未确认，升级到分区组长"
                >
                  <InputNumber
                    min={5}
                    max={120}
                    className="w-full"
                    value={alarmConfig.firstLevelMinutes}
                    onChange={(value) =>
                      setAlarmConfig({ ...alarmConfig, firstLevelMinutes: value || 30 })
                    }
                  />
                </Form.Item>
                <Form.Item
                  name="secondLevelMinutes"
                  label={
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-danger" />
                      <span>第二级升级时间（分钟）</span>
                    </div>
                  }
                  extra="严重告警超过该时间未确认，通知总控中心"
                >
                  <InputNumber
                    min={10}
                    max={240}
                    className="w-full"
                    value={alarmConfig.secondLevelMinutes}
                    onChange={(value) =>
                      setAlarmConfig({ ...alarmConfig, secondLevelMinutes: value || 60 })
                    }
                  />
                </Form.Item>
              </div>
            </div>

            <div className="card-gradient-border p-5 mb-6">
              <h4 className="text-dark-text font-medium mb-4">升级流程说明</h4>
              <div className="flex items-center justify-between px-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-900/50 flex items-center justify-center mx-auto mb-2">
                    <Bell className="w-6 h-6 text-accent-400" />
                  </div>
                  <p className="text-dark-text text-sm font-medium">一般告警</p>
                  <p className="text-dark-text3 text-xs">推送给巡线员</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-accent-400 to-warning" />
                  <span className="px-3 text-dark-text3 text-xs">
                    {alarmConfig.firstLevelMinutes}分钟
                  </span>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-warning to-danger" />
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-900/50 flex items-center justify-center mx-auto mb-2">
                    <Bell className="w-6 h-6 text-warning" />
                  </div>
                  <p className="text-dark-text text-sm font-medium">分区组长</p>
                  <p className="text-dark-text3 text-xs">升级通知</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-warning to-danger" />
                  <span className="px-3 text-dark-text3 text-xs">
                    {alarmConfig.secondLevelMinutes}分钟
                  </span>
                  <div className="h-0.5 flex-1 bg-danger" />
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-2">
                    <Bell className="w-6 h-6 text-danger" />
                  </div>
                  <p className="text-dark-text text-sm font-medium">总控中心</p>
                  <p className="text-dark-text3 text-xs">紧急通知</p>
                </div>
              </div>
            </div>

            <Button
              type="primary"
              icon={<Save className="w-4 h-4" />}
              onClick={handleAlarmSave}
              size="large"
            >
              保存告警规则
            </Button>
          </Form>
        </div>
      ),
    },
    {
      key: 'inspection',
      label: (
        <span className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          巡检管理规则
        </span>
      ),
      children: (
        <div className="max-w-2xl">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-accent-400" />
              巡检任务配置
            </h3>
            <p className="text-dark-text3 text-sm mb-6">
              配置巡检任务自动生成策略和打卡规则
            </p>
          </div>

          <Form form={inspectionForm} layout="vertical" initialValues={inspectionConfig}>
            <div className="card-gradient-border p-5 mb-6">
              <h4 className="text-dark-text font-medium mb-4">任务生成</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-text">自动生成巡检任务</p>
                    <p className="text-dark-text3 text-sm">每日自动按预设路线生成巡检任务</p>
                  </div>
                  <Switch
                    checked={inspectionConfig.autoGenerate}
                    onChange={(checked) =>
                      setInspectionConfig({ ...inspectionConfig, autoGenerate: checked })
                    }
                  />
                </div>
                <Divider className="my-2 bg-dark-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-text">每日生成时间</p>
                    <p className="text-dark-text3 text-sm">设置自动生成巡检任务的时间</p>
                  </div>
                  <Select
                    value={inspectionConfig.generateTime}
                    onChange={(value) =>
                      setInspectionConfig({ ...inspectionConfig, generateTime: value })
                    }
                    style={{ width: 120 }}
                  >
                    <Option value="06:00">06:00</Option>
                    <Option value="07:00">07:00</Option>
                    <Option value="08:00">08:00</Option>
                    <Option value="09:00">09:00</Option>
                  </Select>
                </div>
              </div>
            </div>

            <div className="card-gradient-border p-5 mb-6">
              <h4 className="text-dark-text font-medium mb-4">打卡规则</h4>
              <div className="space-y-4">
                <Form.Item
                  label="打卡允许偏差时间（分钟）"
                  extra="超过该时间未打卡记为迟到"
                  className="mb-0"
                >
                  <InputNumber
                    min={0}
                    max={120}
                    value={inspectionConfig.maxCheckinDeviation}
                    onChange={(value) =>
                      setInspectionConfig({
                        ...inspectionConfig,
                        maxCheckinDeviation: value || 30,
                      })
                    }
                  />
                </Form.Item>
                <Divider className="my-2 bg-dark-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-text">隐患拍照必传</p>
                    <p className="text-dark-text3 text-sm">上报隐患时必须上传照片</p>
                  </div>
                  <Switch
                    checked={inspectionConfig.photoRequired}
                    onChange={(checked) =>
                      setInspectionConfig({ ...inspectionConfig, photoRequired: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="card-gradient-border p-5 mb-6">
              <h4 className="text-dark-text font-medium mb-4">超期处理</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-text">超期未整改暂停通行</p>
                  <p className="text-dark-text3 text-sm">
                    隐患整改超期自动暂停该分区的通行权限
                  </p>
                </div>
                <Switch
                  checked={inspectionConfig.overdueSuspendAccess}
                  onChange={(checked) =>
                    setInspectionConfig({
                      ...inspectionConfig,
                      overdueSuspendAccess: checked,
                    })
                  }
                />
              </div>
            </div>

            <Button
              type="primary"
              icon={<Save className="w-4 h-4" />}
              onClick={handleInspectionSave}
              size="large"
            >
              保存巡检规则
            </Button>
          </Form>
        </div>
      ),
    },
    {
      key: 'environment',
      label: (
        <span className="flex items-center gap-2">
          <Thermometer className="w-4 h-4" />
          环境阈值设置
        </span>
      ),
      children: (
        <div className="max-w-2xl">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-dark-text mb-4 flex items-center gap-2">
              <Wind className="w-5 h-5 text-accent-400" />
              环境监测阈值配置
            </h3>
            <p className="text-dark-text3 text-sm mb-6">
              配置环境参数的正常范围，超过阈值自动触发告警和联动控制
            </p>
          </div>

          <Form form={deviceForm} layout="vertical" initialValues={environmentConfig}>
            <div className="card-gradient-border p-5 mb-6">
              <h4 className="text-dark-text font-medium mb-4">温湿度阈值</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Form.Item label="温度上限（℃）" extra="超过该值启动通风降温">
                  <InputNumber
                    min={0}
                    max={60}
                    value={environmentConfig.tempMax}
                    onChange={(value) =>
                      setEnvironmentConfig({ ...environmentConfig, tempMax: value || 40 })
                    }
                  />
                </Form.Item>
                <Form.Item label="温度下限（℃）" extra="低于该值启动保温措施">
                  <InputNumber
                    min={-20}
                    max={20}
                    value={environmentConfig.tempMin}
                    onChange={(value) =>
                      setEnvironmentConfig({ ...environmentConfig, tempMin: value || 5 })
                    }
                  />
                </Form.Item>
                <Form.Item label="湿度上限（%RH）" extra="超过该值启动除湿通风">
                  <InputNumber
                    min={0}
                    max={100}
                    value={environmentConfig.humidityMax}
                    onChange={(value) =>
                      setEnvironmentConfig({ ...environmentConfig, humidityMax: value || 85 })
                    }
                  />
                </Form.Item>
              </div>
            </div>

            <div className="card-gradient-border p-5 mb-6">
              <h4 className="text-dark-text font-medium mb-4">气体浓度阈值</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Form.Item label="氧气下限（%VOL）" extra="低于该值自动报警">
                  <InputNumber
                    min={0}
                    max={30}
                    step={0.1}
                    value={environmentConfig.o2Min}
                    onChange={(value) =>
                      setEnvironmentConfig({ ...environmentConfig, o2Min: value || 19.5 })
                    }
                  />
                </Form.Item>
                <Form.Item label="甲烷上限（%LEL）" extra="超过该值自动报警">
                  <InputNumber
                    min={0}
                    max={100}
                    step={0.1}
                    value={environmentConfig.ch4Max}
                    onChange={(value) =>
                      setEnvironmentConfig({ ...environmentConfig, ch4Max: value || 0.5 })
                    }
                  />
                </Form.Item>
                <Form.Item label="硫化氢上限（ppm）" extra="超过该值自动报警">
                  <InputNumber
                    min={0}
                    max={100}
                    step={1}
                    value={environmentConfig.h2sMax}
                    onChange={(value) =>
                      setEnvironmentConfig({ ...environmentConfig, h2sMax: value || 10 })
                    }
                  />
                </Form.Item>
              </div>
            </div>

            <div className="card-gradient-border p-5 mb-6">
              <h4 className="text-dark-text font-medium mb-4">联动控制</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-text">自动启动通风</p>
                    <p className="text-dark-text3 text-sm">温湿度或气体超标时自动启动风机</p>
                  </div>
                  <Switch
                    checked={environmentConfig.autoVentilation}
                    onChange={(checked) =>
                      setEnvironmentConfig({
                        ...environmentConfig,
                        autoVentilation: checked,
                      })
                    }
                  />
                </div>
                <Divider className="my-2 bg-dark-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-dark-text">自动启动排水</p>
                    <p className="text-dark-text3 text-sm">水位超标时自动启动水泵</p>
                  </div>
                  <Switch
                    checked={environmentConfig.autoDrainage}
                    onChange={(checked) =>
                      setEnvironmentConfig({
                        ...environmentConfig,
                        autoDrainage: checked,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <Button
              type="primary"
              icon={<Save className="w-4 h-4" />}
              onClick={handleEnvironmentSave}
              size="large"
            >
              保存环境阈值
            </Button>
          </Form>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-text">系统规则配置</h1>
        <p className="text-dark-text3 text-sm mt-1">
          告警、巡检、环境阈值等系统参数配置
        </p>
      </div>

      <div className="card-gradient-border p-2">
        <Tabs
          defaultActiveKey="alarm"
          items={tabItems}
          size="large"
          className="px-4"
        />
      </div>
    </div>
  );
};

export default RuleConfig;
