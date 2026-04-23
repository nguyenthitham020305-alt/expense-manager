import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: vi });
  } catch (e) {
    return dateString;
  }
}

export function formatMonthYear(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MM/yyyy', { locale: vi });
  } catch (e) {
    return dateString;
  }
}
