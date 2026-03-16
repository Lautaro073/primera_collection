function parseBooleanFlag(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function isEcommerceEnabled(): boolean {
  return parseBooleanFlag(process.env.NEXT_PUBLIC_ECOMMERCE_ENABLED);
}
