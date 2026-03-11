"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Droplets } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "Configuration") {
          setError("Error del servidor. Verifica la configuración de la base de datos.");
        } else {
          setError("Credenciales inválidas. Verifica tu correo y contraseña.");
        }
      } else {
        const rawCallback = searchParams.get("callbackUrl");
        // Only allow relative paths to prevent open redirect
        const destination =
          rawCallback && rawCallback.startsWith("/") ? rawCallback : "/dashboard";
        window.location.href = destination;
      }
    } catch {
      setError("Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <Droplets className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Iniciar Sesión</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ingresa tus credenciales para acceder al sistema
        </p>
      </div>

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="email"
          label="Correo electrónico"
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Input
          id="password"
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <Button
          type="submit"
          loading={loading}
          className="w-full"
        >
          Iniciar Sesión
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <p>
          ¿No tienes una cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
          >
            Registrate
          </Link>
        </p>
        <Link href="/" className="font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
