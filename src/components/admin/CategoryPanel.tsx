import type { ChangeEvent, FormEvent } from "react";
import { LoaderCircle, Pencil, Plus, Save, Trash2 } from "lucide-react";
import type { Category, CategoryFormState } from "@/types/domain";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CategoryPanelProps {
  categories: Category[];
  categoryForm: CategoryFormState;
  editingCategoryId: string;
  isPending: boolean;
  categorySubmitting: boolean;
  onFieldChange: (field: keyof CategoryFormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
}

export function CategoryPanel({
  categories,
  categoryForm,
  editingCategoryId,
  isPending,
  categorySubmitting,
  onFieldChange,
  onSubmit,
  onCancel,
  onEdit,
  onDelete,
}: CategoryPanelProps) {
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFieldChange("nombre_categoria", event.target.value);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card className="overflow-hidden rounded-md border-zinc-300 shadow-none">
          <CardHeader className="border-b border-zinc-200 pb-4">
            <CardTitle>
              {editingCategoryId ? "Actualizar Categoria" : "Agregar Categoria"}
            </CardTitle>
            <CardDescription>
              Carga manual de categorias.
            </CardDescription>
          </CardHeader>

          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Nombre de la Categoria</Label>
                <Input
                  id="category-name"
                  placeholder="Ingrese nombre de la categoria"
                  value={categoryForm.nombre_categoria}
                  onChange={handleNameChange}
                  required
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 border-t border-zinc-200 pt-4 sm:flex-row">
              {editingCategoryId ? (
                <>
                  <Button className="w-full" type="submit" disabled={isPending}>
                    {categorySubmitting ? <LoaderCircle className="animate-spin" /> : <Save />}
                    {categorySubmitting ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button className="w-full" variant="outline" type="button" onClick={onCancel}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button className="w-full" type="submit" disabled={isPending}>
                  {categorySubmitting ? <LoaderCircle className="animate-spin" /> : <Plus />}
                  {categorySubmitting ? "Guardando..." : "Agregar Categoria"}
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="rounded-md border-zinc-300 shadow-none">
          <CardHeader className="border-b border-zinc-200 pb-3">
            <CardTitle>Categorias ({categories.length})</CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <TableRow key={category.id_categoria}>
                      <TableCell className="font-medium">#{category.id_categoria}</TableCell>
                      <TableCell>{category.nombre_categoria}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => onEdit(category)}
                            type="button"
                          >
                            <span className="sr-only">Editar</span>
                            <Pencil />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 hover:bg-zinc-100"
                            onClick={() => onDelete(category.id_categoria)}
                            type="button"
                          >
                            <span className="sr-only">Eliminar</span>
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-zinc-500">
                      No hay categorias disponibles.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
