import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  targetType: "category" | "product" | null;
  targetLabel: string;
  error: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  targetType,
  targetLabel,
  error,
  isPending,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const title =
    targetType === "category" ? "Eliminar categoria" : "Eliminar producto";
  const description =
    targetType === "category"
      ? "Si esta categoria tiene productos asociados, no se podra eliminar."
      : "Esta accion elimina el producto del catalogo.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          {targetLabel ? (
            <>
              Elemento seleccionado: <strong>{targetLabel}</strong>
            </>
          ) : (
            "No hay un elemento seleccionado."
          )}
        </div>

        {error ? (
          <div className="mt-3 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
            {error}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-zinc-900 hover:bg-black"
            onClick={onConfirm}
            disabled={isPending || !targetLabel}
          >
            {isPending ? <LoaderCircle className="animate-spin" /> : null}
            {isPending ? "Eliminando..." : "Confirmar eliminacion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
