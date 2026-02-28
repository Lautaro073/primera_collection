/* eslint-disable @next/next/no-img-element */

import type { ChangeEvent, FormEvent } from "react";
import { FileImage, LoaderCircle, Pencil, Plus, Save, Search, Trash2 } from "lucide-react";
import type { Product, ProductFormState, Category } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";

interface ProductPanelProps {
  categories: Category[];
  products: Product[];
  filteredProducts: Product[];
  productFilter: string;
  onFilterChange: (value: string) => void;
  productForm: ProductFormState;
  editingProductId: string;
  existingProductImage: string;
  imagePreview: string;
  isPending: boolean;
  productSubmitting: boolean;
  onFieldChange: (field: keyof ProductFormState, value: string | File | null) => void;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export function ProductPanel({
  categories,
  products,
  filteredProducts,
  productFilter,
  onFilterChange,
  productForm,
  editingProductId,
  existingProductImage,
  imagePreview,
  isPending,
  productSubmitting,
  onFieldChange,
  onImageChange,
  onSubmit,
  onCancel,
  onEdit,
  onDelete,
}: ProductPanelProps) {
  const handleTextField =
    (field: keyof ProductFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onFieldChange(field, event.target.value);
    };

  const categoryNameById = (categoryId: string | null) =>
    categories.find((item) => item.id_categoria === categoryId)?.nombre_categoria || "";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card className="overflow-hidden rounded-md border-zinc-300 shadow-none">
          <CardHeader className="border-b border-zinc-200 pb-4">
            <CardTitle>
              {editingProductId ? "Actualizar Producto" : "Agregar Producto"}
            </CardTitle>
            <CardDescription>
              Carga manual de productos.
            </CardDescription>
          </CardHeader>

          <form onSubmit={onSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Nombre del Producto</Label>
                <Input
                  id="product-name"
                  placeholder="Ingrese nombre del producto"
                  value={productForm.nombre}
                  onChange={handleTextField("nombre")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-description">Descripcion</Label>
                <Textarea
                  id="product-description"
                  className="min-h-[120px]"
                  placeholder="Ingrese descripcion del producto"
                  value={productForm.descripcion}
                  onChange={handleTextField("descripcion")}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="product-price">Precio</Label>
                  <Input
                    id="product-price"
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.precio}
                    onChange={handleTextField("precio")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-stock">Stock</Label>
                  <Input
                    id="product-stock"
                    type="number"
                    min="0"
                    step="1"
                    value={productForm.stock}
                    onChange={handleTextField("stock")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-category">Categoria</Label>
                <select
                  id="product-category"
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-zinc-200"
                  value={productForm.id_categoria}
                  onChange={handleTextField("id_categoria")}
                  required
                >
                  <option value="">Seleccione una categoria</option>
                  {categories.map((category) => (
                    <option key={category.id_categoria} value={category.id_categoria}>
                      {category.nombre_categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-tag">Etiqueta (Tag)</Label>
                <Input
                  id="product-tag"
                  placeholder="Ej: nuevo, oferta, destacado"
                  value={productForm.tag}
                  onChange={handleTextField("tag")}
                />
                <p className="text-xs text-zinc-500">Este campo es opcional</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-image">Imagen del Producto</Label>
                <label className="block cursor-pointer">
                  <span className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-100">
                    <FileImage className="size-4" />
                    {productForm.imagen ? "Cambiar imagen" : "Seleccionar imagen"}
                  </span>
                  <Input
                    id="product-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onImageChange}
                  />
                </label>

                {imagePreview || existingProductImage ? (
                  <div className="relative mt-4 overflow-hidden rounded-md border border-zinc-300">
                    <img
                      src={imagePreview || existingProductImage}
                      alt="Vista previa"
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ) : null}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 border-t border-zinc-200 pt-4 sm:flex-row">
              {editingProductId ? (
                <>
                  <Button className="w-full" type="submit" disabled={isPending || categories.length === 0}>
                    {productSubmitting ? <LoaderCircle className="animate-spin" /> : <Save />}
                    {productSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button className="w-full" variant="outline" type="button" onClick={onCancel}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button className="w-full" type="submit" disabled={isPending || categories.length === 0}>
                  {productSubmitting ? <LoaderCircle className="animate-spin" /> : <Plus />}
                  {productSubmitting ? "Guardando..." : "Agregar Producto"}
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="rounded-md border-zinc-300 shadow-none">
          <CardHeader className="border-b border-zinc-200 pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Productos ({products.length})</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={productFilter}
                  onChange={(event) => onFilterChange(event.target.value)}
                  placeholder="Buscar productos..."
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Nombre</TableHead>
                  <TableHead className="text-center">Precio</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tag</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id_producto}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {product.imagen ? (
                            <img
                              src={product.imagen}
                              alt={product.nombre}
                              className="h-8 w-8 rounded-sm object-cover"
                            />
                          ) : null}
                          <span>{product.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">${product.precio}</TableCell>
                      <TableCell className="text-center">
                        {product.stock > 0 ? (
                          <Badge variant="outline">{product.stock}</Badge>
                        ) : (
                          <Badge variant="secondary">Sin stock</Badge>
                        )}
                      </TableCell>
                      <TableCell>{categoryNameById(product.id_categoria)}</TableCell>
                      <TableCell>
                        {product.tag ? (
                          <Badge variant="outline">{product.tag}</Badge>
                        ) : (
                          <span className="text-sm text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => onEdit(product)}
                            type="button"
                          >
                            <span className="sr-only">Editar</span>
                            <Pencil />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 hover:bg-zinc-100"
                            onClick={() => onDelete(product.id_producto)}
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
                    <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                      {productFilter ? "No hay productos que coincidan con la busqueda." : "No hay productos disponibles."}
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
