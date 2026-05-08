/**
 * Loan helpers and real lender catalog for the Instant Quote financing estimates.
 * Estimates only — not a credit offer.
 */

export interface FinancingTerm {
  months: number;
  apr: number;
}

export type FinanceLender = "Service Finance" | "PACE / YGreen" | "Self Finance";

export interface FinanceProduct {
  id: string;
  lender: FinanceLender;
  label: string;
  apr: number;       // 0.0499 = 4.99%
  termMonths: number; // 0 = N/A (cash)
  dealerFee: number;  // 0.08 = 8% added on top of cash price
  description?: string;
}

export const FINANCE_PRODUCTS: FinanceProduct[] = [
  // Service Finance
  { id: "sf-499-12",  lender: "Service Finance", label: "4.99% APR · 12 yr", apr: 0.0499, termMonths: 144, dealerFee: 0.08 },
  { id: "sf-599-20",  lender: "Service Finance", label: "5.99% APR · 20 yr", apr: 0.0599, termMonths: 240, dealerFee: 0.08 },
  { id: "sf-699-15",  lender: "Service Finance", label: "6.99% APR · 15 yr", apr: 0.0699, termMonths: 180, dealerFee: 0.03 },
  // PACE / YGreen
  { id: "pace-849-10", lender: "PACE / YGreen", label: "8.49% APR · 10 yr", apr: 0.0849, termMonths: 120, dealerFee: 0.10 },
  { id: "pace-849-15", lender: "PACE / YGreen", label: "8.49% APR · 15 yr", apr: 0.0849, termMonths: 180, dealerFee: 0.10 },
  { id: "pace-849-20", lender: "PACE / YGreen", label: "8.49% APR · 20 yr", apr: 0.0849, termMonths: 240, dealerFee: 0.10 },
  // Self Finance
  { id: "self-cash",  lender: "Self Finance", label: "Cash / personal loan (no fee)", apr: 0, termMonths: 0, dealerFee: 0 },
];

export const DEFAULT_FINANCE_PRODUCT_ID = "sf-499-12";

/** Net-up cash price so contractor receives full amount after lender's dealer fee. */
export function financedPrice(cashPrice: number, dealerFee: number): number {
  if (dealerFee <= 0 || dealerFee >= 1) return cashPrice;
  return cashPrice / (1 - dealerFee);
}

/** Standard fixed-rate loan monthly payment. */
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
