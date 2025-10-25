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

    let successCount = 0;
    let failedCount = 0;
    const results = [];

    for (const emailId of emailIds) {
      try {
        // Get email details from database
        const { data: email } = await supabase
          .from('emails')
          .select('unsubscribe_links, subject')
          .eq('gmail_id', emailId)
          .eq('user_id', user.id)
          .single();

        if (!email?.unsubscribe_links || email.unsubscribe_links.length === 0) {
          results.push({ emailId, success: false, reason: 'No unsubscribe links found' });
          failedCount++;
          continue;
        }

        // Attempt to unsubscribe using the first available link
        let success = false;
        for (const unsubscribeLink of email.unsubscribe_links) {
          try {
            const response = await fetch(unsubscribeLink, {
              method: 'GET',
              headers: {
                'User-Agent': 'MailPal-AI/1.0',
              },
            });
            if (response.ok) {
              success = true;
              break;
            }
          } catch (linkError) {
            console.error(`Failed to access unsubscribe link ${unsubscribeLink}:`, linkError);
            continue;
          }
        }
        
        if (success) {
          // Mark as unsubscribed in database
          await supabase
            .from('emails')
            .update({ is_unsubscribed: true })
            .eq('gmail_id', emailId)
            .eq('user_id', user.id);

          results.push({ emailId, success: true });
          successCount++;
        } else {
          results.push({ emailId, success: false, reason: 'Unsubscribe failed' });
          failedCount++;
        }
      } catch (error) {
        console.error(`Unsubscribe failed for email ${emailId}:`, error);
        results.push({ emailId, success: false, reason: 'Server error' });
        failedCount++;
      }
    }

    // Log the action
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'unsubscribe',
      metadata: { 
        total_attempts: emailIds.length,
        successful: successCount,
        failed: failedCount
      }
    });

    return NextResponse.json({
      success: true,
      message: `Unsubscribed from ${successCount} out of ${emailIds.length} emails`,
      results,
      summary: {
        total: emailIds.length,
        successful: successCount,
        failed: failedCount
      }
    });

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to process unsubscribe requests' },
      { status: 500 }
    );
  }
}