import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, ArrowLeft, Mail, Lock, Route, LineChart, MessagesSquare } from "lucide-react";
import { loginFormSchema } from "../schemas/auth.schema";
import type { LoginFormValues } from "../schemas/auth.schema";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";

const HIGHLIGHTS = [
  { icon: Route, text: "Smart round-robin lead routing" },
  { icon: LineChart, text: "Real-time CR performance reports" },
  { icon: MessagesSquare, text: "Unified calls, messages & social inbox" },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema), mode: "onBlur" });

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
    <div className="flex min-h-dvh w-full bg-slate-50 dark:bg-slate-950">
      {/* Brand panel — desktop/tablet only */}
      <div className="relative hidden shrink-0 flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white md:flex md:w-2/5 lg:w-1/2 lg:p-16">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-blue-500/25 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5">
            <img src="/hyundai-logo.jpg" alt="Hyundai" className="h-full w-full rounded-md object-contain" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Lotus CRM</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight lg:text-4xl">
            Every lead, call, and conversion — in one place.
          </h2>
          <p className="mt-4 text-sm text-slate-300 lg:text-base">
            Built for Hyundai dealership teams to manage enquiries end-to-end.
          </p>

          <ul className="mt-8 flex flex-col gap-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-slate-500">© {new Date().getFullYear()} Lotus CRM · Hyundai</p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-8 sm:px-8">
        {/* Soft brand glow so the light page never reads as blank */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-900/20 md:hidden" />

        <div className="relative z-10 flex w-full max-w-sm flex-col">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 self-start text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to home
          </Link>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-[0_20px_50px_-20px_rgb(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_20px_50px_-20px_rgb(0,0,0,0.6)] sm:p-9">
            <div className="mb-7 flex flex-col items-center text-center">
              <span className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-md ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700">
                <span className="pointer-events-none absolute inset-0 -z-10 rounded-2xl bg-blue-400/20 blur-xl" />
                <img src="/hyundai-logo.jpg" alt="Hyundai" className="h-full w-full rounded-lg object-contain" />
              </span>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Welcome back</h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Sign in to your Lotus CRM account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">Email</span>
                <div className="relative">
                  <Mail
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@dealership.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={`w-full rounded-xl border py-3 pl-11 pr-3.5 text-sm text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-white dark:focus:bg-slate-800 ${
                      errors.email
                        ? "border-red-300 bg-red-50 dark:border-red-500/60 dark:bg-red-950/30"
                        : "border-transparent bg-slate-100 focus:border-blue-500 dark:bg-slate-800/60 dark:focus:border-blue-500"
                    }`}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <span id="email-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">Password</span>
                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={`w-full rounded-xl border py-3 pl-11 pr-11 text-sm text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:text-white dark:focus:bg-slate-800 ${
                      errors.password
                        ? "border-red-300 bg-red-50 dark:border-red-500/60 dark:bg-red-950/30"
                        : "border-transparent bg-slate-100 focus:border-blue-500 dark:bg-slate-800/60 dark:focus:border-blue-500"
                    }`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span id="password-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </span>
                )}
              </label>

              {serverError && (
                <p role="alert" aria-live="assertive" className="text-sm text-red-600 dark:text-red-400">
                  {serverError}
                </p>
              )}

              <Button type="submit" isLoading={isSubmitting} icon={<LogIn size={16} />} className="mt-2 w-full" size="lg">
                Sign In
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Lotus CRM · Hyundai Dealership Suite
          </p>
        </div>
      </div>
    </div>
  );
}
