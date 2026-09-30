export function formatMetric(
  value: number | null | undefined,
  locale: string,
  maximumFractionDigits = 1,
) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat(locale === "en" ? "en-IN" : locale, {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}
