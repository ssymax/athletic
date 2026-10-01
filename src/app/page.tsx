import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";

export default async function Home() {
  const t = await getTranslations("auth");
  const tc = await getTranslations("common");
  return (
    <div className="fade-in text-center py-8 home-hero">
      <h1 className="mb-6">{tc("appName")}</h1>
      <p className="text-muted text-lg mb-8 hero-copy">
        {t("homeDescription")}
      </p>
      <div className="flex gap-4 justify-center">
        <Link href="/dashboard">
          <Button size="lg">{t("homeCta")}</Button>
        </Link>
      </div>
    </div>
  );
}
