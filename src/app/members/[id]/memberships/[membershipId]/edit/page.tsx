"use client";

import { getMember } from "@/app/actions/members";
import { getMembership, updateMembership } from "@/app/actions/memberships";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MembershipWithType = NonNullable<Awaited<ReturnType<typeof getMembership>>>;

export default function EditMembershipPage({
  params,
}: {
  params: Promise<{ id: string; membershipId: string }>;
}) {
  const router = useRouter();
  const [membership, setMembership] = useState<MembershipWithType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unwrappedParams, setUnwrappedParams] = useState<{
    id: string;
    membershipId: string;
  } | null>(null);

  useEffect(() => {
    params.then(setUnwrappedParams);
  }, [params]);

  useEffect(() => {
    if (!unwrappedParams) return;
    getMembership(unwrappedParams.membershipId).then((data) => {
      setMembership(data);
      setLoading(false);
    });
  }, [unwrappedParams]);

  async function handleSubmit(formData: FormData) {
    if (!unwrappedParams || !membership) return;
    try {
      await updateMembership(
        unwrappedParams.membershipId,
        unwrappedParams.id,
        formData,
      );
      router.push(`/members/${unwrappedParams.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  if (loading) return <div className="p-8 text-center">Ładowanie...</div>;
  if (!membership)
    return <div className="p-8 text-center">Nie znaleziono karnetu.</div>;

  const isEntry = membership.type.type === "ENTRY";

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/members/${unwrappedParams?.id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Wróć
        </Link>
        <h1 className="text-2xl font-bold">Edytuj Karnet</h1>
      </div>

      <div className="card">
        <div className="panel-soft mb-4">
          <p className="text-sm text-muted-foreground">Typ karnetu</p>
          <p className="font-semibold text-lg">{membership.type.name}</p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="startDate" className="label">
              Data rozpoczęcia
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              className="input"
              defaultValue={
                new Date(membership.startDate).toISOString().split("T")[0]
              }
              required
            />
          </div>

          {(membership.endDate || !isEntry) && (
            <div className="form-group">
              <label htmlFor="endDate" className="label">
                Data zakończenia
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className="input"
                defaultValue={
                  membership.endDate
                    ? new Date(membership.endDate).toISOString().split("T")[0]
                    : ""
                }
              />
            </div>
          )}

          {isEntry && (
            <div className="form-group">
              <label htmlFor="remainingEntries" className="label">
                Pozostałe wejścia
              </label>
              <input
                type="number"
                id="remainingEntries"
                name="remainingEntries"
                className="input"
                defaultValue={membership.remainingEntries ?? ""}
                min="0"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="status" className="label">
              Status
            </label>
            <select
              name="status"
              id="status"
              className="input"
              defaultValue={membership.status}
            >
              <option value="ACTIVE">Aktywny</option>
              <option value="EXPIRED">Wygasły</option>
              <option value="CANCELLED">Anulowany</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="paymentMethod" className="label">
              Metoda płatności
            </label>
            <select
              name="paymentMethod"
              id="paymentMethod"
              className="input"
              defaultValue={membership.paymentMethod}
            >
              <option value="CASH">Gotówka</option>
              <option value="CARD">Karta</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pricePaid" className="label">
              Cena zapłacona (PLN)
            </label>
            <input
              type="number"
              id="pricePaid"
              name="pricePaid"
              className="input"
              defaultValue={membership.pricePaid}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="note" className="label">
              Notatka
            </label>
            <textarea
              id="note"
              name="note"
              className="input"
              rows={3}
              defaultValue={membership.note ?? ""}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link
              href={`/members/${unwrappedParams?.id}`}
              className="btn btn-secondary"
            >
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
