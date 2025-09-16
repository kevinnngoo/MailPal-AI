export interface EmailData {
  gmailId: string;
  threadId: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  date: Date;
  snippet: string;
  bodyText: string;
  bodyHtml: string;
  labels: string[];
  category: EmailCategory;
  unsubscribeLinks: string[];
  isUnsubscribed: boolean;
}

export type EmailCategory = 
  | 'subscription' 
  | 'promotional' 
  | 'social' 
  | 'spam' 
  | 'important' 
  | 'other';

export interface CleanupRule {
  id: string;
  userId: string;
  name: string;
  conditions: {
    senderDomains?: string[];
    keywords?: string[];
    categories?: EmailCategory[];
    olderThanDays?: number;
  };
  actions: {
    delete?: boolean;
    archive?: boolean;
    addLabels?: string[];
    unsubscribe?: boolean;
  };
  isActive: boolean;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
}

export interface EmailStats {
  totalEmails: number;
  subscriptionEmails: number;
  promotionalEmails: number;
  unsubscribeableEmails: number;
  cleanedUp: number;
  lastSync: Date;
}

export interface GmailCredentials {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}
