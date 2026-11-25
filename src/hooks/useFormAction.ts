"use client";

import type { ActionResult } from "@/lib/actionResult";
import { type FormEvent, useRef, useState } from "react";

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
  const inFlight = useRef(false);

  // onSubmit instead of <form action>: React 19 resets fields after every action.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;

    const formData = new FormData(event.currentTarget);
    setError(null);
    setSubmitting(true);

    try {
      const result = await action(formData);
      if (result.success) {
        // Keep the button disabled until navigation completes.
        onSuccess();
        return;
      }
      setError(result.error);
    } catch {
      setError(fallbackError);
    }
    inFlight.current = false;
    setSubmitting(false);
  }

  return { error, submitting, handleSubmit };
}
