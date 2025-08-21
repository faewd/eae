import { twMerge } from "tailwind-merge";
import clsx, { type ClassValue } from "clsx";

export default function cx(...classes: ClassValue[]) {
  return twMerge(clsx(classes));
}
