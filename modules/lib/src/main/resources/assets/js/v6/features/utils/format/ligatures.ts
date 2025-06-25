/**
 * Characters that do not decompose via NFD normalization and
 * need explicit Latin-ASCII expansion. Covers Nordic (æ, ø),
 * German (ß), and other common European ligatures.
 */
const LIGATURES: Record<string, string> = {
    æ: 'ae', œ: 'oe', ß: 'ss', ø: 'o', đ: 'd', ł: 'l', ŋ: 'ng', þ: 'th',
};

const LIGATURE_RE = new RegExp(`[${Object.keys(LIGATURES).join('')}]`, 'g');

/**
 * Expands ligature characters into their Latin-ASCII equivalents.
 * Must be called **before** NFD normalization, since NFD does not
 * decompose these characters.
 */
export function expandLigatures(value: string): string {
    return value.replace(LIGATURE_RE, (ch) => LIGATURES[ch]);
}
