'use client'

import { updateStock } from "@/app/actions/products";
import { useTransition } from "react";

export function UpdateStockButtons({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();

    return (
        <div className="flex gap-2">
            <button
                onClick={() => startTransition(() => updateStock(id, 1))}
                disabled={isPending}
                className="btn btn-outline btn-sm stock-btn"
                title="Dodaj sztukę"
            >
                +
            </button>
            <button
                onClick={() => startTransition(() => updateStock(id, -1))}
                disabled={isPending}
                className="btn btn-outline btn-sm stock-btn"
                title="Usuń sztukę"
            >
                -
            </button>
        </div>
    )
}
