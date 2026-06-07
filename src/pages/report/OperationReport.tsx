import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Download,
  Calendar,
  MapPin,
  FileText,
  BarChart3,
  PieChart,
  TrendingUp,
} from 'lucide-react';
import { Select, DatePicker, Button, Card, message } from 'antd';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useZoneStore } from '@/store/useZoneStore';
import { useDeviceStore } from '@/store/useDeviceStore';
import { useAlarmStore } from '@/store/useAlarmStore';
import { useWorkOrderStore } from '@/store/useWorkOrderStore';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const OperationReport: React.FC = () => {
  const { zones } = useZoneStore();
  const { devices } = useDeviceStore();
  const { alarms } = useAlarmStore();
  const { workOrders, inspectionTasks } = useWorkOrderStore();
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<any>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const reportData = {
    totalZones: zones.length,
    totalLength: zones.reduce((sum, z) => sum + z.length, 0),
    totalDevices: devices.length,
    runningDevices: devices.filter((d) => d.status === 'running').length,
    faultDevices: devices.filter((d) => d.status === 'fault').length,
    totalAlarms: alarms.length,
    resolvedAlarms: alarms.filter((a) => a.status === 'resolved').length,
    totalWorkOrders: workOrders.length,
    completedWorkOrders: workOrders.filter((w) => w.status === 'completed').length,
    overdueWorkOrders: workOrders.filter((w) => w.isOverdue).length,
    totalInspections: inspectionTasks.length,
    completedInspections: inspectionTasks.filter((t) => t.status === 'completed').length,
  };

  const deviceTypeOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1E293B',
      borderColor: '#475569',
      textStyle: { color: '#F1F5F9' },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#94A3B8' },
    },
    series: [
      {
        name: '设备类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        itemStyle: {
          borderRadius: 8,
          borderColor: '#1E293B',
          borderWidth: 2,
        },
        data: [
          {
            value: devices.filter((d) => d.type === 'lighting').length,
            name: '照明',
            itemStyle: { color: '#3E92CC' },
          },
          {
            value: devices.filter((d) => d.type === 'water_pump').length,
            name: '水泵',
            itemStyle: { color: '#00A896' },
          },
          {
            value: devices.filter((d) => d.type === 'fan').length,
            name: '风机',
            itemStyle: { color: '#F77F00' },
          },
          {
            value: devices.filter((d) => d.type === 'fire').length,
            name: '消防',
            itemStyle: { color: '#D62828' },
          },
        ],
      },
    ],
  };

  const alarmLevelOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1E293B',
      borderColor: '#475569',
      textStyle: { color: '#F1F5F9' },
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#94A3B8' },
    },
    series: [
      {
        name: '告警等级',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        itemStyle: {
          borderRadius: 8,
          borderColor: '#1E293B',
          borderWidth: 2,
        },
        data: [
          {
            value: alarms.filter((a) => a.level === 'normal').length,
            name: '一般',
            itemStyle: { color: '#3E92CC' },
          },
          {
            value: alarms.filter((a) => a.level === 'serious').length,
            name: '严重',
            itemStyle: { color: '#F77F00' },
          },
          {
            value: alarms.filter((a) => a.level === 'urgent').length,
            name: '紧急',
            itemStyle: { color: '#D62828' },
          },
        ],
      },
    ],
  };

  const workOrderTrendOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1E293B',
      borderColor: '#475569',
      textStyle: { color: '#F1F5F9' },
    },
    legend: {
      data: ['创建工单', '完成工单'],
      textStyle: { color: '#94A3B8' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 7 }, (_, i) =>
        dayjs().subtract(6 - i, 'day').format('MM-DD')
      ),
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94A3B8' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94A3B8' },
      splitLine: { lineStyle: { color: '#334155' } },
    },
    series: [
      {
        name: '创建工单',
        type: 'bar',
        data: [3, 5, 2, 7, 4, 6, 3],
        itemStyle: { color: '#3E92CC', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '完成工单',
        type: 'bar',
        data: [2, 4, 3, 5, 3, 5, 4],
        itemStyle: { color: '#00A896', borderRadius: [4, 4, 0, 0] },
      },
    ],
  };

  const handleExportExcel = () => {
    const data = [
      ['管廊运维月度分析报告', '', '', ''],
      ['生成时间', dayjs().format('YYYY-MM-DD HH:mm:ss'), '', ''],
      ['', '', '', ''],
      ['一、管廊概况', '', '', ''],
      ['分区数量', reportData.totalZones, '', ''],
      ['总长度(米)', reportData.totalLength, '', ''],
      ['', '', '', ''],
      ['二、设备概况', '', '', ''],
      ['设备总数', reportData.totalDevices, '', ''],
      ['运行中', reportData.runningDevices, '', ''],
      ['故障数', reportData.faultDevices, '', ''],
      ['', '', '', ''],
      ['三、告警概况', '', '', ''],
      ['告警总数', reportData.totalAlarms, '', ''],
      ['已解除', reportData.resolvedAlarms, '', ''],
      ['', '', '', ''],
      ['四、工单概况', '', '', ''],
      ['工单总数', reportData.totalWorkOrders, '', ''],
      ['已完成', reportData.completedWorkOrders, '', ''],
      ['已超期', reportData.overdueWorkOrders, '', ''],
      ['', '', '', ''],
      ['五、巡检概况', '', '', ''],
      ['巡检任务数', reportData.totalInspections, '', ''],
      ['已完成', reportData.completedInspections, '', ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '运维报告');
    XLSX.writeFile(wb, `管廊运维分析报告_${dayjs().format('YYYYMMDD')}.xlsx`);
    message.success('Excel导出成功');
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#0F172A',
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`管廊运维分析报告_${dayjs().format('YYYYMMDD')}.pdf`);
      message.success('PDF导出成功');
    } catch {
      message.error('PDF导出失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-text">月度运维分析报告</h1>
          <p className="text-dark-text3 text-sm mt-1">管廊运行数据综合分析</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportExcel}
          >
            导出Excel
          </Button>
          <Button
            type="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportPDF}
          >
            导出PDF
          </Button>
        </div>
      </div>

      <div className="card-gradient-border p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-dark-text3" />
            <span className="text-dark-text2 text-sm">分区：</span>
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
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-dark-text3" />
            <span className="text-dark-text2 text-sm">月份：</span>
            <RangePicker
              picker="month"
              value={dateRange}
              onChange={setDateRange}
              className="bg-dark-bg3"
            />
          </div>
        </div>
      </div>

      <div id="report-content">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card-gradient-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-accent-400" />
              </div>
              <span className="text-dark-text2">管廊分区</span>
            </div>
            <p className="text-3xl font-bold font-mono text-dark-text">
              {reportData.totalZones}
            </p>
            <p className="text-dark-text3 text-sm mt-1">
              总长度 {reportData.totalLength.toLocaleString()} 米
            </p>
          </div>
          <div className="card-gradient-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-900/30 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-success" />
              </div>
              <span className="text-dark-text2">设备在线率</span>
            </div>
            <p className="text-3xl font-bold font-mono text-success">
              {reportData.totalDevices > 0
                ? Math.round(
                    (reportData.runningDevices / reportData.totalDevices) * 100
                  )
                : 0}
              %
            </p>
            <p className="text-dark-text3 text-sm mt-1">
              运行中 {reportData.runningDevices} / {reportData.totalDevices} 台
            </p>
          </div>
          <div className="card-gradient-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-900/30 flex items-center justify-center">
                <PieChart className="w-5 h-5 text-accent-400" />
              </div>
              <span className="text-dark-text2">告警处置率</span>
            </div>
            <p className="text-3xl font-bold font-mono text-accent-400">
              {reportData.totalAlarms > 0
                ? Math.round(
                    (reportData.resolvedAlarms / reportData.totalAlarms) * 100
                  )
                : 0}
              %
            </p>
            <p className="text-dark-text3 text-sm mt-1">
              已解除 {reportData.resolvedAlarms} / {reportData.totalAlarms} 条
            </p>
          </div>
          <div className="card-gradient-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-warning" />
              </div>
              <span className="text-dark-text2">工单完成率</span>
            </div>
            <p className="text-3xl font-bold font-mono text-warning">
              {reportData.totalWorkOrders > 0
                ? Math.round(
                    (reportData.completedWorkOrders / reportData.totalWorkOrders) *
                      100
                  )
                : 0}
              %
            </p>
            <p className="text-dark-text3 text-sm mt-1">
              已完成 {reportData.completedWorkOrders} / {reportData.totalWorkOrders} 单
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4">设备类型分布</h3>
            <ReactECharts option={deviceTypeOption} style={{ height: '250px' }} />
          </div>
          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4">告警等级分布</h3>
            <ReactECharts option={alarmLevelOption} style={{ height: '250px' }} />
          </div>
          <div className="card-gradient-border p-5">
            <h3 className="text-lg font-semibold text-dark-text mb-4">近7天工单趋势</h3>
            <ReactECharts option={workOrderTrendOption} style={{ height: '250px' }} />
          </div>
        </div>

        <div className="card-gradient-border p-5">
          <h3 className="text-lg font-semibold text-dark-text mb-4">分区运行详情</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-3 px-4 text-dark-text2 font-medium text-sm">
                    分区名称
                  </th>
                  <th className="text-left py-3 px-4 text-dark-text2 font-medium text-sm">
                    长度(米)
                  </th>
                  <th className="text-left py-3 px-4 text-dark-text2 font-medium text-sm">
                    设备数
                  </th>
                  <th className="text-left py-3 px-4 text-dark-text2 font-medium text-sm">
                    告警数
                  </th>
                  <th className="text-left py-3 px-4 text-dark-text2 font-medium text-sm">
                    工单数
                  </th>
                  <th className="text-left py-3 px-4 text-dark-text2 font-medium text-sm">
                    巡检完成率
                  </th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => {
                  const zoneDevices = devices.filter((d) => d.zoneId === zone.id);
                  const zoneAlarms = alarms.filter((a) => a.zoneId === zone.id);
                  const zoneWorkOrders = workOrders.filter((w) => w.zoneId === zone.id);
                  const zoneTasks = inspectionTasks.filter((t) => t.zoneId === zone.id);
                  const completedTasks = zoneTasks.filter((t) => t.status === 'completed').length;
                  const completionRate =
                    zoneTasks.length > 0
                      ? Math.round((completedTasks / zoneTasks.length) * 100)
                      : 0;

                  return (
                    <tr
                      key={zone.id}
                      className="border-b border-dark-border/50 hover:bg-dark-bg3/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-dark-text">{zone.name}</td>
                      <td className="py-3 px-4 text-dark-text2 font-mono">
                        {zone.length}
                      </td>
                      <td className="py-3 px-4 text-dark-text2 font-mono">
                        {zoneDevices.length}
                      </td>
                      <td className="py-3 px-4 text-dark-text2 font-mono">
                        {zoneAlarms.length}
                      </td>
                      <td className="py-3 px-4 text-dark-text2 font-mono">
                        {zoneWorkOrders.length}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-dark-bg3 rounded-full overflow-hidden max-w-24">
                            <div
                              className="h-full bg-gradient-to-r from-accent-400 to-success rounded-full"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                          <span className="text-dark-text2 text-sm font-mono">
                            {completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationReport;
