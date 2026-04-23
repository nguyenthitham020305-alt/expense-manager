import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useTransactions, useDeleteTransaction } from "@/hooks/use-transactions";
import { useGetCategories } from "@/lib/api-client";
import { formatCurrency, formatDate, cn } from "@/lib/format";
import { Trash2, ArrowDownRight, ArrowUpRight, Search, X } from "lucide-react";

const MONTHS = [
  { value: 1, label: "Tháng 1" },
  { value: 2, label: "Tháng 2" },
  { value: 3, label: "Tháng 3" },
  { value: 4, label: "Tháng 4" },
  { value: 5, label: "Tháng 5" },
  { value: 6, label: "Tháng 6" },
  { value: 7, label: "Tháng 7" },
  { value: 8, label: "Tháng 8" },
  { value: 9, label: "Tháng 9" },
  { value: 10, label: "Tháng 10" },
  { value: 11, label: "Tháng 11" },
  { value: 12, label: "Tháng 12" },
];

export default function Transactions() {
  const { data: transactions, isLoading } = useTransactions();
  const { data: categories } = useGetCategories();
  const deleteMutation = useDeleteTransaction();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>("");
  const [filterYear, setFilterYear] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  const years = useMemo(() => {
    if (!transactions?.length) return [];
    const set = new Set(transactions.map((t) => new Date(t.date).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [transactions]);

  const hasActiveFilters = filterMonth !== "" || filterYear !== "" || filterType !== "" || filterCategory !== "";

  const clearFilters = () => {
    setFilterMonth("");
    setFilterYear("");
    setFilterType("");
    setFilterCategory("");
  };

  const filteredTxs = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((t) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchSearch =
          t.description.toLowerCase().includes(term) ||
          t.amount.toString().includes(searchTerm);
        if (!matchSearch) return false;
      }
      if (filterMonth) {
        const txMonth = new Date(t.date).getMonth() + 1;
        if (txMonth !== parseInt(filterMonth)) return false;
      }
      if (filterYear) {
        const txYear = new Date(t.date).getFullYear();
        if (txYear !== parseInt(filterYear)) return false;
      }
      if (filterType && t.type !== filterType) return false;
      if (filterCategory && t.categoryName !== filterCategory) return false;
      return true;
    });
  }, [transactions, searchTerm, filterMonth, filterYear, filterType, filterCategory]);

  return (
    <Layout title="Lịch sử Giao dịch">
      <div className="mb-8 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm giao dịch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Filter: Month */}
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className={cn(
            "px-3 py-2.5 bg-card border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
            filterMonth ? "border-primary text-foreground" : "border-border text-muted-foreground"
          )}
        >
          <option value="">Tất cả tháng</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {/* Filter: Year */}
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className={cn(
            "px-3 py-2.5 bg-card border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
            filterYear ? "border-primary text-foreground" : "border-border text-muted-foreground"
          )}
        >
          <option value="">Tất cả năm</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Filter: Type */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={cn(
            "px-3 py-2.5 bg-card border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
            filterType ? "border-primary text-foreground" : "border-border text-muted-foreground"
          )}
        >
          <option value="">Tất cả loại</option>
          <option value="expense">Chi tiêu</option>
          <option value="income">Thu nhập</option>
        </select>

        {/* Filter: Category */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={cn(
            "px-3 py-2.5 bg-card border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
            filterCategory ? "border-primary text-foreground" : "border-border text-muted-foreground"
          )}
        >
          <option value="">Tất cả danh mục</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
          >
            <X className="w-4 h-4" /> Xóa lọc
          </button>
        )}
      </div>

      <div className="bg-card rounded-2xl shadow-lg shadow-black/5 border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50 text-muted-foreground text-sm">
                <th className="px-6 py-4 font-medium">Ngày</th>
                <th className="px-6 py-4 font-medium">Mô tả</th>
                <th className="px-6 py-4 font-medium">Phân loại</th>
                <th className="px-6 py-4 font-medium text-right">Số tiền</th>
                <th className="px-6 py-4 font-medium w-16"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTxs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    Không tìm thấy giao dịch nào.
                  </td>
                </tr>
              ) : (
                filteredTxs.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{tx.description}</div>
                      {tx.budgetName && (
                        <div className="text-xs text-muted-foreground mt-0.5">{tx.budgetName}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium",
                        tx.type === 'income' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      )}>
                        {tx.type === 'income' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {tx.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                      </span>
                    </td>
                    <td className={cn(
                      "px-6 py-4 whitespace-nowrap text-right font-bold font-display",
                      tx.type === 'income' ? "text-success" : "text-foreground"
                    )}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          if (confirm("Xóa giao dịch này?")) deleteMutation.mutate({ id: tx.id });
                        }}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </Layout>
  );
}
