import { namespaces } from "./namespaces";
import type { Locale } from "./config";

// Static template-literal imports keep the bundle analyzable (standalone-safe).
export async function loadMessages(locale: Locale) {
  const entries = await Promise.all(
    namespaces.map(async (ns) => {
      const mod = await import(`../../messages/${locale}/${ns}.json`);
      return [ns, mod.default] as const;
    }),
  );
  return Object.fromEntries(entries);
}
