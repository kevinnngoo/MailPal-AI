// lib/gmail.ts
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { SupabaseClient } from '@supabase/supabase-js';

export interface EmailData {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  labels: string[];
  unsubscribeLink?: string;
  listUnsubscribe?: string;
  category: 'promotional' | 'social' | 'updates' | 'forums' | 'primary';
  priority: 'high' | 'medium' | 'low';
  isNewsletter: boolean;
  isDeletable: boolean;
}

export interface SafetyCheck {
  isSafe: boolean;
  reason?: string;
  requiresConfirmation: boolean;
}

// Gmail API types
type GmailMessage = gmail_v1.Schema$Message;
type GmailHeader = gmail_v1.Schema$MessagePartHeader;

import { encrypt } from './encryption';

class GmailService {
  private oauth2Client: OAuth2Client;
  private gmail: gmail_v1.Gmail;
  private supabase: SupabaseClient;
  private userId: string;

  constructor(accessToken: string, refreshToken: string, supabase: SupabaseClient, userId: string) {
    this.supabase = supabase;
    this.userId = userId;

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    // Auto-refresh tokens and update in Supabase
    this.oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        await this.supabase
          .from('users')
          .update({
            gmail_access_token: encrypt(tokens.access_token),
            ...(tokens.refresh_token && { gmail_refresh_token: encrypt(tokens.refresh_token) })
          })
          .eq('user_id', this.userId);
      }
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  // Retry wrapper for Gmail API calls with token refresh
  private async retryGmailCall<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        const apiError = error as { code?: number; message?: string };
        if (apiError?.code === 401 && attempt < maxRetries) {
          // Token expired, refresh and retry
          await this.oauth2Client.getAccessToken();
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  }

  // Protected domains that should never be auto-processed
  private readonly PROTECTED_DOMAINS = [
    'noreply@.*bank.*',
    '.*@.*gov',
    'security@.*',
    'billing@.*',
    'legal@.*',
    'payroll@.*',
    'hr@.*',
    '.*@.*health.*',
    '.*@.*medical.*',
  ];

  private readonly PROTECTED_KEYWORDS = [
    'invoice', 'receipt', 'payment', 'bill', 'statement',
    'tax', 'legal', 'court', 'urgent', 'security alert',
    'password', 'verification', 'confirm', 'activate'
  ];

