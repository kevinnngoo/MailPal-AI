import { User } from '@supabase/supabase-js';

export interface UserProfile extends User {
  subscription_status?: 'free' | 'premium';
  gmail_connected_at?: string;
}
