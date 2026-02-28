"use client";

import {
  useDeferredValue,
  useEffect,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { type Auth, onIdTokenChanged, signOut } from "firebase/auth";
import type { AdminTab } from "@/components/admin/AdminTabs";
import type {
  Category,
  CategoryFormState,
  ErrorResponseBody,
  Product,
  ProductFormState,
} from "@/types/domain";
import { isErrorWithMessage, isRecord } from "@/types/shared";
import { getFirebaseClientAuth } from "@/lib/firebase/auth";
import { authorizedFetch, getAdminSession } from "@/lib/admin/client";

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function getResponseErrorMessage(payload: unknown, fallback: string): string {
  if (isRecord(payload) && typeof payload.error === "string") {
    return payload.error;
  }

  return fallback;
}

function isCategoryArray(payload: unknown): payload is Category[] {
  return Array.isArray(payload);
}

function isProductArray(payload: unknown): payload is Product[] {
  return Array.isArray(payload);
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

interface UseAdminCatalogResult {
  booting: boolean;
  activeTab: AdminTab;
  setActiveTab: (value: string) => void;
  sessionEmail: string;
  error: string;
  notice: string;
  categories: Category[];
  products: Product[];
  filteredProducts: Product[];
  productFilter: string;
  setProductFilter: (value: string) => void;
  editingCategoryId: string;
  editingProductId: string;
  existingProductImage: string;
  imagePreview: string;
  isPending: boolean;
  categorySubmitting: boolean;
  productSubmitting: boolean;
  categoryForm: CategoryFormState;
  productForm: ProductFormState;
  updateCategoryField: (field: keyof CategoryFormState, value: string) => void;
  updateProductField: (field: keyof ProductFormState, value: string | File | null) => void;
  handleImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  resetCategoryForm: () => void;
  resetProductForm: () => void;
  beginCategoryEdit: (category: Category) => void;
  beginProductEdit: (product: Product) => void;
  submitCategory: (event: FormEvent<HTMLFormElement>) => void;
  submitProduct: (event: FormEvent<HTMLFormElement>) => void;
  deleteCategory: (categoryId: string) => void;
  deleteProduct: (productId: string) => void;
  logout: () => void;
}

const EMPTY_CATEGORY_FORM: CategoryFormState = {
  nombre_categoria: "",
  slug: "",
};

const EMPTY_PRODUCT_FORM: ProductFormState = {
  nombre: "",
  descripcion: "",
  precio: "",
  id_categoria: "",
  stock: "",
  tag: "",
  imagen: null,
};

export function useAdminCatalog(): UseAdminCatalogResult {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTabState] = useState<AdminTab>("products");
  const [sessionEmail, setSessionEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productFilter, setProductFilter] = useState("");
  const deferredProductFilter = useDeferredValue(productFilter);
  const [editingCategoryId, setEditingCategoryId] = useState("");
  const [editingProductId, setEditingProductId] = useState("");
  const [existingProductImage, setExistingProductImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<
    "category-submit" | "product-submit" | "category-delete" | "product-delete" | "logout" | null
  >(null);

  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [productForm, setProductForm] = useState<ProductFormState>(EMPTY_PRODUCT_FORM);

  useEffect(() => {
    let unsubscribe: () => void = () => undefined;

    startTransition(() => {
      void (async () => {
        try {
          const authInstance = await getFirebaseClientAuth();
          setAuth(authInstance);

          unsubscribe = onIdTokenChanged(authInstance, async (user) => {
            if (!user) {
              router.replace("/admin/login");
              return;
            }

            const session = await getAdminSession(authInstance, user);

            if (!session) {
              await signOut(authInstance);
              router.replace("/admin/login");
              return;
            }

            setSessionEmail(session.user.email || "admin");

            try {
              await loadCatalog(authInstance);
            } catch (currentError: unknown) {
              setFailure(
                isErrorWithMessage(currentError)
                  ? currentError.message
                  : "No se pudo cargar el catalogo."
              );
            }

            setBooting(false);
          });
        } catch (currentError: unknown) {
          setError(
            isErrorWithMessage(currentError)
              ? currentError.message
              : "No se pudo inicializar el panel."
          );
          setBooting(false);
        }
      })();
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setNotice("");
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  async function loadCatalog(currentAuth?: Auth): Promise<void> {
    const resolvedAuth = currentAuth ?? auth;

    if (!resolvedAuth) {
      return;
    }

    setError("");

    const [categoriesResponse, productsResponse] = await Promise.all([
      authorizedFetch(resolvedAuth, "/api/categorias"),
      authorizedFetch(resolvedAuth, "/api/productos/all"),
    ]);

    const [categoriesPayload, productsPayload] = await Promise.all([
      parseJson<Category[] | ErrorResponseBody>(categoriesResponse),
      parseJson<Product[] | ErrorResponseBody>(productsResponse),
    ]);

    if (!categoriesResponse.ok) {
      throw new Error(
        getResponseErrorMessage(
          categoriesPayload,
          "No se pudieron cargar las categorias."
        )
      );
    }

    if (!productsResponse.ok) {
      throw new Error(
        getResponseErrorMessage(
          productsPayload,
          "No se pudieron cargar los productos."
        )
      );
    }

    if (!isCategoryArray(categoriesPayload) || !isProductArray(productsPayload)) {
      throw new Error("La API devolvio un formato invalido.");
    }

    setCategories(categoriesPayload);
    setProducts(productsPayload);
  }

  function setSuccess(message: string): void {
    setNotice(message);
    setError("");
  }

  function setFailure(message: string): void {
    setError(message);
    setNotice("");
  }

  function updateCategoryField(
    field: keyof CategoryFormState,
    value: string
  ): void {
    setCategoryForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateProductField(
    field: keyof ProductFormState,
    value: string | File | null
  ): void {
    setProductForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function clearObjectPreview(): void {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview("");
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] || null;

    clearObjectPreview();
    updateProductField("imagen", file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  }

  function resetCategoryForm(): void {
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setEditingCategoryId("");
  }

  function resetProductForm(): void {
    setProductForm(EMPTY_PRODUCT_FORM);
    setEditingProductId("");
    setExistingProductImage("");
    clearObjectPreview();
  }

  function beginCategoryEdit(category: Category): void {
    setActiveTabState("categories");
    setEditingCategoryId(category.id_categoria);
    setCategoryForm({
      nombre_categoria: category.nombre_categoria || "",
      slug: "",
    });
    setSuccess("Categoria cargada para editar.");
  }

  function beginProductEdit(product: Product): void {
    setActiveTabState("products");
    setEditingProductId(product.id_producto);
    setExistingProductImage(product.imagen || "");
    setProductForm({
      nombre: product.nombre || "",
      descripcion: product.descripcion || "",
      precio: String(product.precio ?? ""),
      id_categoria: product.id_categoria || "",
      stock: String(product.stock ?? ""),
      tag: product.tag || "",
      imagen: null,
    });
    clearObjectPreview();
    setSuccess("Producto cargado para editar.");
  }

  function submitCategory(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!auth) {
      return;
    }

    setPendingAction("category-submit");

    startTransition(() => {
      void (async () => {
        try {
          const endpoint = editingCategoryId
            ? `/api/categorias/${editingCategoryId}`
            : "/api/categorias";

          const response = await authorizedFetch(auth, endpoint, {
            method: editingCategoryId ? "PUT" : "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nombre_categoria: categoryForm.nombre_categoria,
            }),
          });

          const payload = await parseJson<unknown>(response);

          if (!response.ok) {
            throw new Error(
              getResponseErrorMessage(payload, "No se pudo guardar la categoria.")
            );
          }

          const wasEditing = Boolean(editingCategoryId);
          resetCategoryForm();
          await loadCatalog(auth);
          setSuccess(
            wasEditing
              ? "Categoria actualizada correctamente."
              : "Categoria creada correctamente."
          );
        } catch (currentError: unknown) {
          setFailure(
            isErrorWithMessage(currentError)
              ? currentError.message
              : "No se pudo guardar la categoria."
          );
        } finally {
          setPendingAction(null);
        }
      })();
    });
  }

  function submitProduct(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!auth) {
      return;
    }

    setPendingAction("product-submit");

    startTransition(() => {
      void (async () => {
        try {
          const formData = new FormData();
          formData.set("nombre", productForm.nombre);
          formData.set("descripcion", productForm.descripcion);
          formData.set("precio", productForm.precio);
          formData.set("id_categoria", productForm.id_categoria);
          formData.set("stock", productForm.stock);
          formData.set("tag", productForm.tag);

          if (productForm.imagen) {
            formData.set("imagen", productForm.imagen);
          }

          const endpoint = editingProductId
            ? `/api/productos/${editingProductId}`
            : "/api/productos";

          const response = await authorizedFetch(auth, endpoint, {
            method: editingProductId ? "PUT" : "POST",
            body: formData,
          });

          const payload = await parseJson<unknown>(response);

          if (!response.ok) {
            throw new Error(
              getResponseErrorMessage(payload, "No se pudo guardar el producto.")
            );
          }

          const wasEditing = Boolean(editingProductId);
          resetProductForm();
          await loadCatalog(auth);
          setSuccess(
            wasEditing
              ? "Producto actualizado correctamente."
              : "Producto creado correctamente."
          );
        } catch (currentError: unknown) {
          setFailure(
            isErrorWithMessage(currentError)
              ? currentError.message
              : "No se pudo guardar el producto."
          );
        } finally {
          setPendingAction(null);
        }
      })();
    });
  }

  function deleteCategory(categoryId: string): void {
    if (!auth || !window.confirm("Se eliminara la categoria. Continuar?")) {
      return;
    }

    setPendingAction("category-delete");

    startTransition(() => {
      void (async () => {
        try {
          const response = await authorizedFetch(auth, `/api/categorias/${categoryId}`, {
            method: "DELETE",
          });
          const payload = await parseJson<unknown>(response);

          if (!response.ok) {
            throw new Error(
              getResponseErrorMessage(payload, "No se pudo eliminar la categoria.")
            );
          }

          if (editingCategoryId === categoryId) {
            resetCategoryForm();
          }

          await loadCatalog(auth);
          setSuccess("Categoria eliminada correctamente.");
        } catch (currentError: unknown) {
          setFailure(
            isErrorWithMessage(currentError)
              ? currentError.message
              : "No se pudo eliminar la categoria."
          );
        } finally {
          setPendingAction(null);
        }
      })();
    });
  }

  function deleteProduct(productId: string): void {
    if (!auth || !window.confirm("Se eliminara el producto. Continuar?")) {
      return;
    }

    setPendingAction("product-delete");

    startTransition(() => {
      void (async () => {
        try {
          const response = await authorizedFetch(auth, `/api/productos/${productId}`, {
            method: "DELETE",
          });
          const payload = await parseJson<unknown>(response);

          if (!response.ok) {
            throw new Error(
              getResponseErrorMessage(payload, "No se pudo eliminar el producto.")
            );
          }

          if (editingProductId === productId) {
            resetProductForm();
          }

          await loadCatalog(auth);
          setSuccess("Producto eliminado correctamente.");
        } catch (currentError: unknown) {
          setFailure(
            isErrorWithMessage(currentError)
              ? currentError.message
              : "No se pudo eliminar el producto."
          );
        } finally {
          setPendingAction(null);
        }
      })();
    });
  }

  function logout(): void {
    if (!auth) {
      return;
    }

    setPendingAction("logout");

    startTransition(() => {
      void (async () => {
        try {
          await signOut(auth);
          router.replace("/admin/login");
        } finally {
          setPendingAction(null);
        }
      })();
    });
  }

  function setActiveTab(value: string): void {
    if (value === "products" || value === "categories") {
      setActiveTabState(value);
    }
  }

  const normalizedFilter = normalizeText(deferredProductFilter);
  const filteredProducts = products.filter((product) =>
    normalizeText(product.nombre).includes(normalizedFilter)
  );

  return {
    booting,
    activeTab,
    setActiveTab,
    sessionEmail,
    error,
    notice,
    categories,
    products,
    filteredProducts,
    productFilter,
    setProductFilter,
    editingCategoryId,
    editingProductId,
    existingProductImage,
    imagePreview,
    isPending,
    categorySubmitting: pendingAction === "category-submit",
    productSubmitting: pendingAction === "product-submit",
    categoryForm,
    productForm,
    updateCategoryField,
    updateProductField,
    handleImageChange,
    resetCategoryForm,
    resetProductForm,
    beginCategoryEdit,
    beginProductEdit,
    submitCategory,
    submitProduct,
    deleteCategory,
    deleteProduct,
    logout,
  };
}
