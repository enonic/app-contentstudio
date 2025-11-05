/**
 * Normalizes text for use as keys (e.g., localStorage keys, identifiers).
 *
 * Transformation rules:
 * - Converts to lowercase
 * - Replaces whitespace, hyphens, dots, slashes with underscores
 * - Removes all non-alphanumeric characters except underscores
 * - Collapses multiple underscores into one
 * - Trims leading/trailing underscores
 * - Returns empty string if result is empty
 *
 * @example
 * normalize("My Project Name")     // "my_project_name"
 * normalize("foo.bar/baz")         // "foo_bar_baz"
 * normalize("test--key")           // "test_key"
 * normalize("Hello@World!")        // "helloworld"
 *
 * @param text - The text to normalize
 * @returns Normalized string suitable for use as a key
 */
export function normalize(text: string): string {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text
        .toLowerCase()
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[\s\-./\\:]+/g, '_') // Replace separators with underscores
        .replace(/[^a-z0-9_]/g, '') // Remove non-alphanumeric except underscores
        .replace(/_+/g, '_') // Collapse multiple underscores
        .replace(/^_+|_+$/g, ''); // Trim leading/trailing underscores
}
