import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, ArrowLeft, Mail, Lock, ShieldCheck, Route, LineChart, MessagesSquare } from "lucide-react";
import { loginFormSchema } from "../schemas/auth.schema";
import type { LoginFormValues } from "../schemas/auth.schema";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import { fadeUp, staggerContainer } from "../lib/motion";

const HIGHLIGHTS = [
  { icon: Route, title: "Smart lead routing", text: "Round-robin every enquiry to the right CR." },
  { icon: LineChart, title: "Live performance", text: "Real-time conversion & CR reports." },
  { icon: MessagesSquare, title: "Unified inbox", text: "Calls, messages & social in one place." },
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

  const inputBase =
    "glass-input w-full rounded-xl border py-3 pl-11 text-sm text-white shadow-sm transition-all duration-200 placeholder:text-slate-300/70 focus:outline-none focus:ring-4 focus:ring-primary-400/20";
  const inputResting =
    "border-white/15 bg-slate-950/40 hover:border-white/25 hover:bg-slate-950/30 focus:border-primary-300/70 focus:bg-slate-950/30";
  const inputError =
    "border-white/40 bg-slate-950/40 focus:border-white/60 focus:ring-white/20";

  return (
    <div className="relative flex min-h-dvh w-full items-center overflow-hidden bg-slate-50 px-5 py-10 dark:bg-slate-950 sm:px-10 lg:justify-center lg:px-12 xl:px-20">
      {/* Full-bleed dealership backdrop — neutral darken only, no blue cast */}
      <div className="pointer-events-none absolute inset-0">
        <img src="/Hyundai-showroom.jpeg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <Link
        to="/"
        className="absolute left-5 top-6 z-10 inline-flex items-center gap-1.5 text-sm text-slate-300 transition-colors hover:text-white sm:left-8"
      >
        <ArrowLeft size={15} />
        Back to home
      </Link>

      {/* Two-column layout on large screens: brand copy left, card right, both centered as a unit */}
      <div className="relative z-10 flex w-full max-w-6xl items-center justify-center lg:justify-between">
      {/* Brand copy over the photo, left of the card — desktop/tablet only */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="hidden max-w-md flex-col gap-6 pr-12 text-white lg:flex"
      >
        <motion.span
          variants={fadeUp}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-primary-100 backdrop-blur-sm"
        >
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400" />
          Hyundai Dealership Suite
        </motion.span>

        <motion.h2 variants={fadeUp} className="text-3xl font-semibold leading-[1.15] tracking-tight xl:text-4xl">
          Every lead, call, and conversion —{" "}
          <span className="text-primary-200">
            in one place.
          </span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-sm text-slate-300 xl:text-[15px]">
          Built for Hyundai dealership teams to manage enquiries end-to-end — from first touch to signed deal.
        </motion.p>

        <ul className="mt-2 flex flex-col gap-2.5">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <motion.li
              key={title}
              variants={fadeUp}
              className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm transition-colors hover:bg-white/[0.07]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-200 ring-1 ring-inset ring-white/10">
                <Icon size={16} />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-medium text-white">{title}</span>
                <span className="text-[11px] text-slate-400">{text}</span>
              </span>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 flex w-full max-w-[25rem] flex-col"
      >
        {/* Glass panel — no solid card, the showroom photo shows straight through */}
        <motion.div
          variants={fadeUp}
          className="rounded-[2rem] border border-white/15 bg-white/[0.06] p-7 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-9"
        >
          <div className="mb-7 flex flex-col items-center text-center">
            <span className="relative mb-5 flex items-center justify-center rounded-3xl bg-white px-5 py-3 shadow-md">
              <span className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-primary-400/30 blur-xl" />
              <img
                src="/logo.png"
                alt="Lotus D-CRM · Hyundai"
                className="h-16 w-auto max-w-[280px] object-contain sm:h-20"
              />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
            <p className="mt-1.5 text-sm text-slate-300">Sign in to your Lotus D-CRM account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-200">Email</span>
              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300"
                />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@dealership.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`${inputBase} pr-3.5 ${errors.email ? inputError : inputResting}`}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <span id="email-error" role="alert" className="text-xs text-slate-100">
                  {errors.email.message}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-200">Password</span>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={`${inputBase} pr-11 ${errors.password ? inputError : inputResting}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-slate-300 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span id="password-error" role="alert" className="text-xs text-slate-100">
                  {errors.password.message}
                </span>
              )}
            </label>

            {serverError && (
              <p
                role="alert"
                aria-live="assertive"
                className="rounded-xl border border-white/25 bg-white/10 px-3.5 py-2.5 text-sm text-white"
              >
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              isLoading={isSubmitting}
              icon={<LogIn size={16} />}
              className="mt-2 w-full shadow-lg shadow-primary-600/20"
              size="lg"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-white/15 pt-5 text-[11px] text-slate-300 sm:text-xs">
            <ShieldCheck size={13} className="text-emerald-400" />
            Secured with encrypted sign-in
          </div>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="mt-6 text-center text-[11px] text-slate-300/80 sm:text-xs"
        >
          © {new Date().getFullYear()} Lotus D-CRM · Hyundai Dealership Suite
        </motion.p>
      </motion.div>
      </div>
    </div>
  );
}
