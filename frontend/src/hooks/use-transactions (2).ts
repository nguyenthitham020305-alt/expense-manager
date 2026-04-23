import {
  useGetTransactions,
  useCreateTransaction,
  useDeleteTransaction,
  GetTransactionsParams,
} from "@/lib/api-client";

export function useTransactions(params?: GetTransactionsParams) {
  return useGetTransactions(params);
}

export { useCreateTransaction, useDeleteTransaction };
