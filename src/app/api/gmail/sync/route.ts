import { NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';
import { GmailService } from '@/lib/gmail/services';
import { checkRateLimit } from '@/lib/rate-limit';
import { decrypt } from '@/lib/encryption';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    if (!checkRateLimit(user.id, 5, 60000)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Get user's Gmail credentials
    const { data: profile } = await supabase
      .from('users')
      .select('gmail_access_token, gmail_refresh_token, subscription')
      .eq('user_id', user.id)
      .single();

    if (!profile?.gmail_access_token) {
      return NextResponse.json({ 
        error: 'Gmail account not connected',
        connectRequired: true 
      }, { status: 400 });
    }

    // Check usage limits for free users
    let dailyUsageCount = 0;
    if (profile.subscription !== 'premium') {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('action', 'sync')
        .gte('created_at', today + 'T00:00:00.000Z')
        .lt('created_at', today + 'T23:59:59.999Z');

      dailyUsageCount = count || 0;
      if (dailyUsageCount >= 25) {
        return NextResponse.json({ 
          error: 'Daily sync limit reached',
          upgradeRequired: true 
        }, { status: 429 });
      }
    }

    const gmailService = new GmailService(
      decrypt(profile.gmail_access_token),
      profile.gmail_refresh_token ? decrypt(profile.gmail_refresh_token) : undefined
    );

    // Sync subscription emails
    const emails = await gmailService.getSubscriptionEmails();
    
    // Store in database
    const emailInserts = emails.map(email => ({
      user_id: user.id,
      gmail_id: email.gmailId,
      thread_id: email.threadId,
      subject: email.subject,
      sender_email: email.senderEmail,
      sender_name: email.senderName,
      recipient_email: email.recipientEmail,
      date: email.date.toISOString(),
      snippet: email.snippet,
      body_text: email.bodyText,
      body_html: email.bodyHtml,
      labels: email.labels,
      category: email.category,
      unsubscribe_links: email.unsubscribeLinks,
    }));

    // Insert or update emails
    if (emailInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('emails')
        .upsert(emailInserts, { 
          onConflict: 'gmail_id',
          ignoreDuplicates: true 
        });

      if (insertError) {
        console.error('Error inserting emails:', insertError);
        throw insertError;
      }
    }

    // Log usage
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action: 'sync',
      metadata: { emails_processed: emails.length }
    });

    const summary = {
      total: emails.length,
      subscription: emails.filter(e => e.category === 'subscription').length,
      promotional: emails.filter(e => e.category === 'promotional').length,
      unsubscribeable: emails.filter(e => e.unsubscribeLinks.length > 0).length,
    };

    return NextResponse.json({
      success: true,
      emailsProcessed: emails.length,
      summary,
      usage: {
        today: dailyUsageCount + 1,
        limit: profile.subscription === 'premium' ? null : 25,
        remaining: profile.subscription === 'premium' ? null : 24 - dailyUsageCount,
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync emails' },
      { status: 500 }
    );
  }
}
