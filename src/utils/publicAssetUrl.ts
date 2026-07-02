/** Resolve a public/ asset path for web and Capacitor (relative Vite base). */
export function publicAssetUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const trimmed = path.startsWith("/") ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${trimmed}`;
}
