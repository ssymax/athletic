"use client";

import { createMember } from "@/app/actions/members";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddMemberPage() {
  const t = useTranslations("members");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    try {
      await createMember(formData);
      router.push("/members");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.generic"));
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/members"
          className="text-muted-foreground hover:text-foreground"
        >
          {t("back")}
        </Link>
        <h1 className="text-2xl font-bold">{t("newTitle")}</h1>
      </div>

      <div className="card">
        <form action={handleSubmit} className="space-y-4">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="firstName" className="label">
                {t("firstName")}
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                required
                className="input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName" className="label">
                {t("lastName")}
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                required
                className="input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber" className="label">
              {t("phone")}
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              required
              className="input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="label">
              {t("notesOptional")}
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="input resize-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link href="/members" className="btn btn-secondary">
              {t("cancel")}
            </Link>
            <button type="submit" className="btn btn-primary">
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
