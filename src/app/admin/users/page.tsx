import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { getUsers } from "@/app/actions/users";
import { Button } from "@/components/ui/Button";

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await getUsers();
  const t = await getTranslations("users");
  const format = await getFormatter();
  const roleLabel = (role: string) =>
    role === "ADMIN" || role === "RECEPTION" ? t(`roles.${role}`) : role;

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1>{t("list.title")}</h1>
        <Link href="/admin/users/new">
          <Button>{t("list.add")}</Button>
        </Link>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("list.colUsername")}</th>
                <th>{t("list.colRole")}</th>
                <th>{t("list.colCreated")}</th>
                <th>{t("list.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="table-empty">
                    {t("list.empty")}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium">{user.username}</td>
                    <td>{roleLabel(user.role)}</td>
                    <td>
                      {format.dateTime(new Date(user.createdAt), {
                        dateStyle: "medium",
                      })}
                    </td>
                    <td>
                      <Link
                        href={`/admin/users/${user.id}/edit`}
                        className="text-primary font-medium"
                      >
                        {t("list.edit")}
                      </Link>
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
