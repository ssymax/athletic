"use client";

import type { ActionResult } from "@/lib/actionResult";
import { type FormEvent, useState } from "react";

interface UseFormActionOptions {
  action: (formData: FormData) => Promise<ActionResult>;
  onSuccess: () => void;
  fallbackError: string;
}

export function useFormAction({
  action,
  onSuccess,
  fallbackError,
}: UseFormActionOptions) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // onSubmit zamiast <form action>: React 19 czyści pola po każdej akcji.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const formData = new FormData(event.currentTarget);
    setError(null);
    setSubmitting(true);

    try {
      const result = await action(formData);
      if (result.success) {
        // Przycisk zostaje zablokowany do końca nawigacji.
        onSuccess();
        return;
      }
      setError(result.error);
    } catch {
      setError(fallbackError);
    }
    setSubmitting(false);
  }

  return { error, submitting, handleSubmit };
}
