# i18n conventions (PL / EN)

Library: `next-intl` without URL routing. The locale comes from the `NEXT_LOCALE` cookie (`pl` | `en`, default `pl`), set by `setLocale()` in `src/i18n/locale.ts` (used by `LanguageSwitcher`).

## Messages

- Files: `messages/pl/<namespace>.json` and `messages/en/<namespace>.json`. File `dashboard.json` becomes `messages.dashboard`, so keys are used as `useTranslations("dashboard")` + `t("key")`.
- Add a namespace: create both JSON files, then add the name to `src/i18n/namespaces.ts`. Nothing else.
- Each agent should own its namespace files to avoid merge conflicts. Shared strings go in `common`.
- Polish files must keep the existing Polish text exactly. English should be natural, not literal.
- Counts use ICU plurals. Polish needs `one`/`few`/`many`/`other`, English `one`/`other`:
  `"members": "{count, plural, one {# klubowicz} few {# klubowiczów} many {# klubowiczów} other {# klubowicza}}"`
  (Polish: 1 klubowicz, 2-4 klubowiczów, 5+ klubowiczów, fractions klubowicza.)
- Interpolation: `"welcome": "Cześć, {name}"` and `t("welcome", { name })`.

## Usage

```tsx
// Server component
import { getTranslations } from "next-intl/server";
const t = await getTranslations("dashboard");
<h1>{t("title")}</h1>

// Client component
"use client";
import { useTranslations } from "next-intl";
const t = useTranslations("dashboard");

// Server action (errors returned or thrown)
import { getTranslations } from "next-intl/server";
const t = await getTranslations("members");
throw new Error(t("errors.notFound"));
```

Client components rely on `NextIntlClientProvider` in the root layout, which passes all messages.

## Dates and numbers

Use next-intl formatters, not `toLocaleDateString` with hardcoded locales:

- Client: `const format = useFormatter(); format.dateTime(date, { dateStyle: "medium" })`, `format.number(n, { style: "currency", currency: "PLN" })`.
- Server: `const format = await getFormatter();` same API.

## Tests

`src/i18n/vitest.setup.ts` mocks `next-intl/server` (`getTranslations`, `getLocale`) with a real translator over `messages/pl/*`, so tests keep asserting Polish text, e.g. `rejects.toThrow("Brak uprawnień administratora")`. New namespaces are picked up automatically.
