import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Filter,
  CheckSquare,
  Square,
  ChevronRight,
  Users,
  UserCheck,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { useAlarmStore } from '@/store/useAlarmStore';
import { usePermission } from '@/hooks/usePermission';
import { useZoneStore } from '@/store/useZoneStore';
import { formatDateTime, getLevelColor, getStatusBgColor } from '@/utils/format';
import { Button, Select, message } from 'antd';
import type { Alarm } from '@/types';

const { Option } = Select;

const AlarmRealtime: React.FC = () => {
  const navigate = useNavigate();
  const { alarms, confirmAlarm } = useAlarmStore();
  const { currentUser, checkZoneAccess } = usePermission();
  const { zones } = useZoneStore();

  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredAlarms = useMemo(() => {
    return alarms.filter((alarm) => {
      if (levelFilter !== 'all' && alarm.level !== levelFilter) return false;
      if (statusFilter !== 'all' && alarm.status !== statusFilter) return false;
      if (zoneFilter !== 'all' && alarm.zoneId !== zoneFilter) return false;
      const matchPermission = checkZoneAccess(alarm.zoneId);
      return matchPermission;
    });
  }, [alarms, levelFilter, statusFilter, zoneFilter, checkZoneAccess]);

  const unconfirmedAlarms = useMemo(
    () => filteredAlarms.filter((a) => a.status === 'unconfirmed'),
    [filteredAlarms]
  );

  const handleConfirm = (id: string) => {
    if (currentUser) {
      confirmAlarm(id, currentUser.id, currentUser.realName);
      message.success('告警已确认');
    }
  };

  const handleBatchConfirm = () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择要确认的告警');
      return;
    }
    if (currentUser) {
      selectedIds.forEach((id) => {
        confirmAlarm(id, currentUser.id, currentUser.realName);
      });
      setSelectedIds([]);
      message.success(`已确认 ${selectedIds.length} 条告警`);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === unconfirmedAlarms.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unconfirmedAlarms.map((a) => a.id));
    }
  };

  const getEscalateIcon = (level: number) => {
    const icons = [Users, UserCheck, Building2];
    const Icon = icons[level] || Users;
    return <Icon className="w-4 h-4" />;
  };

  const getLevelBorderColor = (level: string) => {
    const colorMap: Record<string, string> = {
      normal: 'border-l-blue-500',
      serious: 'border-l-orange-500',
      urgent: 'border-l-red-500',
    };
    return colorMap[level] || 'border-l-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">实时告警</h1>
          <p className="text-dark-text3 text-sm mt-1">
            共 {filteredAlarms.length} 条告警，其中未确认 {unconfirmedAlarms.length} 条
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="primary"
            icon={<CheckCircle className="w-4 h-4" />}
            onClick={handleBatchConfirm}
            disabled={selectedIds.length === 0}
          >
            批量确认 ({selectedIds.length})
          </Button>
        </div>
      </div>

      <div className="card-gradient-border p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-text3" />
            <span className="text-sm text-dark-text3">筛选：</span>
          </div>
          <Select
            value={levelFilter}
            onChange={setLevelFilter}
            style={{ width: 120 }}
            size="middle"
          >
            <Option value="all">全部等级</Option>
            <Option value="normal">一般</Option>
            <Option value="serious">严重</Option>
            <Option value="urgent">紧急</Option>
          </Select>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            size="middle"
          >
            <Option value="all">全部状态</Option>
            <Option value="unconfirmed">未确认</Option>
            <Option value="confirmed">已确认</Option>
            <Option value="resolved">已解除</Option>
          </Select>
          <Select
            value={zoneFilter}
            onChange={setZoneFilter}
            style={{ width: 200 }}
            size="middle"
            showSearch
            placeholder="选择分区"
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

      <div className="space-y-3">
        {unconfirmedAlarms.length > 0 && (
          <div
            className="card-gradient-border p-3 cursor-pointer hover:bg-dark-bg3/50 transition-colors"
            onClick={toggleSelectAll}
          >
            <div className="flex items-center gap-3">
              {selectedIds.length === unconfirmedAlarms.length ? (
                <CheckSquare className="w-5 h-5 text-accent-400" />
              ) : (
                <Square className="w-5 h-5 text-dark-text3" />
              )}
              <span className="text-sm text-dark-text">
                全选未确认告警 ({unconfirmedAlarms.length} 条)
              </span>
            </div>
          </div>
        )}

        {filteredAlarms.length === 0 ? (
          <div className="card-gradient-border p-12 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-dark-text3 opacity-30" />
            <p className="text-dark-text3">暂无告警信息</p>
          </div>
        ) : (
          filteredAlarms.map((alarm, index) => (
            <div
              key={alarm.id}
              className={`card-gradient-border p-4 border-l-4 ${getLevelBorderColor(
                alarm.level
              )} hover:bg-dark-bg3/50 transition-all cursor-pointer animate-fade-in-up`}
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => navigate(`/alarm/detail/${alarm.id}`)}
            >
              <div className="flex items-start gap-4">
                {alarm.status === 'unconfirmed' && (
                  <div
                    className="mt-1 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(alarm.id);
                    }}
                  >
                    {selectedIds.includes(alarm.id) ? (
                      <CheckSquare className="w-5 h-5 text-accent-400" />
                    ) : (
                      <Square className="w-5 h-5 text-dark-text3 hover:text-dark-text2 transition-colors" />
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle
                          className={`w-5 h-5 shrink-0 ${
                            alarm.level === 'urgent'
                              ? 'text-danger animate-pulse'
                              : alarm.level === 'serious'
                              ? 'text-warning'
                              : 'text-info'
                          }`}
                        />
                        <p className="text-dark-text font-medium truncate">
                          {alarm.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs ${getLevelColor(alarm.level)}`}>
                          {alarm.levelLabel}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusBgColor(alarm.status)}`}>
                          {alarm.statusLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-dark-bg3 text-dark-text3">
                          {alarm.zoneName}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-dark-text3">
                          {getEscalateIcon(alarm.escalateLevel)}
                          <span>{alarm.escalateLevelLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-dark-text3">
                          {formatDateTime(alarm.createdAt)}
                        </p>
                        {alarm.confirmedBy && (
                          <p className="text-xs text-dark-text3 mt-1">
                            确认人：{alarm.confirmedBy}
                          </p>
                        )}
                      </div>

                      {alarm.status === 'unconfirmed' && (
                        <Button
                          type="primary"
                          size="small"
                          icon={<CheckCircle className="w-3 h-3" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirm(alarm.id);
                          }}
                        >
                          确认
                        </Button>
                      )}

                      <ChevronRight className="w-5 h-5 text-dark-text3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlarmRealtime;
