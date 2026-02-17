import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsers } from "@/app/actions/users";
import { Button } from "@/components/ui/Button";

function roleLabel(role: string) {
    if (role === "ADMIN") return "Administrator";
    if (role === "RECEPTION") return "Recepcjonista";
    return role;
}

export default async function AdminUsersPage() {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const users = await getUsers();

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1>Użytkownicy</h1>
                <Link href="/admin/users/new">
                    <Button>Dodaj użytkownika</Button>
                </Link>
            </div>

            <div className="card">
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Login</th>
                                <th>Rola</th>
                                <th>Utworzony</th>
                                <th>Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="table-empty">
                                        Brak użytkowników.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="font-medium">{user.username}</td>
                                        <td>{roleLabel(user.role)}</td>
                                        <td>{new Date(user.createdAt).toLocaleDateString("pl-PL")}</td>
                                        <td>
                                            <Link
                                                href={`/admin/users/${user.id}/edit`}
                                                className="text-primary font-medium"
                                            >
                                                Edytuj
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
