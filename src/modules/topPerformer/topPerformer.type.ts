export type TopPerformer = {
    operatorId: number;
    operatorName: string;
    avgMonthlyProductivity: number;
    avgMonthlyWorkdays: number;
    productivity: {
        avgActual: number;
        target: number;
    }
}