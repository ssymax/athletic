import { vi } from "vitest";
import { createTranslator } from "next-intl";
import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";

// Real pl messages merged by namespace, same shape as src/i18n/request.ts
const dir = resolve(__dirname, "../../messages/pl");
const messages = Object.fromEntries(
  readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => [
      f.replace(/\.json$/, ""),
      JSON.parse(readFileSync(resolve(dir, f), "utf8")),
    ]),
);

vi.mock("next-intl/server", () => ({
  getLocale: async () => "pl",
  getTranslations: async (arg?: string | { namespace?: string }) => {
    const namespace = typeof arg === "string" ? arg : arg?.namespace;
    return createTranslator({
      locale: "pl",
      messages,
      namespace,
    } as never);
  },
}));
