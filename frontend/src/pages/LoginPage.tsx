import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, ArrowLeft } from "lucide-react";
import { loginFormSchema } from "../schemas/auth.schema";
import type { LoginFormValues } from "../schemas/auth.schema";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";

export function LoginPage() {
  const { user, login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  if (user) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
    } catch {
      setServerError("Invalid email or password");
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side: Image */}
      <div className="relative hidden w-1/2 bg-slate-900 lg:block">
        <img
          src="/login-bg.png"
          alt="Dealership"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
        <div className="absolute bottom-12 left-12 text-white">
          <h2 className="text-3xl font-bold tracking-tight">Lotus CRM</h2>
          <p className="mt-2 max-w-sm text-slate-300">
            A premium dealership experience, starting from your first click.
          </p>
        </div>
      </div>

      {/* Right side: Login Form (White Theme) */}
      <div className="flex w-full flex-col justify-center px-4 py-12 lg:w-1/2 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <div className="mb-10 text-center lg:text-left">
            <img src="/hyundai-logo.jpg" alt="Hyundai" className="mx-auto mb-6 h-12 w-auto rounded-lg object-contain lg:mx-0" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">Sign in to Lotus CRM</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Email</span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@dealership.com"
                className={`rounded-xl border px-4 py-3 text-sm text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${errors.email ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200"
                  }`}
                {...register("email")}
              />
              {errors.email && <span className="text-xs font-medium text-rose-500">{errors.email.message}</span>}
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`w-full rounded-xl border px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${errors.password ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200"
                    }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="text-xs font-medium text-rose-500">{errors.password.message}</span>}
            </label>

            {serverError && <p className="text-sm font-medium text-rose-500">{serverError}</p>}

            <Button type="submit" isLoading={isSubmitting} icon={<LogIn size={18} />} className="mt-4 w-full shadow-md hover:shadow-lg" size="lg">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
