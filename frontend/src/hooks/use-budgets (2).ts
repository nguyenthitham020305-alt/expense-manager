import {
  useGetBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from "@/lib/api-client";

export function useBudgets() {
  return useGetBudgets();
}

export { useCreateBudget, useUpdateBudget, useDeleteBudget };
