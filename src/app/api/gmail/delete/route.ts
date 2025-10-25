import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailIds } = await req.json();

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json({ error: 'Email IDs required' }, { status: 400 });
    }

    // Get user's profile to verify Gmail connection
    const { data: profile } = await supabase
      .from('users')
      .select('gmail_connected_at')
      .eq('user_id', user.id)
      .single();

    if (!profile?.gmail_connected_at) {
      return NextResponse.json({ 
        error: 'Gmail account not connected',
        connectRequired: true 
      }, { status: 400 });
    }

    // For now, we'll just mark emails as deleted in our database
    // In a full implementation, you'd use Gmail API to move to trash
    const { error: deleteError } = await supabase
      .from('emails')
      .update({ is_deleted: true })
      .in('gmail_id', emailIds)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error marking emails as deleted:', deleteError);
      return NextResponse.json({ error: 'Failed to delete emails' }, { status: 500 });
    }

    // Log the action
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'delete',
      metadata: { 
        emails_deleted: emailIds.length
      }
    });

    return NextResponse.json({
      success: true,
      message: `Marked ${emailIds.length} emails as deleted`,
      deleted_count: emailIds.length
    });

  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete emails' },
      { status: 500 }
    );
  }
}