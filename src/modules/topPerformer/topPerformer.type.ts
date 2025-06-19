export type TopPerformer = {
    operatorId: number;
    operatorName: string;
    currentMonthWorkdays: number;
    currentMonthItems: {
        actual: number;
        target: number;
    },
    operatorSubRole: {
        name: string;
        teamCategory: string;
    },
}