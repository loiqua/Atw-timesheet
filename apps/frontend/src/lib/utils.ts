import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toInitials(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? parts[1]?.[0] ?? "" : (trimmed.match(/[A-Z]/g)?.[1] ?? "");
  return (first + second).toUpperCase();
}

export function roleLabel(role: string): string {
  return role
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/(^|\s)\w/g, (m) => m.toUpperCase());
}
