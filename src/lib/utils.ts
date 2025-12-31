import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Domain detection utilities
export function isCoatingKingsDomain(): boolean {
  const hostname = window.location.hostname.toLowerCase();
  return hostname.includes('coatingkingz') || hostname.includes('coatingkings');
}

export function getMainSiteUrl(): string {
  return isCoatingKingsDomain() ? 'https://gcn.lovable.app' : '/';
}

// Get admin paths based on domain
export function getCoatingKingsAdminPath(path: 'auth' | 'dashboard'): string {
  return isCoatingKingsDomain() ? `/admin/${path}` : `/coating-kings/admin/${path}`;
}
