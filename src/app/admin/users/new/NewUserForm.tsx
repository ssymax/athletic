"use client";

import { createUser } from "@/app/actions/users";
import { useFormAction } from "@/hooks/useFormAction";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewUserForm() {
  const router = useRouter();

  const { error, submitDisabled, handleSubmit } = useFormAction({
    action: createUser,
    onSuccess: () => {
      router.push("/admin/users");
      router.refresh();
    },
    fallbackError: "Nie udało się utworzyć użytkownika. Spróbuj ponownie.",
  });

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/users"
          className="text-muted-foreground hover:text-foreground"
        >
          ← Wróć
        </Link>
        <h1 className="text-2xl font-bold">Nowy użytkownik</h1>
      </div>

      <div className="card">
        <form method="post" onSubmit={handleSubmit} className="space-y-4">
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
              className="input"
              placeholder="np. recepcja2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">
              Hasło
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="input"
              placeholder="Minimum 6 znaków"
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
              defaultValue="RECEPTION"
            >
              <option value="RECEPTION">Recepcjonista</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/admin/users" className="btn btn-secondary">
              Anuluj
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitDisabled}
            >
              Dodaj użytkownika
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
