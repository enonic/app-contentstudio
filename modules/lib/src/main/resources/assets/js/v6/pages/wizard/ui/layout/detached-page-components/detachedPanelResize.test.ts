import { describe, expect, it } from 'vitest';
import {
    clampPanelPosition,
    getViewportBounds,
    resizePanelToHeight,
    type VerticalResizeSnapshot,
    type ViewportBounds,
} from './detachedPanelResize';

const VIEWPORT: ViewportBounds = { top: 0, right: 800, bottom: 600, left: 0 };

describe('detachedPanelResize', () => {
    it('clamps panel position inside the viewport', () => {
        const panel = { width: 300, height: 200 };
        expect(clampPanelPosition({ top: -20, left: -10 }, panel, VIEWPORT)).toEqual({ top: 0, left: 0 });
        expect(clampPanelPosition({ top: 500, left: 700 }, panel, VIEWPORT)).toEqual({ top: 400, left: 500 });
    });

    it.each([
        ['top', 350, { top: 50, height: 350 }],
        ['top', 50, { top: 240, height: 160 }],
        ['top', 1000, { top: 0, height: 400 }],
        ['bottom', 350, { top: 100, height: 350 }],
        ['bottom', 50, { top: 100, height: 160 }],
        ['bottom', 1000, { top: 100, height: 500 }],
    ] as const)('resizes from the %s edge to %dpx', (edge, desiredHeight, expected) => {
        expect(resizePanelToHeight({ edge, startTop: 100, startHeight: 300 }, desiredHeight, VIEWPORT)).toEqual(
            expected,
        );
    });

    it('uses automatic height only when natural content height limits resizing', () => {
        expect(resizePanelToHeight({ edge: 'bottom', startTop: 100, startHeight: 200 }, 400, VIEWPORT, 275)).toEqual({
            top: 100,
            height: undefined,
        });
        expect(resizePanelToHeight({ edge: 'top', startTop: 300, startHeight: 300 }, 700, VIEWPORT, 700)).toEqual({
            top: 0,
            height: 600,
        });
    });

    it('uses visual viewport bounds when available', () => {
        const currentWindow = {
            innerHeight: 800,
            innerWidth: 1000,
            visualViewport: { offsetLeft: 10, offsetTop: 20, width: 500, height: 300 },
        } as unknown as Window;
        expect(getViewportBounds(currentWindow)).toEqual({ top: 20, right: 510, bottom: 320, left: 10 });
    });
});
