import { Link } from "react-router-dom";
import { LogIn, ArrowRight } from "lucide-react";
import { Reveal } from "./shared";

export function CtaSection() {
  return (
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
  );
}
