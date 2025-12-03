import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// This is a server-side-only route.
// It uses the Supabase service role key to perform admin actions.

export const dynamic = "force-dynamic";

async function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or Service Role Key for admin actions.");
  }
  // The service role key has full access to your database.
  // Do not expose this key on the client-side.
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper to get the current user and their role from their session cookie or auth token
async function getRequestingUser(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase URL or Anon Key.");
  }

  const authHeader = request.headers.get('Authorization');
  const cookieStore = cookies();
  const supabase = createClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
    },
  });

  let sessionUser;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null; // Invalid token
    }
    sessionUser = user;
  } else {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    sessionUser = session.user;
  }
  
  if (!sessionUser) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", sessionUser.id)
    .single();

  return profile;
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const requestingUser = await getRequestingUser(request);

    if (!requestingUser || requestingUser.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const userIdToDelete = params.id;
    if (!userIdToDelete) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // If the user is an admin, proceed with deleting the target user.
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (error) {
      console.error("Supabase admin delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // The 'on delete cascade' on the profiles table should handle deleting the profile.
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (e) {
    const error = e as Error;
    console.error("Unhandled error in DELETE /api/users/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
