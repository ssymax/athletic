"use client";

import { updateUser } from "@/app/actions/users";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface EditUserFormProps {
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export default function EditUserForm({ user }: EditUserFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    try {
      await updateUser(user.id, formData);
      router.push("/admin/users");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się zapisać zmian");
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/users"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Wróć
        </Link>
        <h1 className="text-2xl font-bold">Edytuj użytkownika</h1>
      </div>

      <div className="card">
        <form action={handleSubmit} className="space-y-4">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="username" className="label">
              Login
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              defaultValue={user.username}
              className="input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">
              Nowe hasło
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              placeholder="Zostaw puste, aby nie zmieniać"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role" className="label">
              Rola
            </label>
            <select
              id="role"
              name="role"
              className="input"
              defaultValue={user.role}
            >
              <option value="RECEPTION">Recepcjonista</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/admin/users" className="btn btn-secondary">
              Anuluj
            </Link>
            <button type="submit" className="btn btn-primary">
              Zapisz zmiany
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
