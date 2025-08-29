import { applyPatch } from "diff";
import fs from "node:fs/promises";
import type { DBResult } from "./result";
import { EAE_DATA_DIR } from "$env/static/private";

type FSResult<E extends string> = DBResult<{ content: string }, E>;

const basePath = EAE_DATA_DIR;

function getFilePath(name: string) {
  return `${basePath}/articles/${encodeURIComponent(name)}.md`;
}

export async function getArticle(name: string): Promise<FSResult<"not-found">> {
  const path = getFilePath(name);
  try {
    const content = await fs.readFile(path);
    return {
      ok: true,
      content: content.toString(),
    };
  } catch (err) {
    return {
      ok: false,
      code: "not-found",
      error: `Couldn't find an article titled "${name}".`,
      detail: err,
    };
  }
}

export async function writeArticle(
  name: string,
  content: string,
): Promise<FSResult<"write-failed">> {
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
      code: "write-failed",
      error: `Failed to write article "${name}".`,
    };
  }
}

export async function deleteArticle(name: string): Promise<FSResult<"delete-failed">> {
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
      code: "delete-failed",
      error: `Failed to delete article "${name}".`,
    };
  }
}

async function patchArticleWithoutSaving(
  name: string,
  patch: string,
): Promise<FSResult<"not-found" | "patch-failed">> {
  const base = await getArticle(name);
  if (!base.ok) return base;

  const patched = applyPatch(base.content, patch);
  if (!patched) {
    return {
      ok: false,
      code: "patch-failed",
      error: `Failed to patch article "${name}".`,
    };
  }

  return {
    ok: true,
    content: patched,
  };
}

export async function patchArticle(
  name: string,
  patch: string,
): Promise<FSResult<"not-found" | "patch-failed" | "write-failed">> {
  const patchResult = await patchArticleWithoutSaving(name, patch);
  if (!patchResult.ok) return patchResult;
  return writeArticle(name, patchResult.content);
}

async function renameArticle(
  oldName: string,
  newName: string,
): Promise<FSResult<"not-found" | "rename-failed">> {
  const getResult = await getArticle(oldName);
  if (!getResult.ok) return getResult;
  try {
    await fs.rename(getFilePath(oldName), getFilePath(newName));
    return getResult;
  } catch (err) {
    console.error(err);
    return {
      ok: false,
      code: "rename-failed",
      error: `Failed to rename "${oldName}" to "${newName}".`,
    };
  }
}

export async function patchAndRenameArticle(
  oldName: string,
  newName: string,
  patch: string,
): Promise<
  FSResult<
    | "not-found"
    | "backup-failed"
    | "patch-failed"
    | "write-failed"
    | "rename-failed"
    | "delete-failed"
  >
> {
  const getResult = await getArticle(oldName);
  if (!getResult.ok) return getResult;

  const backupName = oldName + "~" + Date.now();
  const backupResult = await writeArticle(backupName, getResult.content);
  if (!backupResult.ok) {
    return {
      ok: false,
      code: "backup-failed",
      error: `Failed to back up article "${oldName}".`,
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
