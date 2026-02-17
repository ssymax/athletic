'use client'

import { deleteProduct } from "@/app/actions/products";
import { useEffect, useState, useTransition } from "react";

interface DeleteProductButtonProps {
    id: string;
    name: string;
}

export function DeleteProductButton({ id, name }: DeleteProductButtonProps) {
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
                await deleteProduct(id);
                setIsOpen(false);
            } catch (e) {
                setError(e instanceof Error ? e.message : "Nie udało się usunąć produktu.");
            }
        });
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                type="button"
                className="btn btn-danger btn-sm"
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
                        aria-labelledby={`delete-product-title-${id}`}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h3 id={`delete-product-title-${id}`} className="mb-2">
                            Potwierdź usunięcie
                        </h3>
                        <p className="mb-4">
                            Czy na pewno chcesz usunąć produkt <strong>{name}</strong>?
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
