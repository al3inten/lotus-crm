import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate } from "react-router-dom";
import { loginFormSchema } from "../schemas/auth.schema";
import type { LoginFormValues } from "../schemas/auth.schema";
import { useAuth } from "../context/AuthContext";
import { Input } from "../components/common/Input";
import { Button } from "../components/common/Button";

export function LoginPage() {
  const { user, login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
    } catch {
      setServerError("Invalid email or password");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-gray-900">Lotus CRM</h1>
        <div className="flex flex-col gap-4">
          <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          {serverError && <p className="text-sm text-red-600">{serverError}</p>}
          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Log in
          </Button>
        </div>
      </form>
    </div>
  );
}
