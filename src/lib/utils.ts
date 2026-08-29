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

/**
 * True when the app is being served from a dedicated store host.
 * Matches: globalcontractor.store, store.globalcontractor.network, gcnstore.*, thegcnstore.*
 */
export function isStoreDomain(): boolean {
  if (typeof window === "undefined") return false;
  const hostname = window.location.hostname.toLowerCase();
  return (
    hostname === "globalcontractor.store" ||
    hostname === "www.globalcontractor.store" ||
    hostname.endsWith(".globalcontractor.store") ||
    hostname.startsWith("store.") ||
    hostname.includes("gcnstore") ||
    hostname.includes("thegcnstore")
  );
}

/** Canonical public URL for the store, used in SEO tags. */
export function getStoreCanonicalUrl(): string {
  return "https://globalcontractor.store/";
}

/** Link to the network join flow — absolute when browsing from the store host. */
export function getJoinNetworkUrl(): string {
  return isStoreDomain()
    ? "https://globalcontractor.network/join-network"
    : "/join-network";
}


export function getMainSiteUrl(): string {
  return isCoatingKingsDomain() ? 'https://gcn.lovable.app' : '/';
}

// Get admin paths based on domain
export function getCoatingKingsAdminPath(path: 'auth' | 'dashboard'): string {
  return isCoatingKingsDomain() ? `/admin/${path}` : `/coating-kings/admin/${path}`;
}
