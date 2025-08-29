import type { Article } from "$lib/article/types";
import neo4j, { Integer, type Driver } from "neo4j-driver";
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
      // Create or Update Article
      await tx.run(
        `//cypher
        MERGE (a:Article {title: $title})
        ON CREATE SET a = $article
        ON MATCH SET a += $article
      `,
        {
          title: oldName ?? article.title,
          article: { title: article.title, content: article.content },
        },
      );

      // Delete any existing links from this article
      await tx.run(
        `//cypher
        MATCH (:Article {title: $article.title})-[r:LINKS_TO]->(:Article)
        DELETE r
      `,
        { article },
      );

      // Delete any placeholder articles that are no-longer linked to
      await tx.run(`//cypher
        MATCH (a:Article) WHERE a.content IS NULL AND NOT (:Article)-[:LINKS_TO]->(a)
        DELETE a
      `);

      // Delete any tags this article already had
      await tx.run(
        `//cypher
        MATCH (a:Article {title: $title})
        MATCH (:Tag)-[r:APPLIES_TO]->(a)
        DELETE r
      `,
        { title: oldName ?? article.title },
      );

      // Delete any tags that apply to no articles
      await tx.run(`//cypher
        MATCH (t:Tag) WHERE NOT (t)-[:APPLIES_TO]->(:Article)
        DELETE t
      `);

      // Create any links the new version of the article has
      await tx.run(
        `//cypher
          MATCH (a:Article {title: $article.title})
          WITH a
          UNWIND $article.links as link
          MERGE (b:Article {title: link.title})
          MERGE r=(a)-[:LINKS_TO { label: link.label }]->(b)
      `,
        { article },
      );

      // Create any tags the new version of the article has
      await tx.run(
        `//cypher
          MATCH (a:Article {title: $article.title})
          WITH a
          UNWIND $tags as tag
          MERGE (t:Tag { label: tag })
          CREATE (t)-[:APPLIES_TO]->(a)
        `,
        { article, tags: article.metadata.tags },
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
    { database: "neo4j" },
  );
  return records.map((record) => ({
    title: record.get("title"),
  }));
}

export async function listTags(page = 0, size = 25) {
  const driver = await ensureDriver();
  const { records } = await driver.executeQuery(
    `//cypher
      MATCH (t:Tag)
      WITH count(*) as total
      MATCH (t:Tag)-[:APPLIES_TO]->(a:Article)
      WITH t as tag, count(a) as usages, collect(a) as articles, total
      WHERE usages > 0
      ORDER BY tag.label ASC
      SKIP $offset
      LIMIT $limit
      RETURN tag.label as label, usages, articles, total;
    `,
    { offset: new Integer(page * size), limit: new Integer(size) },
    { database: "neo4j" },
  );
  return {
    total: records[0]?.get("total")?.toNumber() ?? 0,
    page: records.map((record) => ({
      label: record.get("label"),
      usages: record.get("usages").toNumber(),
      articles: record.get("articles").map((a: { title: string }) => a.title),
      total: record.get("total").toNumber(),
    })),
  };
}

export async function fetchByTag(tag: string) {
  const driver = await ensureDriver();
  const { records } = await driver.executeQuery(
    `//cypher
      MATCH (t:Tag) WHERE t.label = $tag
      MATCH (a:Article) WHERE (t)-[:APPLIES_TO]->(a)
      RETURN a.title as title
    `,
    { tag },
    { database: "neo4j" },
  );

  return records.map((record) => ({
    title: record.get("title"),
  }));
}

export async function listSimilarTags(tag: string) {
  const driver = await ensureDriver();
  const { records } = await driver.executeQuery(
    `//cypher
      MATCH (t:Tag) WHERE t.label = $tag
      MATCH (t)-[:APPLIES_TO]->(a:Article)
      MATCH (o:Tag)-[r:APPLIES_TO]->(a)
      WHERE o <> t
      LIMIT 10
      WITH o.label as label, count(r) as times
      ORDER BY times DESC, label ASC
      RETURN label, times as count;
    `,
    { tag },
    { database: "neo4j" },
  );

  return records.map((r) => ({
    label: r.get("label"),
    count: r.get("count").toNumber(),
  }));
}
