import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Data for public profile
    const profileData: { [key: string]: any } = {};
    if (body.name) profileData.name = body.name;
    if (body.role) profileData.role = body.role;
    if (body.department) profileData.department = body.department;
    if (body.photo) profileData.photo = body.photo;

    // Data for auth schema
    const authData: { [key: string]: any } = {};
    if (body.email) authData.email = body.email;
    if (body.password) {
      if (body.password.length > 0) { // only update password if it's not an empty string
        authData.password = body.password;
      }
    }
    
    // 1. Update Supabase Auth user if there's auth data
    if (Object.keys(authData).length > 0) {
      const { data: authUser, error: authError } = await supabase.auth.admin.updateUserById(
        id,
        authData
      );
      if (authError) {
        throw new Error(`Supabase auth update error: ${authError.message}`);
      }
    }

    // 2. Update the public 'users' table
    if (Object.keys(profileData).length > 0) {
      const { data, error } = await supabase
        .from('users')
        .update(profileData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase PATCH error:', error);
        if (error.code === '23505') { // Handle unique constraint violation for email
            return new NextResponse(JSON.stringify({ error: 'Email already in use by another user' }), {
              status: 409,
              headers: { 'Content-Type': 'application/json' },
            });
        }
        throw new Error(error.message);
      }
      return NextResponse.json(data);
    }
    
    // If only auth was updated, return a success message
    return NextResponse.json({ message: "User updated successfully" });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('API PATCH Error:', errorMessage);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE handler to remove a user
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const { error, count } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase DELETE error:', error);
            throw new Error(error.message);
        }

        // Supabase delete operation doesn't return the deleted data,
        // but it returns 'count' which is the number of rows affected.
        // If count is 0, user was not found.
        if (count === 0) {
            return new NextResponse(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        console.error('API DELETE Error:', errorMessage);
        return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
