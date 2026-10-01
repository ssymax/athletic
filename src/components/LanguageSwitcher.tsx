"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales } from "@/i18n/config";
import { setLocale } from "@/i18n/locale";

export function LanguageSwitcher() {
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(locale: (typeof locales)[number]) {
    if (locale === current) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={pending}
          onClick={() => change(locale)}
          className={`btn btn-sm ${locale === current ? "btn-secondary" : "btn-ghost"}`}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
