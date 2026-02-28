"use client";

import { deleteMember } from "@/app/actions/members";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface DeleteMemberButtonProps {
  id: string;
  fullName: string;
}

export function DeleteMemberButton({ id, fullName }: DeleteMemberButtonProps) {
  const router = useRouter();
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
        await deleteMember(id);
        router.push("/members");
        router.refresh();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Nie udało się usunąć klubowicza.",
        );
      }
    });
  };

  return (
    <>
      <button
        type="button"
        className="btn btn-danger w-full"
        onClick={() => setIsOpen(true)}
      >
        Usuń klubowicza
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
            aria-labelledby={`delete-member-title-${id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id={`delete-member-title-${id}`} className="mb-2">
              Potwierdź usunięcie klubowicza
            </h3>
            <p className="mb-4">
              Czy na pewno chcesz usunąć <strong>{fullName}</strong>?
            </p>

            {error && <div className="alert alert-error mb-4">{error}</div>}

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
