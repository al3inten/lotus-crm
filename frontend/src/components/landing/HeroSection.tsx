import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { LogIn, ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { EASE } from "../../lib/motion";

/* Rotating hero content — same video backdrop, different headline per slide. */
const HERO_SLIDES = [
  {
    badge: "Hyundai Dealership Suite",
    heading: (
      <>
        Every lead. Every call.
        <br />
        <span className="text-primary-300">
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
        <span className="text-primary-300">
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
        <span className="text-primary-300">
          to key handover.
        </span>
      </>
    ),
    sub: "Quotation, exchange, finance, test drive and delivery — track the entire showroom journey in one connected pipeline.",
  },
];

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  // Hero content slider — auto-advances, pauses on hover, and always resets its
  // timer on a manual nav so a click doesn't get immediately overridden.
  const [activeSlide, setActiveSlide] = useState(0);
  const [slidesPaused, setSlidesPaused] = useState(false);

  useEffect(() => {
    if (reduceMotion || slidesPaused) return;
    const t = setInterval(() => setActiveSlide((i) => (i + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [reduceMotion, slidesPaused, activeSlide]);

  const prevSlide = () => setActiveSlide((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const nextSlide = () => setActiveSlide((i) => (i + 1) % HERO_SLIDES.length);

  return (
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
        <div className="absolute inset-x-0 top-0 h-40 bg-black/20" />
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-white/60 dark:bg-slate-950/60" />
      </div>

      {/* Prev / next slide controls */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous slide"
        className={clsx(
          "absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white backdrop-blur-md transition-colors hover:bg-white/15 sm:flex md:left-6",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
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
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950"
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
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-primary-200 backdrop-blur-md">
              <Sparkles size={14} className="text-primary-300" />
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
              "group inline-flex items-center gap-2 rounded-xl bg-primary-600 px-7 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-500",
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
  );
}
