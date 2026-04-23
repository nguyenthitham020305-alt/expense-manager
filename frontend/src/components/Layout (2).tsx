import { ReactNode } from "react";
import { Sidebar, MobileNav } from "./Sidebar";
import { Bell, Search, User } from "lucide-react";
import { motion } from "framer-motion";

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col pb-20 md:pb-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 glass-panel border-b border-border/50 sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
          <h1 className="text-2xl font-display font-bold text-foreground">{title}</h1>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center relative">
              <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64"
              />
            </div>
            
            <button className="relative p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
            </button>
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent border-2 border-white shadow-sm flex items-center justify-center text-white cursor-pointer overflow-hidden">
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
