export type ReportType = 'daily' | 'weekly' | 'monthly';
export type ReportSortBy = 'time' | 'operatorName' | 'totalItems' | 'productivity';
export type ReportSortOrder = 'asc' | 'desc';
export type ExportFormat = 'csv' | 'pdf';

export interface ReportFilter {
  startDate: Date;
  endDate: Date;
  type: ReportType;
  search?: string;
}

export interface ReportExportFilter extends ReportFilter {
  fileFormat: ExportFormat;
}

export interface ReportDataPoint {
  time: string; // Format depends on type: 'YYYY-MM-DD' for daily, 'YYYY-WW' for weekly, 'YYYY-MM' for monthly
  operatorId: number;
  operatorName: string;
  binningCount: number;
  pickingCount: number;
  totalItems: number;
  productivity: number;
  workdays: number;
  attendanceCount: number;
}

export interface ReportMeta {
  filter: ReportFilter;
  totalOperators: number;
  totalWorkdays: number;
  totalItems: number;
  generatedAt: string;
}

export interface ReportData {
  meta: ReportMeta;
  data: ReportDataPoint[];
}