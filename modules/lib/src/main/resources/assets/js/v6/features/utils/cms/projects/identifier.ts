/**
 * Checks whether a string is a valid project identifier.
 * Allows lowercase alphanumeric characters and hyphens,
 * must start with a letter or digit, must not end with a hyphen.
 */
export function validateProjectIdentifier(value: string): boolean {
    const regExp = /^([a-z0-9])([a-z0-9-])*$/;

    return regExp.test(value) && !value.endsWith('-');
}

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
 * Converts an arbitrary string into a valid project identifier.
 * Pipeline: lowercase → expand ligatures → NFD strip diacritics →
 * replace non-alphanumeric runs with hyphens → trim edge hyphens.
 *
 * When {@link isUserInput} is `true`, a trailing hyphen typed by
 * the user is preserved so the input field does not fight the user
 * while they are still typing (e.g. `"my-project-"`).
 *
 * @param value - Raw input string.
 * @param isUserInput - Preserve a trailing hyphen for live typing.
 */
export function prettifyProjectIdentifier(value: string, isUserInput?: boolean): string {
    const prettified = value
        .toLowerCase()
        .replace(LIGATURE_RE, (ch) => LIGATURES[ch])
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')   // strip combining diacritical marks (é→e, ü→u)
        .replace(/[^a-z0-9]+/g, '-')       // replace non-alphanumeric runs with single hyphen
        .replace(/^-|-$/g, '');             // strip leading/trailing hyphens

    if (isUserInput && value.endsWith('-') && !prettified.endsWith('-')) {
        return prettified + '-';
    }
    return prettified;
}
