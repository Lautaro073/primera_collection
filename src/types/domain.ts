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
  image_url: string | null;
  image_urls: string[];
  image_path: string | null;
  image_paths: string[];
  created_at: string | null;
  updated_at: string | null;
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

export interface CartItemRecord {
  productId: string;
  quantity: number;
}

export interface RawCartRecord {
  id: string;
  items: CartItemRecord[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SerializedCartItem {
  cantidad: number;
  id_producto: string;
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
