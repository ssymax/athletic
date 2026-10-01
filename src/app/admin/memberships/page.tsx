import { getMembershipTypes } from "@/app/actions/membershipTypes";
import Link from "next/link";
import { DeleteMembershipTypeButton } from "./components/DeleteMembershipTypeButton";
import { Button } from "@/components/ui/Button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";

export default async function MembershipTypesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const types = await getMembershipTypes();
  const t = await getTranslations("membershipTypes");
  const format = await getFormatter();

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1>{t("list.title")}</h1>
        <Link href="/admin/memberships/new">
          <Button>{t("list.add")}</Button>
        </Link>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("list.colName")}</th>
                <th>{t("list.colType")}</th>
                <th>{t("list.colValidity")}</th>
                <th>{t("list.colPrice")}</th>
                <th>{t("list.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {types.length === 0 ? (
                <tr>
                  <td colSpan={5} className="table-empty">
                    {t("list.empty")}
                  </td>
                </tr>
              ) : (
                types.map((type) => (
                  <tr key={type.id}>
                    <td className="font-medium">{type.name}</td>
                    <td>
                      {type.type === "TIME"
                        ? t("list.typeTime")
                        : t("list.typeEntry")}
                    </td>
                    <td>
                      {type.type === "TIME"
                        ? t("list.validityTime", { days: type.daysValid ?? 0 })
                        : type.daysValid
                          ? t("list.validityEntryWithDays", {
                              entries: type.entries ?? 0,
                              days: type.daysValid,
                            })
                          : t("list.validityEntry", {
                              entries: type.entries ?? 0,
                            })}
                    </td>
                    <td className="font-semibold">
                      {format.number(type.price, {
                        style: "currency",
                        currency: "PLN",
                      })}
                    </td>
                    <td>
                      <DeleteMembershipTypeButton
                        id={type.id}
                        name={type.name}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
