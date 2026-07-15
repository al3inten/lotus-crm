import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import {
  LogIn,
  Car,
  PhoneCall,
  BarChart3,
  Bot,
  Workflow,
  Inbox,
  Radio,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Megaphone,
  Camera,
  MessageCircle,
  Table,
  Footprints,
  Mic,
  MousePointerClick,
  Split,
  ClipboardCheck,
  KeyRound,
  ShieldCheck,
  Zap,
  Sun,
  Moon,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { CountUp } from "../components/common/CountUp";
import { EASE } from "../lib/motion";
import { useTheme } from "../hooks/useTheme";

/* Shared focus-visible ring for every interactive element on the page —
 * keeps keyboard-navigation affordance consistent (WCAG 2.4.7). */
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";

/* Writes pointer position into CSS vars (no re-render) so .spotlight-card's
 * ::before can track the cursor with a radial-gradient highlight. */
function handleSpotlight(e: ReactMouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
}

/* ------------------------------------------------------------------ *
 * Scroll-reveal wrapper — fades + rises children when they enter view.
 * Respects prefers-reduced-motion (renders static).
 * ------------------------------------------------------------------ */
function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={reduce ? undefined : { opacity: 0, y }}
      animate={inView && !reduce ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Count-up that only fires once its tile scrolls into view. */
function Metric({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <div ref={ref} className="text-center">
      <div className="bg-gradient-to-b from-slate-900 to-blue-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl dark:from-white dark:to-blue-200">
        {inView ? <CountUp value={value} /> : 0}
        {suffix}
      </div>
      <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

const CHANNELS = [
  { icon: <Megaphone size={16} />, label: "Meta Ads" },
  { icon: <MessageCircle size={16} />, label: "WhatsApp" },
  { icon: <Camera size={16} />, label: "Instagram" },
  { icon: <Table size={16} />, label: "Google Sheets" },
  { icon: <Footprints size={16} />, label: "Walk-in" },
  { icon: <Mic size={16} />, label: "Voice AI" },
];

const FEATURES = [
  {
    icon: <Radio size={22} />,
    title: "Omnichannel lead capture",
    desc: "Meta Ads, WhatsApp, Instagram, Google Sheets, walk-ins and Voice AI flow into one deduplicated inbox — no enquiry ever slips through.",
    span: "lg:col-span-2",
    glow: "from-blue-500/25",
  },
  {
    icon: <Workflow size={22} />,
    title: "Smart round-robin routing",
    desc: "Every lead auto-assigns to the right Customer Rep by live workload — fair, instant, zero manual triage.",
    span: "",
    glow: "from-indigo-500/25",
  },
  {
    icon: <Bot size={22} />,
    title: "AI voice & chat follow-ups",
    desc: "An AI agent calls and messages leads, books test drives and logs every touch automatically.",
    span: "",
    glow: "from-cyan-500/25",
  },
  {
    icon: <Car size={22} />,
    title: "Enquiry-to-delivery pipeline",
    desc: "Quotation, exchange, finance, test drive and delivery — the full showroom journey tracked in one place.",
    span: "lg:col-span-2",
    glow: "from-blue-500/25",
  },
  {
    icon: <Inbox size={22} />,
    title: "Unified social inbox",
    desc: "Reply to WhatsApp and Instagram DMs and convert conversations into leads without leaving the CRM.",
    span: "",
    glow: "from-fuchsia-500/25",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Business analytics",
    desc: "Funnels, CR performance and conversion reporting — the numbers that move your showroom.",
    span: "",
    glow: "from-emerald-500/25",
  },
];

/* Rotating hero content — same video backdrop, different headline per slide. */
const HERO_SLIDES = [
  {
    badge: "Hyundai Dealership Suite",
    heading: (
      <>
        Every lead. Every call.
        <br />
        <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
          One drive to close.
        </span>
      </>
    ),
    sub: "The end-to-end sales CRM for your showrooms — capturing every enquiry, routing it instantly, and driving it from first hello to key handover.",
  },
  {
    badge: "AI Voice & Chat Agent",
    heading: (
      <>
        AI that follows up,
        <br />
        <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-400 bg-clip-text text-transparent">
          so you never have to.
        </span>
      </>
    ),
    sub: "Automated voice and WhatsApp follow-ups keep every lead warm — booking test drives and logging every touch, around the clock.",
  },
  {
    badge: "Full Sales Pipeline",
    heading: (
      <>
        From first enquiry
        <br />
        <span className="bg-gradient-to-r from-indigo-300 via-blue-300 to-sky-300 bg-clip-text text-transparent">
          to key handover.
        </span>
      </>
    ),
    sub: "Quotation, exchange, finance, test drive and delivery — track the entire showroom journey in one connected pipeline.",
  },
];

const STEPS = [
  { icon: <MousePointerClick size={18} />, title: "Capture", desc: "Lead lands from any channel" },
  { icon: <Split size={18} />, title: "Auto-assign", desc: "Round-robin to the right CR" },
  { icon: <PhoneCall size={18} />, title: "Follow up", desc: "Calls, WhatsApp & AI nudges" },
  { icon: <Car size={18} />, title: "Test drive", desc: "Schedule & capture feedback" },
  { icon: <ClipboardCheck size={18} />, title: "Booking", desc: "Quotation, finance & exchange" },
  { icon: <KeyRound size={18} />, title: "Delivery", desc: "Key handover, deal closed" },
];

const FAQS = [
  {
    q: "Which lead channels does Lotus D-CRM capture from?",
    a: "Meta Ads, WhatsApp, Instagram DMs, Google Sheets imports, walk-in registrations and the built-in Voice AI agent — all deduplicated into a single inbox.",
  },
  {
    q: "How are leads assigned to Customer Reps?",
    a: "A round-robin engine assigns every new lead to the rep with the lowest live workload, so distribution stays fair and instant with no manual triage.",
  },
  {
    q: "Is data isolated across branches?",
    a: "Yes. Role-based access keeps every branch's leads, pipeline and reports scoped to that branch — reps and managers only see what's relevant to them.",
  },
  {
    q: "What happens after a lead is captured?",
    a: "It moves through a tracked pipeline — follow-up, test drive, quotation, finance, exchange and delivery — with the AI agent nudging warm leads along the way.",
  },
];

/* Independent-toggle FAQ row; height-animates via Framer Motion. */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 dark:border-white/10 dark:bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={clsx(
          "flex w-full items-center justify-between gap-4 rounded-lg py-5 text-left text-sm font-semibold text-slate-900 dark:text-white",
          FOCUS_RING
        )}
      >
        {q}
        <Plus
          size={18}
          className={clsx(
            "shrink-0 text-blue-600 transition-transform duration-300 dark:text-blue-400",
            open && "rotate-45"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const reduceMotion = useReducedMotion();

  // Hero content slider — auto-advances, pauses on hover, and always resets its
  // timer on a manual nav so a click doesn't get immediately overridden.
  const [activeSlide, setActiveSlide] = useState(0);
  const [slidesPaused, setSlidesPaused] = useState(false);

  // Header renders opaque either once the page has scrolled, or while the mobile
  // menu is open — otherwise its top row stays transparent over the hero video.
  const navSolid = scrolled || mobileOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || slidesPaused) return;
    const t = setInterval(() => setActiveSlide((i) => (i + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [reduceMotion, slidesPaused, activeSlide]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const prevSlide = () => setActiveSlide((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const nextSlide = () => setActiveSlide((i) => (i + 1) % HERO_SLIDES.length);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-white">
      {/* ============================= NAVBAR ============================= */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          navSolid
            ? "border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <a href="#top" className={clsx("flex items-center gap-3 rounded-lg", FOCUS_RING)}>
            <img src="/hyundai-logo.jpg" alt="Hyundai" className="h-9 w-auto rounded-md object-contain" />
            <span
              className={`text-lg font-semibold tracking-wide transition-colors ${
                navSolid ? "text-slate-900 dark:text-white" : "text-white"
              }`}
            >
              Lotus D-CRM
            </span>
          </a>
          <nav
            className={`hidden items-center gap-8 text-sm font-medium transition-colors md:flex ${
              navSolid ? "text-slate-600 dark:text-slate-300" : "text-slate-200"
            }`}
          >
            <a href="#features" className={clsx("rounded-lg transition-colors hover:text-blue-600 dark:hover:text-white", FOCUS_RING)}>Features</a>
            <a href="#pipeline" className={clsx("rounded-lg transition-colors hover:text-blue-600 dark:hover:text-white", FOCUS_RING)}>Pipeline</a>
            <a href="#impact" className={clsx("rounded-lg transition-colors hover:text-blue-600 dark:hover:text-white", FOCUS_RING)}>Impact</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:-translate-y-0.5",
                navSolid
                  ? "border-slate-200 bg-white text-slate-600 hover:text-blue-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white"
                  : "border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20",
                FOCUS_RING
              )}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              to="/login"
              className={clsx(
                "inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:-translate-y-0.5 hover:bg-blue-500",
                FOCUS_RING
              )}
            >
              <LogIn size={16} />
              Sign In
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-xl border transition-all md:hidden",
                navSolid
                  ? "border-slate-200 bg-white text-slate-600 dark:border-white/15 dark:bg-white/5 dark:text-slate-300"
                  : "border-white/20 bg-white/10 text-white backdrop-blur-md",
                FOCUS_RING
              )}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile nav panel — the desktop links above are hidden below md, so this
            is the only way small-screen visitors can reach Features/Pipeline/Impact. */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="overflow-hidden border-b border-slate-200/80 bg-white/95 backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-slate-950/95"
            >
              <nav className="flex flex-col gap-1 px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                {[
                  { href: "#features", label: "Features" },
                  { href: "#pipeline", label: "Pipeline" },
                  { href: "#impact", label: "Impact" },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={clsx(
                      "rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-white/5 dark:hover:text-white",
                      FOCUS_RING
                    )}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ============================== HERO ============================== */}
      <section id="top" className="relative flex min-h-screen items-center justify-center overflow-hidden">
        {/* Video backdrop */}
        <div className="pointer-events-none absolute inset-0">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/bgvideo.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          {/* Keep the video clearly visible: only a light top scrim for nav
              legibility and a fade to the page background at the very bottom.
              Text legibility comes from the blurred glow behind the slide content. */}
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-b from-transparent to-white dark:to-slate-950" />
        </div>

        {/* Prev / next slide controls */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className={clsx(
            "absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition-colors hover:bg-white/15 sm:flex md:left-6",
            FOCUS_RING
          )}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className={clsx(
            "absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition-colors hover:bg-white/15 sm:flex md:right-6",
            FOCUS_RING
          )}
        >
          <ChevronRight size={20} />
        </button>

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Hero highlights"
          onMouseEnter={() => setSlidesPaused(true)}
          onMouseLeave={() => setSlidesPaused(false)}
          className="relative z-10 mx-auto max-w-4xl px-6 pt-24 text-center"
        >
          {/* Soft glow behind the text for legibility over bright video — a blurred
              tint, not a drop-shadow/box-shadow, so the "flat, no-shadow" look holds. */}
          <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
            <div className="h-[26rem] w-[36rem] max-w-[92vw] rounded-full bg-black/25 blur-[110px]" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -18 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-blue-200 backdrop-blur-md">
                <Sparkles size={14} className="text-blue-300" />
                {HERO_SLIDES[activeSlide].badge}
              </div>

              <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-7xl">
                {HERO_SLIDES[activeSlide].heading}
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-slate-100 sm:text-lg">
                {HERO_SLIDES[activeSlide].sub}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              to="/login"
              className={clsx(
                "group inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-blue-500",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-0"
              )}
            >
              <LogIn size={18} />
              Sign In to Dashboard
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className={clsx(
                "inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-0"
              )}
            >
              Explore features
            </a>
          </motion.div>

          {/* Slide indicators */}
          <div className="mt-8 flex items-center justify-center gap-2">
            {HERO_SLIDES.map((slide, i) => (
              <button
                key={slide.badge}
                type="button"
                onClick={() => setActiveSlide(i)}
                aria-label={`Go to slide ${i + 1}: ${slide.badge}`}
                aria-current={i === activeSlide}
                className={clsx(
                  "h-1.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80",
                  i === activeSlide ? "w-7 bg-white" : "w-1.5 bg-white/35 hover:bg-white/60"
                )}
              />
            ))}
          </div>
        </div>

        <a
          href="#preview"
          aria-label="Scroll to content"
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-white/70 transition-colors hover:text-white"
        >
          <ChevronDown size={26} className="animate-bounce" />
        </a>
      </section>

      {/* ======================= PRODUCT PREVIEW ======================= */}
      <section id="preview" className="relative z-10 -mt-24 scroll-mt-24 px-6 pb-10 sm:-mt-28 sm:pb-16">
        <Reveal className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/40">
            {/* browser chrome */}
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-slate-950/60">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-center text-xs text-slate-400 dark:bg-white/5 dark:text-slate-500">
                lotuscrm.app/pipeline
              </span>
            </div>
            {/* abstract dashboard illustration — a stylized mock, not a real screenshot */}
            <div className="grid grid-cols-1 gap-4 bg-slate-50/50 p-4 dark:bg-slate-950/40 sm:p-6 lg:grid-cols-[220px_1fr]">
              <div className="hidden flex-col gap-1 lg:flex">
                {["Dashboard", "Leads", "Pipeline", "Inbox", "Analytics"].map((item, i) => (
                  <div
                    key={item}
                    className={clsx(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
                      i === 2 ? "bg-blue-600 text-white" : "text-slate-500 dark:text-slate-400"
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {STEPS.slice(0, 4).map((s) => (
                  <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{s.title}</p>
                    <div className="mt-2 space-y-2">
                      {[1, 2].map((n) => (
                        <div key={n} className="rounded-lg bg-slate-100 p-2 dark:bg-white/5">
                          <div className="h-2 w-3/4 rounded-full bg-slate-300 dark:bg-white/15" />
                          <div className="mt-1.5 h-2 w-1/2 rounded-full bg-slate-200 dark:bg-white/10" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* =========================== CHANNEL BAND =========================== */}
      <section id="channels" className="relative border-y border-slate-200 bg-white py-12 dark:border-white/5 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
              Capturing leads from every channel
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
              <div className="flex w-max animate-marquee gap-3 sm:gap-4">
                {[...CHANNELS, ...CHANNELS].map((c, i) => (
                  <span
                    key={`${c.label}-${i}`}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
                  >
                    <span className="text-blue-500 dark:text-blue-400">{c.icon}</span>
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================= FEATURES ============================= */}
      <section id="features" className="relative scroll-mt-24 bg-white py-24 dark:bg-slate-950">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-blue-500/5 blur-[130px] dark:bg-blue-600/10" />
        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Capabilities</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              One platform for the whole sales floor
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              From the first ad click to the delivery bay — Lotus D-CRM runs the entire dealership
              enquiry lifecycle so your team can focus on selling.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.08} className={f.span}>
                <div
                  onMouseMove={handleSpotlight}
                  className="spotlight-card group relative h-full overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:bg-slate-50/50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20 dark:hover:bg-white/[0.05]"
                >
                  <div
                    className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${f.glow} to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <div className="relative">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-blue-500/5 text-blue-600 ring-1 ring-inset ring-blue-500/10 dark:from-blue-500/20 dark:text-blue-300 dark:ring-white/10">
                      {f.icon}
                    </span>
                    <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================= PIPELINE ============================= */}
      <section id="pipeline" className="relative scroll-mt-24 border-y border-slate-200 bg-slate-50 py-24 dark:border-white/5 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">The journey</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              From enquiry to key handover
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Every enquiry moves through a clear, trackable pipeline — with the right person and
              the right action at every stage.
            </p>
          </Reveal>

          <div className="relative mt-16">
            {/* connecting line */}
            <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent lg:block dark:via-white/15" />
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
              {STEPS.map((s, i) => (
                <Reveal key={s.title} delay={i * 0.07} className="relative text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-blue-600 dark:border-white/10 dark:bg-slate-950 dark:text-blue-300">
                    {s.icon}
                  </div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-blue-600/80 dark:text-blue-400/80">
                    Step {i + 1}
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{s.title}</h3>
                  <p className="mx-auto mt-1 max-w-[9rem] text-xs leading-relaxed text-slate-500 dark:text-slate-400">{s.desc}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================== IMPACT ============================== */}
      <section id="impact" className="relative scroll-mt-24 bg-white py-24 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Built for scale</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Numbers that move showrooms</h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-2 gap-8 rounded-3xl border border-slate-200 bg-slate-50 p-10 sm:gap-6 lg:grid-cols-4 dark:border-white/10 dark:bg-white/[0.03]">
            <Metric value={6} label="Capture channels" />
            <Metric value={7} suffix=" stages" label="Enquiry → delivery" />
            <Metric value={100} suffix="%" label="Leads auto-routed" />
            <Metric value={24} suffix="/7" label="AI voice follow-ups" />
          </div>

          {/* Value strip */}
          <Reveal className="mt-8">
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                { icon: <Zap size={18} />, title: "Instant routing", desc: "Leads reach a rep the moment they land — no cold, forgotten enquiries." },
                { icon: <ShieldCheck size={18} />, title: "Branch-scoped & secure", desc: "Role-based access keeps every branch's data cleanly isolated." },
                { icon: <Sparkles size={18} />, title: "AI that follows up", desc: "Voice and chat agents keep momentum going around the clock." },
              ].map((v) => (
                <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                    {v.icon}
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{v.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{v.desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================== FAQ ============================== */}
      <section className="relative bg-white py-24 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal className="text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">FAQ</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Answers before you sign in
            </h2>
          </Reveal>

          <Reveal delay={0.1} className="mt-10 space-y-3">
            {FAQS.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </Reveal>
        </div>
      </section>

      {/* ============================== CTA ============================== */}
      <section className="relative bg-white pb-24 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-8 py-16 text-center shadow-xl shadow-blue-600/20 sm:px-16">
              <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Ready to drive every lead to close?
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-blue-100">
                  Sign in to your dealership dashboard and pick up right where the showroom left off.
                </p>
                <Link
                  to="/login"
                  className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700"
                >
                  <LogIn size={18} />
                  Sign In to Dashboard
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================== FOOTER ============================== */}
      <footer className="border-t border-slate-200 bg-white py-10 dark:border-white/10 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <img src="/hyundai-logo.jpg" alt="Hyundai" className="h-8 w-auto rounded-md object-contain" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Lotus D-CRM</span>
            <span className="text-sm text-slate-400 dark:text-slate-500">· Hyundai Dealership Suite</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Lotus D-CRM. Every lead, every call, one drive to close.
          </p>
        </div>
      </footer>
    </div>
  );
}
