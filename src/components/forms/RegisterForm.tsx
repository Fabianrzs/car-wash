"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Droplets, CheckCircle, Loader2 } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { useDebounce } from "@/hooks/useDebounce";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  businessName?: string;
  businessSlug?: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planSlug = searchParams.get("plan") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessSlug, setBusinessSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [planName, setPlanName] = useState("");

  const debouncedSlug = useDebounce(businessSlug, 500);

  // Load plan name from query param
  useEffect(() => {
    if (planSlug) {
      fetch("/api/plans")
        .then((r) => r.json())
        .then((plans: Array<{ slug: string; name: string }>) => {
          const found = plans.find((p) => p.slug === planSlug);
          if (found) setPlanName(found.name);
        })
        .catch(() => {});
    }
  }, [planSlug]);

  // Check slug availability
  useEffect(() => {
    if (debouncedSlug && debouncedSlug.length >= 3) {
      setCheckingSlug(true);
      fetch(`/api/auth/check-slug?slug=${debouncedSlug}`)
        .then((r) => r.json())
        .then((data) => {
          setSlugAvailable(data.available);
        })
        .catch(() => setSlugAvailable(null))
        .finally(() => setCheckingSlug(false));
    } else {
      setSlugAvailable(null);
    }
  }, [debouncedSlug]);

  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) newErrors.name = "El nombre es requerido";
    if (!email.trim()) {
      newErrors.email = "El correo electronico es requerido";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "El correo electronico no es valido";
    }
    if (!password) {
      newErrors.password = "La contrasena es requerida";
    } else if (password.length < 6) {
      newErrors.password = "La contrasena debe tener al menos 6 caracteres";
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contrasenas no coinciden";
    }
    if (!businessName.trim()) {
      newErrors.businessName = "El nombre del lavadero es requerido";
    }
    if (!businessSlug || businessSlug.length < 3) {
      newErrors.businessSlug = "El slug debe tener al menos 3 caracteres";
    } else if (slugAvailable === false) {
      newErrors.businessSlug = "Este slug no esta disponible";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          businessName,
          businessSlug,
          planSlug: planSlug || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setServerError(data.error || "Error al registrar");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setServerError("Ocurrio un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-lg">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Droplets className="h-6 w-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Crear Cuenta y Lavadero</h1>
        <p className="text-sm text-gray-500">
          Registra tu cuenta y configura tu lavadero en minutos
        </p>
        {planName && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            <CheckCircle className="h-3 w-3" />
            Plan: {planName}
          </span>
        )}
      </div>

      {serverError && <Alert variant="error">{serverError}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Datos personales */}
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Datos Personales
          </h3>
          <div className="h-px bg-gray-200" />
        </div>

        <Input
          id="name"
          label="Nombre completo"
          type="text"
          placeholder="Juan Perez"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
          autoComplete="name"
        />

        <Input
          id="email"
          label="Correo electronico"
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
          autoComplete="email"
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            id="password"
            label="Contrasena"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            required
            autoComplete="new-password"
          />
          <Input
            id="confirmPassword"
            label="Confirmar contrasena"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            required
            autoComplete="new-password"
          />
        </div>

        {/* Datos del lavadero */}
        <div className="space-y-1 pt-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Datos del Lavadero
          </h3>
          <div className="h-px bg-gray-200" />
        </div>

        <Input
          id="businessName"
          label="Nombre del lavadero"
          type="text"
          placeholder="Mi Lavadero Premium"
          value={businessName}
          onChange={(e) => {
            setBusinessName(e.target.value);
            setBusinessSlug(generateSlug(e.target.value));
            setSlugAvailable(null);
          }}
          error={errors.businessName}
          required
        />

        <div>
          <label htmlFor="businessSlug" className="mb-1 block text-sm font-medium text-gray-700">
            URL del lavadero
          </label>
          <div className="flex items-center gap-1">
            <input
              id="businessSlug"
              type="text"
              value={businessSlug}
              onChange={(e) => {
                setBusinessSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                setSlugAvailable(null);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="mi-lavadero"
            />
            <span className="whitespace-nowrap text-sm text-gray-500">.carwash.com</span>
            {checkingSlug && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>
          {slugAvailable === true && (
            <p className="mt-1 flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="h-3 w-3" /> Disponible
            </p>
          )}
          {slugAvailable === false && (
            <p className="mt-1 text-sm text-red-600">Este slug no esta disponible</p>
          )}
          {errors.businessSlug && !slugAvailable && (
            <p className="mt-1 text-sm text-red-600">{errors.businessSlug}</p>
          )}
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Crear Cuenta y Lavadero
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <p>
          ¿Ya tienes una cuenta?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Inicia sesion
          </Link>
        </p>
        <Link href="/" className="font-medium text-gray-600 hover:text-gray-800">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
