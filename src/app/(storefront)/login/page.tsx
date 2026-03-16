import { CustomerLoginForm } from "@/components/customer/CustomerLoginForm";

export default function CustomerLoginPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-6xl justify-center">
        <CustomerLoginForm />
      </div>
    </main>
  );
}
