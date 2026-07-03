import { DivEl } from '@enonic/lib-admin-ui/dom/DivEl';
import { act, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setContextOpen } from '../../../widgets/context-panel/model/contextWidgets.store';
import { setContextLayoutMetrics } from '../../../widgets/context-panel/model/contextPanelMode.store';
import { setFloatingContextWidth, setMobilePreviewOpen } from '../model/browseLayout.store';
import { setContentFilterOpen } from '../../../features/search/model/contentFilter.store';
import { BrowseLayout } from './BrowseLayout';

// Layout-engine stubs (happy-dom has none); see split-view.test.tsx for details.
// The BrowseLayout root width is parametrized per test to drive the mode store.

let layoutRootWidth = 2000;

const GROUP_SIZE = 1000;
const GROUP_HEIGHT = 500;
const PANEL_SIZE = 495;
const SEPARATOR_SIZE = 10;
const FALLBACK_SIZE = 100;

function isLayoutRoot(element: Element): boolean {
    return element.getAttribute('data-component') === 'BrowseLayout';
}

function sizeOf(element: Element): number {
    if (isLayoutRoot(element)) return layoutRootWidth;
    if (element.hasAttribute('data-group')) return GROUP_SIZE;
    if (element.hasAttribute('data-panel')) return PANEL_SIZE;
    if (element.hasAttribute('data-separator')) return SEPARATOR_SIZE;
    return FALLBACK_SIZE;
}

function rectOf(element: Element): DOMRect {
    const isGroupChild = element.hasAttribute('data-panel') || element.hasAttribute('data-separator');
    if (!isGroupChild) return new DOMRect(0, 0, sizeOf(element), GROUP_HEIGHT);

    let left = 0;
    let sibling = element.previousElementSibling;
    while (sibling != null) {
        left += sizeOf(sibling);
        sibling = sibling.previousElementSibling;
    }

    return new DOMRect(left, 0, sizeOf(element), GROUP_HEIGHT);
}

type ObservedEntry = {
    target: Element;
    borderBoxSize: { inlineSize: number; blockSize: number }[];
    contentRect: DOMRect;
};

class MockResizeObserver {
    private readonly callback: (entries: ObservedEntry[], observer: MockResizeObserver) => void;

    constructor(callback: (entries: ObservedEntry[], observer: MockResizeObserver) => void) {
        this.callback = callback;
    }

    observe(target: Element): void {
        const size = sizeOf(target);
        queueMicrotask(() => {
            this.callback(
                [
                    {
                        target,
                        borderBoxSize: [{ inlineSize: size, blockSize: size }],
                        contentRect: new DOMRect(0, 0, size, size),
                    },
                ],
                this,
            );
        });
    }

    unobserve(): void {
        /* empty */
    }

    disconnect(): void {
        /* empty */
    }
}

function stubLayout(): void {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);

    Object.defineProperty(Element.prototype, 'ariaDisabled', {
        configurable: true,
        get(this: Element) {
            return this.getAttribute('aria-disabled');
        },
    });

    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        return rectOf(this);
    });

    for (const property of ['offsetWidth', 'offsetHeight']) {
        Object.defineProperty(HTMLElement.prototype, property, {
            configurable: true,
            get(this: HTMLElement) {
                return sizeOf(this);
            },
        });
    }

    for (const [property, axis] of [['offsetLeft', 'x'], ['offsetTop', 'y']] as const) {
        Object.defineProperty(HTMLElement.prototype, property, {
            configurable: true,
            get(this: HTMLElement) {
                return rectOf(this)[axis];
            },
        });
    }
}

type Panels = {
    gridPanel: DivEl;
    previewPanel: DivEl;
    contextPanel: DivEl;
    filterPanel: DivEl;
};

function createPanels(): Panels {
    return {
        gridPanel: new DivEl('legacy-grid'),
        previewPanel: new DivEl('legacy-preview'),
        contextPanel: new DivEl('legacy-context'),
        filterPanel: new DivEl('legacy-filter'),
    };
}

// useStore batches rerenders via setTimeout, so store-driven updates need a macrotask tick.
async function settle(): Promise<void> {
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
    });
}

async function renderLayout(panels: Panels): Promise<void> {
    await act(async () => {
        render(<BrowseLayout {...panels} />);
    });
    await settle();
}

