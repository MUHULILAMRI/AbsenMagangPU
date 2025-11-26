import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message);
    }

    return NextResponse.json(users);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('API GET Error:', errorMessage);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, department, photo } = await request.json();

    // Basic validation
    if (!email || !password || !name) {
      return new NextResponse(JSON.stringify({ error: 'Bad Request: Missing email, password, or name' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/attendance`,
        data: {
          name,
          role: role || 'user',
          department: department || null,
          photo: photo || null,
        },
      },
    });

    if (error) {
      console.error('Supabase sign-up error:', error);
      const status = (error as any).status || 409;
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // A user object is returned but session is null until email is confirmed.
    if (data.user && !data.session) {
      return NextResponse.json({ 
        message: 'User created successfully. Please check your email to confirm your account.',
        user: data.user 
      });
    }
    
    // This case would happen if email confirmation is disabled.
    return NextResponse.json({ 
      message: 'User created and signed in successfully.',
      user: data.user, 
      session: data.session 
    }, { status: 201 });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('API POST Error:', errorMessage);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
