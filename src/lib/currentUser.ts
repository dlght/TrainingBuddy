import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireUserId(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw error;
  }

  const userId = data.session?.user.id;

  if (!userId) {
    throw new Error("Not signed in.");
  }

  return userId;
}
