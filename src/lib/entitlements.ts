type GuardInput = {
  action?: string;
  plan?: string | null;
  status?: string | null;
};

// Stubbed entitlement guard for beta; always true but centralised for future billing enforcement.
export function hasEntitlement(_input: GuardInput): boolean {
  return true;
}
