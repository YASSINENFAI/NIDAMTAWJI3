/**
 * Formats a number as Moroccan Dirham (MAD)
 * Examples:
 *   formatMAD(1500)    → "1.500,00 د.م."
 *   formatMAD(1500, true) → "1.500 د.م."
 */
export function formatMAD(amount: number, noDecimals = false): string {
  return new Intl.NumberFormat('ar-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: noDecimals ? 0 : 2,
    maximumFractionDigits: noDecimals ? 0 : 2,
  }).format(amount);
}

/** Short version: "1,500 د.م." — for cards and summaries */
export const fmtMAD = (n: number) => formatMAD(n, true);

/** Full version with decimals: "1,500.00 د.م." — for invoices */
export const fmtMADFull = (n: number) => formatMAD(n, false);
