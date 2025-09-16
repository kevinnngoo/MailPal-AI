import { EmailCategory } from './types';

export function categorizeEmail(
  subject: string,
  senderEmail: string,
  content: string
): EmailCategory {
  const subjectLower = subject.toLowerCase();
  const senderLower = senderEmail.toLowerCase();
  const contentLower = content.toLowerCase();

  // Newsletter/Subscription patterns
  const subscriptionKeywords = [
    'newsletter', 'digest', 'weekly', 'monthly', 'subscription',
    'update', 'bulletin', 'roundup', 'briefing'
  ];

  // Promotional patterns
  const promotionalKeywords = [
    'sale', 'discount', 'offer', 'deal', 'promotion', 'coupon',
    'save', '% off', 'limited time', 'exclusive', 'special'
  ];

  // Social patterns
  const socialKeywords = [
    'notification', 'mentioned you', 'tagged you', 'commented',
    'liked your', 'shared your', 'friend request'
  ];

  // Check for subscription indicators
  if (
    subscriptionKeywords.some(keyword => 
      subjectLower.includes(keyword) || contentLower.includes(keyword)
    ) ||
    senderLower.includes('newsletter') ||
    senderLower.includes('digest') ||
    contentLower.includes('unsubscribe')
  ) {
    return 'subscription';
  }

  // Check for promotional indicators
  if (
    promotionalKeywords.some(keyword => 
      subjectLower.includes(keyword) || contentLower.includes(keyword)
    ) ||
    /\d+%\s*(off|discount)/.test(contentLower) ||
    senderLower.includes('promo') ||
    senderLower.includes('offer')
  ) {
    return 'promotional';
  }

  // Check for social indicators
  if (
    socialKeywords.some(keyword => 
      subjectLower.includes(keyword) || contentLower.includes(keyword)
    ) ||
    ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube']
      .some(platform => senderLower.includes(platform))
  ) {
    return 'social';
  }

  // Check for spam indicators
  if (
    subjectLower.includes('urgent') ||
    subjectLower.includes('act now') ||
    subjectLower.includes('congratulations') ||
    /\$\d+/.test(subjectLower)
  ) {
    return 'spam';
  }

  // Everything else
  return 'other';
}

export function calculateSpamScore(email: {
  subject: string;
  senderEmail: string;
  content: string;
}): number {
  let score = 0;
  
  const subject = email.subject.toLowerCase();
  const sender = email.senderEmail.toLowerCase();
  const content = email.content.toLowerCase();

  // Suspicious subject patterns
  if (subject.includes('urgent')) score += 20;
  if (subject.includes('act now')) score += 20;
  if (subject.includes('limited time')) score += 10;
  if (/free\s*\$/.test(subject)) score += 15;
  if (subject.includes('congratulations')) score += 25;

  // Suspicious sender patterns
  if (!sender.includes('.')) score += 30; // No domain
  if (/\d{5,}/.test(sender)) score += 15; // Many numbers
  if (sender.includes('noreply') && content.includes('click here')) score += 10;

  // Content patterns
  if (content.includes('click here')) score += 10;
  if (/\$\d+/.test(content)) score += 5;
  if (content.includes('winner')) score += 15;

  return Math.min(score, 100); // Cap at 100
}
