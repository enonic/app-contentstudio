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

//
// * Shortcuts
//

type ShortcutEventLike = KeyboardEventLike & {
    shiftKey: boolean;
    code?: string;
};

const KEY_ALIASES: Record<string, string> = {
    del: 'delete',
    esc: 'escape',
    return: 'enter',
    space: ' ',
};

const isApplePlatform = (): boolean =>
    typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform ?? '');

/**
 * Checks if a keyboard event matches a `mod+e` style shortcut. `mod` is Meta
 * on Apple platforms and Control elsewhere; every other modifier must match
 * exactly. A letter is matched by the typed character, falling back to the
 * physical key only for Alt chords, where macOS types a dead character.
 */
export const matchesShortcut = (event: ShortcutEventLike, shortcut: string, isApple = isApplePlatform()): boolean => {
    const tokens = shortcut.toLowerCase().split('+');
    const key = tokens.pop();
    if (!key) return false;

    const modifiers = new Set(tokens.map((token) => (token === 'mod' ? (isApple ? 'meta' : 'ctrl') : token)));

    if (modifiers.has('ctrl') !== event.ctrlKey) return false;
    if (modifiers.has('meta') !== event.metaKey) return false;
    if (modifiers.has('alt') !== event.altKey) return false;
    if (modifiers.has('shift') !== event.shiftKey) return false;

    const expected = KEY_ALIASES[key] ?? key;
    if (event.key.toLowerCase() === expected) return true;

    const isLetter = expected.length === 1 && /[a-z]/.test(expected);
    return isLetter && event.altKey && event.code === `Key${expected.toUpperCase()}`;
};

/**
 * Checks if the event target is a text-entry element, where global shortcuts
 * must not fire.
 */
export const isEditableTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    return ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
};
