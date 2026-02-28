import type { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,_#08111f_0%,_#10263f_45%,_#dde8f4_45%,_#f4f8fb_100%)]">
      {children}
    </div>
  );
}
