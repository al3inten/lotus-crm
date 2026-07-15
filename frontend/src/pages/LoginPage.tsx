import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
  Mail,
  Lock,
  Route,
  LineChart,
  MessagesSquare,
  ShieldCheck,
} from "lucide-react";
import { loginFormSchema } from "../schemas/auth.schema";
import type { LoginFormValues } from "../schemas/auth.schema";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/common/Button";
import { fadeUp, staggerContainer, pageFade } from "../lib/motion";

const HIGHLIGHTS = [
  { icon: Route, title: "Smart lead routing", text: "Round-robin every enquiry to the right CR." },
  { icon: LineChart, title: "Live performance", text: "Real-time conversion & CR reports." },
  { icon: MessagesSquare, title: "Unified inbox", text: "Calls, messages & social in one place." },
];

const STATS = [
  { value: "12k+", label: "Leads managed" },
  { value: "98%", label: "Uptime" },
  { value: "24/7", label: "Support" },
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
    "w-full rounded-xl border py-3 pl-11 text-sm text-slate-900 transition-all duration-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15 dark:text-white dark:focus:bg-slate-800";
  const inputResting =
    "border-transparent bg-slate-100 focus:border-blue-500 dark:bg-slate-800/60 dark:focus:border-blue-500";
  const inputError =
    "border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-500/15 dark:border-red-500/60 dark:bg-red-950/30";

  return (
    <div className="flex min-h-dvh w-full bg-slate-50 dark:bg-slate-950">
      {/* Brand panel — desktop/tablet only */}
      <div className="relative hidden shrink-0 flex-col justify-between overflow-hidden bg-slate-900 p-8 text-white md:flex md:w-2/5 lg:w-1/2 lg:p-12">
        {/* Animated gradient backdrop */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob-a absolute -left-[15%] top-[-30%] h-[70%] w-[70%] rounded-full bg-blue-600/40 blur-[120px]" />
          <div className="animate-blob-b absolute -right-[20%] top-[10%] h-[80%] w-[70%] rounded-full bg-indigo-500/30 blur-[140px]" />
          <div className="animate-blob-a absolute bottom-[-25%] left-[10%] h-[60%] w-[60%] rounded-full bg-sky-500/20 blur-[130px]" />
          {/* Subtle grid overlay for depth */}
          <div
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)",
            }}
          />
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="relative z-10 flex h-full flex-col justify-between"
        >
          <motion.div variants={fadeUp} className="flex">
            <span className="flex items-center rounded-2xl bg-white px-4 py-2.5 shadow-lg shadow-blue-950/40">
              <img
                src="/logo.png"
                alt="Lotus D-CRM · Hyundai"
                className="h-10 w-auto object-contain lg:h-12"
              />
            </span>
          </motion.div>

          <div className="max-w-lg py-4 lg:py-6">
            <motion.span
              variants={fadeUp}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-blue-100 backdrop-blur-sm"
            >
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400" />
              Hyundai Dealership Suite
            </motion.span>

            <motion.h2
              variants={fadeUp}
              className="text-2xl font-semibold leading-[1.15] tracking-tight lg:text-4xl lg:leading-[1.1]"
            >
              Every lead, call, and conversion —{" "}
              <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">
                in one place.
              </span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-sm text-slate-300 lg:mt-4 lg:text-[15px]">
              Built for Hyundai dealership teams to manage enquiries end-to-end — from first touch to signed deal.
            </motion.p>

            <ul className="mt-6 flex flex-col gap-2.5 lg:mt-8 lg:gap-3">
              {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
                <motion.li
                  key={title}
                  variants={fadeUp}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm transition-colors hover:bg-white/[0.07]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-500/5 text-blue-200 ring-1 ring-inset ring-white/10">
                    <Icon size={16} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-white">{title}</span>
                    <span className="text-[11px] text-slate-400">{text}</span>
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-x-6 gap-y-3 lg:gap-x-8 lg:gap-y-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col">
                <span className="text-xl font-semibold tracking-tight text-white lg:text-2xl">{value}</span>
                <span className="text-[11px] text-slate-400 lg:text-xs">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <p className="relative z-10 mt-4 text-[11px] text-slate-500 lg:mt-6">
          © {new Date().getFullYear()} Lotus D-CRM · Hyundai
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-8 sm:px-8">
        {/* Soft brand glow so the light page never reads as blank */}
        <div className="animate-blob-a pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-900/20 md:hidden" />
        <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] hidden h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-900/10 md:block" />

        <motion.div
          variants={pageFade}
          initial="hidden"
          animate="show"
          className="relative z-10 flex w-full max-w-sm flex-col"
        >
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 self-start text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft size={15} />
            Back to home
          </Link>

          {/* Gradient ring wrapper for the bold accent */}
          <div className="rounded-[2rem] bg-gradient-to-b from-blue-500/30 via-slate-200/40 to-transparent p-px shadow-[0_30px_60px_-25px_rgb(30,58,138,0.35)] dark:from-blue-500/25 dark:via-slate-700/40 dark:shadow-[0_30px_60px_-25px_rgb(0,0,0,0.7)]">
            <div className="rounded-[calc(2rem-1px)] border border-white/60 bg-white/80 p-6 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/80 sm:p-8">
              <div className="mb-5 flex flex-col items-center text-center">
                <span className="relative mb-4 flex items-center justify-center rounded-3xl bg-white px-5 py-3 shadow-md ring-1 ring-slate-200/70 dark:ring-slate-700">
                  <span className="pointer-events-none absolute inset-0 -z-10 rounded-3xl bg-blue-400/30 blur-xl" />
                  <img
                    src="/logo.png"
                    alt="Lotus D-CRM · Hyundai"
                    className="h-16 w-auto max-w-[300px] object-contain sm:h-20"
                  />
                </span>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-2xl">Welcome back</h1>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Sign in to your Lotus D-CRM account</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
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
                      className={`${inputBase} pr-3.5 ${errors.email ? inputError : inputResting}`}
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
                      className={`${inputBase} pr-11 ${errors.password ? inputError : inputResting}`}
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
                  <p
                    role="alert"
                    aria-live="assertive"
                    className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-400"
                  >
                    {serverError}
                  </p>
                )}

                <Button type="submit" isLoading={isSubmitting} icon={<LogIn size={16} />} className="mt-2 w-full" size="lg">
                  Sign In
                </Button>
              </form>

              <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 sm:text-xs">
                <ShieldCheck size={13} />
                Secured with encrypted sign-in
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-slate-500 sm:text-xs lg:mt-6">
            © {new Date().getFullYear()} Lotus D-CRM · Hyundai Dealership Suite
          </p>
        </motion.div>
      </div>
    </div>
  );
}
