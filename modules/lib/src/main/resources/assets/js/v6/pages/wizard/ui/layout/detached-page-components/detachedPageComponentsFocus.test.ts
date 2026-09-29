import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    CONTENT_FORM_TOGGLE_NAME,
    DETACHED_PAGE_COMPONENTS_PANEL_ID,
    focusContentFormToggle,
    focusDetachedPageComponentsList,
} from './detachedPageComponentsFocus';

describe('detachedPageComponentsFocus', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    function renderPanel(content: string): HTMLElement {
        document.body.innerHTML = `
            <div id="${DETACHED_PAGE_COMPONENTS_PANEL_ID}">
                <button data-detached-page-components-close>Close</button>
                <div data-resize-region="content">${content}</div>
            </div>
        `;

        return document.querySelector<HTMLElement>('[data-detached-page-components-close]')!;
    }

    it('should focus the requested list edge', () => {
        renderPanel(`
            <div role="treeitem" tabindex="-1">First</div>
            <div role="treeitem" tabindex="-1">Last</div>
        `);
        const rows = document.querySelectorAll<HTMLElement>('[role="treeitem"]');

        expect(focusDetachedPageComponentsList('first')).toBe(true);
        expect(document.activeElement).toBe(rows[0]);

        expect(focusDetachedPageComponentsList('last')).toBe(true);
        expect(document.activeElement).toBe(rows[1]);
    });

    it('should return to the current tree tab stop', () => {
        renderPanel(`
            <div role="treeitem" tabindex="-1">First</div>
            <div role="treeitem" tabindex="0">Selected</div>
            <div role="treeitem" tabindex="-1">Last</div>
        `);
        const rows = document.querySelectorAll<HTMLElement>('[role="treeitem"]');

        expect(focusDetachedPageComponentsList()).toBe(true);
        expect(document.activeElement).toBe(rows[1]);
    });

    it('should fall back to Close when the list is empty', () => {
        const close = renderPanel('');

        expect(focusDetachedPageComponentsList()).toBe(true);
        expect(document.activeElement).toBe(close);
    });

    it('should skip focus targets inside inert content', () => {
        const close = renderPanel(`
            <div inert>
                <div role="treeitem" tabindex="0">Locked</div>
                <button>Locked action</button>
            </div>
        `);

        expect(focusDetachedPageComponentsList()).toBe(true);
        expect(document.activeElement).toBe(close);
    });

    it('should focus the first visible matching target', () => {
        document.body.innerHTML = `
            <button data-component="${CONTENT_FORM_TOGGLE_NAME}">Hidden</button>
            <button data-component="${CONTENT_FORM_TOGGLE_NAME}">Visible</button>
        `;
        const buttons = document.querySelectorAll<HTMLElement>(`[data-component="${CONTENT_FORM_TOGGLE_NAME}"]`);
        vi.spyOn(buttons[0], 'getClientRects').mockReturnValue([] as unknown as DOMRectList);
        vi.spyOn(buttons[1], 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);

        expect(focusContentFormToggle()).toBe(true);
        expect(document.activeElement).toBe(buttons[1]);
    });
});
