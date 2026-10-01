"use client";

import { findMemberForCheckin, registerVisit } from "@/app/actions/checkin";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";

type CheckinMember = Awaited<ReturnType<typeof findMemberForCheckin>>[number];

export default function CheckInPage() {
  const t = useTranslations("checkin");
  const format = useFormatter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CheckinMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const data = await findMemberForCheckin(query);
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn(memberId: string, membershipId: string) {
    setMessage(null);
    try {
      const result = await registerVisit(memberId, membershipId);
      if (result.success) {
        setMessage({ type: "success", text: result.message });
        // Refresh results to show updated entries count
        const data = await findMemberForCheckin(query);
        setResults(data);
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } catch {
      setMessage({ type: "error", text: t("errors.processing") });
    }
  }

  return (
    <div className="fade-in checkin-layout mx-auto">
      <h1 className="mb-6">{t("title")}</h1>

      <div className="card mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="search"
            placeholder={t("searchPlaceholder")}
            className="input-field"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <Button type="submit" isLoading={loading}>
            {t("search")}
          </Button>
        </form>
      </div>

      {message && (
        <div
          className={`alert mb-6 ${message.type === "success" ? "alert-success" : "alert-error"}`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {results.map((member) => (
          <div key={member.id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="mb-1">
                  {member.firstName} {member.lastName}
                </h3>
                <p className="text-sm text-muted">{member.phoneNumber}</p>
                {member.notes && (
                  <div className="alert alert-warning mt-2 text-xs">
                    {member.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="section-divider">
              <p className="text-xs text-muted font-medium uppercase tracking-wider mb-3">
                {t("activeMemberships")}
              </p>
              {member.memberships.length === 0 ? (
                <p className="badge badge-danger">{t("noActiveMemberships")}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {member.memberships.map((m) => (
                    <div
                      key={m.id}
                      className="panel-soft flex justify-between items-center p-3"
                    >
                      <div>
                        <p className="font-medium text-sm">{m.type.name}</p>
                        <p className="text-xs text-muted">
                          {m.type.type === "ENTRY" &&
                            `${t("entriesLeft", { count: m.remainingEntries ?? "" })} · `}
                          {m.endDate
                            ? t("validUntil", {
                                date: format.dateTime(new Date(m.endDate), {
                                  day: "numeric",
                                  month: "numeric",
                                  year: "numeric",
                                }),
                              })
                            : t("noExpiry")}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleCheckIn(member.id, m.id)}
                        variant="secondary"
                        size="sm"
                      >
                        {t("punch")}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {results.length === 0 && query && !loading && (
          <p className="table-empty">{t("notFound")}</p>
        )}
      </div>
    </div>
  );
}
