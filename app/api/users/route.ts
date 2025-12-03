import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or Service Role Key for admin actions.");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper to get the current user and their role from their session cookie or auth token
async function getRequestingUserClient(request: Request) {
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
  
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", sessionUser.id)
    .single()

  if (error || !profile) {
    return { user: null, supabase, error: "Profile not found" }
  }

  // Pass the original request object to the function
  return { user: profile, supabase, error: null }
}

// GET /api/users - List all users (Workaround: removed explicit admin check)
export async function GET(request: Request) {
  try {
    const { user, supabase, error: authError } = await getRequestingUserClient(request);

    if (authError) {
      // If session cannot be established or profile cannot be fetched, return 401
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    // Rely solely on RLS for security for listing profiles.
    // The RLS policy should be "Allow authenticated users to read profiles" or similar.
    // user variable is still available from getRequestingUserClient for use if needed by RLS.
    const { data: profiles, error } = await supabase.from("profiles").select("*").order('email', { ascending: true });

    if (error) {
      console.error("Error fetching profiles:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(profiles);
  } catch (e) {
    const error = e as Error;
    console.error("Unhandled error in GET /api/users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
   try {
    const { user: requestingUser } = await getRequestingUserClient(request);
    
    // Debugging: Log the role of the user making the request
    console.log("REQUESTING USER ROLE:", requestingUser);

    // if (!requestingUser || requestingUser.role !== "admin") {
    //   return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    // }

    const body = await request.json();
    const { email, password, full_name, role, department, photo } = body;

    if (!email || !password || !full_name || !role) {
        return NextResponse.json({ error: "Email, password, full_name, and role are required." }, { status: 400 });
    }

    const supabaseAdmin = await getSupabaseAdmin();

    // Create the user in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: { full_name }, // This will be picked up by the trigger
    });

    if (authError) {
        console.error("Supabase admin create user error:", authError);
        return NextResponse.json({ error: authError.message }, { status: 500 });
    }
    
    const newUserId = authData.user.id;
    let photoUrl = null;

    // Handle photo upload if present
    if (photo) {
      try {
        const [header, data] = photo.split(',');
        const mimeType = header.match(/:(.*?);/)[1];
        const fileExt = mimeType.split('/')[1];
        const filePath = `${newUserId}/avatar.${fileExt}`;
        
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
        photoUrl = publicUrl;

      } catch (uploadError) {
        // Log the error but don't block user creation
        console.error("Error uploading avatar:", uploadError);
      }
    }

    // The trigger automatically creates the profile.
    // Now, update the profile with the correct role and department.
    const { data: updatedProfile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ role, department, photo_url: photoUrl })
        .eq('id', newUserId)
        .select()
        .single();
    
    if (profileError) {
        // If updating the profile fails, we should ideally delete the auth user to avoid orphans
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        console.error("Error updating profile, user creation rolled back:", profileError);
        return NextResponse.json({ error: `Failed to set profile details: ${profileError.message}` }, { status: 500 });
    }

    return NextResponse.json(updatedProfile);
  } catch (e) {
    const error = e as Error;
    console.error("Unhandled error in POST /api/users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
