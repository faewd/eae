import type { Article } from "$lib/article/types";
import neo4j, { Integer, type Driver } from "neo4j-driver";
import type { DBResult } from "./result";
import type { User } from "./auth";
import { env } from "$env/dynamic/private";

type N4jResult<E extends string> = DBResult<Record<never, never>, E>;

let _driver: Driver | null = null;

const database = env.NEO4J_DATABASE ?? "neo4j";

export async function connect(): Promise<Driver> {
  const URI = env.NEO4J_URI ?? "neo4j://localhost";
  const USER = env.NEO4J_USERNAME ?? "neo4j";
  const PASS = env.NEO4J_PASSWORD ?? "password";
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
  const session = driver.session({ database });
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
  const session = driver.session({ database });
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
          article: { title: article.title, content: article.content, placeholder: false },
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

      // Create any links the new version of the article has
      await tx.run(
        `//cypher
          MATCH (a:Article { title: $article.title })
          WITH a
          UNWIND $article.links as link
          MERGE (b:Article { title: link.title })
          ON CREATE SET b.placeholder = true
          MERGE r=(a)-[:LINKS_TO { label: link.label }]->(b)
      `,
        { article },
      );

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

      // Delete any map pins associated with this article
      await tx.run(
        `//cypher
          MATCH (a:Article {title: $article.title})
          MATCH (p:MapPin) WHERE (p)-[:REFERS_TO]->(a)
          DETACH DELETE p;
        `,
        { article },
      );

      // Create map pins for this article
      await tx.run(
        `//cypher
          MATCH (a:Article {title: $article.title})
          WITH a
          UNWIND $pins as pin
          CREATE (:MapPin {
              article: $article.title,
              label: pin.label,
              coords: pin.coords,
              type: pin.type,
              map: pin.map,
              desc: pin.desc
            })-[:REFERS_TO]->(a)
        `,
        {
          article,
          pins: article.metadata.pins.map((p) => ({ ...p, label: p.label ?? article.title })),
        },
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

export async function removeFromGraph(title: string) {
  const driver = await ensureDriver();
  driver.executeQuery(
    `//cypher
      MATCH (a:Article { title: $title })
      DETACH DELETE a;
    `,
    { title },
    { database },
  );
}

export async function searchArticles(query: string): Promise<{ title: string }[]> {
  const driver = await ensureDriver();
  const { records } = await driver.executeQuery(
    `//cypher
      CALL db.index.fulltext.queryNodes("article_text_idx", $query) YIELD node
      WHERE node.placeholder = false
      RETURN node.title as title
    `,
    {
      query: query
        .split(/\s+/)
        .map((word) => word + "~")
        .join(" "),
    },
    { database },
  );
  return records.map((record) => ({
    title: record.get("title"),
  }));
}

export async function listUntaggedArticles() {
  const driver = await ensureDriver();
  const { records } = await driver.executeQuery(
    `//cypher
      MATCH (a:Article)
      WHERE NOT a.placeholder AND NOT EXISTS {
        (:Tag)-[:APPLIES_TO]->(a)
      }
      ORDER BY a.title ASC
      RETURN a.title as title
    `,
  );

  return records.map((r) => ({ title: r.get("title") }));
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
    { database },
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
      ORDER BY a.title ASC
      RETURN a.title as title
    `,
    { tag },
    { database },
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
    { database },
  );

  return records.map((r) => ({
    label: r.get("label"),
    count: r.get("count").toNumber(),
  }));
}

export async function getPinsForMap(map: string) {
  const driver = await ensureDriver();
  const { records } = await driver.executeQuery(
    `//cypher
      MATCH (p:MapPin)
      WHERE p.map = $map
      RETURN p.article as article, p.label as label, p.desc as desc, p.coords as coords, p.type as type;
    `,
    { map },
  );
  return records.map((r) => ({
    article: r.get("article"),
    label: r.get("label"),
    desc: r.get("desc"),
    coords: r.get("coords"),
    type: r.get("type"),
  }));
}

export async function upsertUser(name: User["name"], icon: User["icon"]): Promise<User> {
  const driver = await ensureDriver();
  const { records } = await driver.executeQuery(
    `//cypher
      MERGE (u:User { name: $user.name })
      ON MATCH SET u += $user
      ON CREATE SET u = $user, u.isAdmin = false
      RETURN u.name as name, u.icon as icon, u.isAdmin as isAdmin
    `,
    { user: { name, icon } },
    { database },
  );

  if (records.length !== 1) {
    throw Error(`Failed to update user "${name}": Expected 1 node, got ${records.length}.`);
  }

  const r = records[0];
  return {
    name: r.get("name"),
    icon: r.get("icon"),
    isAdmin: r.get("isAdmin"),
  };
}
