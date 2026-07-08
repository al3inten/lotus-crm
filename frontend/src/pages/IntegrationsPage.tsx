import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useIntegrations } from "../hooks/useIntegrations";
import { IntegrationCard } from "../components/integrations/IntegrationCard";
import { CATEGORY_BY_KEY, INTEGRATION_TITLES } from "../components/integrations/integrationMeta";
import { Blocks, Search, CheckCircle2, AlertTriangle, CircleDashed } from "lucide-react";

const CATEGORIES = ["All", "Lead Source", "Messaging", "Voice", "AI Model", "Media"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring" as const, stiffness: 120, damping: 17 } 
  }
};

export function IntegrationsPage() {
  const { data: integrations, isLoading } = useIntegrations();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [searchParams, setSearchParams] = useSearchParams();
  const metaOAuthResult = searchParams.get("meta");

  useEffect(() => {
    if (!metaOAuthResult) return;
    const next = new URLSearchParams(searchParams);
    next.delete("meta");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metaOAuthResult]);

  const counts = useMemo(() => {
    const connected = integrations?.filter((i) => i.status === "CONNECTED").length ?? 0;
    const needsAttention = integrations?.filter((i) => i.status === "ERROR").length ?? 0;
    const notConnected = integrations?.filter((i) => i.status === "NOT_CONFIGURED").length ?? 0;
    return { connected, needsAttention, notConnected };
  }, [integrations]);

  const filtered = useMemo(() => {
    return (integrations ?? []).filter((config) => {
      const matchesCategory = category === "All" || CATEGORY_BY_KEY[config.key] === category;
      const matchesQuery = INTEGRATION_TITLES[config.key].toLowerCase().includes(query.trim().toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [integrations, category, query]);

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mx-auto w-full max-w-7xl flex flex-col gap-6"
    >
      {/* Hero Section */}
      <motion.div 
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 shadow-xl dark:bg-slate-950 sm:px-8 sm:py-10"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] -top-[50%] h-[200%] w-[50%] rounded-full bg-blue-600/30 blur-[100px] dark:bg-blue-600/20" />
          <div className="absolute -right-[20%] top-[-20%] h-[150%] w-[60%] rounded-full bg-fuchsia-500/20 blur-[120px] dark:bg-fuchsia-500/10" />
        </div>

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs sm:text-sm font-medium text-blue-300 ring-1 ring-inset ring-blue-500/20 backdrop-blur-md">
              Integration Hub
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Connect your stack
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Manage lead sources, messaging channels, voice, and AI providers in one place.
            </p>
          </div>

          <div className="relative w-full max-w-md lg:w-72 shrink-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full rounded-xl border-0 bg-white/10 py-3 pl-11 pr-4 text-white shadow-sm ring-1 ring-inset ring-white/20 backdrop-blur-md placeholder:text-slate-400 focus:bg-white/20 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 transition-all"
              placeholder="Search integrations…"
            />
          </div>
        </div>
      </motion.div>

      {/* Meta OAuth callback result banner */}
      {metaOAuthResult === "connected" && (
        <motion.div 
          variants={itemVariants}
          className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          <CheckCircle2 size={16} /> Facebook login connected — your Pages are listed under Meta Lead Ads.
        </motion.div>
      )}
      {metaOAuthResult === "error" && (
        <motion.div 
          variants={itemVariants}
          className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          <AlertTriangle size={16} /> Facebook login failed — please try again.
        </motion.div>
      )}

      {/* Status Summary Strip */}
      {!isLoading && integrations && integrations.length > 0 && (
        <motion.div 
          variants={itemVariants}
          className="mb-6 flex flex-wrap items-center gap-3"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
            <CheckCircle2 size={13} /> {counts.connected} Connected
          </span>
          {counts.needsAttention > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
              <AlertTriangle size={13} /> {counts.needsAttention} Needs attention
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-600/10">
            <CircleDashed size={13} /> {counts.notConnected} Not connected
          </span>
        </motion.div>
      )}

      {/* Category Tabs */}
      <motion.div 
        variants={itemVariants}
        className="mb-6 flex flex-wrap gap-2"
      >
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={clsx(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              category === c ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            )}
          >
            {c}
          </button>
        ))}
      </motion.div>

      <main className="flex flex-col gap-8">
        {/* Integrations Grid */}
        <section aria-labelledby="integrations-heading">
          <h2 id="integrations-heading" className="sr-only">
            Available Integrations
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-[220px] w-full animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm"
                />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <motion.div 
              layout
              variants={itemVariants}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((config) => (
                  <motion.div
                    layout
                    key={config.key}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IntegrationCard config={config} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* Empty State Box */
            <motion.div 
              variants={itemVariants}
              className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm"
            >
              <Blocks className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-sm font-semibold text-slate-900">No integrations match your search</h3>
              <p className="mt-1 text-sm text-slate-500">Try a different keyword or category.</p>
            </motion.div>
          )}
        </section>
      </main>
    </motion.div>
  );
}
