/**
 * Communication Hub API Helpers
 * Standardized utilities for fetching, pagination, and error handling
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  nextCursor?: string | null;
}

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Standard API fetcher with consistent error handling
 */
export async function apiFetch<T>(url: string, options?: FetchOptions): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
    
    const json = await res.json();
    
    if (!res.ok || !json?.success) {
      return { success: false, error: json?.error || `HTTP ${res.status}` };
    }
    
    return json;
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error' };
  }
}

/**
 * Fetch paginated list with cursor
 */
export async function fetchPaginated<T>(
  baseUrl: string,
  params: Record<string, string | number> = {},
  cursor?: string | null
): Promise<ApiResponse<T[]>> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => qs.set(k, String(v)));
  if (cursor) qs.set('cursor', cursor);
  
  return apiFetch<T[]>(`${baseUrl}?${qs.toString()}`);
}

/**
 * Show toast notification (basic implementation)
 * Can be replaced with a toast library
 */
export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  // Basic alert for now; replace with proper toast library
  if (type === 'error') {
    console.error('Toast:', message);
    alert(`Error: ${message}`);
  } else {
    console.log('Toast:', message);
  }
}

/**
 * Debounce utility for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Format relative time for messages/posts
 */
export function formatRelativeTime(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) return new Date(date).toLocaleDateString();
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/**
 * Extract mentions from text (simple @username pattern)
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = text.matchAll(mentionRegex);
  return Array.from(matches, m => m[1]);
}

/**
 * Highlight mentions in text for rendering
 */
export function highlightMentions(text: string): string {
  return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}
