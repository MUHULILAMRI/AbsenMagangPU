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
async function getRequestingUser(request: NextRequest) {
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
  
  // First, try to get the profile from the database
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", sessionUser.id)
    .single();
    
  let fullUser;

  if (profile) {
    // If profile exists, combine it with the auth user
    fullUser = {
      ...sessionUser,
      ...profile,
    };
  } else {
    // FALLBACK: If profile is not found, check for role in user_metadata
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
      // If no profile and no role in metadata, then we can't authorize
      return { user: null, supabase, error: "Profile not found and no role in metadata" };
    }
  }
  
  return { user: fullUser, supabase, error: null };
}

// POST /api/attendance - Create a new attendance record
export async function POST(request: NextRequest) {
  try {
    const { user: requestingUser, error: authError } = await getRequestingUser(request);

    if (authError || !requestingUser) {
      return NextResponse.json({ error: authError || "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { type, is_late, timestamp, latitude, longitude } = body;

    if (!type || !timestamp || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Type, timestamp, latitude, and longitude are required." }, { status: 400 });
    }

    const supabaseAdmin = await getSupabaseAdmin();

    const { data: newRecord, error: insertError } = await supabaseAdmin
      .from('attendance')
      .insert({
        user_id: requestingUser.id,
        type,
        timestamp,
        is_late: is_late || false,
        latitude,
        longitude,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting attendance record:", insertError);
      return NextResponse.json({ error: `Database error: ${insertError.message}` }, { status: 500 });
    }

    // --- Google Sheets Integration ---
    try {
      const formattedTimestamp = new Date(timestamp).toLocaleString("id-ID", {
        dateStyle: "long",
        timeStyle: "long",
        timeZone: "Asia/Jakarta", // WIB
      });

      const valuesToAppend = [
        formattedTimestamp,
        requestingUser.full_name || "",
        requestingUser.email || "",
        type,
        is_late ? "YA" : "TIDAK",
        latitude,
        longitude,
      ];
      
      const { appendToSheet } = await import("@/lib/google-sheets");
      await appendToSheet(valuesToAppend);
      console.log("Successfully wrote to Google Sheet."); // Re-added success log

    } catch (sheetError: any) {
      console.error("--- Google Sheets Integration Error ---");
      console.error("!!! FAILED TO WRITE TO GOOGLE SHEET:", sheetError.message);
      console.error(sheetError); // Log the full error object for details
    }
    // --- End of Google Sheets Integration ---

    return NextResponse.json(newRecord, { status: 201 });

  } catch (e) {
    const error = e as Error;
    console.error("Unhandled error in POST /api/attendance:", error);
    return NextResponse.json({ error: `Unhandled server error: ${error.message}` }, { status: 500 });
  }
}

// GET /api/attendance - Fetch attendance records
export async function GET(request: NextRequest) {
  console.log("--- GET /api/attendance endpoint hit ---");
  try {
    const { user: requestingUser, supabase, error: authError } = await getRequestingUser(request);

    console.log(`Requesting user role: ${requestingUser?.role}, ID: ${requestingUser?.id}`);

    if (authError || !requestingUser) {
      console.error("Auth error in /api/attendance:", authError);
      return NextResponse.json({ error: authError || "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    let query;

    if (requestingUser.role === 'admin' && !userId) {
      console.log("Attempting to fetch all records with ADMIN privileges...");
      const supabaseAdmin = await getSupabaseAdmin();
      query = supabaseAdmin.from('attendance').select('*');
    } else {
      console.log("Fetching records with user-scoped (RLS) client...");
      query = supabase.from('attendance').select('*');
      if (requestingUser.role !== 'admin') {
        console.log(`Filtering for user_id: ${requestingUser.id}`);
        query = query.eq('user_id', requestingUser.id);
      } else if (userId) {
        console.log(`Admin fetching for specific user_id: ${userId}`);
        query = query.eq('user_id', userId);
      }
    }
    
    query = query.order('timestamp', { ascending: false });

    const { data: records, error: fetchError } = await query;

    if (fetchError) {
      console.error("!!! Supabase fetch error in GET /api/attendance:", fetchError);
      return NextResponse.json({ error: `Database fetch failed: ${fetchError.message}` }, { status: 500 });
    }

    console.log(`Successfully fetched ${records?.length} attendance records.`);
    if (!records || records.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(records);

  } catch (e) {
    const error = e as Error;
    console.error("Unhandled error in GET /api/attendance:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}