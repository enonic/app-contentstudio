/**
 * Checks if a string is a single Unicode letter or number.
 * Uses Unicode property escapes to support all scripts (Latin, Cyrillic, CJK, etc.).
 * @param key - The string to check (typically a keyboard event `key` value)
 * @returns `true` if `key` is exactly one letter (`\p{L}`) or digit (`\p{N}`)
 */
export const isUnicodeLetterOrNumber = (key: string): boolean => {
    if (key.length !== 1) return false;
    return /\p{L}|\p{N}/u.test(key);
};

type KeyboardEventLike = {
    key: string;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
};

/**
 * Checks if a keyboard event represents typing a plain character (letter or digit)
 * without modifier keys (Alt, Ctrl, Meta). Useful for type-ahead search and quick navigation.
 * @param event - Keyboard event or event-like object with `key` and modifier flags
 * @returns `true` if the event is a single letter/digit press without modifiers
 */
export const isTypingCharacter = (event: KeyboardEventLike): boolean => {
    if (event.altKey || event.ctrlKey || event.metaKey) return false;
    return isUnicodeLetterOrNumber(event.key);
};
