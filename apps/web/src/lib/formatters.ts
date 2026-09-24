export function formatPlural(
  count: number,
  { singular, plural }: { singular: string; plural: string },
  { includeCount = true } = {}
) {
  const word = count === 1 ? singular : plural

  return includeCount ? `${count} ${word}` : word
}

// Prices are in Nepalese rupees: "Rs 1,999", "Rs 1,999.50", "-Rs 500".
// en-IN grouping (1,00,000) is the convention in Nepal too.
export function formatPrice(amount: number, { showZeroAsNumber = false } = {}) {
  if (amount === 0 && !showZeroAsNumber) return "Free"
  const formatter = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })
  return `${amount < 0 ? "-" : ""}Rs ${formatter.format(Math.abs(amount))}`
}

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatDate(date: Date) {
  return DATE_FORMATTER.format(date)
}

export function formatNumber(
  number: number,
  options?: Intl.NumberFormatOptions
) {
  const formatter = new Intl.NumberFormat(undefined, options)
  return formatter.format(number)
}
