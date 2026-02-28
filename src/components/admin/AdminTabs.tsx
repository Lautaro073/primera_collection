import type { ReactNode } from "react";
import { Package, Tags } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { id: "products", label: "Productos", icon: Package },
  { id: "categories", label: "Categorias", icon: Tags },
] as const;

export type AdminTab = (typeof TABS)[number]["id"];

interface AdminTabsProps {
  activeTab: AdminTab;
  onChange: (value: string) => void;
  productsContent: ReactNode;
  categoriesContent: ReactNode;
}

export function AdminTabs({ activeTab, onChange, productsContent, categoriesContent }: AdminTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onChange}>
      <TabsList className="grid h-auto w-full grid-cols-2 rounded-md border border-zinc-300 bg-white p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;

          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="gap-2 rounded-sm px-3 py-2 text-sm"
            >
              <Icon className="size-4" />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <TabsContent value="products">{productsContent}</TabsContent>
      <TabsContent value="categories">{categoriesContent}</TabsContent>
    </Tabs>
  );
}
