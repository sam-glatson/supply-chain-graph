"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageContainer, PageHeader } from "@/components/PageContainer";
import { fetchJson } from "@/lib/api-client";
import type { Supplier, SupplierDetail } from "@/lib/types";

const regions = ["", "US", "EU", "APAC", "CN", "JP", "IN"];
const tiers = ["", "Tier 1", "Tier 2", "Tier 3"];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SupplierDetail | null>(null);
  const [region, setRegion] = useState("");
  const [tier, setTier] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSuppliers() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (region) params.set("region", region);
        if (tier) params.set("tier", tier);
        const data = await fetchJson<{ suppliers: Supplier[] }>(
          `/api/suppliers?${params.toString()}`,
        );
        setSuppliers(data.suppliers);
        if (data.suppliers.length > 0) {
          setSelectedId(data.suppliers[0].id);
        } else {
          setSelectedId(null);
          setDetail(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load suppliers");
      } finally {
        setLoading(false);
      }
    }

    loadSuppliers();
  }, [region, tier]);

  useEffect(() => {
    if (!selectedId) return;

    async function loadDetail() {
      setDetailLoading(true);
      try {
        const data = await fetchJson<{ supplier: SupplierDetail }>(
          `/api/suppliers?id=${selectedId}`,
        );
        setDetail(data.supplier);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load supplier detail");
      } finally {
        setDetailLoading(false);
      }
    }

    loadDetail();
  }, [selectedId]);

  const filteredCount = useMemo(() => suppliers.length, [suppliers]);

  return (
    <PageContainer>
      <PageHeader
        title="Suppliers"
        description="Filter vendors by region and tier, then inspect downstream product exposure."
      />

      {error ? <div className="mb-6"><ErrorBanner message={error} /></div> : null}

      <div className="mb-4 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <select
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm sm:w-auto"
        >
          {regions.map((option) => (
            <option key={option || "all"} value={option}>
              {option ? option : "All regions"}
            </option>
          ))}
        </select>
        <select
          value={tier}
          onChange={(event) => setTier(event.target.value)}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm sm:w-auto"
        >
          {tiers.map((option) => (
            <option key={option || "all"} value={option}>
              {option ? option : "All tiers"}
            </option>
          ))}
        </select>
        <span className="self-center text-sm text-slate-500">{filteredCount} suppliers</span>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[320px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="max-h-64 space-y-2 overflow-auto sm:max-h-[420px] xl:max-h-[620px]">
            {loading ? (
              <LoadingSkeleton rows={5} />
            ) : suppliers.length === 0 ? (
              <EmptyState
                title="No suppliers found"
                description="Adjust your filters to see vendors in the network."
              />
            ) : (
              suppliers.map((supplier) => (
                <button
                  key={supplier.id}
                  type="button"
                  onClick={() => setSelectedId(supplier.id)}
                  className={`w-full rounded-xl px-3 py-3 text-left transition ${
                    selectedId === supplier.id
                      ? "bg-emerald-50 ring-1 ring-emerald-200"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <p className="font-medium text-slate-900">{supplier.name}</p>
                  <p className="text-xs text-slate-500">
                    {supplier.tier} · {supplier.region} · {supplier.productCount ?? 0} products
                  </p>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {detailLoading ? (
            <LoadingSkeleton rows={6} />
          ) : !detail ? (
            <EmptyState
              title="Select a supplier"
              description="Choose a supplier to review components and affected products."
            />
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{detail.name}</h3>
                  <p className="text-sm text-slate-500">
                    {detail.tier} · {detail.region}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
                  Reliability {(detail.reliabilityScore * 100).toFixed(0)}%
                </span>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="font-medium text-slate-900">Supplied Components</h4>
                  <div className="mt-3 space-y-2">
                    {detail.components.length === 0 ? (
                      <p className="text-sm text-slate-500">No components linked.</p>
                    ) : (
                      detail.components.map((component) => (
                        <div key={component.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                          <p className="font-medium">{component.name}</p>
                          <p className="text-slate-500">
                            {component.category} · ${component.unitCost} · {component.leadTimeDays}d
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Affected Products</h4>
                  <div className="mt-3 space-y-2">
                    {detail.affectedProducts.length === 0 ? (
                      <p className="text-sm text-slate-500">No downstream products.</p>
                    ) : (
                      detail.affectedProducts.map((product) => (
                        <div key={product} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                          {product}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
