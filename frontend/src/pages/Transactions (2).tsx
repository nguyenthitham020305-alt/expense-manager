import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useTransactions, useCreateTransaction, useDeleteTransaction } from "@/hooks/use-transactions";
import { useBudgets } from "@/hooks/use-budgets";
import { formatCurrency, formatDate, cn } from "@/lib/format";
import { Plus, Trash2, ArrowDownRight, ArrowUpRight, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const txSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().min(1, "Số tiền phải lớn hơn 0"),
  description: z.string().min(1, "Mô tả không được để trống"),
  date: z.string().min(1, "Ngày không được để trống"),
  budgetId: z.coerce.number().optional().or(z.literal('')),
});

type TxFormData = z.infer<typeof txSchema>;

export default function Transactions() {
  const { data: transactions, isLoading } = useTransactions();
  const { data: budgets } = useBudgets();
  const createMutation = useCreateTransaction();
  const deleteMutation = useDeleteTransaction();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<TxFormData>({
    resolver: zodResolver(txSchema),
    defaultValues: {
      type: "expense",
      date: new Date().toISOString().split('T')[0],
      budgetId: ''
    }
  });

  const txType = watch("type");

  const onSubmit = (data: TxFormData) => {
    // Clean up empty budgetId
    const payload = { ...data };
    if (!payload.budgetId || payload.type === 'income') {
      delete payload.budgetId;
    }

    createMutation.mutate({ data: payload as any }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        reset();
      }
    });
  };

  const filteredTxs = transactions?.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.amount.toString().includes(searchTerm)
  ) || [];

  return (
    <Layout title="Lịch sử Giao dịch">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
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
        <button 
          onClick={() => setIsDialogOpen(true)}
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Ghi chép mới
        </button>
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

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold font-display">Ghi chép giao dịch</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 mb-2 p-1 bg-muted rounded-xl">
                <label className="cursor-pointer">
                  <input type="radio" value="expense" {...register("type")} className="peer sr-only" />
                  <div className="text-center py-2 rounded-lg font-medium text-sm transition-all peer-checked:bg-white peer-checked:shadow-sm peer-checked:text-destructive text-muted-foreground">
                    Khoản Chi
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" value="income" {...register("type")} className="peer sr-only" />
                  <div className="text-center py-2 rounded-lg font-medium text-sm transition-all peer-checked:bg-white peer-checked:shadow-sm peer-checked:text-success text-muted-foreground">
                    Khoản Thu
                  </div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Số tiền (VND)</label>
                <input 
                  type="number"
                  {...register("amount")} 
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-display font-bold text-lg"
                  placeholder="0"
                />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mô tả</label>
                <input 
                  {...register("description")} 
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  placeholder="VD: Mua cafe, Lương tháng..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Ngày</label>
                <input 
                  type="date"
                  {...register("date")} 
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border outline-none"
                />
              </div>

              {txType === 'expense' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Trừ vào ngân sách (Tùy chọn)</label>
                  <select 
                    {...register("budgetId")} 
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border outline-none"
                  >
                    <option value="">-- Không chọn --</option>
                    {budgets?.map(b => (
                      <option key={b.id} value={b.id}>{b.name} (Còn {formatCurrency(b.remainingAmount)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted font-medium transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending ? "Đang lưu..." : "Hoàn tất"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
