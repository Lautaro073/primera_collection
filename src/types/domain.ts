import type { IdTokenResult, User } from "firebase/auth";

export interface FirebaseDateLikeObject {
  toDate(): Date;
}

export type FirebaseDateLike = Date | string | FirebaseDateLikeObject | null | undefined;
export type ProductMeasureType = "none" | "ropa" | "calzado";

export interface RawProductVariantRecord {
  medida: string;
  stock: number | string | null;
  sku?: string | null;
}

export interface ProductVariant {
  medida: string;
  stock: number;
  sku?: string | null;
}

export interface ProductVariantFormState {
  medida: string;
  stock: string;
  sku: string;
}

export interface RawCategoryRecord {
  id: string;
  name: string;
  slug: string;
  createdAt?: FirebaseDateLike;
  updatedAt?: FirebaseDateLike;
}

export interface Category {
  id: string;
  id_categoria: string;
  nombre_categoria: string;
  slug: string;
  created_at: string | null;
}

export interface RawProductRecord {
  id: string;
  name: string;
  description: string;
  price: number | string | null;
  basePrice?: number | string | null;
  promoPrice?: number | string | null;
  promoEnabled?: boolean;
  categoryId: string | null;
  stock: number | string | null;
  tag: string | null;
  measureType: ProductMeasureType;
  measureOptions: string[];
  variants?: RawProductVariantRecord[];
  imageUrl: string | null;
  imagePath: string | null;
  imageUrls: string[];
  imagePaths: string[];
  createdAt?: FirebaseDateLike;
  updatedAt?: FirebaseDateLike;
}

