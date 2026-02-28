"use client";

import {
  useDeferredValue,
  useEffect,
  useRef,
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

function isSameFile(left: File, right: File): boolean {
  return (
    left.name === right.name &&
    left.size === right.size &&
    left.lastModified === right.lastModified
  );
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
  existingProductImages: string[];
  imagePreviews: string[];
  isPending: boolean;
  categorySubmitting: boolean;
  productSubmitting: boolean;
  deleteDialogOpen: boolean;
  deleteDialogType: "category" | "product" | null;
  deleteDialogLabel: string;
  deleteDialogError: string;
  deleteSubmitting: boolean;
  categoryForm: CategoryFormState;
  productForm: ProductFormState;
  updateCategoryField: (field: keyof CategoryFormState, value: string) => void;
  updateProductField: (field: keyof ProductFormState, value: string | File[] | null) => void;
  handleImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  appendImageFiles: (files: File[]) => void;
  setPrimarySelectedImage: (index: number) => void;
  clearSelectedImages: () => void;
  resetCategoryForm: () => void;
  resetProductForm: () => void;
  beginCategoryEdit: (category: Category) => void;
  beginProductEdit: (product: Product) => void;
  submitCategory: (event: FormEvent<HTMLFormElement>) => void;
  submitProduct: (event: FormEvent<HTMLFormElement>) => void;
  requestCategoryDelete: (category: Category) => void;
  requestProductDelete: (product: Product) => void;
  closeDeleteDialog: () => void;
  confirmDelete: () => void;
  logout: () => void;
}

interface DeleteTarget {
  kind: "category" | "product";
  id: string;
  label: string;
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
  tipo_medida: "none",
  medidas: "",
  imagenes: [],
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
  const [existingProductImages, setExistingProductImages] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const imagePreviewsRef = useRef<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<
    "category-submit" | "product-submit" | "logout" | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

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
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      if (imagePreviewsRef.current.length > 0) {
        imagePreviewsRef.current.forEach((preview) => URL.revokeObjectURL(preview));
      }
    };
  }, []);

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
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function setFailure(message: string): void {
    setError(message);
    setNotice("");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
    value: string | File[] | null
  ): void {
    setProductForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function clearObjectPreview(): void {
    if (imagePreviews.length > 0) {
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
      imagePreviewsRef.current = [];
      setImagePreviews([]);
    }
  }

  function appendImageFiles(files: File[]): void {
    const validImages = files.filter((file) => file.type.startsWith("image/"));

    if (validImages.length === 0) {
      return;
    }

    const mergedFiles = [...productForm.imagenes];
    const nextPreviews = [...imagePreviews];

    for (const file of validImages) {
      if (mergedFiles.some((currentFile) => isSameFile(currentFile, file))) {
        continue;
      }

      mergedFiles.push(file);
      nextPreviews.push(URL.createObjectURL(file));
    }

    updateProductField("imagenes", mergedFiles);
    setImagePreviews(nextPreviews);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files ? Array.from(event.target.files) : [];
    appendImageFiles(files);
    event.target.value = "";
  }

  function setPrimarySelectedImage(index: number): void {
    if (index <= 0 || index >= productForm.imagenes.length || index >= imagePreviews.length) {
      return;
    }

    const nextFiles = [...productForm.imagenes];
    const nextPreviews = [...imagePreviews];
    const [primaryFile] = nextFiles.splice(index, 1);
    const [primaryPreview] = nextPreviews.splice(index, 1);

    nextFiles.unshift(primaryFile);
    nextPreviews.unshift(primaryPreview);

    updateProductField("imagenes", nextFiles);
    setImagePreviews(nextPreviews);
  }

  function clearSelectedImages(): void {
    clearObjectPreview();
    updateProductField("imagenes", []);
  }

  function resetCategoryForm(): void {
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setEditingCategoryId("");
  }

  function resetProductForm(): void {
    setProductForm(EMPTY_PRODUCT_FORM);
    setEditingProductId("");
    setExistingProductImages([]);
    clearObjectPreview();
  }

  function requestCategoryDelete(category: Category): void {
    setDeleteError("");
    setDeleteTarget({
      kind: "category",
      id: category.id_categoria,
      label: category.nombre_categoria,
    });
  }

  function requestProductDelete(product: Product): void {
    setDeleteError("");
    setDeleteTarget({
      kind: "product",
      id: product.id_producto,
      label: product.nombre,
    });
  }

  function closeDeleteDialog(): void {
    if (deleteSubmitting) {
      return;
    }

    setDeleteError("");
    setDeleteTarget(null);
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
    setExistingProductImages(product.imagenes);
    setProductForm({
      nombre: product.nombre || "",
      descripcion: product.descripcion || "",
      precio: String(product.precio ?? ""),
      id_categoria: product.id_categoria || "",
      stock: String(product.stock ?? ""),
      tag: product.tag || "",
      tipo_medida: product.tipo_medida || "none",
      medidas: product.medidas.join(", "),
      imagenes: [],
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
          formData.set("tipo_medida", productForm.tipo_medida);
          formData.set("medidas", productForm.medidas);

          for (const image of productForm.imagenes) {
            formData.append("imagenes", image);
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

  function confirmDelete(): void {
    if (!auth || !deleteTarget) {
      return;
    }

    const currentTarget = deleteTarget;
    setDeleteSubmitting(true);
    setDeleteError("");

    startTransition(() => {
      void (async () => {
        try {
          const endpoint =
            currentTarget.kind === "category"
              ? `/api/categorias/${currentTarget.id}`
              : `/api/productos/${currentTarget.id}`;
          const response = await authorizedFetch(auth, endpoint, {
            method: "DELETE",
          });
          const payload = await parseJson<unknown>(response);

          if (!response.ok) {
            throw new Error(
              getResponseErrorMessage(
                payload,
                currentTarget.kind === "category"
                  ? "No se pudo eliminar la categoria."
                  : "No se pudo eliminar el producto."
              )
            );
          }

          if (currentTarget.kind === "category" && editingCategoryId === currentTarget.id) {
            resetCategoryForm();
          }

          if (currentTarget.kind === "product" && editingProductId === currentTarget.id) {
            resetProductForm();
          }

          await loadCatalog(auth);
          setDeleteTarget(null);
          setSuccess(
            currentTarget.kind === "category"
              ? "Categoria eliminada correctamente."
              : "Producto eliminado correctamente."
          );
        } catch (currentError: unknown) {
          setDeleteError(
            isErrorWithMessage(currentError)
              ? currentError.message
              : currentTarget.kind === "category"
                ? "No se pudo eliminar la categoria."
                : "No se pudo eliminar el producto."
          );
        } finally {
          setDeleteSubmitting(false);
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
    existingProductImages,
    imagePreviews,
    isPending,
    categorySubmitting: pendingAction === "category-submit",
    productSubmitting: pendingAction === "product-submit",
    deleteDialogOpen: Boolean(deleteTarget),
    deleteDialogType: deleteTarget?.kind || null,
    deleteDialogLabel: deleteTarget?.label || "",
    deleteDialogError: deleteError,
    deleteSubmitting,
    categoryForm,
    productForm,
    updateCategoryField,
    updateProductField,
    handleImageChange,
    appendImageFiles,
    setPrimarySelectedImage,
    clearSelectedImages,
    resetCategoryForm,
    resetProductForm,
    beginCategoryEdit,
    beginProductEdit,
    submitCategory,
    submitProduct,
    requestCategoryDelete,
    requestProductDelete,
    closeDeleteDialog,
    confirmDelete,
    logout,
  };
}
