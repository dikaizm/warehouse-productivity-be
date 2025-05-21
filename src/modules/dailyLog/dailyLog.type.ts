// DailyLog type
export type DailyLog = {
  id: number;
  logDate: Date;
  binningCount: number;
  pickingCount: number;
  totalItems: number;
  productivity: {
    actual: number;
    target: number;
  };
  attendance: {
    operatorId: number;
    operatorName: string;
    operatorRole: string;
  }[];
};

export type DailyLogResult = {
  logs: DailyLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type DailyLogDetail = {
  id: number;
  logDate: Date;
  binningCount: number;
  pickingCount: number;
  totalItems: number;
  productivity: {
    actual: number;
    target: number;
  };
  attendance: {
    operatorId: number;
    operatorName: string;
    operatorRole: string;
  }[];
  workNotes: string;
  createdAt: Date;
  updatedAt: Date;
};