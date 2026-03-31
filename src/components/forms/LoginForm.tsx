"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Droplets, User } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

export default function LoginForm() {
  const [mode, setMode] = useState<"email" | "employee">("email");

  // Email mode fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Employee mode fields
  const [tenantSlug, setTenantSlug] = useState("");
  const [employeeCode, setEmployeeCode] = useState("");
  const [pin, setPin] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let result;

      if (mode === "employee") {
        result = await signIn("credentials", {
          mode: "employee",
          tenantSlug: tenantSlug.trim().toLowerCase(),
          employeeCode: employeeCode.trim().toLowerCase(),
          pin,
          redirect: false,
        });
      } else {
        result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
      }

      if (result?.error) {
        if (result.error === "Configuration") {
          setError("Error del servidor. Verifica la configuración de la base de datos.");
        } else if (mode === "employee") {
          setError("Código o PIN incorrecto.");
        } else {
          setError("Credenciales inválidas. Verifica tu correo y contraseña.");
        }
      } else {
        const rawCallback = searchParams.get("callbackUrl");
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

      {/* Mode toggle */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        <button
          type="button"
          onClick={() => { setMode("email"); setError(""); }}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "email"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          Administrador
        </button>
        <button
          type="button"
          onClick={() => { setMode("employee"); setError(""); }}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === "employee"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          Lavador
        </button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {mode === "email" ? (
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
          <Button type="submit" loading={loading} className="w-full">
            Iniciar Sesión
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="tenantSlug"
            label="Código del lavadero"
            type="text"
            placeholder="mi-lavadero"
            value={tenantSlug}
            onChange={(e) => setTenantSlug(e.target.value)}
            required
            autoComplete="off"
          />
          <Input
            id="employeeCode"
            label="Código de empleado"
            type="text"
            placeholder="juan01"
            value={employeeCode}
            onChange={(e) => setEmployeeCode(e.target.value)}
            required
            autoComplete="username"
          />
          <Input
            id="pin"
            label="PIN (4 dígitos)"
            type="password"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            required
            autoComplete="current-password"
            inputMode="numeric"
          />
          <Button type="submit" loading={loading} className="w-full">
            Ingresar
          </Button>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Tu código y PIN te los proporciona el administrador del lavadero.
          </p>
        </form>
      )}

      {mode === "email" && (
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
      )}
    </div>
  );
}
