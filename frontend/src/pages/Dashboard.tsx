import { useState } from "react";
import { Layout } from "@/components/Layout";
import { CurrencyInput } from "@/components/CurrencyInput";
import { useDashboard } from "@/hooks/use-dashboard";
import { useSavingsAccounts } from "@/hooks/use-savings";
import { useBudgets } from "@/hooks/use-budgets";
import { useTransferToSavings } from "@/lib/api-client";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { formatCurrency, cn } from "@/lib/format";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertCircle,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  TriangleAlert,
  SendHorizonal,
} from "lucide-react";
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
} from "recharts";
import { motion } from "framer-motion";

const CHART_COLORS = [
  "#6366f1",
  "#f97316",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#3b82f6",
];

export default function Dashboard() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { summary, monthlySummary, isLoading, isError } = useDashboard();
  const { data: savings } = useSavingsAccounts();
  const { data: budgets } = useBudgets();
  const transferMutation = useTransferToSavings();

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferAccountId, setTransferAccountId] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferError, setTransferError] = useState<string | null>(null);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    const id = parseInt(transferAccountId);
    const amount = transferAmount;

    if (!id || amount <= 0) {
      setTransferError("Vui lòng chọn tài khoản và nhập số tiền hợp lệ.");
      return;
    }

    transferMutation.mutate({ id, data: { amount } }, {
      onSuccess: () => {
        setIsTransferOpen(false);
        setTransferAccountId("");
        setTransferAmount(0);
      },
      onError: () => {
        setTransferError("Đã xảy ra lỗi khi chuyển tiền.");
      }
    });
  };

  if (isLoading) {
    return (
      <Layout title="Tổng quan">
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  if (isError || !summary) {
    return (
      <Layout title="Tổng quan">
        <div className="text-center py-20 text-destructive">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold">Không thể tải dữ liệu</h2>
          <p className="text-muted-foreground mt-2">Vui lòng thử lại sau.</p>
        </div>
      </Layout>
    );
  }

  const statCards = [
    {
      title: "Tổng số dư",
      amount: summary.totalBalance,
      icon: Wallet,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Thu nhập tháng này",
      amount: summary.monthlyIncome,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-600/10",
    },
    {
      title: "Chi tiêu tháng này",
      amount: summary.monthlyExpense,
      icon: TrendingDown,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: "Tổng tiết kiệm",
      amount: summary.totalSavings,
      icon: PiggyBank,
      color: "text-purple-600",
      bg: "bg-purple-600/10",
    },
  ];

  // Trend data: add net savings line
  const trendData = (monthlySummary ?? []).map((m) => ({
    ...m,
    net: m.income - m.expense,
  }));

  // Expense breakdown from budgets
  const expenseBreakdown = (budgets ?? [])
    .filter((b) => b.spentAmount > 0)
    .map((b, i) => ({
      name: b.name,
      value: b.spentAmount,
      color: b.color || CHART_COLORS[i % CHART_COLORS.length],
    }));

  // Smart alerts
  const alerts: {
    type: "danger" | "warning" | "info";
    message: string;
    detail?: string;
  }[] = [];

  if (
    summary.monthlyExpense > summary.monthlyIncome &&
    summary.monthlyIncome > 0
  ) {
    alerts.push({
      type: "danger",
      message: "Chi tiêu vượt thu nhập tháng này",
      detail: `Bội chi: ${formatCurrency(summary.monthlyExpense - summary.monthlyIncome)}`,
    });
  }

  if (summary.monthlyIncome > 0) {
    const savingsRate =
      ((summary.monthlyIncome - summary.monthlyExpense) /
        summary.monthlyIncome) *
      100;
    if (savingsRate < 10 && savingsRate >= 0) {
      alerts.push({
        type: "warning",
        message: "Tỷ lệ tiết kiệm thấp",
        detail: `Tháng này chỉ tiết kiệm được ${savingsRate.toFixed(0)}% thu nhập`,
      });
    }
  }

  summary.budgetAlerts?.forEach((a) => {
    alerts.push({
      type: a.isOverBudget ? "danger" : "warning",
      message: `${a.isOverBudget ? "Vượt ngân sách" : "Sắp đạt ngưỡng"}: ${a.budgetName}`,
      detail: `Đã chi ${formatCurrency(a.spent)} / ${formatCurrency(a.allocated)} (${a.percentage.toFixed(0)}%)`,
    });
  });

  if (alerts.length === 0) {
    alerts.push({
      type: "info",
      message: "Tài chính ổn định",
      detail: "Tất cả các khoản đều trong tầm kiểm soát!",
    });
  }

  const alertIcon = {
    danger: TriangleAlert,
    warning: AlertCircle,
    info: CheckCircle2,
  };
  const alertColor = {
    danger: "border-destructive/30 bg-destructive/5 text-destructive",
    warning: "border-yellow-400/30 bg-yellow-400/5 text-yellow-600",
    info: "border-emerald-400/30 bg-emerald-400/5 text-emerald-600",
  };

  return (
    <Layout title="Tổng quan">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 hover:shadow-md hover:border-primary/20 transition-all"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {stat.title}
                </p>
                <h3 className="text-xl font-bold text-foreground">
                  {formatCurrency(stat.amount)}
                </h3>
              </div>
              <div className={cn("p-2.5 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full w-1/3 rounded-full opacity-40",
                  stat.bg.replace("/10", ""),
                )}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions CTA */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-4 bg-gradient-to-r from-primary/5 via-emerald-500/5 to-transparent rounded-2xl border border-border/40">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Ghi nhận giao dịch nhanh
          </p>
          <p className="text-xs text-muted-foreground">
            Thêm thu nhập hoặc chi tiêu ngay tại đây
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <AddTransactionDialog
            defaultType="income"
            trigger={
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20">
                <ArrowUpCircle className="w-4 h-4" /> Thu nhập
              </button>
            }
          />
          <AddTransactionDialog
            defaultType="expense"
            trigger={
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive text-white font-semibold text-sm hover:bg-destructive/90 transition-colors shadow-sm shadow-destructive/20">
                <ArrowDownCircle className="w-4 h-4" /> Chi tiêu
              </button>
            }
          />
          {summary.monthlySavings > 0 && savings && savings.length > 0 && (
            <button
              onClick={() => setIsTransferOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors shadow-sm shadow-purple-600/20"
            >
              <SendHorizonal className="w-4 h-4" /> Chuyển vào tiết kiệm
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Charts + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 shadow-sm border border-border/50">
          <h3 className="text-base font-bold text-foreground mb-4">
            Thu & Chi theo tháng
          </h3>
          <div className="h-[260px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={trendData}
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
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 11,
                    }}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name,
                    ]}
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
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="expense"
                    name="Chi tiêu"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Chưa có dữ liệu
              </div>
            )}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 flex flex-col">
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500" /> Cảnh báo tài
            chính
          </h3>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {alerts.map((alert, i) => {
              const Icon = alertIcon[alert.type];
              return (
                <div
                  key={i}
                  className={cn(
                    "p-3 rounded-xl border text-sm",
                    alertColor[alert.type],
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">{alert.message}</p>
                      {alert.detail && (
                        <p className="text-xs opacity-80 mt-0.5">
                          {alert.detail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expense Breakdown Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
          <h3 className="text-base font-bold text-foreground mb-1">
            Phân bổ chi tiêu
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Tháng {month}/{year}
          </p>
          {expenseBreakdown.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="h-[130px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={60}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {expenseBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
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
              <div className="space-y-1.5 overflow-y-auto max-h-[80px]">
                {expenseBreakdown.map((e, i) => {
                  const total = expenseBreakdown.reduce(
                    (s, x) => s + x.value,
                    0,
                  );
                  const pct =
                    total > 0 ? ((e.value / total) * 100).toFixed(0) : "0";
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: e.color }}
                        />
                        <span className="text-muted-foreground truncate max-w-[90px]">
                          {e.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-[180px] flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
              <PiggyBank className="w-8 h-8 opacity-30" />
              <p>Chưa có chi tiêu</p>
            </div>
          )}
        </div>
      </div>

      {/* Transfer to Savings Dialog */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <SendHorizonal className="w-5 h-5 text-purple-600" />
                Chuyển vào tiết kiệm
              </h2>
            </div>
            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tài khoản tiết kiệm</label>
                <select
                  value={transferAccountId}
                  onChange={(e) => setTransferAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                >
                  <option value="">-- Chọn tài khoản --</option>
                  {savings?.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Số tiền chuyển (VND)</label>
                <CurrencyInput
                  value={transferAmount}
                  onChange={setTransferAmount}
                  className="w-full px-4 py-3 text-lg font-bold rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="0"
                  autoFocus
                />
                {summary && summary.monthlySavings > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Số dư khả dụng: <span className="font-semibold text-foreground">{formatCurrency(summary.monthlySavings)}</span>
                  </p>
                )}
              </div>
              {transferError && <p className="text-xs text-destructive">{transferError}</p>}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsTransferOpen(false); setTransferError(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={transferMutation.isPending || !transferAccountId || transferAmount <= 0}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {transferMutation.isPending ? "Đang chuyển..." : "Xác nhận chuyển"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
