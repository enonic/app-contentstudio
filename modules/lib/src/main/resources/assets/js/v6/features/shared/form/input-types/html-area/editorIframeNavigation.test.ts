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
});
