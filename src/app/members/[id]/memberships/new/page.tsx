"use client";

import { getMember } from "@/app/actions/members";
import { getMembershipTypes } from "@/app/actions/membershipTypes";
import { sellMembership } from "@/app/actions/memberships";
import { addDays, resolveDaysValid } from "@/lib/memberships";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MemberDetails = NonNullable<Awaited<ReturnType<typeof getMember>>>;
type MembershipType = Awaited<ReturnType<typeof getMembershipTypes>>[number];

export default function NewMembershipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("memberships");
  const format = useFormatter();
  const router = useRouter();
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [types, setTypes] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(
    null,
  );
  const [selectedType, setSelectedType] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    params.then(setUnwrappedParams);
  }, [params]);

  useEffect(() => {
    if (!unwrappedParams) return;

    Promise.all([
      getMember(unwrappedParams.id),
      getMembershipTypes().then((types) => types.filter((t) => t.active)),
    ]).then(([memberData, typesData]) => {
      setMember(memberData);
      setTypes(typesData);
      if (typesData.length > 0) setSelectedType(typesData[0].id);
      setLoading(false);
    });
  }, [unwrappedParams]);

  async function handleSubmit(formData: FormData) {
    if (!unwrappedParams) return;
    try {
      await sellMembership(unwrappedParams.id, formData);
      router.push(`/members/${unwrappedParams.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errors.generic"));
    }
  }

  const selectedTypeData = types.find((t) => t.id === selectedType);
  const effectiveDaysValid = selectedTypeData
    ? resolveDaysValid(selectedTypeData.type, selectedTypeData.daysValid)
    : null;
  const effectiveEndDate = effectiveDaysValid
    ? addDays(new Date(startDate), effectiveDaysValid)
    : null;

  if (loading) return <div className="p-8 text-center">{t("loading")}</div>;
  if (!member)
    return <div className="p-8 text-center">{t("memberNotFound")}</div>;

  return (
    <div className="container mx-auto py-8 max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/members/${member.id}`}
          className="text-muted-foreground hover:text-foreground"
        >
          {t("back")}
        </Link>
        <h1 className="text-2xl font-bold">{t("sell.title")}</h1>
      </div>

      <div className="card">
        <div className="panel-soft mb-4">
          <p className="text-sm text-muted-foreground">{t("sell.member")}</p>
          <p className="font-semibold text-lg">
            {member.firstName} {member.lastName}
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="typeId" className="label">
              {t("sell.type")}
            </label>
            <select
              name="typeId"
              id="typeId"
              className="input"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} - {type.price} PLN
                </option>
              ))}
            </select>
          </div>

          {selectedTypeData && (
            <div className="alert alert-info mb-4">
              <p>
                <strong>{t("sell.price")}</strong>{" "}
                {selectedTypeData.price.toFixed(2)} PLN
              </p>
              <p>
                <strong>{t("sell.kind")}</strong>{" "}
                {t(
                  `kind.${selectedTypeData.type === "TIME" ? "TIME" : "ENTRY"}`,
                )}
              </p>
              <p>
                <strong>{t("sell.validity")}</strong>{" "}
                {selectedTypeData.type === "TIME"
                  ? t("sell.validityTime", {
                      days: selectedTypeData.daysValid ?? 0,
                    })
                  : t("sell.validityEntry", {
                      entries: selectedTypeData.entries ?? 0,
                      days: effectiveDaysValid ?? 0,
                    })}
              </p>
              {effectiveEndDate && (
                <p>
                  <strong>{t("sell.validUntil")}</strong>{" "}
                  {format.dateTime(effectiveEndDate, {
                    day: "numeric",
                    month: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
              {discount > 0 && (
                <p className="text-green-700 font-semibold">
                  <strong>{t("sell.toPay")}</strong>{" "}
                  {t("sell.toPayValue", {
                    amount: Math.max(
                      0,
                      selectedTypeData.price - discount,
                    ).toFixed(2),
                    discount: discount.toFixed(2),
                  })}
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="startDate" className="label">
              {t("sell.startDate")}
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="discount" className="label">
              {t("sell.discount")}
            </label>
            <input
              type="number"
              id="discount"
              name="discount"
              className="input"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label htmlFor="paymentMethod" className="label">
              {t("sell.paymentMethod")}
            </label>
            <select name="paymentMethod" id="paymentMethod" className="input">
              <option value="CASH">{t("payment.CASH")}</option>
              <option value="CARD">{t("payment.CARD")}</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link href={`/members/${member.id}`} className="btn btn-secondary">
              {t("cancel")}
            </Link>
            <button type="submit" className="btn btn-primary">
              {t("sell.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
