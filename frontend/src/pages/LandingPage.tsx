import { Link } from "react-router-dom";
import { LogIn, Car, PhoneCall, MessageSquareText, BarChart3 } from "lucide-react";

const YOUTUBE_ID = "UmO1ICc1i7s";

const HIGHLIGHTS = [
  { icon: <Car size={18} />, label: "End-to-end sales pipeline" },
  { icon: <MessageSquareText size={18} />, label: "WhatsApp & Instagram capture" },
  { icon: <PhoneCall size={18} />, label: "AI voice follow-ups" },
  { icon: <BarChart3 size={18} />, label: "Business analytics" },
];

export function LandingPage() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* YouTube background — sized with 16:9 cover math so it always fills the viewport,
          muted+looped (autoplay only works muted), pointer-events off so it's pure backdrop. */}
      <div className="pointer-events-none absolute inset-0">
        <iframe
          title="Hyundai background video"
          src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_ID}&controls=0&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3&disablekb=1`}
          allow="autoplay; encrypted-media"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "max(100vw, 177.78vh)",
            height: "max(100vh, 56.25vw)",
            border: 0,
          }}
        />
        {/* Readability overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-10">
        <div className="flex items-center gap-3">
          <img src="/hyundai-logo.jpg" alt="Hyundai" className="h-10 w-auto rounded-md object-contain" />
          <span className="text-lg font-semibold tracking-wide text-white">Lotus CRM</span>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-lg transition-colors hover:bg-blue-50"
        >
          <LogIn size={16} />
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex h-[calc(100vh-160px)] flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-blue-300">Hyundai Dealer Group</p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white sm:text-6xl">
          Every lead. Every call.
          <br />
          <span className="text-blue-400">One drive to close.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-gray-300 sm:text-lg">
          The end-to-end sales CRM for your showrooms — from first enquiry to key handover.
        </p>
        <Link
          to="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl transition-colors hover:bg-blue-700"
        >
          <LogIn size={18} />
          Sign In to Dashboard
        </Link>
      </main>

      {/* Feature strip */}
      <footer className="absolute inset-x-0 bottom-0 z-10 px-6 pb-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {HIGHLIGHTS.map((h) => (
            <span key={h.label} className="flex items-center gap-2 text-xs font-medium text-gray-300 sm:text-sm">
              <span className="text-blue-400">{h.icon}</span>
              {h.label}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
