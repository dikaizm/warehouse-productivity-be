export type WorkerPresentResponse = {
  present: number;
  absent: number;
  total: number;
  presentPercentage: number;
  absentPercentage: number;
};

export type TrendItemDataPoint = {
  date: Date;
  binningCount: number;
  pickingCount: number;
  totalItems: number;
  compoundedBinning: number;
  compoundedPicking: number;
  compoundedTotal: number;
};

export type TrendItemResponse = {
  data: TrendItemDataPoint[];
  period: {
    startDate: Date;
    endDate: Date;
  };
  lastUpdated: string;
};

export type WorkerPerformancePoint = {
  operatorId: number;
  operatorName: string;
  value: number; // productivity value
};

export type TimePointPerformance = {
  timePoint: string; // example: 'Jan W1', 'Jan W2', ..., 'Mar W2'
  data: WorkerPerformancePoint[];
};

export type WorkerComparisonDataset = {
  year: number;
  type: 'weekly' | 'monthly';
  metrics: TimePointPerformance[];
};