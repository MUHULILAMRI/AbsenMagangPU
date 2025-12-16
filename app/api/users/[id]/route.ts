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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing Supabase URL or Anon Key.")
  }

  const authHeader = request.headers.get('Authorization');
  const cookieStore = cookies()
  const supabase = createClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
    },
  })

  let sessionUser;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return { user: null, supabase, error: "Invalid token" };
    }
    sessionUser = user;
  } else {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return { user: null, supabase, error: "No session" }
    sessionUser = session.user;
  }

  if (!sessionUser) {
    return { user: null, supabase, error: "User not found" };
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sessionUser.id)
    .single();
    
  let fullUser;

  if (profile) {
    fullUser = { ...sessionUser, ...profile };
  } else {
    const roleFromMetadata = sessionUser.user_metadata?.role;
    if (roleFromMetadata) {
      fullUser = {
        ...sessionUser,
        role: roleFromMetadata,
        full_name: sessionUser.user_metadata?.full_name || sessionUser.email,
        department: null,
        photo_url: null,
      };
    } else {
      return { user: null, supabase, error: "Profile not found and no role in metadata" };
    }
  }
  
  return { user: fullUser, supabase, error: null };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { user: requestingUser } = await getRequestingUser(request);

    if (!requestingUser) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { id: userIdToFetch } = params;
    if (!userIdToFetch) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const supabaseAdmin = await getSupabaseAdmin();
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userIdToFetch)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (e) {
    const error = e as Error;
    console.error("Unhandled error in GET /api/users/[id]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  console.log("PUT /api/users/[id] received params:", params); // Logging untuk debugging
  try {
    const { user: requestingUser, error: authError } = await getRequestingUser(request);
    
    if (authError || !requestingUser) {
      return NextResponse.json({ error: authError || "Not authenticated" }, { status: 401 });
    }

    const { id: userIdToUpdate } = params;
    if (!userIdToUpdate) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Authorization check: Allow if user is an admin OR if they are updating their own profile
    if (requestingUser.role !== "admin" && requestingUser.id !== userIdToUpdate) {
      return NextResponse.json({ error: "Forbidden: You can only update your own profile." }, { status: 403 });
    }

    const body = await request.json();
    const supabaseAdmin = await getSupabaseAdmin();
    
    const updatePayload: { [key: string]: any } = {};

    if (body.hasOwnProperty('full_name')) {
      updatePayload.full_name = body.full_name;
    }
    if (body.hasOwnProperty('role') && requestingUser.role === 'admin') { // Only admin can change role
      updatePayload.role = body.role;
    }
    if (body.hasOwnProperty('department')) {
      updatePayload.department = body.department;
    }

    // Handle photo upload if a new base64 photo is provided
    if (body.photo && body.photo.startsWith('data:image')) {
      try {
        const [header, data] = body.photo.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1];
        if (!mimeType) throw new Error("Invalid image format.");
        
        const fileExt = mimeType.split('/')[1];
        const filePath = `${userIdToUpdate}/avatar.${fileExt}`;
        
        const { error: uploadError } = await supabaseAdmin.storage
          .from('avatars')
          .upload(filePath, Buffer.from(data, 'base64'), {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Add a timestamp to the URL to bypass browser cache
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('avatars')
          .getPublicUrl(filePath, {
             transform: {
                // This is a trick to force a cache bust
                // You might want a more robust strategy in production
                width: 500, 
                height: 500,
             }
          });
        
        updatePayload.photo_url = `${publicUrl}?t=${new Date().getTime()}`;

      } catch (uploadError: any) {
        console.error("Error uploading avatar during update:", uploadError);
        return NextResponse.json({ error: `Failed to upload new photo: ${uploadError.message}` }, { status: 500 });
      }
    }

    if (Object.keys(updatePayload).length === 0) {
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

    const { id: userIdToDelete } = await params;
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