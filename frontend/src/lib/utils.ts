import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Transform Google Drive URLs to embeddable versions
 * Tries to use the lh3.googleusercontent.com CDN for better performance and access handling.
 * Fallback to drive.google.com/thumbnail if needed.
 */
export function getGoogleDriveImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  // Pattern to extract ID from various Drive URL formats
  // 1. https://drive.google.com/file/d/VIDEO_ID/view...
  // 2. https://drive.google.com/uc?id=VIDEO_ID
  // 3. https://drive.google.com/open?id=VIDEO_ID
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/
  ];

  let id = null;
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      id = match[1];
      break;
    }
  }

  if (id) {
    // Return direct thumbnail link (size 1000px) which usually bypasses some strict 3rd party cookie checks
    // lh3.googleusercontent.com/d/{id} is also popular but sometimes requires auth.
    // drive.google.com/thumbnail?id={id}&sz=w1000 is robust for public files.
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  }

  return url;
}
