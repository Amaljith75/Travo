const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

/** ₹4,999 */
export function formatINR(amount: number): string {
  return inr.format(Math.round(amount));
}

/** ₹1.2L style compact rupee value for dashboards. */
export function formatINRCompact(amount: number): string {
  return `₹${compact.format(amount)}`;
}

export function formatDuration(days: number, nights: number): string {
  if (days <= 1 && nights === 0) return 'Day trip';
  const d = `${days} ${days === 1 ? 'day' : 'days'}`;
  return nights > 0 ? `${d} / ${nights} ${nights === 1 ? 'night' : 'nights'}` : d;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Parse YYYY-MM-DD as a local calendar date (no timezone shift). */
export function parseISODate(date: string): Date {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date: string, days: number): string {
  const d = parseISODate(date);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** 12 Dec 2026 */
export function formatDate(date: string): string {
  const d = parseISODate(date);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Sat, 12 Dec */
export function formatDateShort(date: string): string {
  const d = parseISODate(date);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** 12–14 Dec 2026 or 30 Dec – 2 Jan 2027 */
export function formatDateRange(start: string, end: string): string {
  const s = parseISODate(start);
  const e = parseISODate(end);
  if (start === end) return formatDate(start);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
  }
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours() % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm} ${d.getHours() < 12 ? 'am' : 'pm'}`;
}

export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - new Date(iso).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso.slice(0, 10));
}

export function discountedPrice(basePrice: number, discountPercent: number): number {
  return Math.round(basePrice * (1 - Math.min(Math.max(discountPercent, 0), 90) / 100));
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Normalise an Indian phone number into wa.me format (country code, digits only). */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

export function whatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Human-friendly booking reference, e.g. TRV-26K7QX4M. Ambiguous characters excluded. */
export function generateReference(prefix = 'TRV', date: Date = new Date()): string {
  let body = '';
  for (let i = 0; i < 6; i++) body += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  return `${prefix}-${String(date.getFullYear()).slice(2)}${body}`;
}

export function uuid(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
