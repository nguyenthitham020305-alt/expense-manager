import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget, useCategories, useCreateCategory, useDeleteCategory } from "@/hooks/use-budgets";
import type { Budget } from "@/lib/api-client";
import { formatCurrency, cn } from "@/lib/format";
import { Plus, Trash2, X, Loader2, Target, Tag, Edit2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CurrencyInput } from "@/components/CurrencyInput";
import * as z from "zod";

const budgetSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  category: z.string().min(1, "Danh mục không được để trống"),
  allocatedAmount: z.coerce.number().min(1, "Số tiền phải lớn hơn 0"),
  color: z.string().optional(),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000)
});

type BudgetFormData = z.infer<typeof budgetSchema>;

const categorySchema = z.object({
  name: z.string().min(1, "Tên danh mục không được để trống"),
  color: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function Budgets() {
  const { data: budgets, isLoading } = useBudgets();
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();
  const createCategoryMutation = useCreateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      color: "#4f46e5"
    }
  });

  const { register: registerCat, handleSubmit: handleSubmitCat, formState: { errors: catErrors }, reset: resetCat } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { color: "#6366f1" }
  });

  const onSubmit = (data: BudgetFormData) => {
    if (editingBudget) {
      updateMutation.mutate(
        { id: editingBudget.id, data: { name: data.name, category: data.category, allocatedAmount: data.allocatedAmount } },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            setEditingBudget(null);
            reset();
          },
        }
      );
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          setIsDialogOpen(false);
          reset();
        }
      });
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    reset({
      name: budget.name,
      category: budget.category,
      allocatedAmount: budget.allocatedAmount,
      month: budget.month,
      year: budget.year,
    });
    setIsDialogOpen(true);
  };

  const onSubmitCategory = (data: CategoryFormData) => {
    setCategoryError(null);
    createCategoryMutation.mutate({ data }, {
      onSuccess: () => {
        setIsCategoryDialogOpen(false);
        resetCat();
      },
      onError: (err) => {
        setCategoryError(err.message.includes("409") ? "Danh mục này đã tồn tại." : err.message);
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa ngân sách này?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      deleteCategoryMutation.mutate({ id }, {
        onError: (err) => {
          alert(err.message.includes("409")
            ? "Không thể xóa: danh mục đang được sử dụng bởi ngân sách."
            : "Đã xảy ra lỗi khi xóa danh mục.");
        }
      });
    }
  };

  return (
    <Layout title="Quản lý Ngân sách">
      {/* ── Budget Categories Section ── */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Danh mục ngân sách
          </h2>
          <button
            onClick={() => setIsCategoryDialogOpen(true)}
            className="text-sm bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-1.5 border border-border hover:border-primary/30"
          >
            <Plus className="w-4 h-4" />
            Thêm danh mục
          </button>
        </div>

        {isCategoriesLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !categories || categories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Chưa có danh mục nào.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="group flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-2 text-sm shadow-sm hover:shadow-md hover:border-primary/20 transition-all"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.icon && <span className="text-base">{cat.icon}</span>}
                <span className="font-medium text-foreground">{cat.name}</span>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="ml-1 p-0.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="border-border mb-8" />

      {/* ── Budgets Section ── */}
      <div className="flex justify-between items-center mb-8">
        <p className="text-muted-foreground">Quản lý các khoản chi tiêu dự kiến trong tháng.</p>
        <button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all flex items-center gap-2 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Thêm ngân sách
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !budgets || budgets.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-2xl border border-dashed border-border">
          <Target className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-bold text-foreground">Chưa có ngân sách nào</h3>
          <p className="text-muted-foreground mt-2 mb-6">Tạo ngân sách đầu tiên để kiểm soát chi tiêu.</p>
          <button 
            onClick={() => setIsDialogOpen(true)}
            className="text-primary hover:underline font-medium"
          >
            Tạo ngay →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {budgets.map((budget) => {
            const percent = Math.min((budget.spentAmount / budget.allocatedAmount) * 100, 100);
            const isWarning = percent > 80;
            const isDanger = percent >= 100;
            
            return (
              <div key={budget.id} className="bg-card rounded-2xl p-6 shadow-lg shadow-black/5 border border-border/50 group hover:shadow-xl hover:border-primary/20 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm" 
                      style={{ backgroundColor: budget.color || '#4f46e5' }} 
                    />
                    <div>
                      <h3 className="font-bold text-lg text-foreground leading-tight">{budget.name}</h3>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md mt-1 inline-block">
                        {budget.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(budget.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Đã chi</span>
                    <span className="font-semibold text-foreground">{formatCurrency(budget.spentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tổng ngân sách</span>
                    <span className="font-semibold text-foreground">{formatCurrency(budget.allocatedAmount)}</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1.5 font-medium">
                      <span className={isDanger ? "text-destructive" : isWarning ? "text-warning" : "text-muted-foreground"}>
                        {percent.toFixed(1)}%
                      </span>
                      <span className={isDanger ? "text-destructive" : "text-success"}>
                        Còn lại: {formatCurrency(Math.max(budget.remainingAmount, 0))}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isDanger ? "bg-destructive" : isWarning ? "bg-amber-500" : "bg-success"
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold font-display">{editingBudget ? "Sửa ngân sách" : "Thêm ngân sách mới"}</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tên ngân sách</label>
                <input 
                  {...register("name")} 
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  placeholder="VD: Ăn uống, Giải trí..."
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Danh mục</label>
                <select
                  {...register("category")}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Số tiền phân bổ (VND)</label>
                <Controller
                  name="allocatedAmount"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="5.000.000"
                    />
                  )}
                />
                {errors.allocatedAmount && <p className="text-xs text-destructive">{errors.allocatedAmount.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Tháng</label>
                  <input 
                    type="number"
                    {...register("month")} 
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Năm</label>
                  <input 
                    type="number"
                    {...register("year")} 
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setIsDialogOpen(false); setEditingBudget(null); reset(); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted font-medium transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={editingBudget ? updateMutation.isPending : createMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {(editingBudget ? updateMutation.isPending : createMutation.isPending) ? "Đang lưu..." : (editingBudget ? "Cập nhật" : "Lưu ngân sách")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Dialog */}
      {isCategoryDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold font-display">Thêm danh mục mới</h2>
            </div>
            <form onSubmit={handleSubmitCat(onSubmitCategory)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tên danh mục</label>
                <input
                  {...registerCat("name")}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  placeholder="VD: Du lịch, Thú cưng..."
                />
                {catErrors.name && <p className="text-xs text-destructive">{catErrors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Màu sắc</label>
                <input
                  type="color"
                  {...registerCat("color")}
                  className="w-full h-10 rounded-xl border border-border cursor-pointer"
                />
              </div>
              {categoryError && <p className="text-xs text-destructive">{categoryError}</p>}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setIsCategoryDialogOpen(false); setCategoryError(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createCategoryMutation.isPending ? "Đang lưu..." : "Lưu danh mục"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
