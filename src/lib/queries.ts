import { int } from "neo4j-driver";
import { runQuery } from "./db";
import type {
  Alternative,
  DashboardStats,
  ImpactResult,
  Product,
  ProductBomItem,
  RegionalRisk,
  SinglePointOfFailure,
  Supplier,
  SupplierDetail,
} from "./types";

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value ?? 0);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return runQuery(async (session) => {
    const result = await session.run(`
      OPTIONAL MATCH (s:Supplier) WITH count(s) AS suppliers
      OPTIONAL MATCH (c:Component) WITH suppliers, count(c) AS components
      OPTIONAL MATCH (p:Product) WITH suppliers, components, count(p) AS products
      OPTIONAL MATCH (f:Facility) WITH suppliers, components, products, count(f) AS facilities
      RETURN suppliers, components, products, facilities
    `);

    const record = result.records[0];
    return {
      suppliers: toNumber(record.get("suppliers")),
      components: toNumber(record.get("components")),
      products: toNumber(record.get("products")),
      facilities: toNumber(record.get("facilities")),
    };
  });
}

export async function getProducts(search?: string): Promise<Product[]> {
  return runQuery(async (session) => {
    const result = await session.run(
      `
      MATCH (p:Product)
      WHERE $search = '' OR toLower(p.name) CONTAINS toLower($search)
         OR toLower(p.sku) CONTAINS toLower($search)
         OR toLower(p.line) CONTAINS toLower($search)
      RETURN p.id AS id, p.name AS name, p.sku AS sku, p.line AS line
      ORDER BY p.name
    `,
      { search: search ?? "" },
    );

    return result.records.map((record) => ({
      id: record.get("id") as string,
      name: record.get("name") as string,
      sku: record.get("sku") as string,
      line: record.get("line") as string,
    }));
  });
}

export async function getProductBom(productId: string): Promise<ProductBomItem[]> {
  return runQuery(async (session) => {
    const result = await session.run(
      `
      MATCH (p:Product {id: $productId})<-[ui:USED_IN]-(c:Component)
      OPTIONAL MATCH (c)<-[sRel:SUPPLIES]-(s:Supplier)
      OPTIONAL MATCH (c)-[:DEPENDS_ON]->(dep:Component)
      WITH c, ui,
           collect(DISTINCT {id: s.id, name: s.name, leadTimeDays: sRel.leadTimeDays, unitCost: sRel.unitCost}) AS suppliers,
           collect(DISTINCT {id: dep.id, name: dep.name}) AS dependencies
      RETURN c.id AS componentId, c.name AS componentName, c.category AS category,
             c.critical AS critical, ui.quantity AS quantity, suppliers, dependencies
      ORDER BY c.critical DESC, c.name
    `,
      { productId },
    );

    return result.records.map((record) => ({
      componentId: record.get("componentId") as string,
      componentName: record.get("componentName") as string,
      category: record.get("category") as string,
      critical: Boolean(record.get("critical")),
      quantity: toNumber(record.get("quantity")),
      suppliers: (record.get("suppliers") as ProductBomItem["suppliers"]).filter(
        (s) => s.id,
      ),
      dependencies: (record.get("dependencies") as ProductBomItem["dependencies"]).filter(
        (d) => d.id,
      ),
    }));
  });
}

export async function getSuppliers(filters?: {
  region?: string;
  tier?: string;
}): Promise<Supplier[]> {
  return runQuery(async (session) => {
    const result = await session.run(
      `
      MATCH (s:Supplier)-[:LOCATED_IN]->(r:Region)
      OPTIONAL MATCH (s)-[:SUPPLIES]->(c:Component)-[:USED_IN]->(p:Product)
      WITH s, r, count(DISTINCT p) AS productCount
      WHERE ($region = '' OR r.code = $region)
        AND ($tier = '' OR s.tier = $tier)
      RETURN s.id AS id, s.name AS name, s.tier AS tier,
             s.reliabilityScore AS reliabilityScore, r.name AS region,
             productCount
      ORDER BY s.name
    `,
      { region: filters?.region ?? "", tier: filters?.tier ?? "" },
    );

    return result.records.map((record) => ({
      id: record.get("id") as string,
      name: record.get("name") as string,
      tier: record.get("tier") as string,
      reliabilityScore: toNumber(record.get("reliabilityScore")),
      region: record.get("region") as string,
      productCount: toNumber(record.get("productCount")),
    }));
  });
}

export async function getSupplierDetail(supplierId: string): Promise<SupplierDetail | null> {
  return runQuery(async (session) => {
    const result = await session.run(
      `
      MATCH (s:Supplier {id: $supplierId})-[:LOCATED_IN]->(r:Region)
      OPTIONAL MATCH (s)-[sup:SUPPLIES]->(c:Component)
      OPTIONAL MATCH (c)-[:USED_IN]->(p:Product)
      WITH s, r,
           collect(DISTINCT {
             id: c.id,
             name: c.name,
             category: c.category,
             critical: c.critical,
             unitCost: sup.unitCost,
             leadTimeDays: sup.leadTimeDays
           }) AS componentRows,
           collect(DISTINCT p.name) AS products
      RETURN s.id AS id, s.name AS name, s.tier AS tier,
             s.reliabilityScore AS reliabilityScore, r.name AS region,
             componentRows, products
    `,
      { supplierId },
    );

    if (result.records.length === 0) return null;

    const record = result.records[0];
    const components = (record.get("componentRows") as SupplierDetail["components"]).filter(
      (c) => c.id,
    );

    return {
      id: record.get("id") as string,
      name: record.get("name") as string,
      tier: record.get("tier") as string,
      reliabilityScore: toNumber(record.get("reliabilityScore")),
      region: record.get("region") as string,
      components,
      affectedProducts: (record.get("products") as string[]).filter(Boolean),
    };
  });
}

