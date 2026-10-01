"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { login } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
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
          <h1 className="text-2xl mb-2">{tc("appName")}</h1>
          <p className="text-sm text-muted">{t("loginTitle")}</p>
        </div>

        <form action={handleSubmit}>
          <div className="input-group">
            <label>{t("usernameLabel")}</label>
            <input
              name="username"
              type="text"
              className="input-field"
              placeholder={t("usernamePlaceholder")}
              required
            />
          </div>

          <div className="input-group">
            <label>{t("passwordLabel")}</label>
            <input
              name="password"
              type="password"
              className="input-field"
              placeholder={t("passwordPlaceholder")}
              required
            />
          </div>

          {error && <div className="alert alert-error mb-6">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? t("submitting") : t("submit")}
          </button>
        </form>

        <div className="mt-4 flex justify-center">
          <LanguageSwitcher />
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted">
            &copy; 2026 {tc("appTitle")}
          </p>
        </div>
      </div>
    </div>
  );
}