  async scanPromotionalEmails(maxResults: number = 50): Promise<EmailData[]> {
    return this.retryGmailCall(async () => {
      // Query for promotional and marketing emails
      const queries = [
        'category:promotions',
        'category:updates',
        'from:noreply OR from:newsletter OR from:marketing'
      ];

      const allEmails: EmailData[] = [];

      for (const query of queries) {
        try {
          const response = await this.gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: Math.floor(maxResults / queries.length),
          });

          if (response.data.messages) {
            const emailDetails = await Promise.all(
              response.data.messages.map(async (msg: GmailMessage) => {
                try {
                  if (!msg.id) return null;
                  return await this.getEmailDetails(msg.id);
                } catch (error) {
                  console.error(`Error getting email ${msg.id}:`, error);
                  return null;
                }
              })
            );
            allEmails.push(...emailDetails.filter(Boolean) as EmailData[]);
          }
        } catch (queryError) {
          console.error(`Error with query "${query}":`, queryError);
          continue; // Skip this query and continue with others
        }
      }

      // Remove duplicates and sort by date
      const uniqueEmails = this.removeDuplicates(allEmails);
      return uniqueEmails.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });
  }

  private async getEmailDetails(messageId: string): Promise<EmailData | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data;
      const headers = message.payload?.headers || [];
      
      const getHeader = (name: string) => 
        headers.find((h: GmailHeader) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('subject');
      const from = getHeader('from');
      const date = getHeader('date');
      const listUnsubscribe = getHeader('list-unsubscribe');

      // Extract unsubscribe link from headers or body
      const unsubscribeLink = this.extractUnsubscribeLink(message, listUnsubscribe);

      // Categorize email
      const category = this.categorizeEmail(subject, from, message.snippet || '');
      const priority = this.calculatePriority(subject, from, category);
      const isNewsletter = this.isNewsletterEmail(subject, from, listUnsubscribe);

      // Safety check
      const safetyCheck = this.performSafetyCheck(subject, from, message.snippet || '');

      return {
        id: messageId,
        threadId: message.threadId || '',
        subject: subject,
        from: from,
        date: date,
        snippet: message.snippet || '',
        labels: message.labelIds || [],
        unsubscribeLink,
        listUnsubscribe,
        category,
        priority,
        isNewsletter,
        isDeletable: safetyCheck.isSafe && !safetyCheck.requiresConfirmation,
      };

    } catch (error) {
      console.error(`Error getting email details for ${messageId}:`, error);
      return null;
    }
  }

  private extractUnsubscribeLink(message: GmailMessage, listUnsubscribe: string): string | undefined {
    if (listUnsubscribe) {
      // Parse List-Unsubscribe header (RFC 2369)
      const urlMatch = listUnsubscribe.match(/<(https?:\/\/[^>]+)>/);
      if (urlMatch) return urlMatch[1];
    }

    // Look for unsubscribe links in email body
    const body = this.extractEmailBody(message);
    const unsubscribePatterns = [
      /unsubscribe.*?href=["']([^"']+)["']/i,
      /href=["']([^"']*unsubscribe[^"']*)["']/i,
      /<a[^>]+href=["']([^"']*unsubscribe[^"']*)["']/i,
    ];

    for (const pattern of unsubscribePatterns) {
      const match = body.match(pattern);
      if (match) return match[1];
    }

    return undefined;
  }

  private extractEmailBody(message: GmailMessage): string {
    let body = '';
    
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString();
    } else if (message.payload?.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/html' || part.mimeType === 'text/plain') {
          if (part.body?.data) {
            body += Buffer.from(part.body.data, 'base64').toString();
          }
        }
      }
    }
    
    return body;
  }

  private categorizeEmail(subject: string, from: string, snippet: string): EmailData['category'] {
    const text = `${subject} ${from} ${snippet}`.toLowerCase();
    
    if (text.includes('newsletter') || text.includes('digest')) return 'updates';
    if (text.includes('social') || text.includes('notification')) return 'social';
    if (text.includes('forum') || text.includes('discussion')) return 'forums';
    if (text.includes('sale') || text.includes('offer') || text.includes('deal')) return 'promotional';
    
    return 'primary';
  }

  private calculatePriority(subject: string, from: string, category: EmailData['category']): EmailData['priority'] {
    const text = `${subject} ${from}`.toLowerCase();
    
    // High priority indicators
    if (this.PROTECTED_KEYWORDS.some(keyword => text.includes(keyword))) {
      return 'high';
    }

    // Low priority promotional content
    if (category === 'promotional' && 
        (text.includes('sale') || text.includes('offer') || text.includes('deal'))) {
      return 'low';
    }

    return 'medium';
  }

  private isNewsletterEmail(subject: string, from: string, listUnsubscribe: string): boolean {
    const text = `${subject} ${from}`.toLowerCase();
    return !!(
      listUnsubscribe ||
      text.includes('newsletter') ||
      text.includes('digest') ||
      text.includes('weekly') ||
      text.includes('monthly') ||
      from.includes('newsletter') ||
      from.includes('noreply')
    );
  }

  performSafetyCheck(subject: string, from: string, snippet: string): SafetyCheck {
    const text = `${subject} ${from} ${snippet}`.toLowerCase();

    // Check against protected domains
    for (const domain of this.PROTECTED_DOMAINS) {
      const regex = new RegExp(domain, 'i');
      if (regex.test(from)) {
        return {
          isSafe: false,
          reason: 'Protected domain - contains financial, legal, or security content',
          requiresConfirmation: true,
        };
      }
    }

    // Check for protected keywords
    for (const keyword of this.PROTECTED_KEYWORDS) {
      if (text.includes(keyword)) {
        return {
          isSafe: false,
          reason: `Contains protected keyword: ${keyword}`,
          requiresConfirmation: true,
        };
      }
    }

    // Safe to process automatically
    return {
      isSafe: true,
      requiresConfirmation: false,
    };
  }

  async validateUnsubscribeLink(url: string): Promise<boolean> {
    try {
      // Basic URL validation
      const urlObj = new URL(url);
      
      // Check if it's HTTPS
      if (urlObj.protocol !== 'https:') return false;
      
      // Check against known malicious domains
      const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'suspicious-site.com'];
      if (suspiciousDomains.some(domain => urlObj.hostname.includes(domain))) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async executeUnsubscribe(messageId: string, unsubscribeUrl: string): Promise<boolean> {
    try {
      // Validate the unsubscribe URL first
      if (!await this.validateUnsubscribeLink(unsubscribeUrl)) {
        throw new Error('Unsafe unsubscribe link detected');
      }

      // Make the unsubscribe request
      const response = await fetch(unsubscribeUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'MailPal-AI Unsubscribe Bot/1.0',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        // Move email out of inbox
        await this.gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          requestBody: {
            removeLabelIds: ['INBOX'],
            addLabelIds: ['CATEGORY_PROMOTIONS'],
          },
        });

        return true;
      }

      return false;
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      return false;
    }
  }

  private removeDuplicates(emails: EmailData[]): EmailData[] {
    const seen = new Set();
    return emails.filter(email => {
      const key = `${email.from}-${email.subject}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export default GmailService;
