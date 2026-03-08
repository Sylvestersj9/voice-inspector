// Thin wrapper: re-exports the auto-generated typed client so every file
// that imports from "@/lib/supabase" shares the same GoTrueClient instance.
// We cast to `any` so that files referencing tables not yet in the generated
// types (e.g. inspection_*) continue to work at runtime without TS errors.

import { supabase as _supabase } from "@/integrations/supabase/client";

export const supabase = _supabase as any;
