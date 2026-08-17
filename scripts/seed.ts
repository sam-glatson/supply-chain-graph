import "dotenv/config";
import neo4j from "neo4j-driver";
import {
  alternativeLinks,
  components,
  dependsOnLinks,
  facilities,
  products,
  regions,
  suppliers,
  supplyLinks,
  usedInLinks,
} from "./seed-data";

async function seed() {
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME ?? "cognodb";
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !password) {
    console.error("Set NEO4J_URI and NEO4J_PASSWORD before running the seed script.");
    process.exit(1);
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  const session = driver.session();

  try {
    console.log("Connecting to CognoDB...");
    await driver.verifyConnectivity();
    console.log("Connected. Clearing existing graph...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("Creating constraints and indexes...");
    const labels = ["Region", "Supplier", "Component", "Product", "Facility"];
    for (const label of labels) {
      await session.run(
        `CREATE CONSTRAINT IF NOT EXISTS FOR (n:${label}) REQUIRE n.id IS UNIQUE`,
      );
    }

    console.log("Loading regions...");
    await session.run(
      `
      UNWIND $rows AS row
      CREATE (r:Region {id: row.id, name: row.name, code: row.code})
    `,
      { rows: regions },
    );

    console.log("Loading facilities...");
    await session.run(
      `
      UNWIND $rows AS row
      CREATE (f:Facility {id: row.id, name: row.name, type: row.type})
    `,
      { rows: facilities },
    );

    console.log("Loading suppliers...");
    await session.run(
      `
      UNWIND $rows AS row
      MATCH (r:Region {id: row.regionId})
      CREATE (s:Supplier {id: row.id, name: row.name, tier: row.tier, reliabilityScore: row.reliabilityScore})
      CREATE (s)-[:LOCATED_IN]->(r)
    `,
      { rows: suppliers },
    );

    console.log("Loading components...");
    await session.run(
      `
      UNWIND $rows AS row
      CREATE (c:Component {
        id: row.id,
        name: row.name,
        category: row.category,
        critical: row.critical
      })
    `,
      { rows: components },
    );

    console.log("Loading products and manufacturing links...");
    await session.run(
      `
      UNWIND $rows AS row
      MATCH (f:Facility {id: row.facilityId})
      CREATE (p:Product {id: row.id, name: row.name, sku: row.sku, line: row.line})
      CREATE (p)-[:MANUFACTURED_AT]->(f)
    `,
      { rows: products },
    );

    console.log("Creating supply relationships...");
    await session.run(
      `
      UNWIND $rows AS row
      MATCH (s:Supplier {id: row.supplierId})
      MATCH (c:Component {id: row.componentId})
      CREATE (s)-[:SUPPLIES {
        unitCost: row.unitCost,
        leadTimeDays: row.leadTimeDays,
        minOrderQty: row.minOrderQty
      }]->(c)
    `,
      { rows: supplyLinks },
    );

    console.log("Creating bill-of-materials links...");
    await session.run(
      `
      UNWIND $rows AS row
      MATCH (c:Component {id: row.componentId})
      MATCH (p:Product {id: row.productId})
      CREATE (c)-[:USED_IN {
        quantity: row.quantity,
        isCriticalPath: row.isCriticalPath
      }]->(p)
    `,
      { rows: usedInLinks },
    );

    console.log("Creating component dependencies...");
    await session.run(
      `
      UNWIND $rows AS row
      MATCH (parent:Component {id: row.parentId})
      MATCH (child:Component {id: row.childId})
      CREATE (parent)-[:DEPENDS_ON {quantity: row.quantity}]->(child)
    `,
      { rows: dependsOnLinks },
    );

    console.log("Creating alternative component links...");
    await session.run(
      `
      UNWIND $rows AS row
      MATCH (a:Component {id: row.componentA})
      MATCH (b:Component {id: row.componentB})
      CREATE (a)-[:ALTERNATIVE_FOR {compatibilityScore: row.compatibilityScore}]->(b)
      CREATE (b)-[:ALTERNATIVE_FOR {compatibilityScore: row.compatibilityScore}]->(a)
    `,
      { rows: alternativeLinks },
    );

    const stats = await session.run(`
      MATCH (n) WITH count(n) AS nodes
      MATCH ()-[r]->() WITH nodes, count(r) AS rels
      RETURN nodes, rels
    `);

    const record = stats.records[0];
    console.log(
      `Seed complete: ${record.get("nodes")} nodes, ${record.get("rels")} relationships.`,
    );
  } finally {
    await session.close();
    await driver.close();
  }
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