export interface Product {
  id: string;
  id_producto: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precio_lista: number;
  precio_promocional: number | null;
  tiene_promocion: boolean;
  id_categoria: string | null;
  stock: number;
  tag: string | null;
  tipo_medida: ProductMeasureType;
  medidas: string[];
  variantes: ProductVariant[];
  imagen: string | null;
  imagenes: string[];
  image_url?: string | null;
  image_urls?: string[];
  image_path?: string | null;
  image_paths?: string[];
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductSearchResult {
  id_producto: string;
  nombre: string;
  descripcion: string;
  precio: number;
  precio_lista: number;
  precio_promocional: number | null;
  tiene_promocion: boolean;
  id_categoria: string | null;
  stock: number;
  medidas: string[];
  variantes: ProductVariant[];
  imagen: string | null;
  imagenes: string[];
}

export interface CategoryWithProducts extends Category {
  productos: Product[];
}

export interface CategoryFormState {
  nombre_categoria: string;
  slug: string;
}

export interface ProductFormState {
  nombre: string;
  descripcion: string;
  precio: string;
  precio_promocional: string;
  id_categoria: string;
  stock: string;
  tag: string;
  tipo_medida: ProductMeasureType;
  medidas: string;
  variantes: ProductVariantFormState[];
  imagenes: File[];
}

export interface ProductImageAsset {
  url: string;
  path: string | null;
}

export interface RawCustomerRecord {
  uid: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  dni: string;
  activeCartId?: string | null;
  defaultAddressId?: string | null;
  createdAt?: FirebaseDateLike;
  updatedAt?: FirebaseDateLike;
  lastLoginAt?: FirebaseDateLike;
}

export interface CustomerProfile {
  uid: string;
  email: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  dni: string;
  active_cart_id?: string | null;
  default_address_id?: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_login_at: string | null;
}

export interface CustomerProfileInput {
  email?: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dni?: string;
  activeCartId?: string | null;
  defaultAddressId?: string | null;
}

export type CustomerAddressLabel = "casa" | "trabajo" | "otro";

export interface RawCustomerAddressRecord {
  id: string;
  customerUid: string;
  label: CustomerAddressLabel;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
  countryCode: "AR";
  deliveryNotes: string;
  isDefault: boolean;
  createdAt?: FirebaseDateLike;
  updatedAt?: FirebaseDateLike;
  lastUsedAt?: FirebaseDateLike;
}

export interface CustomerAddress {
  id: string;
  customer_uid: string;
  label: CustomerAddressLabel;
  recipient_name: string;
  phone: string;
  line_1: string;
  line_2: string;
  city: string;
  province: string;
  postal_code: string;
  country_code: "AR";
  delivery_notes: string;
  is_default: boolean;
  created_at: string | null;
  updated_at: string | null;
  last_used_at: string | null;
}

export interface CustomerAddressInput {
  label?: CustomerAddressLabel;
  recipientName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  countryCode?: "AR";
  deliveryNotes?: string;
  isDefault?: boolean;
}

export interface CartItemRecord {
  productId: string;
  quantity: number;
  selectedMeasure?: string;
}

export interface RawCartRecord {
  id: string;
  items: CartItemRecord[];
  customerUid?: string | null;
  ownerType?: CartOwnerType;
  status?: CartStatus;
  mergedIntoCartId?: string | null;
  createdAt?: FirebaseDateLike;
  updatedAt?: FirebaseDateLike;
  lastActivityAt?: FirebaseDateLike;
}

export type CartOwnerType = "anonymous" | "customer";
export type CartStatus = "active" | "merged" | "abandoned";

export interface SerializedCartItem {
  clave: string;
  cantidad: number;
  id_producto: string;
  medida_seleccionada: string | null;
  stock: number;
  nombre: string;
  precio: number;
  precio_lista: number;
  precio_promocional: number | null;
  tiene_promocion: boolean;
  tag: string | null;
  imagen: string | null;
}

export interface CheckoutSessionItem {
  clave: string;
  cantidad: number;
  id_producto: string;
  imagen: string | null;
  medida_seleccionada: string | null;
  nombre: string;
  precio: number;
  precio_lista: number;
  subtotal: number;
  subtotal_lista: number;
  tiene_promocion: boolean;
}

export interface CheckoutSessionPricing {
  subtotal: number;
  subtotal_lista: number;
  descuentos_total: number;
  shipping_total: number | null;
  total: number | null;
}

export type ShippingQuoteProvider = "correo_argentino";
export type ShippingQuoteKind = "real" | "estimado";
export type ShippingDeliveryType = "domicilio" | "sucursal";
export type CheckoutFulfillmentType = "shipping" | "pickup";

export interface ShippingQuote {
  id: string;
  amount: number;
  currency: "ARS";
  delivery_type: ShippingDeliveryType;
  eta_max_days: number | null;
  eta_min_days: number | null;
  kind: ShippingQuoteKind;
  provider: ShippingQuoteProvider;
  service_code: string;
  service_name: string;
}

export interface CheckoutSessionShippingRequest {
  destination_postal_code: string;
  origin_postal_code: string;
  package_height_cm: number;
  package_length_cm: number;
  package_weight_grams: number;
  package_width_cm: number;
}

export interface CheckoutSessionShipping {
  destination_postal_code: string | null;
  fulfillment_type: CheckoutFulfillmentType;
  pickup_label: string | null;
  quotes: ShippingQuote[];
  request: CheckoutSessionShippingRequest | null;
  requires_address: boolean;
  selected_quote: ShippingQuote | null;
  selected_quote_id: string | null;
  status: "pending" | "quoted" | "selected" | "unavailable";
}

export interface CheckoutSessionSummary {
  id_checkout_session: string;
  cart_id: string;
  address_id: string | null;
  customer_uid: string;
  order_id?: string | null;
  status: "open" | "expired" | "converted";
  items: CheckoutSessionItem[];
  pricing: CheckoutSessionPricing;
  shipping: CheckoutSessionShipping;
  address: CustomerAddress | null;
  expires_at: string | null;
  updated_at: string | null;
}

export interface OrderItemSummary {
  clave: string;
  cantidad: number;
  id_producto: string;
  imagen: string | null;
  medida_seleccionada: string | null;
  nombre: string;
  precio: number;
  precio_lista: number;
  subtotal: number;
  subtotal_lista: number;
  tiene_promocion: boolean;
}

export interface OrderSummary {
  id_orden: string;
  customer_uid: string;
  checkout_session_id: string;
  cart_id: string;
  status: "pending_confirmation" | "confirmed" | "cancelled";
  payment_status: "unpaid";
  fulfillment_status: "unfulfilled";
  items: OrderItemSummary[];
  pricing: CheckoutSessionPricing;
  shipping: CheckoutSessionShipping;
  address: CustomerAddress | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CartExistsResponse {
  exists: boolean;
}

export interface CartIdResponse {
  id_carrito: string;
  owner_type?: CartOwnerType;
  restored?: boolean;
}

export interface DeleteResponse {
  deleted: true;
}

export interface AdminClaims {
  admin?: boolean;
  role?: string;
  [key: string]: unknown;
}

export interface AdminSession {
  user: User;
  token: string;
  claims: IdTokenResult["claims"];
}

export interface ErrorResponseBody {
  error: string;
  details?: string | null;
}

export interface MercadoPagoPreferenceInput {
  title: string;
  quantity: number;
  price: number;
}

export interface MercadoPagoPreferenceResponse {
  id: string;
  initPoint: string;
  raw: Record<string, unknown>;
}
