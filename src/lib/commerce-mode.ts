import { createHttpError } from "@/lib/api/errors";

export type CommerceFeature =
  | "ecommerce"
  | "checkout"
  | "userAccounts"
  | "shippingQuotes"
  | "discounts";

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

function resolveFeatureFlag(flagValue: string | undefined): boolean {
  if (!isEcommerceEnabled()) {
    return false;
  }

  if (flagValue === undefined) {
    return true;
  }

  return parseBooleanFlag(flagValue);
}

export function isCheckoutEnabled(): boolean {
  return resolveFeatureFlag(process.env.NEXT_PUBLIC_ENABLE_CHECKOUT);
}

export function isUserAccountsEnabled(): boolean {
  return resolveFeatureFlag(process.env.NEXT_PUBLIC_ENABLE_USER_ACCOUNTS);
}

export function isShippingQuotesEnabled(): boolean {
  return resolveFeatureFlag(process.env.NEXT_PUBLIC_ENABLE_SHIPPING_QUOTES);
}

export function isDiscountsEnabled(): boolean {
  return resolveFeatureFlag(process.env.NEXT_PUBLIC_ENABLE_DISCOUNTS);
}

export function getCommerceFlags(): Record<CommerceFeature, boolean> {
  return {
    ecommerce: isEcommerceEnabled(),
    checkout: isCheckoutEnabled(),
    userAccounts: isUserAccountsEnabled(),
    shippingQuotes: isShippingQuotesEnabled(),
    discounts: isDiscountsEnabled(),
  };
}

export function ensureCommerceFeatureEnabled(
  feature: Exclude<CommerceFeature, "ecommerce">,
  message?: string
): void {
  const flags = getCommerceFlags();

  if (!flags[feature]) {
    throw createHttpError(
      404,
      message || `La funcionalidad ${feature} no esta habilitada en este modo.`
    );
  }
}
