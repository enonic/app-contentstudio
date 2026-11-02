import { describe, expect, it } from 'vitest';
import { isEditableTarget, isTypingCharacter, matchesShortcut } from './keyboard';

type EventInit = Partial<Parameters<typeof matchesShortcut>[0]>;

const event = (init: EventInit): Parameters<typeof matchesShortcut>[0] => ({
    key: '',
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...init,
});

describe('matchesShortcut', () => {
    it('should resolve mod to Control outside Apple platforms', () => {
        expect(matchesShortcut(event({ key: 'e', code: 'KeyE', ctrlKey: true }), 'mod+e', false)).toBe(true);
        expect(matchesShortcut(event({ key: 'e', code: 'KeyE', metaKey: true }), 'mod+e', false)).toBe(false);
    });

    it('should resolve mod to Meta on Apple platforms', () => {
        expect(matchesShortcut(event({ key: 'e', code: 'KeyE', metaKey: true }), 'mod+e', true)).toBe(true);
        expect(matchesShortcut(event({ key: 'e', code: 'KeyE', ctrlKey: true }), 'mod+e', true)).toBe(false);
    });

    it('should require every modifier to match exactly', () => {
        expect(matchesShortcut(event({ key: 'e', code: 'KeyE', ctrlKey: true, shiftKey: true }), 'mod+e', false)).toBe(
            false,
        );
        expect(matchesShortcut(event({ key: 'n', code: 'KeyN' }), 'alt+n', false)).toBe(false);
    });

    it('should match a letter by the typed character, not the physical key', () => {
        expect(matchesShortcut(event({ key: 'e', code: 'KeyD', ctrlKey: true }), 'mod+e', false)).toBe(true);
        expect(matchesShortcut(event({ key: 'd', code: 'KeyE', ctrlKey: true }), 'mod+e', false)).toBe(false);
    });

    it('should fall back to the physical key for Alt chords that type a dead character', () => {
        expect(matchesShortcut(event({ key: '˜', code: 'KeyN', altKey: true }), 'alt+n', true)).toBe(true);
        expect(matchesShortcut(event({ key: '˜', code: 'KeyN', ctrlKey: true }), 'mod+n', false)).toBe(false);
    });

    it('should accept an upper-case key value', () => {
        expect(matchesShortcut(event({ key: 'N', altKey: true }), 'alt+n', false)).toBe(true);
    });

    it('should map del to the Delete key', () => {
        expect(matchesShortcut(event({ key: 'Delete', code: 'Delete', ctrlKey: true }), 'mod+del', false)).toBe(true);
        expect(matchesShortcut(event({ key: 'Backspace', code: 'Backspace', ctrlKey: true }), 'mod+del', false)).toBe(
            false,
        );
    });
});

describe('isEditableTarget', () => {
    it('should treat inputs and contenteditable elements as editable', () => {
        const input = document.createElement('input');
        const editable = document.createElement('div');
        editable.contentEditable = 'true';

        expect(isEditableTarget(input)).toBe(true);
        expect(isEditableTarget(editable)).toBe(true);
    });

    it('should treat other elements and missing targets as not editable', () => {
        expect(isEditableTarget(document.createElement('button'))).toBe(false);
        expect(isEditableTarget(null)).toBe(false);
    });
});

describe('isTypingCharacter', () => {
    it('should accept a plain letter and reject one with a modifier', () => {
        expect(isTypingCharacter({ key: 'a', altKey: false, ctrlKey: false, metaKey: false })).toBe(true);
        expect(isTypingCharacter({ key: 'a', altKey: false, ctrlKey: true, metaKey: false })).toBe(false);
    });
});
