"use client";

import { deleteProduct } from "@/app/actions/products";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

interface DeleteProductButtonProps {
  id: string;
  name: string;
}

export function DeleteProductButton({ id, name }: DeleteProductButtonProps) {
  const t = useTranslations("products");
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
        setError(e instanceof Error ? e.message : t("deleteFailed"));
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
        {t("delete")}
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
              {t("deleteTitle")}
            </h3>
            <p className="mb-4">
              {t.rich("deleteConfirm", {
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
                {t("cancel")}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={isPending}
              >
                {isPending ? t("deleting") : t("deleteYes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
