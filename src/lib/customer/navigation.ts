export const DEFAULT_CUSTOMER_REDIRECT_PATH = "/mi-cuenta";

export function resolveCustomerNextPath(
  value: string | string[] | undefined
): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate) {
    return DEFAULT_CUSTOMER_REDIRECT_PATH;
  }

  const normalized = candidate.trim();

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return DEFAULT_CUSTOMER_REDIRECT_PATH;
  }

  return normalized;
}
