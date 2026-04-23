import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useSavingsAccounts, useCreateSavingsAccount, useUpdateSavingsAccount } from "@/hooks/use-savings";
import { formatCurrency, cn } from "@/lib/format";
import { Plus, PiggyBank, Target, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const savingSchema = z.object({
  name: z.string().min(1, "Tên không được để trống"),
  balance: z.coerce.number().min(0, "Số dư không hợp lệ"),
  targetAmount: z.coerce.number().optional().or(z.literal(0)),
  description: z.string().optional()
});

type SavingFormData = z.infer<typeof savingSchema>;

export default function Savings() {
  const { data: accounts, isLoading } = useSavingsAccounts();
  const createMutation = useCreateSavingsAccount();
  const updateMutation = useUpdateSavingsAccount();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'deposit'|'withdraw'>('deposit');
  const [actionAmount, setActionAmount] = useState("");

  const { register, handleSubmit, reset } = useForm<SavingFormData>({
    resolver: zodResolver(savingSchema),
    defaultValues: { balance: 0, targetAmount: 0 }
  });

  const onSubmitCreate = (data: SavingFormData) => {
    createMutation.mutate({ data }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        reset();
      }
    });
  };

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount || !actionAmount) return;
    
    const account = accounts?.find(a => a.id === activeAccount);
    if (!account) return;

    const amt = parseFloat(actionAmount);
    if (isNaN(amt) || amt <= 0) return;

    let newBalance = account.balance;
    if (actionType === 'deposit') newBalance += amt;
    if (actionType === 'withdraw') {
      if (amt > newBalance) return alert("Số dư không đủ!");
      newBalance -= amt;
    }

    updateMutation.mutate({ 
      id: activeAccount, 
      data: { balance: newBalance } 
    }, {
      onSuccess: () => {
        setActiveAccount(null);
        setActionAmount("");
      }
    });
  };

  return (
    <Layout title="Tài khoản Tiết kiệm">
      <div className="flex justify-between items-center mb-8">
        <p className="text-muted-foreground">Tích lũy cho tương lai. Mỗi đồng tiết kiệm là một hạt giống sinh lời.</p>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all flex items-center gap-2 hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Mở sổ tiết kiệm
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {accounts?.map((acc) => {
          const hasTarget = acc.targetAmount && acc.targetAmount > 0;
          const percent = hasTarget ? Math.min((acc.balance / acc.targetAmount!) * 100, 100) : 0;
          
          return (
            <div key={acc.id} className="bg-gradient-to-br from-card to-card rounded-2xl p-6 shadow-lg shadow-black/5 border border-border/50 relative overflow-hidden">
              {/* Decorative bg */}
              <PiggyBank className="absolute -bottom-6 -right-6 w-32 h-32 text-primary/5 -rotate-12" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{acc.name}</h3>
                    {acc.description && <p className="text-sm text-muted-foreground mt-1">{acc.description}</p>}
                  </div>
                  <div className="bg-primary/10 p-2.5 rounded-xl">
                    <PiggyBank className="w-6 h-6 text-primary" />
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Số dư hiện tại</p>
                  <h4 className="text-3xl font-display font-bold text-foreground text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                    {formatCurrency(acc.balance)}
                  </h4>
                </div>

                {hasTarget && (
                  <div className="mb-6 bg-muted/50 p-4 rounded-xl border border-border/50">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-muted-foreground flex items-center gap-1">
                        <Target className="w-4 h-4" /> Mục tiêu
                      </span>
                      <span className="font-bold">{formatCurrency(acc.targetAmount!)}</span>
                    </div>
                    <div className="w-full h-2.5 bg-background rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success rounded-full transition-all duration-1000"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-right mt-1 text-xs text-muted-foreground font-medium">
                      Đạt {percent.toFixed(1)}%
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => { setActiveAccount(acc.id); setActionType('deposit'); }}
                    className="flex-1 py-2 bg-success/10 text-success hover:bg-success hover:text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowDownCircle className="w-4 h-4" /> Nạp thêm
                  </button>
                  <button 
                    onClick={() => { setActiveAccount(acc.id); setActionType('withdraw'); }}
                    className="flex-1 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowUpCircle className="w-4 h-4" /> Rút tiền
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold font-display">Mở sổ tiết kiệm</h2>
            </div>
            <form onSubmit={handleSubmit(onSubmitCreate)} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tên khoản tiết kiệm</label>
                <input {...register("name")} className="w-full px-4 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none" placeholder="VD: Mua xe, Đám cưới..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Số dư ban đầu (VND)</label>
                <input type="number" {...register("balance")} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mục tiêu (VND - Tùy chọn)</label>
                <input type="number" {...register("targetAmount")} className="w-full px-4 py-2.5 rounded-xl border border-border outline-none" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted font-medium transition-colors">Hủy</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors">Hoàn tất</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Dialog (Deposit/Withdraw) */}
      {activeAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold font-display">
                {actionType === 'deposit' ? 'Nạp tiền vào sổ' : 'Rút tiền khỏi sổ'}
              </h2>
            </div>
            <form onSubmit={handleAction} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Số tiền (VND)</label>
                <input 
                  type="number" 
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="w-full px-4 py-3 text-lg font-bold rounded-xl border border-border focus:ring-2 focus:ring-primary/20 outline-none" 
                  placeholder="0" 
                  autoFocus
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setActiveAccount(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border hover:bg-muted font-medium transition-colors">Hủy</button>
                <button 
                  type="submit" 
                  disabled={updateMutation.isPending || !actionAmount} 
                  className={cn("flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition-colors", actionType === 'deposit' ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90")}
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
