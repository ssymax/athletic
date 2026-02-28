"use client";

import { getMember, updateMember } from "@/app/actions/members";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MemberDetails = NonNullable<Awaited<ReturnType<typeof getMember>>>;

export default function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params
  const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(
    null,
  );

  useEffect(() => {
    params.then(setUnwrappedParams);
  }, [params]);

  useEffect(() => {
    if (!unwrappedParams) return;

    getMember(unwrappedParams.id).then((data) => {
      setMember(data);
      setLoading(false);
    });
  }, [unwrappedParams]);

  async function handleSubmit(formData: FormData) {
    if (!unwrappedParams) return;
    try {
      await updateMember(unwrappedParams.id, formData);
      router.push(`/members/${unwrappedParams.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  if (loading) return <div className="p-8 text-center">Ładowanie...</div>;
  if (!member)
    return <div className="p-8 text-center">Nie znaleziono klubowicza.</div>;

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/members/${member.id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Wróć
        </Link>
        <h1 className="text-2xl font-bold">Edytuj Klubowicza</h1>
      </div>

      <div className="card">
        <form action={handleSubmit} className="space-y-4">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="firstName" className="label">
                Imię
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                defaultValue={member.firstName}
                required
                className="input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName" className="label">
                Nazwisko
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                defaultValue={member.lastName}
                required
                className="input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber" className="label">
              Numer telefonu
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              defaultValue={member.phoneNumber}
              required
              className="input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes" className="label">
              Notatki (opcjonalnie)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={member.notes || ""}
              className="input resize-none"
            ></textarea>
          </div>

          <div className="form-group flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              name="active"
              defaultChecked={member.active}
              className="h-4 w-4"
            />
            <label htmlFor="active" className="label mb-0">
              Klubowicz aktywny
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link href={`/members/${member.id}`} className="btn btn-secondary">
              Anuluj
            </Link>
            <button type="submit" className="btn btn-primary">
              Zapisz Zmiany
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
