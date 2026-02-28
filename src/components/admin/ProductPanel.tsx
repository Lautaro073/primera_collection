/* eslint-disable @next/next/no-img-element */

import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { Check, FileImage, LoaderCircle, Pencil, Plus, Save, Search, Trash2 } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ProductPanelProps {
  categories: Category[];
  products: Product[];
  filteredProducts: Product[];
  productFilter: string;
  onFilterChange: (value: string) => void;
  productForm: ProductFormState;
  editingProductId: string;
  existingProductImages: string[];
  imagePreviews: string[];
  isPending: boolean;
  productSubmitting: boolean;
  onFieldChange: (field: keyof ProductFormState, value: string | File[] | null) => void;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onAppendImages: (files: File[]) => void;
  onSetPrimaryImage: (index: number) => void;
  onClearImages: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onEdit: (product: Product) => void;
  onRequestDelete: (product: Product) => void;
}

export function ProductPanel({
  categories,
  products,
  filteredProducts,
  productFilter,
  onFilterChange,
  productForm,
  editingProductId,
  existingProductImages,
  imagePreviews,
  isPending,
  productSubmitting,
  onFieldChange,
  onImageChange,
  onAppendImages,
  onSetPrimaryImage,
  onClearImages,
  onSubmit,
  onCancel,
  onEdit,
  onRequestDelete,
}: ProductPanelProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const dragDepthRef = useRef(0);

  const handleTextField =
    (field: keyof ProductFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      onFieldChange(field, event.target.value);
    };

  const categoryNameById = (categoryId: string | null) =>
    categories.find((item) => item.id_categoria === categoryId)?.nombre_categoria || "";
  const measureLabel =
    productForm.tipo_medida === "calzado" ? "Numeros disponibles" : "Talles disponibles";
  const measurePlaceholder =
    productForm.tipo_medida === "calzado"
      ? "Ej: 38, 39, 40, 41"
      : "Ej: S, M, L, XL";
  const productMeasures = (product: Product) =>
    product.medidas.length > 0 ? product.medidas.join(" | ") : "-";
  const hasNewImages = productForm.imagenes.length > 0;
  const hasExistingImages = existingProductImages.length > 0;
  const visibleImages = hasNewImages ? imagePreviews : existingProductImages;
  function isFileDrag(event: DragEvent<HTMLDivElement>): boolean {
    return Array.from(event.dataTransfer.types).includes("Files");
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>): void {
    if (!isFileDrag(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragActive(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    if (!isFileDrag(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragActive(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>): void {
    if (!isFileDrag(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    if (!isFileDrag(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragActive(false);
    onAppendImages(Array.from(event.dataTransfer.files));
  }

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
                <Label htmlFor="product-measure-type">Medidas</Label>
                <select
                  id="product-measure-type"
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-zinc-200"
                  value={productForm.tipo_medida}
                  onChange={handleTextField("tipo_medida")}
                >
                  <option value="none">No aplica</option>
                  <option value="ropa">Ropa (talles)</option>
                  <option value="calzado">Calzado (numeros)</option>
                </select>
              </div>

              {productForm.tipo_medida !== "none" ? (
                <div className="space-y-2">
                  <Label htmlFor="product-measures">{measureLabel}</Label>
                  <Input
                    id="product-measures"
                    placeholder={measurePlaceholder}
                    value={productForm.medidas}
                    onChange={handleTextField("medidas")}
                    required
                  />
                  <p className="text-xs text-zinc-500">
                    Separalos con coma para guardar varias opciones.
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="product-image">Imagen del Producto</Label>
                <div
                  className={cn("relative rounded-2xl", isDragActive && "z-50")}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {isDragActive ? (
                    <div className="pointer-events-none fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px]" />
                  ) : null}

                  <label className="block cursor-pointer">
                    <span
                      className={cn(
                        "relative z-50 flex w-full flex-col gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-4 text-left transition hover:border-black hover:bg-white",
                        isDragActive && "border-black bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
                      )}
                    >
                      <span className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex rounded-md border border-zinc-200 bg-white p-2 text-zinc-700">
                          <FileImage className="size-4" />
                        </span>
                        <span className="min-w-0 space-y-1">
                          <span className="block text-sm font-medium text-black">
                            {isDragActive ? "Suelta las imagenes aqui" : "Galeria del producto"}
                          </span>
                          <span className="block text-xs leading-5 text-zinc-500">
                            {hasNewImages
                              ? `${productForm.imagenes.length} imagen(es) listas.`
                              : hasExistingImages
                                ? `Haz clic o arrastra. Si subes nuevas, reemplazan las ${existingProductImages.length} actuales.`
                                : "Haz clic o arrastra imagenes."}
                          </span>
                        </span>
                      </span>

                      <span
                        className={cn(
                          "inline-flex w-fit rounded-md px-3 py-2 text-xs font-medium",
                          isDragActive
                            ? "border border-black bg-black text-white"
                            : "border border-zinc-300 bg-white text-zinc-800"
                        )}
                      >
                        {isDragActive
                          ? "Suelta aqui"
                          : hasNewImages
                            ? "Agregar mas imagenes"
                            : "Elegir imagenes"}
                      </span>
                    </span>
                    <Input
                      id="product-image"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={onImageChange}
                    />
                  </label>
                </div>

                {visibleImages.length > 0 ? (
                  <div className="relative z-50 rounded-xl border border-zinc-200 bg-white p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-black">
                          {hasNewImages
                            ? `${productForm.imagenes.length} imagen(es) nuevas`
                            : "Galeria actual"}
                        </p>
                        {hasNewImages ? (
                          <p className="text-xs text-zinc-500">La primera es la portada.</p>
                        ) : null}
                      </div>

                      {hasNewImages ? (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0 border-zinc-300"
                                onClick={onClearImages}
                              >
                                <Trash2 />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                      {visibleImages.map((image, index) =>
                        hasNewImages ? (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => {
                              if (index > 0) {
                                onSetPrimaryImage(index);
                              }
                            }}
                            disabled={index === 0}
                            title={index === 0 ? "Portada actual" : "Usar como portada"}
                            className={cn(
                              "group relative overflow-hidden rounded-md border border-zinc-300 bg-zinc-50 transition",
                              index === 0 && "border-black ring-1 ring-black",
                              index > 0 && "hover:border-black"
                            )}
                          >
                            <img
                              src={image}
                              alt={index === 0 ? "Portada del producto" : `Miniatura ${index + 1}`}
                              className="aspect-square w-full object-cover"
                            />
                            {index === 0 ? (
                              <>
                                <span className="pointer-events-none absolute inset-0 ring-1 ring-black" />
                                <span className="pointer-events-none absolute left-1.5 top-1.5 inline-flex rounded-full bg-black p-1 text-white">
                                  <Check className="size-3" />
                                </span>
                              </>
                            ) : (
                              <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
                            )}
                          </button>
                        ) : (
                          <div
                            key={`${image}-${index}`}
                            className={cn(
                              "relative overflow-hidden rounded-md border border-zinc-300 bg-zinc-50",
                              index === 0 && "border-black ring-1 ring-black"
                            )}
                          >
                            <img
                              src={image}
                              alt={index === 0 ? "Portada actual del producto" : `Imagen ${index + 1}`}
                              className="aspect-square w-full object-cover"
                            />
                            {index === 0 ? (
                              <>
                                <span className="pointer-events-none absolute inset-0 ring-1 ring-black" />
                                <span className="pointer-events-none absolute left-1.5 top-1.5 inline-flex rounded-full bg-black p-1 text-white">
                                  <Check className="size-3" />
                                </span>
                              </>
                            ) : null}
                          </div>
                        )
                      )}
                    </div>
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
                  <TableHead>Medidas</TableHead>
                  <TableHead className="text-center">Imgs</TableHead>
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
                      <TableCell className="text-sm text-zinc-600">
                        {productMeasures(product)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-zinc-600">
                        {product.imagenes.length}
                      </TableCell>
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
                            onClick={() => onRequestDelete(product)}
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
                    <TableCell colSpan={8} className="h-24 text-center text-zinc-500">
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
