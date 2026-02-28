"use client";

import { LoaderCircle } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminStatus } from "@/components/admin/AdminStatus";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { CategoryPanel } from "@/components/admin/CategoryPanel";
import { ProductPanel } from "@/components/admin/ProductPanel";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminCatalog } from "@/hooks/useAdminCatalog";

export default function AdminCatalogPage() {
  const admin = useAdminCatalog();

  if (admin.booting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-8">
        <Card className="rounded-lg border-zinc-300 shadow-none">
          <CardContent className="flex items-center gap-3 px-6 py-5 text-sm">
            <LoaderCircle className="size-4 animate-spin" />
            Cargando panel...
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <AdminHeader email={admin.sessionEmail} onLogout={admin.logout} />
        <AdminStatus notice={admin.notice} error={admin.error} />
        <DeleteConfirmDialog
          open={admin.deleteDialogOpen}
          targetType={admin.deleteDialogType}
          targetLabel={admin.deleteDialogLabel}
          error={admin.deleteDialogError}
          isPending={admin.deleteSubmitting}
          onOpenChange={(open) => {
            if (!open) {
              admin.closeDeleteDialog();
            }
          }}
          onConfirm={admin.confirmDelete}
        />

        <AdminTabs
          activeTab={admin.activeTab}
          onChange={admin.setActiveTab}
          productsContent={
            <ProductPanel
              categories={admin.categories}
              products={admin.products}
              filteredProducts={admin.filteredProducts}
              productFilter={admin.productFilter}
              onFilterChange={admin.setProductFilter}
              productForm={admin.productForm}
              editingProductId={admin.editingProductId}
              existingProductImages={admin.existingProductImages}
              imagePreviews={admin.imagePreviews}
              isPending={admin.isPending}
              productSubmitting={admin.productSubmitting}
              onFieldChange={admin.updateProductField}
              onImageChange={admin.handleImageChange}
              onAppendImages={admin.appendImageFiles}
              onSetPrimaryImage={admin.setPrimarySelectedImage}
              onClearImages={admin.clearSelectedImages}
              onSubmit={admin.submitProduct}
              onCancel={admin.resetProductForm}
              onEdit={admin.beginProductEdit}
              onRequestDelete={admin.requestProductDelete}
            />
          }
          categoriesContent={
            <CategoryPanel
              categories={admin.categories}
              categoryForm={admin.categoryForm}
              editingCategoryId={admin.editingCategoryId}
              isPending={admin.isPending}
              categorySubmitting={admin.categorySubmitting}
              onFieldChange={admin.updateCategoryField}
              onSubmit={admin.submitCategory}
              onCancel={admin.resetCategoryForm}
              onEdit={admin.beginCategoryEdit}
              onRequestDelete={admin.requestCategoryDelete}
            />
          }
        />
      </div>
    </main>
  );
}
