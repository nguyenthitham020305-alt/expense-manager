import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// -----------------------------------------------------------------------------
// Types & Schemas
// -----------------------------------------------------------------------------

export interface HealthStatus {
  status: string;
}

export interface BudgetAlert {
  budgetId: number;
  budgetName: string;
  allocated: number;
  spent: number;
  percentage: number;
  isOverBudget: boolean;
}

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  budgetAlerts: BudgetAlert[];
  totalSavings: number;
}

export interface Budget {
  id: number;
  name: string;
  category: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  color: string;
  month: number;
  year: number;
  createdAt: string;
}

export interface CreateBudgetInput {
  name: string;
  category: string;
  allocatedAmount: number;
  color?: string;
  month: number;
  year: number;
}

export interface UpdateBudgetInput {
  name?: string;
  category?: string;
  allocatedAmount?: number;
  color?: string;
}

export type TransactionType = "income" | "expense";

export const TransactionTypeEnum = {
  income: "income",
  expense: "expense",
} as const;

export interface Transaction {
  id: number;
  budgetId?: number;
  budgetName?: string;
  categoryName?: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface CreateTransactionInput {
  budgetId?: number;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
}

export interface SavingsAccount {
  id: number;
  name: string;
  balance: number;
  targetAmount?: number;
  description?: string;
  createdAt: string;
}

export interface CreateSavingsAccountInput {
  name: string;
  balance: number;
  targetAmount?: number;
  description?: string;
}

export interface UpdateSavingsAccountInput {
  name?: string;
  balance?: number;
  targetAmount?: number;
  description?: string;
}

export interface MonthlySummaryItem {
  month: string;
  income: number;
  expense: number;
}

export type GetTransactionsParams = {
  month?: number;
  year?: number;
  budgetId?: number;
  type?: TransactionType;
};

export type GetMonthlySummaryParams = {
  months?: number;
};

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  color: string;
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
  icon?: string;
  color?: string;
}

// -----------------------------------------------------------------------------
// HTTP helper
// -----------------------------------------------------------------------------

const API_BASE = "/api";

async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// -----------------------------------------------------------------------------
// React Query Keys
// -----------------------------------------------------------------------------

export const getGetDashboardSummaryQueryKey = () => ["dashboardSummary"];
export const getGetBudgetsQueryKey = () => ["budgets"];
export const getGetTransactionsQueryKey = (params?: GetTransactionsParams) => [
  "transactions",
  params,
];
export const getGetSavingsAccountsQueryKey = () => ["savingsAccounts"];
export const getGetCategoriesQueryKey = () => ["categories"];
export const getGetMonthlySummaryQueryKey = (
  params?: GetMonthlySummaryParams,
) => ["monthlySummary", params];

// -----------------------------------------------------------------------------
// React Query Hooks
// -----------------------------------------------------------------------------

export function useGetDashboardSummary() {
  return useQuery({
    queryKey: getGetDashboardSummaryQueryKey(),
    queryFn: () => api<DashboardSummary>("/dashboard/summary"),
  });
}

export function useGetCategories() {
  return useQuery({
    queryKey: getGetCategoriesQueryKey(),
    queryFn: () => api<Category[]>("/categories"),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: CreateCategoryInput }) =>
      api<Category>("/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      api<void>(`/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetCategoriesQueryKey() });
    },
  });
}

export function useGetBudgets() {
  return useQuery({
    queryKey: getGetBudgetsQueryKey(),
    queryFn: () => api<Budget[]>("/budgets"),
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: CreateBudgetInput }) =>
      api<Budget>("/budgets", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetBudgetsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getGetDashboardSummaryQueryKey(),
      });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBudgetInput }) =>
      api<Budget>(`/budgets/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetBudgetsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getGetDashboardSummaryQueryKey(),
      });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      api<void>(`/budgets/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetBudgetsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getGetDashboardSummaryQueryKey(),
      });
    },
  });
}

export function useGetTransactions(params?: GetTransactionsParams) {
  return useQuery({
    queryKey: getGetTransactionsQueryKey(params),
    queryFn: () => {
      const qs = new URLSearchParams();
      if (params?.month) qs.set("month", String(params.month));
      if (params?.year) qs.set("year", String(params.year));
      if (params?.budgetId) qs.set("budgetId", String(params.budgetId));
      if (params?.type) qs.set("type", params.type);
      const query = qs.toString();
      return api<Transaction[]>(`/transactions${query ? `?${query}` : ""}`);
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: CreateTransactionInput }) =>
      api<Transaction>("/transactions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getGetDashboardSummaryQueryKey(),
      });
      queryClient.invalidateQueries({ queryKey: getGetBudgetsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getGetMonthlySummaryQueryKey(),
      });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number }) =>
      api<void>(`/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getGetDashboardSummaryQueryKey(),
      });
      queryClient.invalidateQueries({ queryKey: getGetBudgetsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getGetMonthlySummaryQueryKey(),
      });
    },
  });
}

export function useGetSavingsAccounts() {
  return useQuery({
    queryKey: getGetSavingsAccountsQueryKey(),
    queryFn: () => api<SavingsAccount[]>("/savings"),
  });
}

export function useCreateSavingsAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data }: { data: CreateSavingsAccountInput }) =>
      api<SavingsAccount>("/savings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getGetSavingsAccountsQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getGetDashboardSummaryQueryKey(),
      });
    },
  });
}

export function useUpdateSavingsAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateSavingsAccountInput;
    }) =>
      api<SavingsAccount>(`/savings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getGetSavingsAccountsQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getGetDashboardSummaryQueryKey(),
      });
    },
  });
}

export interface TransferToSavingsInput {
  amount: number;
}

export interface TransferToSavingsResult {
  savingsAccount: SavingsAccount;
  transaction: Transaction;
}

export function useTransferToSavings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransferToSavingsInput }) =>
      api<TransferToSavingsResult>(`/savings/${id}/transfer`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetSavingsAccountsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMonthlySummaryQueryKey() });
    },
  });
}

export function useWithdrawFromSavings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransferToSavingsInput }) =>
      api<TransferToSavingsResult>(`/savings/${id}/withdraw`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetSavingsAccountsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMonthlySummaryQueryKey() });
    },
  });
}

export function useGetMonthlySummary(params?: GetMonthlySummaryParams) {
  return useQuery({
    queryKey: getGetMonthlySummaryQueryKey(params),
    queryFn: () => {
      const qs = params?.months ? `?months=${params.months}` : "";
      return api<MonthlySummaryItem[]>(`/dashboard/monthly-summary${qs}`);
    },
  });
}
