import { gmail_v1 } from 'googleapis';

export interface ParsedEmailContent {
  textContent: string;
  htmlContent: string;
}

export function parseEmailContent(payload: gmail_v1.Schema$MessagePart): ParsedEmailContent {
  let textContent = '';
  let htmlContent = '';

  function extractContent(part: gmail_v1.Schema$MessagePart) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      textContent += Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      htmlContent += Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (part.parts) {
      part.parts.forEach(extractContent);
    }
  }

  extractContent(payload);

  return { textContent, htmlContent };
}

export function extractUnsubscribeLinks(htmlContent: string, headers: { name?: string | null; value?: string | null }[]): string[] {
  const links: string[] = [];

  // Check List-Unsubscribe header
  const listUnsubscribe = headers.find(h => h.name === 'List-Unsubscribe')?.value;
  if (listUnsubscribe) {
    const urlMatches = listUnsubscribe.match(/<(https?:\/\/[^>]+)>/g);
    if (urlMatches) {
      links.push(...urlMatches.map((match: string) => match.slice(1, -1)));
    }
  }

  // Extract from HTML content
  if (htmlContent) {
    const unsubscribeRegex = /href=["']([^"']*(?:unsubscribe|opt-out|remove)[^"']*)["']/gi;
    let match;
    while ((match = unsubscribeRegex.exec(htmlContent)) !== null) {
      if (match[1] && match[1].startsWith('http')) {
        links.push(match[1]);
      }
    }
  }

  return Array.from(new Set(links)); // Remove duplicates
}

export function parseSenderInfo(from: string): { name: string; email: string } {
  const senderMatch = from.match(/^(.+?)\s*<(.+)>$/) || [null, from, from];
  const name = senderMatch[1]?.trim().replace(/"/g, '') || '';
  const email = senderMatch[2]?.trim() || from;
  
  return { name, email };
}
