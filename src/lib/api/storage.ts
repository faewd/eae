import { applyPatch } from "diff";
import { join } from "node:path";
import fs from "node:fs/promises";

const basePath = join(import.meta.dirname, "../../../.data");

function getFilePath(name: string) {
  return join(basePath, "articles", encodeURIComponent(name) + ".md");
}

export type DBResult =
  | {
      ok: false;
      error: string;
    }
  | {
      ok: true;
      content: string;
    };

export async function getArticle(name: string): Promise<DBResult> {
  const path = getFilePath(name);
  try {
    const content = await fs.readFile(path);
    return {
      ok: true,
      content: content.toString(),
    };
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      error: `Failed to read article with name ${name}.`,
    };
  }
}

export async function writeArticle(name: string, content: string): Promise<DBResult> {
  const path = getFilePath(name);
  try {
    await fs.writeFile(path, content);
    return {
      ok: true,
      content: content,
    };
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      error: `Failed to write article with name ${name}.`,
    };
  }
}

export async function deleteArticle(name: string): Promise<DBResult> {
  const path = getFilePath(name);
  try {
    await fs.rm(path);
    return {
      ok: true,
      content: `Deleted ${name}.`,
    };
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      error: `Failed to delete article with name ${name}.`,
    };
  }
}

async function patchArticleWithoutSaving(name: string, patch: string): Promise<DBResult> {
  const base = await getArticle(name);
  if (!base.ok) return base;

  const patched = applyPatch(base.content, patch);
  if (!patched) {
    return {
      ok: false,
      error: `Failed to patch article with name ${name}.`,
    };
  }

  return {
    ok: true,
    content: patched,
  };
}

export async function patchArticle(name: string, patch: string): Promise<DBResult> {
  const patchResult = await patchArticleWithoutSaving(name, patch);
  if (!patchResult.ok) return patchResult;
  return writeArticle(name, patchResult.content);
}

async function renameArticle(oldName: string, newName: string): Promise<DBResult> {
  const getResult = await getArticle(oldName);
  if (!getResult.ok) return getResult;
  try {
    await fs.rename(getFilePath(oldName), getFilePath(newName));
    return getResult;
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      error: `Failed to rename '${oldName}' to '${newName}'.`,
    };
  }
}

export async function patchAndRenameArticle(
  oldName: string,
  newName: string,
  patch: string,
): Promise<DBResult> {
  const getResult = await getArticle(oldName);
  if (!getResult.ok) return getResult;

  const backupName = oldName + "~" + Date.now();
  const backupResult = await writeArticle(backupName, getResult.content);
  if (!backupResult.ok) {
    return {
      ok: false,
      error: `Failed to back up "${oldName}": ${backupResult.error}`,
    };
  }

  const patchResult = await patchArticle(oldName, patch);
  if (!patchResult.ok) return patchResult;

  const renameResult = await renameArticle(oldName, newName);
  if (!renameResult.ok) return renameResult;

  const deleteResult = await deleteArticle(backupName);
  if (!deleteResult.ok) return deleteResult;

  return patchResult;
}
