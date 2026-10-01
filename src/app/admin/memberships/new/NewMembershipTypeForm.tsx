"use client";

import { createMembershipType } from "@/app/actions/membershipTypes";
import { DEFAULT_DAYS_VALID } from "@/lib/memberships";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function NewMembershipTypeForm() {
  const t = useTranslations("membershipTypes");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<string>("TIME");

  async function handleSubmit(formData: FormData) {
    try {
      await createMembershipType(formData);
      router.push("/admin/memberships");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.generic"));
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/memberships"
          className="text-muted-foreground hover:text-foreground"
        >
          {t("form.back")}
        </Link>
        <h1 className="text-2xl font-bold">{t("form.title")}</h1>
      </div>

      <div className="card">
        <form action={handleSubmit} className="space-y-4">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="name" className="label">
              {t("form.name")}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="input"
              placeholder={t("form.namePlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="scope" className="label">
                {t("form.scope")}
              </label>
              <select name="scope" id="scope" className="input">
                <option value="GYM">{t("form.scopeGYM")}</option>
                <option value="CLASSES">{t("form.scopeCLASSES")}</option>
                <option value="ALL">{t("form.scopeALL")}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="type" className="label">
                {t("form.billingType")}
              </label>
              <select
                name="type"
                id="type"
                className="input"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="TIME">{t("form.typeTIME")}</option>
                <option value="ENTRY">{t("form.typeENTRY")}</option>
              </select>
            </div>
          </div>

          {type === "TIME" ? (
            <div className="form-group">
              <label htmlFor="daysValid" className="label">
                {t("form.daysValid")}
              </label>
              <input
                type="number"
                id="daysValid"
                name="daysValid"
                required
                min="1"
                className="input"
                defaultValue={DEFAULT_DAYS_VALID}
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="entries" className="label">
                  {t("form.entries")}
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
              <div className="form-group">
                <label htmlFor="daysValid" className="label">
                  {t("form.daysLimit")}
                </label>
                <input
                  type="number"
                  id="daysValid"
                  name="daysValid"
                  min="1"
                  className="input"
                  defaultValue={DEFAULT_DAYS_VALID}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("form.daysLimitHint", { days: DEFAULT_DAYS_VALID })}
                </p>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="price" className="label">
              {t("form.price")}
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
              {t("form.cancel")}
            </Link>
            <button type="submit" className="btn btn-primary">
              {t("form.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
