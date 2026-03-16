import type { IdTokenResult, User } from "firebase/auth";

export interface FirebaseDateLikeObject {
  toDate(): Date;
}

export type FirebaseDateLike = Date | string | FirebaseDateLikeObject | null | undefined;
export type ProductMeasureType = "none" | "ropa" | "calzado";

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
  categoryId: string | null;
  stock: number | string | null;
  tag: string | null;
  measureType: ProductMeasureType;
  measureOptions: string[];
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
  id_categoria: string | null;
  stock: number;
  tag: string | null;
  tipo_medida: ProductMeasureType;
  medidas: string[];
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
  id_categoria: string | null;
  stock: number;
  medidas: string[];
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
  id_categoria: string;
  stock: string;
  tag: string;
  tipo_medida: ProductMeasureType;
  medidas: string;
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
  tag: string | null;
  imagen: string | null;
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
