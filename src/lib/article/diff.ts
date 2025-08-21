import { createTwoFilesPatch } from "diff";

export interface Diff {
  startLine: number;
  lineCount: number;
  added: boolean;
  removed: boolean;
  common: boolean;
  value: string;
}

export function diff(
  updatedTitle: string,
  updated: string,
  baseTitle: string,
  base: string,
): string {
  return createTwoFilesPatch(baseTitle, updatedTitle, base, updated);
}

function countHunks(patch: string): number {
  return [...patch.matchAll(/^@@[^@]+@@$/gm)].length;
}

export function isEmpty(patch: string): boolean {
  return countHunks(patch) === 0;
}

export function extractNames(patch: string): [string, string] {
  const [start, end] = patch.startsWith("Index: ") ? [2, 4] : [1, 3];
  return patch
    .split("\n")
    .slice(start, end)
    .map((line) => line.slice(4)) as [string, string];
}
