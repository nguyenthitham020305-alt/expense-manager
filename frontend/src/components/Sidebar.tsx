import { Link, useLocation } from "wouter";
import { LayoutDashboard, Wallet, ArrowRightLeft, PiggyBank, LogOut, Plus, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/format";
import { AddTransactionDialog } from "./AddTransactionDialog";

const navItems = [
  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Ngân sách", href: "/budgets", icon: Wallet },
  { name: "Giao dịch", href: "/transactions", icon: ArrowRightLeft },
  { name: "Tiết kiệm", href: "/savings", icon: PiggyBank },
  { name: "Báo cáo", href: "/reports", icon: BarChart3 },
  { name: "Cài đặt", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border h-screen sticky top-0 flex flex-col hidden md:flex">
      <div className="h-20 flex items-center justify-center border-b border-border/50">
        <img src="/images/logo.png" alt="Monetra" className="h-20 w-auto" />
      </div>

      <div className="flex-1 py-6 px-4 flex flex-col gap-2">
        <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2 px-2">Menu</div>
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
              {item.name}
            </Link>
          );
        })}

        {/* Quick Add Divider */}
        <div className="mt-4 mb-2">
          <div className="text-xs font-semibold text-muted-foreground tracking-wider uppercase px-2 mb-3">Thêm nhanh</div>
          <AddTransactionDialog
            trigger={
              <button className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-semibold text-sm transition-all duration-200 border border-primary/20 hover:border-primary group">
                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Thêm giao dịch
              </button>
            }
          />
        </div>
      </div>

      <div className="p-4 border-t border-border/50">
        <button className="flex items-center gap-3 px-3 py-3 w-full rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors duration-200 font-medium group">
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 px-2 py-2 flex justify-between items-center pb-safe">
      {navItems.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className={cn("w-6 h-6", isActive && "fill-primary/10")} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
      {/* Mobile quick add */}
      <AddTransactionDialog
        trigger={
          <button className="flex flex-col items-center gap-1 p-2 rounded-lg text-primary">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
              <Plus className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-[10px] font-medium">Thêm</span>
          </button>
        }
      />
    </div>
  );
}
