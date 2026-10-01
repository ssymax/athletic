"use client";

import { deleteMember } from "@/app/actions/members";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

interface DeleteMemberButtonProps {
  id: string;
  fullName: string;
}

export function DeleteMemberButton({ id, fullName }: DeleteMemberButtonProps) {
  const t = useTranslations("members");
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
        setError(e instanceof Error ? e.message : t("delete.failed"));
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
            aria-labelledby={`delete-member-title-${id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id={`delete-member-title-${id}`} className="mb-2">
              {t("delete.title")}
            </h3>
            <p className="mb-4">
              {t.rich("delete.confirm", {
                name: fullName,
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
                {t("cancel")}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isPending}
              >
                {isPending ? t("delete.deleting") : t("delete.yes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
