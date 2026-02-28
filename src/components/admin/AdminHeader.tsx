import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminHeaderProps {
  email: string;
  onLogout: () => void;
}

export function AdminHeader({ email, onLogout }: AdminHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-zinc-300 pb-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          Admin
        </p>
        <h1 className="text-2xl font-semibold text-black">Panel de administracion</h1>
        {email ? <p className="text-sm text-zinc-500">{email}</p> : null}
      </div>

      <Button
        onClick={onLogout}
        variant="outline"
        className="border-zinc-300 bg-white text-black hover:bg-zinc-100"
        type="button"
      >
        <LogOut />
        Cerrar sesion
      </Button>
    </header>
  );
}
