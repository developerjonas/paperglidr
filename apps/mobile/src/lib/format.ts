/**
 * The website's formatting rules (apps/web/src/lib/formatters.ts), so the
 * app shows the same thing: "Free", "Rs 1,999", en-IN grouping (1,00,000).
 */
export function formatPrice(amount: number) {
  if (amount === 0) return 'Free';
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '-' : ''}Rs ${formatter.format(Math.abs(amount))}`;
}

export function formatPlural(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatRating(rating: number) {
  return rating.toFixed(1);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}
