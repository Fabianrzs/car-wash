import { Suspense } from "react";
import RegisterForm from "@/components/forms/RegisterForm";
import { PageLoader } from "@/components/ui/Spinner";

export default function RegisterPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RegisterForm />
    </Suspense>
  );
}
