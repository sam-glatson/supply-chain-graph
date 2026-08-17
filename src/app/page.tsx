"use client";

import { useEffect, useState } from "react";
import { CardSkeleton, LoadingSkeleton } from "@/components/LoadingSkeleton";
import { DbStatusBadge, ErrorBanner } from "@/components/ErrorBanner";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { fetchJson } from "@/lib/api-client";
import type {
  DashboardStats,
  RegionalRisk,
  SinglePointOfFailure,
} from "@/lib/types";

type DashboardResponse = {
  stats: DashboardStats;
  risks: SinglePointOfFailure[];
  regionalRisks: RegionalRisk[];
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const health = await fetchJson<{ status: string }>("/api/health");
        setConnected(health.status === "ok");
        const dashboard = await fetchJson<DashboardResponse>("/api/dashboard");
        setData(dashboard);
      } catch (err) {
        setConnected(false);
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="px-8 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Operations Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor supply chain exposure, single points of failure, and regional concentration.
          </p>
        </div>
        <DbStatusBadge connected={connected} />
      </div>

      {error ? <div className="mb-6"><ErrorBanner message={error} /></div> : null}

      {loading ? (
        <CardSkeleton />
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Suppliers" value={data.stats.suppliers} hint="Active vendor nodes" />
            <StatCard label="Components" value={data.stats.components} hint="Tracked parts & sub-assemblies" />
            <StatCard label="Products" value={data.stats.products} hint="Finished goods in network" />
            <StatCard label="Facilities" value={data.stats.facilities} hint="Manufacturing & distribution sites" />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Single Points of Failure</h3>
              <p className="mt-1 text-sm text-slate-500">
                Sole-source suppliers for critical components used across multiple products.
              </p>
              <div className="mt-4">
                {data.risks.length === 0 ? (
                  <EmptyState
                    title="No sole-source risks detected"
                    description="Every critical component with multi-product exposure has alternate suppliers."
                  />
                ) : (
                  <div className="space-y-3">
                    {data.risks.map((risk) => (
                      <div key={`${risk.supplier}-${risk.component}`} className="rounded-xl bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">{risk.supplier}</p>
                            <p className="text-sm text-slate-500">Component: {risk.component}</p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                            {risk.productCount} products
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          Affected: {risk.products.join(", ")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">Regional Concentration</h3>
              <p className="mt-1 text-sm text-slate-500">
                Products with multiple critical suppliers concentrated in one region.
              </p>
              <div className="mt-4">
                {data.regionalRisks.length === 0 ? (
                  <EmptyState
                    title="No regional concentration alerts"
                    description="Critical supplier dependencies are geographically diversified."
                  />
                ) : (
                  <div className="space-y-3">
                    {data.regionalRisks.slice(0, 8).map((risk) => (
                      <div key={`${risk.product}-${risk.region}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-900">{risk.product}</p>
                          <p className="text-sm text-slate-500">{risk.region}</p>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          <p>{risk.criticalCount} critical parts</p>
                          <p>{risk.supplierCount} suppliers</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      ) : (
        <LoadingSkeleton rows={6} />
      )}
    </div>
  );
}
