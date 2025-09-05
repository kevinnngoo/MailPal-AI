import { z } from "zod";
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '../../../../../supabase/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// GET: Generate Gmail authorization URL
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels',
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: user.id, // Pass user ID in state for security
      prompt: 'consent', // Force consent to get refresh token
    });

    return NextResponse.json({ authUrl });

  } catch (error) {
    console.error('Auth URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' }, 
      { status: 500 }
    );
  }
}

// POST: Handle Gmail OAuth callback

// Zod schema for callback validation
const CallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CallbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
  { error: 'Invalid request data', details: parsed.error.issues },
        { status: 400 }
      );
    }
    const { code, state: userId } = parsed.data;

    const supabase = await createClient();

    // Verify the user exists and matches the state
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Invalid user or security check failed' }, 
        { status: 401 }
      );
    }


    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens || !tokens.access_token) {
      return NextResponse.json(
        { error: 'Failed to get access token' }, 
        { status: 400 }
      );
    }

    // Store tokens in user profile
    const { error: dbError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        gmail_access_token: tokens.access_token,
        gmail_refresh_token: tokens.refresh_token,
        gmail_connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (dbError) {
      console.error('Failed to store Gmail tokens:', dbError);
      return NextResponse.json(
        { error: 'Failed to store tokens' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Gmail connected successfully' 
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' }, 
      { status: 500 }
    );
  }
}

