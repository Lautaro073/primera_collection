import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NoticeProps {
  children: ReactNode;
  tone: "success" | "error";
}

function Notice({ children, tone }: NoticeProps) {
  const isSuccess = tone === "success";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border px-3 py-2 text-sm",
        isSuccess
          ? "border-zinc-300 bg-zinc-900 text-white"
          : "border-zinc-300 bg-white text-black"
      )}
    >
      {isSuccess ? <CheckCircle2 className="mt-0.5 size-4" /> : <AlertCircle className="mt-0.5 size-4" />}
      <p>{children}</p>
    </div>
  );
}

interface AdminStatusProps {
  notice: string;
  error: string;
}

export function AdminStatus({ notice, error }: AdminStatusProps) {
  return (
    <>
      {notice ? <Notice tone="success">{notice}</Notice> : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
    </>
  );
}
