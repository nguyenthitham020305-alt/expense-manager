import { useGetDashboardSummary, useGetMonthlySummary } from "@/lib/api-client";

export function useDashboard() {
  const summaryQuery = useGetDashboardSummary();
  const monthlySummaryQuery = useGetMonthlySummary({ months: 6 });

  return {
    summary: summaryQuery.data,
    monthlySummary: monthlySummaryQuery.data,
    isLoading: summaryQuery.isLoading || monthlySummaryQuery.isLoading,
    isError: summaryQuery.isError || monthlySummaryQuery.isError,
    error: summaryQuery.error || monthlySummaryQuery.error,
  };
}
