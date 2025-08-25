import type { Article } from "$lib/article/types";
import neo4j, { type Driver } from "neo4j-driver";
import type { DBResult } from "./result";

type N4jResult<E extends string> = DBResult<Record<never, never>, E>;

let _driver: Driver | null = null;

export async function connect(): Promise<Driver> {
  const URI = process.env.NEO4J_URI ?? "neo4j://localhost";
  const USER = process.env.NEO4J_USERNAME ?? "neo4j";
  const PASS = process.env.NEO4J_USERNAME ?? "password";
  const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASS));
  const serverInfo = await driver.getServerInfo();
  console.log(`Connected to ${serverInfo.agent} on ${serverInfo.address}`);
  _driver = driver;
  return driver;
}

async function ensureDriver(): Promise<Driver> {
  if (_driver !== null) return _driver;
  return await connect();
}

export async function init() {
  const driver = await ensureDriver();
  const session = driver.session({ database: "neo4j" });
  try {
    await session.executeWrite(async (tx) => {
      await tx.run(`//cypher
        DROP INDEX article_title_idx IF EXISTS
      `);
      await tx.run(`//cypher
        DROP INDEX article_text_idx IF EXISTS
      `);
    });

    await session.executeWrite(async (tx) => {
      await tx.run(`//cypher
        CREATE INDEX article_title_idx FOR (a:Article) ON (a.title)
      `);
      await tx.run(`//cypher
        CREATE FULLTEXT INDEX article_text_idx FOR (a:Article) ON EACH [a.title, a.content]
      `);
    });
  } finally {
    session.close();
  }
}

export async function mergeIntoGraph(
  article: Article,
  oldName?: string,
): Promise<N4jResult<"n4j-query-error">> {
  const driver = await ensureDriver();
  const session = driver.session({ database: "neo4j" });
  try {
    await session.executeWrite(async (tx) => {
      await tx.run(
        `//cypher
          MERGE (a:Article {title: $title})
          ON CREATE SET a = $article
          ON MATCH SET a += $article

          WITH 0 as dummy

          MATCH (a:Article {title: $article.title})-[r:LINKS_TO]->(:Article)
          DELETE r

          WITH 0 as dummy

          MATCH (a:Article) WHERE a.content IS NULL AND NOT (a)<-[:LINKS_TO]-()
          DELETE a
        `,
        {
          title: oldName ?? article.title,
          article: { title: article.title, content: article.content },
          links: article.links,
        },
      );

      await tx.run(
        `//cypher
          MATCH (a:Article {title: $article.title})
          WITH a
          UNWIND $article.links as link
          MERGE (b:Article {title: link.title})
          MERGE (a)-[:LINKS_TO { label: link.label }]->(b)
          RETURN a;
        `,
        { article },
      );
    });

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      code: "n4j-query-error",
      error: "Failed to update the graph.",
      detail: err,
    };
  } finally {
    session.close();
  }
}

export async function searchArticles(query: string): Promise<{ title: string }[]> {
  const driver = await ensureDriver();
  const { records } = await driver.executeQuery(
    `//cypher
    CALL db.index.fulltext.queryNodes("article_text_idx", $query) YIELD node
    RETURN node.title as title
  `,
    {
      query: query
        .split(/\s+/)
        .map((word) => word + "~")
        .join(" "),
    },
  );
  return records.map((record) => ({
    title: record.get("title"),
  }));
}
