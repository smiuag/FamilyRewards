"use server";

import { createClient } from "@supabase/supabase-js";

export async function deleteAuthUserAction(authUserId: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.auth.admin.deleteUser(authUserId);
}
