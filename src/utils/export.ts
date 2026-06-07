import * as XLSX from 'xlsx';
import { message } from 'antd';

export const exportToCSV = (
  data: Record<string, any>[],
  filename: string,
  columns?: { key: string; title: string }[]
) => {
  if (data.length === 0) {
    message.warning('没有可导出的数据');
    return;
  }

  const headers = columns || Object.keys(data[0]).map((key) => ({ key, title: key }));
  const headerRow = headers.map((h) => h.title).join(',');
  const dataRows = data.map((row) =>
    headers.map((h) => {
      const value = row[h.key];
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  );

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  message.success('CSV导出成功');
};

export const exportToExcel = (
  data: Record<string, any>[],
  filename: string,
  sheetName: string = 'Sheet1'
) => {
  try {
    if (data.length === 0) {
      message.warning('没有可导出的数据');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
    message.success('Excel导出成功');
  } catch (error) {
    console.warn('Excel导出失败，改用CSV导出:', error);
    exportToCSV(data, filename);
  }
};

export const exportAoaToExcel = (
  data: any[][],
  filename: string,
  sheetName: string = 'Sheet1'
) => {
  try {
    if (data.length === 0) {
      message.warning('没有可导出的数据');
      return;
    }
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
    message.success('Excel导出成功');
  } catch (error) {
    console.warn('Excel导出失败，改用CSV导出:', error);
    const csvData = data.slice(1).map((row) => {
      const obj: Record<string, any> = {};
      row.forEach((val, idx) => {
        obj[data[0][idx] || `col${idx}`] = val;
      });
      return obj;
    });
    exportToCSV(csvData, filename);
  }
};
