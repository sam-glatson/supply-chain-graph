"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageContainer, PageHeader } from "@/components/PageContainer";
import { fetchJson } from "@/lib/api-client";
import type { Alternative, ImpactResult, Supplier } from "@/lib/types";

type ComponentOption = {
  id: string;
  name: string;
  category: string;
  critical: boolean;
};

export default function ImpactPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [components, setComponents] = useState<ComponentOption[]>([]);
  const [mode, setMode] = useState<"supplier" | "component">("supplier");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedComponentId, setSelectedComponentId] = useState("");
  const [results, setResults] = useState<ImpactResult[]>([]);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOptions() {
      setLoading(true);
      setError(null);
      try {
        const [supplierData, componentData] = await Promise.all([
          fetchJson<{ suppliers: Supplier[] }>("/api/suppliers"),
          fetchJson<{ components: ComponentOption[] }>("/api/alternatives?list=true"),
        ]);
        setSuppliers(supplierData.suppliers);
        setComponents(componentData.components);
        const initialSupplierId = supplierData.suppliers[0]?.id ?? "";
        const initialComponentId = componentData.components[0]?.id ?? "";
        if (initialSupplierId) {
          setSelectedSupplierId(initialSupplierId);
        }
        if (initialComponentId) {
          setSelectedComponentId(initialComponentId);
        }

        await analyzeImpact(
          "supplier",
          initialSupplierId,
          initialComponentId,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analysis options");
      } finally {
        setLoading(false);
      }
    }

    loadOptions();
  }, []);

  async function analyzeImpact(
    analysisMode: "supplier" | "component",
    supplierId: string,
    componentId: string,
  ) {
    setAnalysisLoading(true);
    setError(null);
    setAlternatives([]);

    try {
      const params = new URLSearchParams();
      if (analysisMode === "supplier") {
        if (!supplierId) return;
        params.set("supplierId", supplierId);
      } else {
        if (!componentId) return;
        params.set("componentId", componentId);
      }

      const data = await fetchJson<{ results: ImpactResult[] }>(
        `/api/impact?${params.toString()}`,
      );
      setResults(data.results);

      if (analysisMode === "component" && componentId) {
        const altData = await fetchJson<{ alternatives: Alternative[] }>(
          `/api/alternatives?componentId=${componentId}`,
        );
        setAlternatives(altData.alternatives);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impact analysis failed");
      setResults([]);
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function runAnalysis() {
    await analyzeImpact(mode, selectedSupplierId, selectedComponentId);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Impact Analysis"
        description="Simulate supplier or component outages and trace multi-hop product impact across the graph."
      />

      {error ? <div className="mb-6"><ErrorBanner message={error} /></div> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <button
            type="button"
            onClick={() => {
              setMode("supplier");
              void analyzeImpact("supplier", selectedSupplierId, selectedComponentId);
            }}
            className={`rounded-full px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm ${
              mode === "supplier"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Supplier outage
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("component");
              void analyzeImpact("component", selectedSupplierId, selectedComponentId);
            }}
            className={`rounded-full px-3 py-2 text-xs font-medium sm:px-4 sm:text-sm ${
              mode === "component"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Component shortage
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap sm:items-end">
          {mode === "supplier" ? (
            <select
              value={selectedSupplierId}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedSupplierId(value);
                void analyzeImpact("supplier", value, selectedComponentId);
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm sm:min-w-[280px] sm:w-auto"
              disabled={loading}
            >
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedComponentId}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedComponentId(value);
                void analyzeImpact("component", selectedSupplierId, value);
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm sm:min-w-[280px] sm:w-auto"
              disabled={loading}
            >
              {components.map((component) => (
                <option key={component.id} value={component.id}>
                  {component.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={runAnalysis}
            disabled={analysisLoading || loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 sm:w-auto"
          >
            {analysisLoading ? "Analyzing..." : "Run analysis"}
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold">Affected Products</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {results.length} impacted
          </span>
        </div>

        {analysisLoading ? (
          <LoadingSkeleton rows={5} />
        ) : results.length === 0 ? (
          <EmptyState
            title="No downstream impact found"
            description="This node may not feed any products directly or through sub-assemblies."
          />
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <div key={result.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-900">{result.name}</p>
                    <p className="text-sm text-slate-500">{result.sku}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                    {result.hopCount}-hop path
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Components in path: {result.affectedComponents.join(", ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {mode === "component" ? (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-6">
          <h3 className="text-lg font-semibold">Alternative Supply Paths</h3>
          <p className="mt-1 text-sm text-slate-500">
            Substitute components and their suppliers, ranked by reliability.
          </p>
          <div className="mt-4">
            {alternatives.length === 0 ? (
              <EmptyState
                title="No alternatives configured"
                description="This component has no substitute parts in the graph."
              />
            ) : (
              <div className="space-y-3">
                {alternatives.map((alt) => (
                  <div key={`${alt.id}-${alt.supplier}`} className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="font-medium text-slate-900">{alt.name}</p>
                    <p className="text-sm text-slate-500">
                      {alt.category} · Supplier: {alt.supplier} · Reliability {(alt.reliabilityScore * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </PageContainer>
  );
}
