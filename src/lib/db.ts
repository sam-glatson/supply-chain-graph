import neo4j, { Driver, Session } from "neo4j-driver";

let driver: Driver | null = null;

function getConfig() {
  const uri = process.env.NEO4J_URI;
  const username = process.env.NEO4J_USERNAME ?? "cognodb";
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !password) {
    throw new Error(
      "Missing database configuration. Set NEO4J_URI and NEO4J_PASSWORD environment variables.",
    );
  }

  return { uri, username, password };
}

export function getDriver(): Driver {
  if (!driver) {
    const { uri, username, password } = getConfig();
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  }

  return driver;
}

export async function verifyConnectivity(): Promise<boolean> {
  try {
    const dbDriver = getDriver();
    await dbDriver.verifyConnectivity();
    return true;
  } catch {
    return false;
  }
}

export async function withSession<T>(
  work: (session: Session) => Promise<T>,
): Promise<T> {
  const session = getDriver().session();
  try {
    return await work(session);
  } finally {
    await session.close();
  }
}

export class DatabaseError extends Error {
  constructor(message = "Database unavailable") {
    super(message);
    this.name = "DatabaseError";
  }
}

export async function runQuery<T>(
  work: (session: Session) => Promise<T>,
): Promise<T> {
  try {
    return await withSession(work);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Missing database")) {
      throw error;
    }
    throw new DatabaseError();
  }
}
