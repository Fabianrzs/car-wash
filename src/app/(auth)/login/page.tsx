import { Suspense } from "react";
import LoginForm from "@/components/forms/LoginForm";
import { PageLoader } from "@/components/ui/Spinner";

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginForm />
    </Suspense>
  );
}
