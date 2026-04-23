import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useTransactions } from "@/hooks/use-transactions";
import { useBudgets } from "@/hooks/use-budgets";
import { useSavingsAccounts } from "@/hooks/use-savings";
import { useGetMonthlySummary } from "@/lib/api-client";
import { formatCurrency, formatDate, cn } from "@/lib/format";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { motion } from "framer-motion";

const COLORS = [
  "#6366f1",
  "#f97316",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#3b82f6",
  "#10b981",
];

const MONTHS_VI = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

export default function Reports() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const years = [
    now.getFullYear(),
    now.getFullYear() - 1,
    now.getFullYear() - 2,
  ];

  const { data: allTransactions, isLoading: txLoading } = useTransactions();
  const { data: budgets } = useBudgets();
  const { data: savings } = useSavingsAccounts();
  const { data: monthlySummary, isLoading: chartLoading } =
    useGetMonthlySummary({ months: 12 });

  const isLoading = txLoading || chartLoading;

  // Filter transactions by selected year
  const yearTx = useMemo(
    () =>
      (allTransactions ?? []).filter(
        (t) => new Date(t.date).getFullYear() === selectedYear,
      ),
    [allTransactions, selectedYear],
  );

  const totalIncome = yearTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = yearTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Monthly breakdown for selected year (from monthlySummary, last 12 months)
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthTx = yearTx.filter(
        (t) => new Date(t.date).getMonth() + 1 === month,
      );
      const income = monthTx
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expense = monthTx
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      return { month: `T${month}`, income, expense, net: income - expense };
    });
  }, [yearTx]);

  // Expense breakdown by budget category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string }> =
      {};
    yearTx
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const key = t.budgetName ?? "Khác";
        if (!map[key])
          map[key] = {
            name: key,
            value: 0,
            color: COLORS[Object.keys(map).length % COLORS.length],
          };
        map[key].value += t.amount;
      });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [yearTx]);

  // Budget performance
  const budgetPerformance = useMemo(() => {
    return (budgets ?? [])
      .map((b) => {
        const pct =
          b.allocatedAmount > 0 ? (b.spentAmount / b.allocatedAmount) * 100 : 0;
        return { ...b, percentage: pct };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [budgets]);

  // Top expenses
  const topExpenses = useMemo(
    () =>
      yearTx
        .filter((t) => t.type === "expense")
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8),
    [yearTx],
  );

  // Monthly income vs expense table
  const monthlyTable = useMemo(
    () => monthlyData.filter((m) => m.income > 0 || m.expense > 0),
    [monthlyData],
  );

  const savingsGoals = (savings ?? []).map((s) => ({
    ...s,
    percentage: s.targetAmount
      ? Math.min((s.balance / s.targetAmount) * 100, 100)
      : 100,
  }));

  if (isLoading) {
    return (
      <Layout title="Báo cáo">
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Báo cáo tài chính">
      {/* Header + Year Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Tổng quan thu chi và phân tích tài chính
          </p>
        </div>
        <div className="relative inline-flex items-center">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Tổng thu nhập",
            value: totalIncome,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Tổng chi tiêu",
            value: totalExpense,
            icon: TrendingDown,
            color: "text-destructive",
            bg: "bg-destructive/5",
          },
          {
            label: "Tiết kiệm ròng",
            value: netSavings,
            icon: PiggyBank,
            color: netSavings >= 0 ? "text-blue-600" : "text-destructive",
            bg: netSavings >= 0 ? "bg-blue-50" : "bg-destructive/5",
          },
          {
            label: "Tỷ lệ tiết kiệm",
            value: null,
            rate: savingsRate,
            icon: Target,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm"
          >
            <div className="flex justify-between items-start mb-3">
              <p className="text-xs font-medium text-muted-foreground leading-tight">
                {card.label}
              </p>
              <div className={cn("p-2 rounded-lg", card.bg, card.color)}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            {card.rate !== undefined ? (
              <>
                <p className={cn("text-2xl font-bold", card.color)}>
                  {card.rate.toFixed(1)}%
                </p>
                <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${Math.min(card.rate, 100)}%` }}
                  />
                </div>
              </>
            ) : (
              <p className={cn("text-xl font-bold", card.color)}>
                {formatCurrency(card.value!)}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Row 1: Monthly chart + Expense pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Full-year bar chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-1">
            Thu & Chi theo từng tháng — {selectedYear}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Tổng thu nhập và chi tiêu mỗi tháng trong năm
          </p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={monthlyData}
                margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  dy={6}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                  }}
                  formatter={(v: number, n: string) => [formatCurrency(v), n]}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
                />
                <Bar
                  dataKey="income"
                  name="Thu nhập"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="expense"
                  name="Chi tiêu"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  name="Tiết kiệm ròng"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense breakdown pie */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-foreground mb-1">
            Phân bổ chi tiêu
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Theo danh mục — {selectedYear}
          </p>
          {expenseByCategory.length > 0 ? (
            <>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {expenseByCategory.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), ""]}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "none",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto mt-2">
                {expenseByCategory.map((e, i) => {
                  const pct =
                    totalExpense > 0
                      ? ((e.value / totalExpense) * 100).toFixed(1)
                      : "0";
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: e.color }}
                      />
                      <span className="text-xs text-muted-foreground flex-1 truncate">
                        {e.name}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {pct}%
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatCurrency(e.value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
              <BarChart3 className="w-8 h-8 opacity-30" />
              <p>Chưa có dữ liệu chi tiêu</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Budget performance + Savings goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Budget performance */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-1">
            Hiệu suất ngân sách
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            So sánh phân bổ vs thực chi tháng hiện tại
          </p>
          {budgetPerformance.length > 0 ? (
            <div className="space-y-4">
              {budgetPerformance.map((b) => {
                const pct = b.percentage;
                const barColor =
                  pct > 100 ? "#ef4444" : pct > 80 ? "#f59e0b" : "#10b981";
                return (
                  <div key={b.id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: b.color }}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {b.name}
                        </span>
                        {pct > 100 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive font-bold">
                            Vượt
                          </span>
                        )}
                      </div>
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: barColor }}
                      >
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: barColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Đã chi: {formatCurrency(b.spentAmount)}</span>
                      <span>Phân bổ: {formatCurrency(b.allocatedAmount)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
              <BarChart3 className="w-8 h-8 opacity-30" />
              <p>Chưa có ngân sách</p>
            </div>
          )}
        </div>

        {/* Savings goals */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" /> Mục tiêu tiết kiệm
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Tiến độ các tài khoản tiết kiệm
          </p>
          {savingsGoals.length > 0 ? (
            <div className="space-y-5">
              {savingsGoals.map((s) => {
                const pct = s.percentage;
                const color =
                  pct >= 100
                    ? "#10b981"
                    : pct >= 60
                      ? "#6366f1"
                      : pct >= 30
                        ? "#f97316"
                        : "#ef4444";
                const remaining = s.targetAmount
                  ? Math.max(s.targetAmount - s.balance, 0)
                  : 0;
                return (
                  <div key={s.id}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-semibold text-foreground">
                        {s.name}
                      </span>
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color }}
                      >
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {s.description}
                      </p>
                    )}
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1.5">
                      <span className="font-medium text-foreground">
                        {formatCurrency(s.balance)}
                      </span>
                      <div className="text-right text-muted-foreground">
                        {s.targetAmount ? (
                          <>
                            / {formatCurrency(s.targetAmount)}{" "}
                            {remaining > 0 && (
                              <span>(còn {formatCurrency(remaining)})</span>
                            )}
                          </>
                        ) : (
                          <span>Không có mục tiêu</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
              <PiggyBank className="w-8 h-8 opacity-30" />
              <p>Chưa có tài khoản tiết kiệm</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Monthly summary table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Monthly table */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-4">
            Bảng tổng hợp theo tháng — {selectedYear}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left pb-3 text-muted-foreground font-medium text-xs">
                    Tháng
                  </th>
                  <th className="text-right pb-3 text-muted-foreground font-medium text-xs">
                    Thu nhập
                  </th>
                  <th className="text-right pb-3 text-muted-foreground font-medium text-xs">
                    Chi tiêu
                  </th>
                  <th className="text-right pb-3 text-muted-foreground font-medium text-xs">
                    Tiết kiệm
                  </th>
                  <th className="text-right pb-3 text-muted-foreground font-medium text-xs">
                    Tỷ lệ TK
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {monthlyData.map((m, i) => {
                  const net = m.income - m.expense;
                  const rate = m.income > 0 ? (net / m.income) * 100 : 0;
                  const isEmpty = m.income === 0 && m.expense === 0;
                  return (
                    <tr
                      key={i}
                      className={cn(
                        "hover:bg-muted/30 transition-colors",
                        isEmpty && "opacity-40",
                      )}
                    >
                      <td className="py-2.5 font-medium text-foreground">
                        {MONTHS_VI[i]}
                      </td>
                      <td className="py-2.5 text-right text-emerald-600 font-medium tabular-nums">
                        {m.income > 0 ? formatCurrency(m.income) : "—"}
                      </td>
                      <td className="py-2.5 text-right text-destructive font-medium tabular-nums">
                        {m.expense > 0 ? formatCurrency(m.expense) : "—"}
                      </td>
                      <td
                        className={cn(
                          "py-2.5 text-right font-bold tabular-nums",
                          net >= 0 ? "text-blue-600" : "text-destructive",
                        )}
                      >
                        {isEmpty
                          ? "—"
                          : (net >= 0 ? "+" : "") + formatCurrency(net)}
                      </td>
                      <td className="py-2.5 text-right">
                        {!isEmpty && (
                          <span
                            className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-full",
                              rate >= 20
                                ? "bg-emerald-100 text-emerald-700"
                                : rate >= 0
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700",
                            )}
                          >
                            {rate.toFixed(0)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {monthlyTable.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-border font-bold">
                    <td className="pt-3 text-foreground">Tổng cộng</td>
                    <td className="pt-3 text-right text-emerald-600 tabular-nums">
                      {formatCurrency(totalIncome)}
                    </td>
                    <td className="pt-3 text-right text-destructive tabular-nums">
                      {formatCurrency(totalExpense)}
                    </td>
                    <td
                      className={cn(
                        "pt-3 text-right tabular-nums",
                        netSavings >= 0 ? "text-blue-600" : "text-destructive",
                      )}
                    >
                      {netSavings >= 0 ? "+" : ""}
                      {formatCurrency(netSavings)}
                    </td>
                    <td className="pt-3 text-right">
                      <span
                        className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded-full",
                          savingsRate >= 20
                            ? "bg-emerald-100 text-emerald-700"
                            : savingsRate >= 0
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700",
                        )}
                      >
                        {savingsRate.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Top expenses */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-1">
            Top chi tiêu lớn nhất
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Các giao dịch chi lớn nhất năm {selectedYear}
          </p>
          {topExpenses.length > 0 ? (
            <div className="space-y-3">
              {topExpenses.map((tx, i) => (
                <div key={tx.id} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      i === 0
                        ? "bg-yellow-100 text-yellow-700"
                        : i === 1
                          ? "bg-gray-100 text-gray-600"
                          : i === 2
                            ? "bg-orange-100 text-orange-600"
                            : "bg-muted text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {tx.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(
                        typeof tx.date === "string"
                          ? tx.date
                          : (tx.date as Date).toISOString(),
                      )}
                      {tx.budgetName && ` · ${tx.budgetName}`}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-destructive tabular-nums shrink-0">
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
              <ArrowDownCircle className="w-8 h-8 opacity-30" />
              <p>Chưa có giao dịch chi</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
