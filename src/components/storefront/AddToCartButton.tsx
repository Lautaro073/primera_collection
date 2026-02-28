"use client";

import { useState } from "react";
import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useStoreCart } from "@/components/storefront/StoreCartProvider";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AddToCartButtonProps {
  productId: string;
  stock: number;
  selectedMeasure?: string | null;
  requiresMeasure?: boolean;
  onAdded?: () => void;
  className?: string;
}

export function AddToCartButton({
  productId,
  stock,
  selectedMeasure,
  requiresMeasure = false,
  onAdded,
  className,
}: AddToCartButtonProps) {
  const { addItem, isReady, items } = useStoreCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const missingMeasure = requiresMeasure && !selectedMeasure;
  const quantityInCart = items.reduce(
    (total, item) =>
      item.id_producto === productId ? total + item.cantidad : total,
    0
  );
  const stockReached = stock > 0 && quantityInCart >= stock;
  const disabledReason = !isReady
    ? "Preparando carrito..."
    : stock <= 0
      ? "Este producto no tiene stock."
      : stockReached
        ? "Ya agregaste el maximo disponible."
      : missingMeasure
        ? "Elige un talle antes de anadir al carrito."
        : null;
  const isDisabled = Boolean(disabledReason) || isSubmitting;
  const idleLabel = stock <= 0
    ? "Sin stock"
    : stockReached
      ? "Sin stock"
    : missingMeasure
      ? "Elegi un talle"
      : "Anadir al carrito";

  async function handleAdd(): Promise<void> {
    try {
      setIsSubmitting(true);
      await addItem(productId, 1, selectedMeasure);
      onAdded?.();
    } catch {
      // The button is intentionally silent in card contexts.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      {disabledReason ? (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block w-full" tabIndex={0}>
                <Button
                  type="button"
                  className={className}
                  disabled
                >
                  <ShoppingBag />
                  {idleLabel}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{disabledReason}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Button
          type="button"
          className={className}
          disabled={isDisabled}
          onClick={() => {
            void handleAdd();
          }}
        >
          {isSubmitting ? <LoaderCircle className="animate-spin" /> : <ShoppingBag />}
          {isSubmitting ? "Agregando..." : idleLabel}
        </Button>
      )}
    </div>
  );
}
