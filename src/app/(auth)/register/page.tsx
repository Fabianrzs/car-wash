import { Suspense } from "react";
import RegisterForm from "@/components/forms/RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
