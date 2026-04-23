import { useState, ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateTransaction } from "@/hooks/use-transactions";
import { useBudgets } from "@/hooks/use-budgets";
import { formatCurrency, cn } from "@/lib/format";
import { X, Plus, ArrowUpCircle, ArrowDownCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const txSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().min(1, "Số tiền phải lớn hơn 0"),
  description: z.string().min(1, "Mô tả không được để trống"),
  date: z.string().min(1, "Ngày không được để trống"),
  budgetId: z.coerce.number().optional().or(z.literal("")),
});

type TxFormData = z.infer<typeof txSchema>;

interface Props {
  trigger?: ReactNode;
  defaultType?: "income" | "expense";
}

export function AddTransactionDialog({ trigger, defaultType = "expense" }: Props) {
  const [open, setOpen] = useState(false);
  const { data: budgets } = useBudgets();
  const createMutation = useCreateTransaction();

  const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm<TxFormData>({
    resolver: zodResolver(txSchema),
    defaultValues: {
      type: defaultType,
      date: new Date().toISOString().split("T")[0],
      budgetId: "",
    },
  });

  const txType = watch("type");

  const onSubmit = (data: TxFormData) => {
    const payload: any = { ...data };
    if (!payload.budgetId || payload.type === "income") delete payload.budgetId;
    createMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          setOpen(false);
          reset({ type: defaultType, date: new Date().toISOString().split("T")[0], budgetId: "" });
        },
      }
    );
  };

  const openWith = (type: "income" | "expense") => {
    setValue("type", type);
    setOpen(true);
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">{trigger}</div>
      ) : (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Thêm giao dịch
        </button>
      )}

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <motion.div
              className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border/50 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className={cn("px-6 py-5 flex items-center justify-between",
                txType === "income" ? "bg-emerald-50 border-b border-emerald-100" : "bg-red-50 border-b border-red-100")}>
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-xl",
                    txType === "income" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600")}>
                    {txType === "income"
                      ? <ArrowUpCircle className="w-5 h-5" />
                      : <ArrowDownCircle className="w-5 h-5" />}
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    {txType === "income" ? "Thêm thu nhập" : "Thêm chi tiêu"}
                  </h2>
                </div>
                <button onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-black/5 text-muted-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {/* Type switcher */}
                <div className="flex rounded-xl bg-muted p-1 gap-1">
                  <button type="button"
                    onClick={() => setValue("type", "expense")}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                      txType === "expense"
                        ? "bg-destructive text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground")}>
                    <ArrowDownCircle className="w-4 h-4" /> Chi tiêu
                  </button>
                  <button type="button"
                    onClick={() => setValue("type", "income")}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                      txType === "income"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground")}>
                    <ArrowUpCircle className="w-4 h-4" /> Thu nhập
                  </button>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Số tiền (₫)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="0"
                    {...register("amount")}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                  {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Mô tả
                  </label>
                  <input
                    type="text"
                    placeholder={txType === "income" ? "Vd: Lương tháng 3..." : "Vd: Ăn trưa văn phòng..."}
                    {...register("description")}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                  {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Date */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      Ngày
                    </label>
                    <input
                      type="date"
                      {...register("date")}
                      className="w-full px-3 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition text-sm"
                    />
                  </div>

                  {/* Budget */}
                  {txType === "expense" && (
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                        Ngân sách
                      </label>
                      <select
                        {...register("budgetId")}
                        className="w-full px-3 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition text-sm">
                        <option value="">-- Không chọn --</option>
                        {budgets?.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2",
                    txType === "income"
                      ? "bg-emerald-500 hover:bg-emerald-600"
                      : "bg-destructive hover:bg-destructive/90",
                    createMutation.isPending && "opacity-70 cursor-not-allowed"
                  )}>
                  {createMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...</>
                    : <><Plus className="w-4 h-4" /> Lưu giao dịch</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
