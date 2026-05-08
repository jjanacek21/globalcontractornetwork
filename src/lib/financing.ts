/**
 * Simple loan amortization helpers for the Instant Quote financing estimates.
 * These are estimates only — not a credit offer.
 */

export interface FinancingTerm {
  months: number;
  apr: number; // annual percentage rate, e.g. 0.0999 for 9.99%
}

export const DEFAULT_APRS = [0.0699, 0.0999, 0.1499] as const;
export const DEFAULT_TERMS_MONTHS = [60, 120, 180] as const;

/**
 * Standard fixed-rate loan monthly payment.
 *   M = P * r / (1 - (1 + r)^-n)
 */
export function monthlyPayment(principal: number, apr: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = apr / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export function totalCost(principal: number, apr: number, months: number): number {
  return monthlyPayment(principal, apr, months) * months;
}

export function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
