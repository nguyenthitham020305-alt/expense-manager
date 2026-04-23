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

// -----------------------------------------------------------------------------
// Mock Data Store (In-Memory + LocalStorage persistence)
// -----------------------------------------------------------------------------

const STORAGE_KEY = "money_keeper_mock_data";

interface MockData {
  budgets: Budget[];
  transactions: Transaction[];
  savingsAccounts: SavingsAccount[];
}

const currentMonth = new Date().getMonth() + 1;
const currentYear = new Date().getFullYear();

const defaultData: MockData = {
  budgets: [
    {
      id: 1,
      name: "Groceries",
      category: "Food",
      allocatedAmount: 500,
      spentAmount: 350,
      remainingAmount: 150,
      color: "#ef4444", // red
      month: currentMonth,
      year: currentYear,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Rent",
      category: "Housing",
      allocatedAmount: 1500,
      spentAmount: 1500,
      remainingAmount: 0,
      color: "#3b82f6", // blue
      month: currentMonth,
      year: currentYear,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      name: "Entertainment",
      category: "Leisure",
      allocatedAmount: 200,
      spentAmount: 220,
      remainingAmount: -20,
      color: "#10b981", // green
      month: currentMonth,
      year: currentYear,
      createdAt: new Date().toISOString(),
    },
  ],
  transactions: [
    {
      id: 1,
      type: "income",
      amount: 4000,
      description: "Salary",
      date: new Date(currentYear, currentMonth - 1, 1).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      budgetId: 2,
      budgetName: "Rent",
      type: "expense",
      amount: 1500,
      description: "Monthly Rent",
      date: new Date(currentYear, currentMonth - 1, 2).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      budgetId: 1,
      budgetName: "Groceries",
      type: "expense",
      amount: 350,
      description: "Whole Foods",
      date: new Date(currentYear, currentMonth - 1, 5).toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      budgetId: 3,
      budgetName: "Entertainment",
      type: "expense",
      amount: 220,
      description: "Concert Tickets",
      date: new Date(currentYear, currentMonth - 1, 15).toISOString(),
      createdAt: new Date().toISOString(),
    },
  ],
  savingsAccounts: [
    {
      id: 1,
      name: "Emergency Fund",
      balance: 10000,
      targetAmount: 15000,
      description: "6 months of living expenses",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: "Vacation",
      balance: 1200,
      targetAmount: 3000,
      description: "Trip to Japan",
      createdAt: new Date().toISOString(),
    },
  ],
};

