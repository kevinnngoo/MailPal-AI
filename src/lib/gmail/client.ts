import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GmailCredentials } from './types';

export class GmailClient {
  private oauth2Client: OAuth2Client;
  private gmail: gmail_v1.Gmail;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  setCredentials(tokens: GmailCredentials) {
    this.oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });
  }

  async refreshAccessToken(): Promise<string> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.setCredentials({
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || undefined,
        expiry_date: credentials.expiry_date || undefined,
      });
      return credentials.access_token!;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  getGmailInstance(): gmail_v1.Gmail {
    return this.gmail;
  }

  getOAuth2Client(): OAuth2Client {
    return this.oauth2Client;
  }
}
