'use client'

import { getMember } from "@/app/actions/members";
import { getMembershipTypes } from "@/app/actions/membershipTypes";
import { sellMembership } from "@/app/actions/memberships";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MemberDetails = NonNullable<Awaited<ReturnType<typeof getMember>>>;
type MembershipType = Awaited<ReturnType<typeof getMembershipTypes>>[number];

export default function NewMembershipPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const router = useRouter();
    const [member, setMember] = useState<MemberDetails | null>(null);
    const [types, setTypes] = useState<MembershipType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null);
    const [selectedType, setSelectedType] = useState<string>("");

    useEffect(() => {
        params.then(setUnwrappedParams);
    }, [params]);

    useEffect(() => {
        if (!unwrappedParams) return;

        Promise.all([
            getMember(unwrappedParams.id),
            getMembershipTypes().then(types => types.filter(t => t.active))
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
            setError(e instanceof Error ? e.message : "Something went wrong");
        }
    }

    const selectedTypeData = types.find(t => t.id === selectedType);

    if (loading) return <div className="p-8 text-center">Ładowanie...</div>;
    if (!member) return <div className="p-8 text-center">Nie znaleziono klubowicza.</div>;

    return (
        <div className="container mx-auto py-8 max-w-lg">
            <div className="flex items-center gap-4 mb-6">
                <Link href={`/members/${member.id}`} className="text-muted-foreground hover:text-foreground">
                    ← Wróć
                </Link>
                <h1 className="text-2xl font-bold">Sprzedaj Karnet</h1>
            </div>

            <div className="card">
                <div className="panel-soft mb-4">
                    <p className="text-sm text-muted-foreground">Klubowicz</p>
                    <p className="font-semibold text-lg">{member.firstName} {member.lastName}</p>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="typeId" className="label">Typ Karnetu</label>
                        <select
                            name="typeId"
                            id="typeId"
                            className="input"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            {types.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name} - {type.price} PLN
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedTypeData && (
                        <div className="alert alert-info mb-4">
                            <p><strong>Cena:</strong> {selectedTypeData.price.toFixed(2)} PLN</p>
                            <p><strong>Typ:</strong> {selectedTypeData.type === 'TIME' ? 'Czasowy' : 'Wejściowy'}</p>
                            <p>
                                <strong>Ważność:</strong> {
                                    selectedTypeData.type === 'TIME'
                                        ? `${selectedTypeData.daysValid} dni`
                                        : `${selectedTypeData.entries} wejść`
                                }
                            </p>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="startDate" className="label">Data Rozpoczęcia</label>
                        <input
                            type="date"
                            id="startDate"
                            name="startDate"
                            className="input"
                            defaultValue={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="paymentMethod" className="label">Metoda Płatności</label>
                        <select name="paymentMethod" id="paymentMethod" className="input">
                            <option value="CASH">Gotówka</option>
                            <option value="CARD">Karta</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Link href={`/members/${member.id}`} className="btn btn-secondary">
                            Anuluj
                        </Link>
                        <button type="submit" className="btn btn-primary">
                            Sprzedaj
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
