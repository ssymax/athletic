'use client'

import { deleteMembershipType } from "@/app/actions/membershipTypes";
import { useEffect, useState, useTransition } from "react";

interface DeleteMembershipTypeButtonProps {
    id: string;
    name: string;
}

export function DeleteMembershipTypeButton({ id, name }: DeleteMembershipTypeButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isPending) {
                setIsOpen(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, isPending]);

    const handleConfirmDelete = () => {
        setError(null);
        startTransition(async () => {
            try {
                await deleteMembershipType(id);
                setIsOpen(false);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Nie udało się usunąć karnetu.");
            }
        });
    };

    return (
        <>
            <button
                className="btn btn-danger btn-sm"
                onClick={() => setIsOpen(true)}
                type="button"
            >
                Usuń
            </button>

            {isOpen && (
                <div
                    className="modal-backdrop"
                    onClick={() => {
                        if (!isPending) setIsOpen(false);
                    }}
                >
                    <div
                        className="modal-card"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`delete-membership-title-${id}`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h3 id={`delete-membership-title-${id}`} className="mb-2">
                            Potwierdź usunięcie
                        </h3>
                        <p className="mb-4">
                            Czy na pewno chcesz usunąć karnet <strong>{name}</strong>?
                        </p>

                        {error && (
                            <div className="alert alert-error mb-4">
                                {error}
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setIsOpen(false)}
                                disabled={isPending}
                            >
                                Anuluj
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={handleConfirmDelete}
                                disabled={isPending}
                            >
                                {isPending ? "Usuwanie..." : "Tak, usuń"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
