"use client";

import { setStock } from "@/app/actions/products";
import { useTransition, useState, useEffect } from "react";

export function StockInput({ id, stock }: { id: string; stock: number }) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(String(stock));

  useEffect(() => {
    setValue(String(stock));
  }, [stock]);

  function handleBlur() {
    const parsed = parseInt(value);
    if (isNaN(parsed) || parsed < 0 || parsed === stock) {
      setValue(String(stock));
      return;
    }
    startTransition(() => setStock(id, parsed));
  }

  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      disabled={isPending}
      style={{ width: "5rem" }}
      className="input-compact"
    />
  );
}
