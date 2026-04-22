import {beforeEach, describe, expect, it, vi} from 'vitest';
import {dispatchSyntheticTabKey, focusAdjacentDocumentTabStop} from './editorIframeNavigation';

describe('editorIframeNavigation', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('returns true when synthetic Tab navigation is handled upstream', () => {
        const target = document.createElement('div');
        document.body.appendChild(target);

        target.addEventListener('keydown', (event: Event) => {
            const keyEvent = event as KeyboardEvent;

            expect(keyEvent.key).toBe('Tab');
            expect(keyEvent.shiftKey).toBe(false);
            event.preventDefault();
        });

        expect(dispatchSyntheticTabKey(target, false)).toBe(true);
    });

    it('returns false when synthetic Tab navigation is not handled upstream', () => {
        const target = document.createElement('div');
        document.body.appendChild(target);

        expect(dispatchSyntheticTabKey(target, false)).toBe(false);
    });

    it('focuses the next document tab stop after the anchor', () => {
        document.body.innerHTML = `
            <button id="before" type="button">Before</button>
            <iframe id="anchor" tabindex="-1"></iframe>
            <button id="after" type="button">After</button>
        `;

        const anchor = document.getElementById('anchor') as HTMLIFrameElement;
        const nextButton = document.getElementById('after') as HTMLButtonElement;
        const focusSpy = vi.spyOn(nextButton, 'focus');

        expect(focusAdjacentDocumentTabStop(anchor, false)).toBe(true);
        expect(focusSpy).toHaveBeenCalledOnce();
    });

    it('focuses the previous document tab stop before the anchor', () => {
        document.body.innerHTML = `
            <button id="before" type="button">Before</button>
            <iframe id="anchor" tabindex="-1"></iframe>
            <button id="after" type="button">After</button>
        `;

        const anchor = document.getElementById('anchor') as HTMLIFrameElement;
        const previousButton = document.getElementById('before') as HTMLButtonElement;
        const focusSpy = vi.spyOn(previousButton, 'focus');

        expect(focusAdjacentDocumentTabStop(anchor, true)).toBe(true);
        expect(focusSpy).toHaveBeenCalledOnce();
    });

    it('skips focusable descendants of the anchor when searching forward', () => {
        document.body.innerHTML = `
            <button id="before" type="button">Before</button>
            <div id="anchor" tabindex="0">
                <button id="inside" type="button">Inside</button>
            </div>
            <button id="after" type="button">After</button>
        `;

        const anchor = document.getElementById('anchor') as HTMLDivElement;
        const insideButton = document.getElementById('inside') as HTMLButtonElement;
        const afterButton = document.getElementById('after') as HTMLButtonElement;
        const insideSpy = vi.spyOn(insideButton, 'focus');
        const afterSpy = vi.spyOn(afterButton, 'focus');

        expect(focusAdjacentDocumentTabStop(anchor, false)).toBe(true);
        expect(insideSpy).not.toHaveBeenCalled();
        expect(afterSpy).toHaveBeenCalledOnce();
    });

    it('returns false when no tab stop exists in the given direction', () => {
        document.body.innerHTML = `
            <button id="before" type="button">Before</button>
            <iframe id="anchor" tabindex="-1"></iframe>
        `;

        const anchor = document.getElementById('anchor') as HTMLIFrameElement;

        expect(focusAdjacentDocumentTabStop(anchor, false)).toBe(false);
    });

    it('skips candidates marked aria-hidden', () => {
        document.body.innerHTML = `
            <iframe id="anchor" tabindex="-1"></iframe>
            <button id="hidden" type="button" aria-hidden="true">Hidden</button>
            <button id="after" type="button">After</button>
        `;

        const anchor = document.getElementById('anchor') as HTMLIFrameElement;
        const afterButton = document.getElementById('after') as HTMLButtonElement;
        const focusSpy = vi.spyOn(afterButton, 'focus');

        expect(focusAdjacentDocumentTabStop(anchor, false)).toBe(true);
        expect(focusSpy).toHaveBeenCalledOnce();
    });

    it('skips candidates inside a [hidden] ancestor', () => {
        document.body.innerHTML = `
            <iframe id="anchor" tabindex="-1"></iframe>
            <div hidden>
                <button id="hidden" type="button">Hidden</button>
            </div>
            <button id="after" type="button">After</button>
        `;

        const anchor = document.getElementById('anchor') as HTMLIFrameElement;
        const afterButton = document.getElementById('after') as HTMLButtonElement;
        const focusSpy = vi.spyOn(afterButton, 'focus');

        expect(focusAdjacentDocumentTabStop(anchor, false)).toBe(true);
        expect(focusSpy).toHaveBeenCalledOnce();
    });

    it('skips disabled candidates matched via [tabindex]', () => {
        document.body.innerHTML = `
            <iframe id="anchor" tabindex="-1"></iframe>
            <input id="disabled" type="text" tabindex="0" disabled />
            <button id="after" type="button">After</button>
        `;

        const anchor = document.getElementById('anchor') as HTMLIFrameElement;
        const afterButton = document.getElementById('after') as HTMLButtonElement;
        const focusSpy = vi.spyOn(afterButton, 'focus');

        expect(focusAdjacentDocumentTabStop(anchor, false)).toBe(true);
        expect(focusSpy).toHaveBeenCalledOnce();
    });

    it('skips candidates with display:none', () => {
        document.body.innerHTML = `
            <iframe id="anchor" tabindex="-1"></iframe>
            <button id="display-none" type="button" style="display: none">Hidden</button>
            <button id="after" type="button">After</button>
        `;

        const anchor = document.getElementById('anchor') as HTMLIFrameElement;
        const afterButton = document.getElementById('after') as HTMLButtonElement;
        const focusSpy = vi.spyOn(afterButton, 'focus');

        expect(focusAdjacentDocumentTabStop(anchor, false)).toBe(true);
        expect(focusSpy).toHaveBeenCalledOnce();
    });

    it('skips candidates with visibility:hidden', () => {
        document.body.innerHTML = `
            <iframe id="anchor" tabindex="-1"></iframe>
            <button id="invisible" type="button" style="visibility: hidden">Hidden</button>
            <button id="after" type="button">After</button>
        `;

        const anchor = document.getElementById('anchor') as HTMLIFrameElement;
        const afterButton = document.getElementById('after') as HTMLButtonElement;
        const focusSpy = vi.spyOn(afterButton, 'focus');

        expect(focusAdjacentDocumentTabStop(anchor, false)).toBe(true);
        expect(focusSpy).toHaveBeenCalledOnce();
    });
});