describe('BrowseLayout', () => {
    beforeEach(() => {
        stubLayout();
        layoutRootWidth = 2000;
        setContextOpen(false);
        setContentFilterOpen(false);
        setMobilePreviewOpen(false);
        setFloatingContextWidth(360);
        setContextLayoutMetrics({ totalWidth: 0, contextWidth: 0 });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        window.localStorage.clear();
    });

    it('hosts grid and preview panels in a split view with a thin handle', async () => {
        const panels = createPanels();

        await renderLayout(panels);

        const root = screen.getByTestId('grid').closest('[data-group]');
        expect(root).not.toBeNull();
        expect(screen.getByTestId('grid').querySelector('.legacy-grid')).toBe(panels.gridPanel.getHTMLElement());
        expect(screen.getByTestId('preview').querySelector('.legacy-preview')).toBe(
            panels.previewPanel.getHTMLElement(),
        );
        expect(screen.getByRole('separator')).toBeTruthy();
        expect(document.querySelector('.legacy-context')).toBeNull();
    });

    it('docks the context panel into the split view on wide screens', async () => {
        const panels = createPanels();
        setContextOpen(true);

        await renderLayout(panels);

        expect(screen.getByTestId('context').querySelector('.legacy-context')).toBe(
            panels.contextPanel.getHTMLElement(),
        );
        expect(document.querySelector('[data-component="BrowseLayout.FloatingContext"]')).toBeNull();
    });

    it('floats the context panel as an overlay on narrow screens', async () => {
        layoutRootWidth = 1400;
        const panels = createPanels();
        setContextOpen(true);

        await renderLayout(panels);

        const overlay = document.querySelector('[data-component="BrowseLayout.FloatingContext"]');
        expect(overlay).not.toBeNull();
        expect(overlay?.querySelector('.legacy-context')).toBe(panels.contextPanel.getHTMLElement());
        expect(document.querySelector('[data-testid="context"]')).toBeNull();
    });

    it('resizes the floating context panel with the keyboard', async () => {
        layoutRootWidth = 1400;
        const panels = createPanels();
        setContextOpen(true);

        await renderLayout(panels);

        const handle = document.querySelector('[data-component="BrowseLayout.FloatingContext"] [role="separator"]');
        expect(handle).not.toBeNull();
        if (!(handle instanceof HTMLElement)) throw new Error('no handle');

        const before = Number(handle.getAttribute('aria-valuenow'));

        await act(async () => {
            handle.focus();
            handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
        });
        await settle();

        const handleAfter = document.querySelector(
            '[data-component="BrowseLayout.FloatingContext"] [role="separator"]',
        );
        expect(Number(handleAfter?.getAttribute('aria-valuenow'))).toBeGreaterThan(before);
    });

    it('renders the mobile overlay stack below the mobile threshold', async () => {
        layoutRootWidth = 700;
        const panels = createPanels();

        await renderLayout(panels);

        const preview = document.querySelector('[data-component="BrowseLayout.MobilePreview"]');
        expect(preview).not.toBeNull();
        expect(preview?.className).toContain('translate-x-full');
        expect(document.querySelector('[data-group]')).toBeNull();

        await act(async () => setMobilePreviewOpen(true));
        await settle();
        expect(preview?.className).toContain('translate-x-0');
    });

    it('mounts the filter as a resizable split panel when opened', async () => {
        const panels = createPanels();

        await renderLayout(panels);
        expect(document.querySelector('.legacy-filter')).toBeNull();

        await act(async () => setContentFilterOpen(true));
        await settle();

        expect(screen.getByTestId('filter').querySelector('.legacy-filter')).toBe(
            panels.filterPanel.getHTMLElement(),
        );
        expect(document.querySelector('[data-testid="filter-handle"]')).not.toBeNull();

        await act(async () => setContentFilterOpen(false));
        await settle();
        expect(document.querySelector('.legacy-filter')).toBeNull();
    });

    it('shows the filter as a fullscreen overlay in mobile mode', async () => {
        layoutRootWidth = 700;
        const panels = createPanels();
        setContentFilterOpen(true);

        await renderLayout(panels);

        const overlay = document.querySelector('[data-component="BrowseLayout.MobileFilter"]');
        expect(overlay).not.toBeNull();
        expect(overlay?.querySelector('.legacy-filter')).toBe(panels.filterPanel.getHTMLElement());
    });

    it('reacts to context open toggling', async () => {
        const panels = createPanels();

        await renderLayout(panels);
        expect(document.querySelector('.legacy-context')).toBeNull();

        await act(async () => setContextOpen(true));
        await settle();
        expect(screen.getByTestId('context').querySelector('.legacy-context')).not.toBeNull();

        await act(async () => setContextOpen(false));
        await settle();
        expect(document.querySelector('.legacy-context')).toBeNull();
    });
});
