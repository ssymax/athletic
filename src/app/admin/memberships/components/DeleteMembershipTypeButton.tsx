"use client";

import { deleteMembershipType } from "@/app/actions/membershipTypes";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

interface DeleteMembershipTypeButtonProps {
  id: string;
  name: string;
}

export function DeleteMembershipTypeButton({
  id,
  name,
}: DeleteMembershipTypeButtonProps) {
  const t = useTranslations("membershipTypes");
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
        setError(e instanceof Error ? e.message : t("errors.deleteFailed"));
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
        {t("delete.button")}
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
              {t("delete.confirmTitle")}
            </h3>
            <p className="mb-4">
              {t.rich("delete.confirmText", {
                name,
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>

            {error && <div className="alert alert-error mb-4">{error}</div>}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                {t("delete.cancel")}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isPending}
              >
                {isPending ? t("delete.pending") : t("delete.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
