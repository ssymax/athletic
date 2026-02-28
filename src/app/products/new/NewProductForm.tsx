"use client";

import { createProduct } from "@/app/actions/products";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewProductForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    try {
      await createProduct(formData);
      router.push("/products");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/products"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Wróć
        </Link>
        <h1 className="text-2xl font-bold">Nowy Produkt</h1>
      </div>

      <div className="card">
        <form action={handleSubmit} className="space-y-4">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="name" className="label">
              Nazwa
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="category" className="label">
              Kategoria
            </label>
            <select name="category" id="category" className="input">
              <option value="DRINKS">Napoje</option>
              <option value="SUPPLEMENTS">Suplementy</option>
              <option value="OTHER">Inne</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="price" className="label">
                Cena (PLN)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                step="0.01"
                className="input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="stock" className="label">
                Stan początkowy
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                min="0"
                defaultValue="0"
                className="input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/products" className="btn btn-secondary">
              Anuluj
            </Link>
            <button type="submit" className="btn btn-primary">
              Dodaj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
