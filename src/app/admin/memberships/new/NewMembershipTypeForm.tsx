"use client";

import { createMembershipType } from "@/app/actions/membershipTypes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewMembershipTypeForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<string>("TIME");

  async function handleSubmit(formData: FormData) {
    try {
      await createMembershipType(formData);
      router.push("/admin/memberships");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/memberships"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Wróć
        </Link>
        <h1 className="text-2xl font-bold">Nowy Typ Karnetu</h1>
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
              placeholder="np. Karnet Open 30 dni"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="scope" className="label">
                Zakres
              </label>
              <select name="scope" id="scope" className="input">
                <option value="GYM">Siłownia</option>
                <option value="CLASSES">Zajęcia</option>
                <option value="ALL">Siłownia + Zajęcia</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="type" className="label">
                Typ rozliczenia
              </label>
              <select
                name="type"
                id="type"
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="TIME">Czasowy (dni)</option>
                <option value="ENTRY">Wejściowy (ilość)</option>
              </select>
            </div>
          </div>

          {type === "TIME" ? (
            <div className="form-group">
              <label htmlFor="daysValid" className="label">
                Liczba dni ważności
              </label>
              <input
                type="number"
                id="daysValid"
                name="daysValid"
                required
                min="1"
                className="input"
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="entries" className="label">
                Liczba wejść
              </label>
              <input
                type="number"
                id="entries"
                name="entries"
                required
                min="1"
                className="input"
              />
            </div>
          )}

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

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/admin/memberships" className="btn btn-secondary">
              Anuluj
            </Link>
            <button type="submit" className="btn btn-primary">
              Stwórz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
