// DailyLog type
export type DailyLog = {
  id: number;
  logDate: Date;
  binningCount: number;
  pickingCount: number;
  binningSmallType: number;
  binningFloorType: number;
  binningHeavyDutyType: number;
  binningCabinetType: number;
  pickingSmallType: number;
  pickingFloorType: number;
  pickingHeavyDutyType: number;
  pickingCabinetType: number;
  totalItems: number;
  productivity: number; // This will be the percentage (avgProd/TARGET * 100)
  prodItemIncoming: number;
  prodItemOutgoing: number;
  attendance: {
    operatorId: number;
    operatorName: string;
    operatorRole: string;
    operatorSubRole: string;
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
  binningSmallType: number;
  binningFloorType: number;
  binningHeavyDutyType: number;
  binningCabinetType: number;
  pickingSmallType: number;
  pickingFloorType: number;
  pickingHeavyDutyType: number;
  pickingCabinetType: number;
  totalItems: number;
  productivity: number; // This will be the percentage (avgProd/TARGET * 100)
  attendance: {
    operatorId: number;
    operatorName: string;
    operatorRole: string;
    operatorSubRole: string;
  }[];
  workNotes: string;
  createdAt: Date;
  updatedAt: Date;
};