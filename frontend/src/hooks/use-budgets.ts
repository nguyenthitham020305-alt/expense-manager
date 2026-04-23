import {
  useGetBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useGetCategories,
  useCreateCategory,
  useDeleteCategory,
} from "@/lib/api-client";

export function useBudgets() {
  return useGetBudgets();
}

export function useCategories() {
  return useGetCategories();
}

export { useCreateBudget, useUpdateBudget, useDeleteBudget };
export { useCreateCategory, useDeleteCategory };
