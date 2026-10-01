"use client";

import { updateStock } from "@/app/actions/products";
import { useTransition } from "react";
import { useTranslations } from "next-intl";

export function UpdateStockButtons({ id }: { id: string }) {
  const t = useTranslations("products");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => startTransition(() => updateStock(id, 1))}
        disabled={isPending}
        className="btn btn-outline btn-sm stock-btn"
        title={t("addPiece")}
      >
        +
      </button>
      <button
        onClick={() => startTransition(() => updateStock(id, -1))}
        disabled={isPending}
        className="btn btn-outline btn-sm stock-btn"
        title={t("removePiece")}
      >
        -
      </button>
    </div>
  );
}
