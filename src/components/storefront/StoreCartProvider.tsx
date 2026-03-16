"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onIdTokenChanged } from "firebase/auth";
import type { SerializedCartItem } from "@/types/domain";
import { getFirebaseClientAuth } from "@/lib/firebase/auth";
import { isUserAccountsEnabled } from "@/lib/commerce-mode";
import { clearCustomerSession, persistCustomerSession } from "@/lib/customer/client";

const CART_STORAGE_KEY = "primera_collection_cart_id";

type CartOwnerType = "anonymous" | "customer";

function buildCartLineKey(
  productId: string,
  selectedMeasure?: string | null
): string {
  return `${productId}::${selectedMeasure?.trim() || ""}`;
}

interface CartMutationResponse {
  items: SerializedCartItem[];
}

interface CartSessionResponse {
  id_carrito: string;
  items?: SerializedCartItem[];
  merged?: boolean;
  owner_type?: CartOwnerType;
  restored?: boolean;
}

interface StoreCartContextValue {
  cartId: string;
  items: SerializedCartItem[];
  getProductQuantity: (productId: string) => number;
  itemCount: number;
  totalAmount: number;
  isReady: boolean;
  isLoading: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (productId: string, quantity?: number, selectedMeasure?: string | null) => Promise<void>;
  updateItemQuantity: (
    productId: string,
    quantity: number,
    selectedMeasure?: string | null
  ) => Promise<void>;
  removeItem: (productId: string, selectedMeasure?: string | null) => Promise<void>;
}

const StoreCartContext = createContext<StoreCartContextValue | null>(null);

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "No se pudo actualizar el carrito.";
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function ensureCart(cartId: string): Promise<SerializedCartItem[]> {
  const response = await fetch(`/api/carrito/${encodeURIComponent(cartId)}`, {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("No se pudo leer el carrito.");
  }

  return parseJson<SerializedCartItem[]>(response);
}

async function requestCartSession(
  cartId: string | null
): Promise<CartSessionResponse> {
  const response = await fetch("/api/session/cart", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ id_carrito: cartId }),
  });

  if (!response.ok) {
    throw new Error("No se pudo inicializar el carrito.");
  }

  return parseJson<CartSessionResponse>(response);
}

interface StoreCartProviderProps {
  children: ReactNode;
}

