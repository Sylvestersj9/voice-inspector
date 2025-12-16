import { useCallback, useEffect, useMemo, useState } from "react";

type OnboardingItems = Record<string, boolean>;

type OnboardingState = {
  dismissed: boolean;
  dismissedAt?: number;
  items: OnboardingItems;
};

const STORAGE_KEY = "onboarding_v1_state";

const defaultItems: OnboardingItems = {
  create_session: false,
  answer_questions: false,
  run_evaluation: false,
  review_summary: false,
  send_feedback: false,
};

const defaultState: OnboardingState = {
  dismissed: false,
  items: defaultItems,
};

const readState = (): OnboardingState => {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return defaultState;
    const items = { ...defaultItems, ...(parsed as { items?: OnboardingItems }).items };
    const dismissed = Boolean((parsed as { dismissed?: boolean }).dismissed);
    const dismissedAtRaw = (parsed as { dismissedAt?: unknown }).dismissedAt;
    const dismissedAt =
      typeof dismissedAtRaw === "number" && Number.isFinite(dismissedAtRaw) ? dismissedAtRaw : undefined;
    return { dismissed, dismissedAt, items };
  } catch {
    return defaultState;
  }
};

const persistState = (state: OnboardingState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
};

export function useOnboardingChecklist() {
  const [state, setState] = useState<OnboardingState>(() => readState());

  useEffect(() => {
    persistState(state);
  }, [state]);

  const completeItem = useCallback((id: string) => {
    setState((prev) => {
      const nextItems = { ...defaultItems, ...prev.items, [id]: true };
      return { ...prev, items: nextItems };
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setState((prev) => {
      const nextItems = { ...defaultItems, ...prev.items };
      nextItems[id] = !nextItems[id];
      return { ...prev, items: nextItems };
    });
  }, []);

  const dismiss = useCallback(() => {
    setState((prev) => ({ ...prev, dismissed: true, dismissedAt: Date.now() }));
  }, []);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  const progress = useMemo(() => {
    const completed = Object.values(state.items ?? {}).filter(Boolean).length;
    const total = Object.keys(defaultItems).length;
    return { completed, total };
  }, [state.items]);

  return { state, progress, toggleItem, completeItem, dismiss, reset };
}
