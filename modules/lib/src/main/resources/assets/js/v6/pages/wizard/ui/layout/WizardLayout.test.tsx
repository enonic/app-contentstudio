import { DivEl } from '@enonic/lib-admin-ui/dom/DivEl';
import { act, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setFloatingContextWidth } from '../../../../widgets/context-panel/model/floatingContextWidth.store';
import { setContextOpen } from '../../../../widgets/context-panel/model/contextWidgets.store';
import { setContentFormExpanded } from '../../model/wizardContent.store';
import { setWizardLayoutMetrics, setWizardViewMode } from '../../model/wizardLayout.store';
import { WizardLayout } from './WizardLayout';

// Layout-engine stubs (happy-dom has none); see split-view.test.tsx for details.

let layoutRootWidth = 2000;

const GROUP_SIZE = 1000;
const GROUP_HEIGHT = 500;
const PANEL_SIZE = 495;
const SEPARATOR_SIZE = 10;
const FALLBACK_SIZE = 100;

function isLayoutRoot(element: Element): boolean {
    return element.getAttribute('data-component') === 'WizardLayout';
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
    formPanel: DivEl;
    livePanel: DivEl;
    contextPanel: DivEl;
};

function createPanels(): Panels {
    return {
        formPanel: new DivEl('legacy-form'),
        livePanel: new DivEl('legacy-live'),
        contextPanel: new DivEl('legacy-context'),
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
        render(<WizardLayout {...panels} />);
    });
    await settle();
}

describe('WizardLayout', () => {
    beforeEach(() => {
        stubLayout();
        layoutRootWidth = 2000;
        setWizardViewMode('split');
        setContentFormExpanded(true);
        setContextOpen(false);
        setFloatingContextWidth(0);
        setWizardLayoutMetrics({ totalWidth: 0, contextWidth: 0 });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        window.localStorage.clear();
    });

    it('hosts form and live panels in a split view', async () => {
        const panels = createPanels();

        await renderLayout(panels);

        expect(screen.getByTestId('form').querySelector('.legacy-form')).toBe(panels.formPanel.getHTMLElement());
        expect(screen.getByTestId('live').querySelector('.legacy-live')).toBe(panels.livePanel.getHTMLElement());
        expect(document.querySelector('.legacy-context')).toBeNull();
    });

    it('collapses the live panel in form mode and unmounts the handle', async () => {
        setWizardViewMode('form');
        const panels = createPanels();

        await renderLayout(panels);

        const live = screen.getByTestId('live');
        expect(live.getAttribute('data-panel')).not.toBeNull();
        expect(live.querySelector('.legacy-live')).toBe(panels.livePanel.getHTMLElement());

        expect(document.querySelector('[data-testid="form-live-handle"]')).toBeNull();
    });

    it('keeps the live panel mounted when switching modes', async () => {
        const panels = createPanels();

        await renderLayout(panels);
        const liveElement = panels.livePanel.getHTMLElement();
        expect(screen.getByTestId('live').contains(liveElement)).toBe(true);

        await act(async () => setWizardViewMode('form'));
        await settle();
        expect(screen.getByTestId('live').contains(liveElement)).toBe(true);
    });

    it('docks the context panel when open on wide screens', async () => {
        setContextOpen(true);
        const panels = createPanels();

        await renderLayout(panels);

        expect(screen.getByTestId('context').querySelector('.legacy-context')).toBe(
            panels.contextPanel.getHTMLElement(),
        );
    });

    it('floats the context panel on narrow screens', async () => {
        layoutRootWidth = 1600;
        setContextOpen(true);
        const panels = createPanels();

        await renderLayout(panels);

        const overlay = document.querySelector('[data-component="FloatingContextPanel"]');
        expect(overlay).not.toBeNull();
        expect(overlay?.querySelector('.legacy-context')).toBe(panels.contextPanel.getHTMLElement());
    });

    it('keeps the split view mounted in mobile mode', async () => {
        layoutRootWidth = 700;
        setWizardViewMode('live');
        const panels = createPanels();

        await renderLayout(panels);

        expect(document.querySelector('[data-group]')).not.toBeNull();
        expect(screen.getByTestId('live').querySelector('.legacy-live')).toBe(panels.livePanel.getHTMLElement());
        expect(document.querySelector('[data-testid="form-live-handle"]')).toBeNull();

        await act(async () => setContextOpen(true));
        await settle();
        expect(document.querySelector('[data-component="WizardLayout.MobileContext"]')).not.toBeNull();
    });

    it('keeps the live panel hosted through mode changes', async () => {
        const panels = createPanels();

        await renderLayout(panels);
        const liveElement = panels.livePanel.getHTMLElement();
        const liveHost = liveElement.parentElement;
        expect(liveHost).not.toBeNull();

        await act(async () => setWizardLayoutMetrics({ totalWidth: 700, contextWidth: 360 }));
        await settle();
        expect(liveElement.parentElement).toBe(liveHost);
        expect(liveElement.isConnected).toBe(true);

        await act(async () => setWizardLayoutMetrics({ totalWidth: 2000, contextWidth: 360 }));
        await settle();
        expect(liveElement.parentElement).toBe(liveHost);
        expect(liveElement.isConnected).toBe(true);
    });
});
