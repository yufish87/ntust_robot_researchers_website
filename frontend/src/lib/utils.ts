import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely checks if a given URL string belongs to Google Drive or Google CDN domains.
 * Uses the URL constructor to validate the exact hostname rather than insecure substring matching.
 */
export function isGoogleDriveOrCdnUrl(urlString: string | undefined | null): boolean {
  if (!urlString) return false;
  try {
    const parsed = new URL(urlString, "https://dummy.local");
    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname === "drive.google.com" ||
      hostname === "docs.google.com" ||
      hostname === "lh3.googleusercontent.com" ||
      hostname.endsWith(".googleusercontent.com") ||
      hostname.endsWith(".drive.google.com")
    );
  } catch {
    return false;
  }
}

/**
 * Safely extracts Google Drive file ID from a URL using hostname validation.
 */
export function getGoogleDriveIdFromUrl(urlString: string | undefined | null): string | null {
  if (!urlString) return null;
  try {
    const parsed = new URL(urlString, "https://dummy.local");
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "drive.google.com" ||
      hostname === "docs.google.com" ||
      hostname === "lh3.googleusercontent.com" ||
      hostname.endsWith(".googleusercontent.com") ||
      hostname.endsWith(".drive.google.com")
    ) {
      const match =
        parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
        parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return match[1];
      const idParam = parsed.searchParams.get("id");
      if (idParam) return idParam;
    }
  } catch {
    // If URL parsing fails, return null
  }
  return null;
}

/**
 * Transform Google Drive URLs to embeddable versions
 * Tries to use the lh3.googleusercontent.com CDN for better performance and access handling.
 * Fallback to drive.google.com/thumbnail if needed.
 */
export function getGoogleDriveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  const id = getGoogleDriveIdFromUrl(url);
  if (id) {
    return `https://lh3.googleusercontent.com/d/${id}`;
  }

  return url;
}
