"use client";

import { useState } from "react";
import { login } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card fade-in">
        <div className="text-center mb-8">
          <h1 className="text-2xl mb-2">Athletic Club</h1>
          <p className="text-sm text-muted">Zaloguj się do systemu</p>
        </div>

        <form action={handleSubmit}>
          <div className="input-group">
            <label>Login</label>
            <input
              name="username"
              type="text"
              className="input-field"
              placeholder="Wprowadź login"
              required
            />
          </div>

          <div className="input-group">
            <label>Hasło</label>
            <input
              name="password"
              type="password"
              className="input-field"
              placeholder="Wprowadź hasło"
              required
            />
          </div>

          {error && <div className="alert alert-error mb-6">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted">
            &copy; 2026 Athletic Club Recepcja
          </p>
        </div>
      </div>
    </div>
  );
}