export async function getSupplierImpact(supplierId: string): Promise<ImpactResult[]> {
  return runQuery(async (session) => {
    const result = await session.run(
      `
      MATCH (s:Supplier {id: $supplierId})-[:SUPPLIES]->(c:Component)
      CALL {
        WITH c
        MATCH (c)-[:USED_IN]->(p:Product)
        RETURN p, c AS affected, 2 AS hops
        UNION
        WITH c
        MATCH (c)-[:DEPENDS_ON*1..2]->(sub:Component)-[:USED_IN]->(p:Product)
        RETURN p, sub AS affected, 3 AS hops
      }
      RETURN DISTINCT p.id AS id, p.name AS name, p.sku AS sku,
             collect(DISTINCT affected.name) AS affectedComponents,
             min(hops) AS hopCount
      ORDER BY p.name
    `,
      { supplierId },
    );

    return result.records.map((record) => ({
      id: record.get("id") as string,
      name: record.get("name") as string,
      sku: record.get("sku") as string,
      affectedComponents: record.get("affectedComponents") as string[],
      hopCount: toNumber(record.get("hopCount")),
    }));
  });
}

export async function getComponentImpact(componentId: string): Promise<ImpactResult[]> {
  return runQuery(async (session) => {
    const result = await session.run(
      `
      MATCH (c:Component {id: $componentId})
      CALL {
        WITH c
        MATCH (c)-[:USED_IN]->(p:Product)
        RETURN p, c AS affected, 1 AS hops
        UNION
        WITH c
        MATCH (c)<-[:DEPENDS_ON*1..2]-(parent:Component)-[:USED_IN]->(p:Product)
        RETURN p, parent AS affected, 2 AS hops
      }
      RETURN DISTINCT p.id AS id, p.name AS name, p.sku AS sku,
             collect(DISTINCT affected.name) AS affectedComponents,
             min(hops) AS hopCount
      ORDER BY p.name
    `,
      { componentId },
    );

    return result.records.map((record) => ({
      id: record.get("id") as string,
      name: record.get("name") as string,
      sku: record.get("sku") as string,
      affectedComponents: record.get("affectedComponents") as string[],
      hopCount: toNumber(record.get("hopCount")),
    }));
  });
}

export async function getSinglePointOfFailureRisks(): Promise<SinglePointOfFailure[]> {
  return runQuery(async (session) => {
    const result = await session.run(`
      MATCH (s:Supplier)-[:SUPPLIES]->(c:Component {critical: true})-[:USED_IN]->(p:Product)
      WITH s, c, collect(DISTINCT p) AS products
      WHERE size(products) >= 2
        AND NOT EXISTS {
          MATCH (alt:Supplier)-[:SUPPLIES]->(c)
          WHERE alt <> s
        }
      RETURN s.name AS supplier, c.name AS component,
             size(products) AS productCount,
             [x IN products | x.name] AS products
      ORDER BY productCount DESC
    `);

    return result.records.map((record) => ({
      supplier: record.get("supplier") as string,
      component: record.get("component") as string,
      productCount: toNumber(record.get("productCount")),
      products: record.get("products") as string[],
    }));
  });
}

export async function getRegionalConcentrationRisks(): Promise<RegionalRisk[]> {
  return runQuery(async (session) => {
    const result = await session.run(`
      MATCH (p:Product)<-[:USED_IN]-(c:Component {critical: true})<-[:SUPPLIES]-(s:Supplier)-[:LOCATED_IN]->(r:Region)
      WITH p, r, count(DISTINCT c) AS criticalCount, count(DISTINCT s) AS supplierCount
      WHERE supplierCount >= 2
      RETURN p.name AS product, r.name AS region, criticalCount, supplierCount
      ORDER BY criticalCount DESC, product
    `);

    return result.records.map((record) => ({
      product: record.get("product") as string,
      region: record.get("region") as string,
      criticalCount: toNumber(record.get("criticalCount")),
      supplierCount: toNumber(record.get("supplierCount")),
    }));
  });
}

export async function getAlternatives(componentId: string): Promise<Alternative[]> {
  return runQuery(async (session) => {
    const result = await session.run(
      `
      MATCH (c:Component {id: $componentId})-[:ALTERNATIVE_FOR]-(alt:Component)<-[:SUPPLIES]-(s:Supplier)
      RETURN alt.id AS id, alt.name AS name, alt.category AS category,
             s.name AS supplier, s.reliabilityScore AS reliabilityScore
      ORDER BY s.reliabilityScore DESC, alt.name
    `,
      { componentId },
    );

    return result.records.map((record) => ({
      id: record.get("id") as string,
      name: record.get("name") as string,
      category: record.get("category") as string,
      supplier: record.get("supplier") as string,
      reliabilityScore: toNumber(record.get("reliabilityScore")),
    }));
  });
}

export async function getAllComponents(): Promise<
  Array<{ id: string; name: string; category: string; critical: boolean }>
> {
  return runQuery(async (session) => {
    const result = await session.run(`
      MATCH (c:Component)
      RETURN c.id AS id, c.name AS name, c.category AS category, c.critical AS critical
      ORDER BY c.name
    `);

    return result.records.map((record) => ({
      id: record.get("id") as string,
      name: record.get("name") as string,
      category: record.get("category") as string,
      critical: Boolean(record.get("critical")),
    }));
  });
}

export { int };
