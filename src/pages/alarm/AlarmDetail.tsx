import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  AlertTriangle,
  User,
  MessageSquare,
  ChevronRight,
  Bell,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { Button, Tag, Descriptions, Timeline, Card, Space, message } from 'antd';
import dayjs from 'dayjs';
import { useAlarmStore } from '@/store/useAlarmStore';
import { usePermission } from '@/hooks/usePermission';
import type { Alarm, EscalateLog } from '@/types';

const getLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    normal: 'bg-blue-900/30 text-blue-400',
    serious: 'bg-yellow-900/30 text-yellow-400',
    urgent: 'bg-orange-900/30 text-orange-400',
    critical: 'bg-red-900/30 text-red-400',
  };
  return colors[level] || colors.normal;
};

const getLevelLabel = (level: string) => {
  const labels: Record<string, string> = {
    normal: '一般',
    serious: '严重',
    urgent: '紧急',
    critical: '特急',
  };
  return labels[level] || level;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    unconfirmed: 'bg-red-900/30 text-red-400',
    confirmed: 'bg-yellow-900/30 text-yellow-400',
    processing: 'bg-blue-900/30 text-blue-400',
    resolved: 'bg-green-900/30 text-green-400',
  };
  return colors[status] || colors.unconfirmed;
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    unconfirmed: '未确认',
    confirmed: '已确认',
    processing: '处理中',
    resolved: '已解决',
  };
  return labels[status] || status;
};

const getEscalateLevelLabel = (level: number) => {
  const labels = ['巡线员', '分区组长', '总控中心'];
  return labels[level] || `Level ${level}`;
};

const AlarmDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = usePermission();
  const { alarms, confirmAlarm, resolveAlarm } = useAlarmStore();

  const alarm = alarms.find((a) => a.id === id);

  const handleConfirm = () => {
    if (alarm && currentUser) {
      confirmAlarm(alarm.id, currentUser.id, currentUser.realName);
      message.success('告警已确认');
    }
  };

  const handleResolve = () => {
    if (alarm) {
      resolveAlarm(alarm.id);
      message.success('告警已标记为已解决');
    }
  };

  if (!alarm) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning opacity-50" />
        <p className="text-dark-text3 text-lg">告警不存在</p>
        <Button className="mt-4" onClick={() => navigate('/alarm/realtime')}>
          返回告警列表
        </Button>
      </div>
    );
  }

  const timelineItems = [
    {
      color: 'blue',
      children: (
        <div>
          <p className="text-dark-text font-medium">告警创建</p>
          <p className="text-dark-text3 text-sm">{alarm.createdAt}</p>
          <p className="text-dark-text2 text-xs mt-1">系统自动检测到异常</p>
        </div>
      ),
    },
    ...alarm.escalateLogs.map((log: EscalateLog) => ({
      color: log.level === 2 ? 'red' : log.level === 1 ? 'orange' : 'blue',
      dot: log.level > 0 ? <Shield className="w-4 h-4" /> : undefined,
      children: (
        <div>
          <p className="text-dark-text font-medium flex items-center gap-2">
            升级到 {log.levelLabel}
            {log.level > 0 && (
              <Tag color="orange" className="text-xs">
                自动升级
              </Tag>
            )}
          </p>
          <p className="text-dark-text3 text-sm">{log.time}</p>
          {log.note && <p className="text-dark-text2 text-xs mt-1">{log.note}</p>}
        </div>
      ),
    })),
    alarm.status === 'confirmed' || alarm.status === 'processing' || alarm.status === 'resolved'
      ? {
          color: 'orange',
          children: (
            <div>
              <p className="text-dark-text font-medium">告警已确认</p>
              <p className="text-dark-text3 text-sm">{alarm.confirmedAt || '--'}</p>
              <p className="text-dark-text2 text-xs mt-1">当班人员已确认告警</p>
            </div>
          ),
        }
      : null,
    alarm.status === 'resolved'
      ? {
          color: 'green',
          children: (
            <div>
              <p className="text-dark-text font-medium">告警已解决</p>
              <p className="text-dark-text3 text-sm">{alarm.resolvedAt || '--'}</p>
              <p className="text-dark-text2 text-xs mt-1">问题已修复，告警关闭</p>
            </div>
          ),
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/alarm/realtime')}
        >
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-dark-text flex items-center gap-3">
            告警详情
            <span className="text-base font-normal">
              <Tag className={getLevelColor(alarm.level)}>{getLevelLabel(alarm.level)}</Tag>
            </span>
            <span className="text-base font-normal">
              <Tag className={getStatusColor(alarm.status)}>{getStatusLabel(alarm.status)}</Tag>
            </span>
          </h1>
          <p className="text-dark-text3 text-sm mt-1">告警编号：{alarm.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-gradient-border">
            <Descriptions title="基本信息" column={2} bordered size="small">
              <Descriptions.Item label="告警标题">{alarm.title || alarm.content}</Descriptions.Item>
              <Descriptions.Item label="告警类型">{alarm.typeLabel || alarm.type}</Descriptions.Item>
              <Descriptions.Item label="所属分区">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-dark-text3" />
                  {alarm.zoneName}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="当前升级级别">
                <div className="flex items-center gap-2">
                  <Bell className="w-3 h-3 text-warning" />
                  <span className="font-mono">
                    Lv.{alarm.escalateLevel} - {getEscalateLevelLabel(alarm.escalateLevel)}
                  </span>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-dark-text3" />
                  {alarm.createdAt}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="持续时间">
                {dayjs().diff(dayjs(alarm.createdAt), 'minute')} 分钟
              </Descriptions.Item>
              <Descriptions.Item label="告警描述" span={2}>
                {alarm.description || alarm.content}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card className="card-gradient-border" title="处理记录">
            <div className="flex gap-4 mb-6">
              {alarm.status === 'unconfirmed' && (
                <Button type="primary" onClick={handleConfirm}>
                  确认告警
                </Button>
              )}
              {(alarm.status === 'confirmed' || alarm.status === 'processing') && (
                <Button type="primary" onClick={handleResolve}>
                  标记已解决
                </Button>
              )}
              <Button>生成工单</Button>
            </div>

            {alarm.escalateLogs.length > 0 && (
              <div className="mb-6">
                <h4 className="text-dark-text font-medium mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-warning" />
                  升级历史
                </h4>
                <div className="space-y-2">
                  {alarm.escalateLogs.map((log: EscalateLog, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 bg-dark-bg3 rounded-lg border border-dark-border"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          log.level === 2
                            ? 'bg-red-900/50 text-red-400'
                            : log.level === 1
                            ? 'bg-orange-900/50 text-orange-400'
                            : 'bg-blue-900/50 text-blue-400'
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-dark-text font-medium">
                            升级到 {log.levelLabel}
                          </span>
                          <Tag color={log.level === 2 ? 'red' : log.level === 1 ? 'orange' : 'blue'}>
                            Lv.{log.level}
                          </Tag>
                        </div>
                        <p className="text-dark-text3 text-sm">{log.time}</p>
                        {log.note && <p className="text-dark-text2 text-xs mt-1">{log.note}</p>}
                      </div>
                      {log.level > 0 && (
                        <Tag color="warning" icon={<Bell className="w-3 h-3" />}>
                          自动升级
                        </Tag>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h4 className="text-dark-text font-medium mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-dark-text3" />
              时间线
            </h4>
            <Timeline items={timelineItems} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="card-gradient-border" title="升级规则">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-dark-bg3 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center">
                  <span className="text-blue-400 text-xs font-bold">L0</span>
                </div>
                <div className="flex-1">
                  <p className="text-dark-text font-medium">巡线员</p>
                  <p className="text-dark-text3 text-xs">告警创建时自动推送</p>
                </div>
                {alarm.escalateLevel >= 0 && (
                  <CheckCircle className="w-5 h-5 text-success" />
                )}
              </div>
              <div className="flex items-center gap-3 p-3 bg-dark-bg3 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-orange-900/50 flex items-center justify-center">
                  <span className="text-orange-400 text-xs font-bold">L1</span>
                </div>
                <div className="flex-1">
                  <p className="text-dark-text font-medium">分区组长</p>
                  <p className="text-dark-text3 text-xs">30分钟未确认自动升级</p>
                </div>
                {alarm.escalateLevel >= 1 && (
                  <CheckCircle className="w-5 h-5 text-success" />
                )}
              </div>
              <div className="flex items-center gap-3 p-3 bg-dark-bg3 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-red-900/50 flex items-center justify-center">
                  <span className="text-red-400 text-xs font-bold">L2</span>
                </div>
                <div className="flex-1">
                  <p className="text-dark-text font-medium">总控中心</p>
                  <p className="text-dark-text3 text-xs">1小时未确认自动升级</p>
                </div>
                {alarm.escalateLevel >= 2 && (
                  <CheckCircle className="w-5 h-5 text-success" />
                )}
              </div>
            </div>
          </Card>

          <Card className="card-gradient-border" title="相关设备">
            {alarm.deviceId ? (
              <div
                className="flex items-center gap-3 p-3 bg-dark-bg3 rounded-lg cursor-pointer hover:bg-dark-bg2 transition-colors"
                onClick={() => navigate(`/device/detail/${alarm.deviceId}`)}
              >
                <div className="flex-1">
                  <p className="text-dark-text font-medium">{alarm.deviceName || '关联设备'}</p>
                  <p className="text-dark-text3 text-xs font-mono">{alarm.deviceId}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-dark-text3" />
              </div>
            ) : (
              <p className="text-dark-text3 text-sm text-center py-4">暂无关联设备</p>
            )}
          </Card>

          <Card className="card-gradient-border" title="通知人员">
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-bg3">
                <div className="w-8 h-8 rounded-full bg-accent-400/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-accent-400" />
                </div>
                <div className="flex-1">
                  <p className="text-dark-text text-sm">张三</p>
                  <p className="text-dark-text3 text-xs">巡线员</p>
                </div>
                <Tag color="blue">已通知</Tag>
              </div>
              {alarm.escalateLevel >= 1 && (
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-bg3">
                  <div className="w-8 h-8 rounded-full bg-orange-400/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-dark-text text-sm">李组长</p>
                    <p className="text-dark-text3 text-xs">分区组长</p>
                  </div>
                  <Tag color="orange">已通知</Tag>
                </div>
              )}
              {alarm.escalateLevel >= 2 && (
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-bg3">
                  <div className="w-8 h-8 rounded-full bg-red-400/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-dark-text text-sm">王主任</p>
                    <p className="text-dark-text3 text-xs">总控中心</p>
                  </div>
                  <Tag color="red">已通知</Tag>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AlarmDetail;