export function StoreCartProvider({ children }: StoreCartProviderProps) {
  const [cartId, setCartId] = useState("");
  const [items, setItems] = useState<SerializedCartItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [ownerType, setOwnerType] = useState<CartOwnerType>("anonymous");

  const hydrateCart = useCallback((session: CartSessionResponse): void => {
    window.localStorage.setItem(CART_STORAGE_KEY, session.id_carrito);
    setCartId(session.id_carrito);
    setItems(session.items || []);
    setOwnerType(session.owner_type || "anonymous");
  }, []);

  const initializeCart = useCallback(async () => {
    if (typeof window === "undefined") {
      return;
    }

    setIsLoading(true);

    try {
      const storedCartId = window.localStorage.getItem(CART_STORAGE_KEY);
      const initializedCart = await requestCartSession(storedCartId);
      hydrateCart(initializedCart);

      if (!initializedCart.items && initializedCart.restored) {
        const storedItems = await ensureCart(initializedCart.id_carrito);
        setItems(storedItems);
      }
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }, [hydrateCart]);

  useEffect(() => {
    void initializeCart();
  }, [initializeCart]);

  useEffect(() => {
    if (!isUserAccountsEnabled()) {
      return;
    }

    let unsubscribe: () => void = () => undefined;

    void (async () => {
      const auth = await getFirebaseClientAuth();

      unsubscribe = onIdTokenChanged(auth, async (user) => {
        if (typeof window === "undefined") {
          return;
        }

        const storedCartId = window.localStorage.getItem(CART_STORAGE_KEY);

        try {
          setIsLoading(true);

          if (user) {
            await persistCustomerSession(user);
          } else if (ownerType === "customer") {
            await clearCustomerSession();
          }

          const nextCart = await requestCartSession(storedCartId);
          hydrateCart(nextCart);
        } catch {
          if (!user) {
            window.localStorage.removeItem(CART_STORAGE_KEY);
          }
        } finally {
          setIsLoading(false);
          setIsReady(true);
        }
      });
    })();

    return () => unsubscribe();
  }, [hydrateCart, ownerType]);

  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const addItem = useCallback(
    async (
      productId: string,
      quantity: number = 1,
      selectedMeasure?: string | null
    ) => {
      if (!cartId) {
        throw new Error("El carrito todavia no esta listo.");
      }

      setIsLoading(true);

      try {
        const response = await fetch(`/api/carrito/${encodeURIComponent(cartId)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({
            id_producto: productId,
            cantidad: quantity,
            medida: selectedMeasure || null,
          }),
        });

        const payload = await parseJson<CartMutationResponse | { error?: string }>(response);

        if (!response.ok || !("items" in payload)) {
          throw new Error(
            "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "No se pudo agregar el producto al carrito."
          );
        }

        setItems(payload.items);
        setIsDrawerOpen(true);
      } finally {
        setIsLoading(false);
      }
    },
    [cartId]
  );

  const updateItemQuantity = useCallback(
    async (
      productId: string,
      quantity: number,
      selectedMeasure?: string | null
    ) => {
      if (!cartId) {
        throw new Error("El carrito todavia no esta listo.");
      }

      if (quantity <= 0) {
        const targetKey = buildCartLineKey(productId, selectedMeasure);
        const searchParams = new URLSearchParams();

        if (selectedMeasure) {
          searchParams.set("medida", selectedMeasure);
        }

        const response = await fetch(
          `/api/carrito/${encodeURIComponent(cartId)}/${encodeURIComponent(productId)}${
            searchParams.size > 0 ? `?${searchParams.toString()}` : ""
          }`,
          {
            method: "DELETE",
            credentials: "same-origin",
          }
        );
        const payload = await parseJson<{ error?: string }>(response);

        if (!response.ok) {
          throw new Error(
            typeof payload.error === "string"
              ? payload.error
              : "No se pudo eliminar el producto."
          );
        }

        setItems((current) =>
          current.filter((item) => item.clave !== targetKey)
        );
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/carrito/${encodeURIComponent(cartId)}/${encodeURIComponent(productId)}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify({
              cantidad: quantity,
              medida: selectedMeasure || null,
            }),
          }
        );

        const payload = await parseJson<CartMutationResponse | { error?: string }>(response);

        if (!response.ok || !("items" in payload)) {
          throw new Error(
            "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "No se pudo actualizar la cantidad."
          );
        }

        setItems(payload.items);
      } finally {
        setIsLoading(false);
      }
    },
    [cartId]
  );

  const removeItem = useCallback(
    async (productId: string, selectedMeasure?: string | null) => {
      if (!cartId) {
        throw new Error("El carrito todavia no esta listo.");
      }

      setIsLoading(true);

      try {
        const targetKey = buildCartLineKey(productId, selectedMeasure);
        const searchParams = new URLSearchParams();

        if (selectedMeasure) {
          searchParams.set("medida", selectedMeasure);
        }

        const response = await fetch(
          `/api/carrito/${encodeURIComponent(cartId)}/${encodeURIComponent(productId)}${
            searchParams.size > 0 ? `?${searchParams.toString()}` : ""
          }`,
          {
            method: "DELETE",
            credentials: "same-origin",
          }
        );

        const payload = await parseJson<{ error?: string }>(response);

        if (!response.ok) {
          throw new Error(
            typeof payload.error === "string"
              ? payload.error
              : "No se pudo eliminar el producto."
          );
        }

        setItems((current) =>
          current.filter((item) => item.clave !== targetKey)
        );
      } finally {
        setIsLoading(false);
      }
    },
    [cartId]
  );

  const quantityByProductId = useMemo<Record<string, number>>(() => {
    const quantities: Record<string, number> = {};

    for (const item of items) {
      quantities[item.id_producto] = (quantities[item.id_producto] || 0) + item.cantidad;
    }

    return quantities;
  }, [items]);

  const value = useMemo<StoreCartContextValue>(
    () => ({
      cartId,
      items,
      getProductQuantity: (productId: string) => quantityByProductId[productId] || 0,
      itemCount: items.reduce((total, item) => total + item.cantidad, 0),
      totalAmount: items.reduce(
        (total, item) => total + item.precio * item.cantidad,
        0
      ),
      isReady,
      isLoading,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      addItem: async (
        productId: string,
        quantity: number = 1,
        selectedMeasure?: string | null
      ) => {
        try {
          await addItem(productId, quantity, selectedMeasure);
        } catch (error: unknown) {
          throw new Error(getErrorMessage(error));
        }
      },
      updateItemQuantity: async (
        productId: string,
        quantity: number,
        selectedMeasure?: string | null
      ) => {
        try {
          await updateItemQuantity(productId, quantity, selectedMeasure);
        } catch (error: unknown) {
          throw new Error(getErrorMessage(error));
        }
      },
      removeItem: async (productId: string, selectedMeasure?: string | null) => {
        try {
          await removeItem(productId, selectedMeasure);
        } catch (error: unknown) {
          throw new Error(getErrorMessage(error));
        }
      },
    }),
    [
      addItem,
      cartId,
      closeDrawer,
      isDrawerOpen,
      isLoading,
      isReady,
      items,
      openDrawer,
      quantityByProductId,
      removeItem,
      updateItemQuantity,
    ]
  );

  return (
    <StoreCartContext.Provider value={value}>
      {children}
    </StoreCartContext.Provider>
  );
}

export function useStoreCart(): StoreCartContextValue {
  const context = useContext(StoreCartContext);

  if (!context) {
    throw new Error("useStoreCart debe usarse dentro de StoreCartProvider.");
  }

  return context;
}
