"use client";

import type { ActionResult } from "@/lib/actionResult";
import { type FormEvent, useRef, useState, useSyncExternalStore } from "react";

interface UseFormActionOptions {
  action: (formData: FormData) => Promise<ActionResult>;
  onSuccess: () => void;
  fallbackError: string;
}

const subscribeNoop = () => () => {};

function useHydrated() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

export function useFormAction({
  action,
  onSuccess,
  fallbackError,
}: UseFormActionOptions) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const hydrated = useHydrated();

  function fail(message: string) {
    setError(message);
    inFlight.current = false;
    setSubmitting(false);
  }

  // onSubmit instead of <form action>: React 19 resets fields after every action.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;

    const formData = new FormData(event.currentTarget);
    setError(null);
    setSubmitting(true);

    let result: ActionResult;
    try {
      result = await action(formData);
    } catch {
      fail(fallbackError);
      return;
    }

    if (!result) {
      fail(fallbackError);
      return;
    }
    if (!result.success) {
      fail(result.error);
      return;
    }

    // Keep the button disabled until navigation completes.
    onSuccess();
  }

  // Before hydration a native submit would silently drop the form data.
  return { error, submitDisabled: submitting || !hydrated, handleSubmit };
}
