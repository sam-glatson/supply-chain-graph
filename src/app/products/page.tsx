"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { PageContainer, PageHeader } from "@/components/PageContainer";
import { fetchJson } from "@/lib/api-client";
import type { Product, ProductBomItem } from "@/lib/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bom, setBom] = useState<ProductBomItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [bomLoading, setBomLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchJson<{ products: Product[] }>("/api/products");
        setProducts(data.products);
        if (data.products.length > 0) {
          setSelectedId(data.products[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    async function loadBom() {
      setBomLoading(true);
      try {
        const data = await fetchJson<{ bom: ProductBomItem[] }>("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: selectedId }),
        });
        setBom(data.bom);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load BOM");
      } finally {
        setBomLoading(false);
      }
    }

    loadBom();
  }, [selectedId]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.line.toLowerCase().includes(term),
    );
  }, [products, search]);

  const selectedProduct = products.find((product) => product.id === selectedId);

  return (
    <PageContainer>
      <PageHeader
        title="Products"
        description="Explore finished goods and drill into bill-of-materials with supplier paths."
      />

      {error ? <div className="mb-6"><ErrorBanner message={error} /></div> : null}

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-[320px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, SKU, or line..."
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
          />
          <div className="mt-4 max-h-64 space-y-2 overflow-auto sm:max-h-[420px] xl:max-h-[620px] p-1">
            {loading ? (
              <LoadingSkeleton rows={5} />
            ) : filtered.length === 0 ? (
              <EmptyState
                title="No products match your filter"
                description="Try a different search term or clear the filter."
              />
            ) : (
              filtered.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedId(product.id)}
                  className={`w-full rounded-xl px-3 py-3 text-left transition ${
                    selectedId === product.id
                      ? "bg-emerald-50 ring-1 ring-emerald-200"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-xs text-slate-500">{product.sku} · {product.line}</p>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {!selectedProduct ? (
            <EmptyState
              title="Select a product"
              description="Choose a product from the list to inspect its supply chain."
            />
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-semibold">{selectedProduct.name}</h3>
                <p className="text-sm text-slate-500">
                  {selectedProduct.sku} · {selectedProduct.line}
                </p>
              </div>

              {bomLoading ? (
                <LoadingSkeleton rows={6} />
              ) : bom.length === 0 ? (
                <EmptyState
                  title="No components linked yet"
                  description="Run the seed script to populate bill-of-materials relationships."
                />
              ) : (
                <div className="space-y-4">
                  {bom.map((item) => (
                    <div key={item.componentId} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900">{item.componentName}</p>
                          <p className="text-sm text-slate-500">
                            {item.category} · Qty {item.quantity}
                          </p>
                        </div>
                        {item.critical ? (
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                            Critical
                          </span>
                        ) : null}
                      </div>

                      {item.dependencies.length > 0 ? (
                        <p className="mt-3 text-xs text-slate-500">
                          Depends on: {item.dependencies.map((dep) => dep.name).join(", ")}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.suppliers.map((supplier) => (
                          <span
                            key={`${item.componentId}-${supplier.id}`}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                          >
                            {supplier.name} · {supplier.leadTimeDays}d lead · ${supplier.unitCost}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