class MockStore {
  private data: MockData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): MockData {
    if (typeof window === "undefined") return defaultData;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load mock data from localStorage", e);
    }
    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(data: MockData) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save mock data to localStorage", e);
    }
  }

  // --- Budgets ---
  getBudgets() {
    return [...this.data.budgets];
  }

  createBudget(input: CreateBudgetInput) {
    const newBudget: Budget = {
      ...input,
      id: Date.now(),
      spentAmount: 0,
      remainingAmount: input.allocatedAmount,
      color: input.color || "#000000",
      createdAt: new Date().toISOString(),
    };
    this.data.budgets.push(newBudget);
    this.saveData(this.data);
    return newBudget;
  }

  updateBudget(id: number, input: UpdateBudgetInput) {
    const index = this.data.budgets.findIndex((b) => b.id === id);
    if (index === -1) throw new Error("Budget not found");

    const budget = this.data.budgets[index];
    const updatedBudget = { ...budget, ...input };

    if (input.allocatedAmount !== undefined) {
      updatedBudget.remainingAmount =
        input.allocatedAmount - updatedBudget.spentAmount;
    }

    this.data.budgets[index] = updatedBudget;
    this.saveData(this.data);
    return updatedBudget;
  }

  deleteBudget(id: number) {
    this.data.budgets = this.data.budgets.filter((b) => b.id !== id);
    // Also remove budgetId from transactions
    this.data.transactions = this.data.transactions.map((t) =>
      t.budgetId === id
        ? { ...t, budgetId: undefined, budgetName: undefined }
        : t,
    );
    this.saveData(this.data);
  }

  // --- Transactions ---
  getTransactions(params?: GetTransactionsParams) {
    let result = [...this.data.transactions];
    if (params?.month && params?.year) {
      result = result.filter((t) => {
        const d = new Date(t.date);
        return (
          d.getMonth() + 1 === params.month && d.getFullYear() === params.year
        );
      });
    }
    if (params?.budgetId) {
      result = result.filter((t) => t.budgetId === params.budgetId);
    }
    if (params?.type) {
      result = result.filter((t) => t.type === params.type);
    }
    // Sort by date descending
    result.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    return result;
  }

  createTransaction(input: CreateTransactionInput) {
    let budgetName = undefined;
    if (input.budgetId) {
      const budget = this.data.budgets.find((b) => b.id === input.budgetId);
      if (budget) {
        budgetName = budget.name;
        // Update budget spent/remaining amounts if it's an expense
        if (input.type === "expense") {
          budget.spentAmount += input.amount;
          budget.remainingAmount = budget.allocatedAmount - budget.spentAmount;
        } else if (input.type === "income") {
          budget.spentAmount -= input.amount;
          budget.remainingAmount = budget.allocatedAmount - budget.spentAmount;
        }
      }
    }

    const newTransaction: Transaction = {
      ...input,
      id: Date.now(),
      budgetName,
      createdAt: new Date().toISOString(),
    };
    this.data.transactions.push(newTransaction);
    this.saveData(this.data);
    return newTransaction;
  }

  deleteTransaction(id: number) {
    const transaction = this.data.transactions.find((t) => t.id === id);
    if (!transaction) return;

    // Revert budget amounts
    if (transaction.budgetId) {
      const budget = this.data.budgets.find(
        (b) => b.id === transaction.budgetId,
      );
      if (budget) {
        if (transaction.type === "expense") {
          budget.spentAmount -= transaction.amount;
          budget.remainingAmount = budget.allocatedAmount - budget.spentAmount;
        } else if (transaction.type === "income") {
          budget.spentAmount += transaction.amount;
          budget.remainingAmount = budget.allocatedAmount - budget.spentAmount;
        }
      }
    }

    this.data.transactions = this.data.transactions.filter((t) => t.id !== id);
    this.saveData(this.data);
  }

  // --- Savings Accounts ---
  getSavingsAccounts() {
    return [...this.data.savingsAccounts];
  }

  createSavingsAccount(input: CreateSavingsAccountInput) {
    const newAccount: SavingsAccount = {
      ...input,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };
    this.data.savingsAccounts.push(newAccount);
    this.saveData(this.data);
    return newAccount;
  }

  updateSavingsAccount(id: number, input: UpdateSavingsAccountInput) {
    const index = this.data.savingsAccounts.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Savings account not found");

    const account = this.data.savingsAccounts[index];
    const updatedAccount = { ...account, ...input };

    this.data.savingsAccounts[index] = updatedAccount;
    this.saveData(this.data);
    return updatedAccount;
  }

  // --- Aggregations ---
  getDashboardSummary(): DashboardSummary {
    const now = new Date();
    const currentMonthTx = this.data.transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });

    const monthlyIncome = currentMonthTx
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = currentMonthTx
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSavings = this.data.savingsAccounts.reduce(
      (sum, a) => sum + a.balance,
      0,
    );
    const totalBalance = monthlyIncome - monthlyExpense + totalSavings; // Simplified calculation

    const budgetAlerts: BudgetAlert[] = this.data.budgets
      .filter(
        (b) => b.month === now.getMonth() + 1 && b.year === now.getFullYear(),
      )
      .filter((b) => b.spentAmount > 0)
      .map((b) => {
        const percentage =
          b.allocatedAmount > 0 ? (b.spentAmount / b.allocatedAmount) * 100 : 0;
        return {
          budgetId: b.id,
          budgetName: b.name,
          allocated: b.allocatedAmount,
          spent: b.spentAmount,
          percentage,
          isOverBudget: percentage > 100,
        };
      })
      .filter((alert) => alert.percentage >= 80); // Alert if >= 80% spent

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlySavings: monthlyIncome - monthlyExpense, // Simplification
      budgetAlerts,
      totalSavings,
    };
  }

  getMonthlySummary(params?: GetMonthlySummaryParams): MonthlySummaryItem[] {
    const monthsCount = params?.months || 6;
    const result: MonthlySummaryItem[] = [];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = targetMonth.toLocaleString("default", {
        month: "short",
      });

      const monthTx = this.data.transactions.filter((t) => {
        const d = new Date(t.date);
        return (
          d.getMonth() === targetMonth.getMonth() &&
          d.getFullYear() === targetMonth.getFullYear()
        );
      });

      const income = monthTx
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTx
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      result.push({
        month: monthStr,
        income,
        expense,
      });
    }

    return result;
  }
}

const store = new MockStore();

// Utility for network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
export const getGetMonthlySummaryQueryKey = (
  params?: GetMonthlySummaryParams,
) => ["monthlySummary", params];

// -----------------------------------------------------------------------------
// React Query Hooks
// -----------------------------------------------------------------------------

export function useGetDashboardSummary() {
  return useQuery({
    queryKey: getGetDashboardSummaryQueryKey(),
    queryFn: async () => {
      await delay(500);
      return store.getDashboardSummary();
    },
  });
}

export function useGetBudgets() {
  return useQuery({
    queryKey: getGetBudgetsQueryKey(),
    queryFn: async () => {
      await delay(500);
      return store.getBudgets();
    },
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: CreateBudgetInput }) => {
      await delay(500);
      return store.createBudget(data);
    },
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
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateBudgetInput;
    }) => {
      await delay(500);
      return store.updateBudget(id, data);
    },
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
    mutationFn: async ({ id }: { id: number }) => {
      await delay(500);
      store.deleteBudget(id);
    },
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
    queryFn: async () => {
      await delay(500);
      return store.getTransactions(params);
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: CreateTransactionInput }) => {
      await delay(500);
      return store.createTransaction(data);
    },
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
    mutationFn: async ({ id }: { id: number }) => {
      await delay(500);
      store.deleteTransaction(id);
    },
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
    queryFn: async () => {
      await delay(500);
      return store.getSavingsAccounts();
    },
  });
}

export function useCreateSavingsAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }: { data: CreateSavingsAccountInput }) => {
      await delay(500);
      return store.createSavingsAccount(data);
    },
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
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateSavingsAccountInput;
    }) => {
      await delay(500);
      return store.updateSavingsAccount(id, data);
    },
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

export function useGetMonthlySummary(params?: GetMonthlySummaryParams) {
  return useQuery({
    queryKey: getGetMonthlySummaryQueryKey(params),
    queryFn: async () => {
      await delay(500);
      return store.getMonthlySummary(params);
    },
  });
}
