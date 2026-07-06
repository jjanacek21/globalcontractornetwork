// GCN Equipment financing math. Illustrative only — not a credit offer.
export const APR = 0.129;

export function monthlyPayment(amountCents: number, months: number, apr = APR): number {
  const p = amountCents / 100;
  if (months <= 0 || p <= 0) return 0;
  const r = apr / 12;
  if (r === 0) return p / months;
  return (p * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1);
}

export const fmtUSD = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

export const fmtUSDPrecise = (dollars: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);
