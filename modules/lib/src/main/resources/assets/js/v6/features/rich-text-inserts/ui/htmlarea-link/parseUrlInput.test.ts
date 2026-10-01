import { describe, expect, it } from 'vitest';
import { parseUrlInput, type UrlInputState, type UrlProtocol } from './parseUrlInput';

const initial: UrlInputState = { urlValue: '', urlInputPrefix: '', urlProtocol: 'https://' };

describe('parseUrlInput', () => {
    it.each(['https://example.com', 'http://example.com', 'ftp://example.com/file', 'tel:+4712345678'])(
        'preserves %s while typing character by character',
        (url) => {
            let state = initial;
            for (let i = 1; i <= url.length; i++) {
                const raw = url.slice(0, i);
                state = parseUrlInput(state, raw);
                expect(state.urlInputPrefix + state.urlValue).toBe(raw);
            }
            expect(state.urlProtocol).toBe(url.slice(0, url.length - state.urlValue.length));
            expect(state.urlProtocol + state.urlValue).toBe(url);
        },
    );

    it.each([
        ['https://http://x', 'http://', 'x'],
        ['HTTPS://x', 'https://', 'x'],
        ['  HTTP:// HTTPS://x ', 'https://', 'x '],
        ['http://tel:90043146', 'tel:', '90043146'],
        ['tel:https://ftp://example.com/file', 'ftp://', 'example.com/file'],
        ['https://example.com?next=http://other.com', 'https://', 'example.com?next=http://other.com'],
        ['https://ftp://tel:', 'tel:', ''],
    ] as [string, UrlProtocol, string][])(
        'normalizes pasted %s using the last leading protocol',
        (raw, protocol, address) => {
            const prev = Object.freeze({ ...initial });
            expect(parseUrlInput(prev, raw, true)).toEqual({
                urlValue: address,
                urlInputPrefix: '',
                urlProtocol: protocol,
            });
        },
    );

    it('does not apply repeated-protocol stripping while typing', () => {
        expect(parseUrlInput(initial, 'https://http://x')).toEqual({
            urlValue: 'http://x',
            urlInputPrefix: 'https://',
            urlProtocol: 'https://',
        });
    });

    it('preserves casing and whitespace in a typed prefix', () => {
        expect(parseUrlInput(initial, '  HTTP://example.com ')).toEqual({
            urlValue: 'example.com ',
            urlInputPrefix: '  HTTP://',
            urlProtocol: 'http://',
        });
    });

    it('replaces an already typed prefix when pasting', () => {
        const prev = parseUrlInput(initial, 'https://old.example');
        expect(parseUrlInput(prev, 'ftp://http://new.example', true)).toEqual({
            urlValue: 'new.example',
            urlInputPrefix: '',
            urlProtocol: 'http://',
        });
    });

    it.each(['tel:8080', 'localhost:8080', 'tel:secret@example.com/file'])(
        'does not reinterpret the existing address %s while editing',
        (address) => {
            const prev: UrlInputState = { ...initial, urlValue: address, urlProtocol: 'ftp://' };
            expect(parseUrlInput(prev, address + '1')).toEqual({ ...prev, urlValue: address + '1' });
        },
    );

    it.each(['/path', './a:b', '../path', '.', '..', '.?view=full', '..#section'])('switches %s to Relative', (raw) => {
        expect(parseUrlInput(initial, raw)).toEqual({ urlValue: raw, urlInputPrefix: '', urlProtocol: '' });
    });

    it.each(['example.com', '', 'https:/', 'javascript:alert(1)'])(
        'retains the selected protocol for input without a supported prefix: %s',
        (raw) => {
            expect(parseUrlInput({ ...initial, urlProtocol: 'http://' }, raw)).toEqual({
                urlValue: raw,
                urlInputPrefix: '',
                urlProtocol: 'http://',
            });
        },
    );
});
