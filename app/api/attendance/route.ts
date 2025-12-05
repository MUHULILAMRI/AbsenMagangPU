import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { NextRequest } from 'next/server';

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
async function getRequestingUser(request: NextRequest) { // Changed Request to NextRequest
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
  
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role") // Fetch ID and role
    .eq("id", sessionUser.id)
    .single()

  if (profileError || !profile) {
    return { user: null, supabase, error: "Profile not found or error fetching profile" }
  }

  return { user: { ...sessionUser, ...profile }, supabase, error: null }
}

// POST /api/attendance - Create a new attendance record
export async function POST(request: NextRequest) {
  try {
    const { user: requestingUser, supabase, error: authError } = await getRequestingUser(request);

    if (authError || !requestingUser) {
      return NextResponse.json({ error: authError || "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { type, latitude, longitude, photo, is_late, timestamp } = body;

    if (!type || !latitude || !longitude || !photo || !timestamp) {
      return NextResponse.json({ error: "Type, latitude, longitude, photo, and timestamp are required." }, { status: 400 });
    }

    let photoUrl = null;
    // Handle photo upload if present
    if (photo && photo.startsWith('data:image')) {
      try {
        const [header, data] = photo.split(',');
        const mimeType = header.match(/:(.*?);/)[1];
        const fileExt = mimeType.split('/')[1];
        const filePath = `${requestingUser.id}/${Date.now()}.${fileExt}`; // Unique filename
        
        const { error: uploadError } = await supabase.storage
          .from('attendance-photos') // Using a new bucket for attendance photos
          .upload(filePath, Buffer.from(data, 'base64'), {
            contentType: mimeType,
            upsert: false, // Do not upsert, always create new
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('attendance-photos')
          .getPublicUrl(filePath);
        photoUrl = publicUrl;

      } catch (uploadError) {
        console.error("Error uploading attendance photo:", uploadError);
        return NextResponse.json({ error: "Failed to upload attendance photo." }, { status: 500 });
      }
    } else if (photo) {
        // If photo is not a data URL, assume it's already a public URL
        photoUrl = photo;
    }

    const { data: newRecord, error: insertError } = await supabase
      .from('attendance')
      .insert({
        user_id: requestingUser.id,
        type,
        timestamp,
        latitude,
        longitude,
        photo_url: photoUrl,
        is_late: is_late || false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting attendance record:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(newRecord, { status: 201 });

  } catch (e) {
    const error = e as Error;
    console.error("Unhandled error in POST /api/attendance:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/attendance - Fetch attendance records
// Can filter by user_id (for history) or fetch all (for monitor)
export async function GET(request: NextRequest) {
  try {
    const { user: requestingUser, supabase, error: authError } = await getRequestingUser(request);

    if (authError || !requestingUser) {
      return NextResponse.json({ error: authError || "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const forAdmin = searchParams.get('for_admin') === 'true';

    let query = supabase.from('attendance').select('*');

    // If requesting user is not admin, they can only see their own records
    if (requestingUser.role !== 'admin') {
      query = query.eq('user_id', requestingUser.id);
    } else {
        // If admin, and specific user_id is requested, filter by it
        if (userId) {
            query = query.eq('user_id', userId);
        }
    }
    
    // Sort by timestamp descending
    query = query.order('timestamp', { ascending: false });

    const { data: records, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching attendance records:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json(records);

  } catch (e) {
    const error = e as Error;
    console.error("Unhandled error in GET /api/attendance:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}