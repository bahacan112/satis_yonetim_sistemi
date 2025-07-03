import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Rakamı yerel ayarlara göre para biçimine çevirir.
 *
 * @param value   Biçimlendirilecek sayı
 * @param currency ISO-4217 para birimi kodu — varsayılan “TRY”
 *
 * @example
 *   formatCurrency(1234.5)             // "€1.234,50"
 *   formatCurrency(1234.5, "USD")      // "$1,234.50"
 */
export function formatCurrency(value: number, currency = "TRY") {
  if (Number.isNaN(value)) return "€0,00";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
