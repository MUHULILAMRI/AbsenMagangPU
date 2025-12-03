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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const requestingUser = await getRequestingUser(request);

    if (!requestingUser || requestingUser.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const userIdToUpdate = params.id;
    if (!userIdToUpdate) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const supabaseAdmin = await getSupabaseAdmin();
    
    const updatePayload: { [key: string]: any } = {};

    // Explicitly check for each field in the body before adding it to the payload.
    // This allows setting fields to empty or null values.
    if (body.hasOwnProperty('full_name')) {
      updatePayload.full_name = body.full_name;
    }
    if (body.hasOwnProperty('role')) {
      updatePayload.role = body.role;
    }
    if (body.hasOwnProperty('department')) {
      updatePayload.department = body.department;
    }

    // Handle photo upload if a new base64 photo is provided
    if (body.photo && body.photo.startsWith('data:image')) {
      try {
        const [header, data] = body.photo.split(',');
        const mimeType = header.match(/:(.*?);/)[1];
        const fileExt = mimeType.split('/')[1];
        const filePath = `${userIdToUpdate}/avatar.${fileExt}`;
        
        const { error: uploadError } = await supabaseAdmin.storage
          .from('avatars')
          .upload(filePath, Buffer.from(data, 'base64'), {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        updatePayload.photo_url = publicUrl;

      } catch (uploadError) {
        console.error("Error uploading avatar during update:", uploadError);
        return NextResponse.json({ error: "Failed to upload new photo." }, { status: 500 });
      }
    }

    // Do not proceed if the payload is empty
    if (Object.keys(updatePayload).length === 0) {
      // Or return a 200 OK with the existing profile data
      const { data: existingProfile } = await supabaseAdmin.from('profiles').select().eq('id', userIdToUpdate).single();
      return NextResponse.json(existingProfile);
    }

    const { data: updatedProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', userIdToUpdate)
        .select()
        .single();
    
    if (profileError) {
        console.error("Error updating profile:", profileError);
        return NextResponse.json({ error: `Failed to update profile: ${profileError.message}` }, { status: 500 });
    }

    return NextResponse.json(updatedProfile);

  } catch (e) {
    const error = e as Error;
    console.error("Unhandled error in PUT /api/users/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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