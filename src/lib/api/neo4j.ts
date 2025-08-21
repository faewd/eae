import type { Article } from "$lib/article/types";
import neo4j, { type Driver } from "neo4j-driver";

type N4jResult = { ok: false; error: Error | string } | { ok: true };

let _driver: Driver | null = null;

export async function connect(): Promise<Driver> {
  const URI = process.env.NEO4J_URI ?? "neo4j://localhost";
  const USER = process.env.NEO4J_USERNAME ?? "neo4j";
  const PASS = process.env.NEO4J_USERNAME ?? "password";
  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS));
  const serverInfo = await driver.getServerInfo();
  console.log(`Connected to Neo4j:\n${serverInfo}`);
  _driver = driver;
  return driver;
}

async function ensureDriver(): Promise<Driver> {
  if (_driver !== null) return _driver;
  return await connect();
}

export async function mergeArticle(article: Article): Promise<N4jResult> {
  try {
    const driver = await ensureDriver();

    await driver.executeQuery(
      `
        MERGE (a:Article {title: $article.title})
        ON CREATE SET a = $article
        ON MATCH SET a += $article

        WITH 0 as dummy

        MATCH (:Article {title: $article.title})-[r:LINKS_TO]->(:Article)
        DELETE r

        WITH 0 as dummy

        MATCH (a:Article { title: $article.title })
        WITH a
        UNWIND $links as link
        MERGE (a)-[:LINKS_TO { label: link.label }]->(b:Article { title: link.title })
        RETURN a;
      `,
      { article: { title: article.title, content: article.content }, links: article.links },
      { database: "neo4j" },
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : `${err}`,
    };
  }
}
