import { gmail_v1 } from 'googleapis';
import { GmailClient } from './client';
import { EmailData } from './types';
import { parseEmailContent, extractUnsubscribeLinks, parseSenderInfo } from './utils';
import { categorizeEmail } from './categorizer';

export class GmailService {
  private client: GmailClient;

  constructor(accessToken: string, refreshToken?: string) {
    this.client = new GmailClient();
    this.client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  async getEmails(query: string = '', maxResults: number = 50): Promise<EmailData[]> {
    try {
      const gmail = this.client.getGmailInstance();
      
      // Get list of messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      const messages = response.data.messages || [];
      
      // Get detailed message data
      const emails: EmailData[] = [];
      
      for (const message of messages) {
        try {
          const messageDetail = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full',
          });

          const emailData = await this.parseGmailMessage(messageDetail.data);
          emails.push(emailData);
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error);
          continue;
        }
      }

      return emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw new Error('Failed to fetch emails');
    }
  }

  async getSubscriptionEmails(): Promise<EmailData[]> {
    const queries = [
      'unsubscribe',
      'subscription',
      'newsletter',
      'opt-out',
      'promotional',
      'marketing'
    ];

    const allEmails: EmailData[] = [];
    
    for (const query of queries) {
      try {
        const emails = await this.getEmails(`"${query}"`, 20);
        allEmails.push(...emails);
      } catch (error) {
        console.error(`Error fetching emails for query "${query}":`, error);
      }
    }

    // Remove duplicates and categorize
    const uniqueEmails = this.removeDuplicateEmails(allEmails);
    return uniqueEmails.filter(email => 
      email.category === 'subscription' || 
      email.category === 'promotional'
    );
  }

  private async parseGmailMessage(message: gmail_v1.Schema$Message): Promise<EmailData> {
    const headers = message.payload?.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const to = headers.find(h => h.name === 'To')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    // Parse sender info
    const { name: senderName, email: senderEmail } = parseSenderInfo(from);

    // Extract email content
    const { textContent, htmlContent } = parseEmailContent(message.payload!);
    
    // Extract unsubscribe links
    const unsubscribeLinks = extractUnsubscribeLinks(htmlContent, headers);

    // Categorize email
    const category = categorizeEmail(subject, senderEmail, textContent);

    return {
      gmailId: message.id!,
      threadId: message.threadId!,
      subject,
      senderName,
      senderEmail,
      recipientEmail: to,
      date: new Date(date),
      snippet: message.snippet || '',
      bodyText: textContent,
      bodyHtml: htmlContent,
      labels: message.labelIds || [],
      category,
      unsubscribeLinks,
      isUnsubscribed: false,
    };
  }

  private removeDuplicateEmails(emails: EmailData[]): EmailData[] {
    const seen = new Set<string>();
    return emails.filter(email => {
      if (seen.has(email.gmailId)) {
        return false;
      }
      seen.add(email.gmailId);
      return true;
    });
  }

  async modifyEmail(gmailId: string, addLabels: string[] = [], removeLabels: string[] = []): Promise<void> {
    try {
      const gmail = this.client.getGmailInstance();
      
      await gmail.users.messages.modify({
        userId: 'me',
        id: gmailId,
        requestBody: {
          addLabelIds: addLabels,
          removeLabelIds: removeLabels,
        },
      });
    } catch (error) {
      console.error('Error modifying email:', error);
      throw new Error('Failed to modify email');
    }
  }

  async createLabel(name: string): Promise<string> {
    try {
      const gmail = this.client.getGmailInstance();
      
      const response = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        },
      });

      return response.data.id!;
    } catch (error) {
      console.error('Error creating label:', error);
      throw new Error('Failed to create label');
    }
  }

  async refreshTokens(): Promise<void> {
    try {
      await this.client.refreshAccessToken();
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      throw new Error('Failed to refresh tokens');
    }
  }
}
