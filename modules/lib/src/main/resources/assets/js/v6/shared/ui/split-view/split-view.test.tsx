import { act, render, screen } from '@testing-library/preact';
import { createRef, type Ref } from 'react';
import { type GroupImperativeHandle, type PanelImperativeHandle } from 'react-resizable-panels';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SplitView } from './split-view';

// ? happy-dom has no layout engine: element geometry, ResizeObserver, and ARIA
// reflection (ariaDisabled must be null when unset) are stubbed below.
// react-resizable-panels sorts group children by offsetLeft and matches
// separators to panels by rect adjacency, so positions must be consistent.

const GROUP_SIZE = 1000;
const GROUP_HEIGHT = 500;
const PANEL_SIZE = 495;
const SEPARATOR_SIZE = 10;
const FALLBACK_SIZE = 100;

function sizeOf(element: Element): number {
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
        // Real ResizeObserver reports asynchronously, after mount completes.
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

type HarnessProps = {
    groupRef?: Ref<GroupImperativeHandle | null>;
    panelRef?: Ref<PanelImperativeHandle | null>;
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
    storageId?: string;
    handleLabel?: string;
    thin?: boolean;
};

const Harness = ({ groupRef, panelRef, collapsed, onCollapsedChange, storageId, handleLabel, thin }: HarnessProps) => (
    <SplitView id='root' groupRef={groupRef} storageId={storageId}>
        <SplitView.Panel
            id='first'
            defaultSize='38%'
            minSize='280px'
            collapsible
            collapsedSize='60px'
            collapsed={collapsed}
            onCollapsedChange={onCollapsedChange}
            panelRef={panelRef}
        >
            <div>first content</div>
        </SplitView.Panel>
        <SplitView.Handle id='handle' aria-label={handleLabel} variant={thin ? 'thin' : undefined} />
        <SplitView.Panel id='second'>
            <div>second content</div>
        </SplitView.Panel>
    </SplitView>
);
Harness.displayName = 'Harness';

async function renderHarness(props: HarnessProps = {}): Promise<ReturnType<typeof render>> {
    let result: ReturnType<typeof render> | undefined;
    await act(async () => {
        result = render(<Harness {...props} />);
    });
    if (result === undefined) throw new Error('render did not complete');
    return result;
}

async function rerenderHarness(result: ReturnType<typeof render>, props: HarnessProps): Promise<void> {
    await act(async () => {
        result.rerender(<Harness {...props} />);
    });
}

describe('SplitView', () => {
    beforeEach(() => {
        stubLayout();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        window.localStorage.clear();
    });

    it('renders the compound structure with data-component attributes', async () => {
        await renderHarness();

        expect(screen.getByText('first content')).toBeTruthy();
        expect(screen.getByText('second content')).toBeTruthy();
        expect(screen.getByTestId('root').getAttribute('data-component')).toBe('SplitView.Root');
        expect(screen.getByTestId('first').getAttribute('data-component')).toBe('SplitView.Panel');
        expect(screen.getByTestId('handle').getAttribute('data-component')).toBe('SplitView.Handle');
    });

    it('renders the ARIA window-splitter pattern on the handle', async () => {
        await renderHarness();

        const handle = screen.getByRole('separator');

        expect(handle.getAttribute('tabindex')).toBe('0');
        expect(handle.getAttribute('aria-valuenow')).not.toBeNull();
        expect(handle.getAttribute('aria-valuemin')).not.toBeNull();
        expect(handle.getAttribute('aria-valuemax')).not.toBeNull();
    });

    it('labels the handle with the i18n fallback and accepts an override', async () => {
        const first = await renderHarness();
        expect(screen.getByRole('separator').getAttribute('aria-label')).toBe('#field.splitView.resize#');

        first.unmount();
        await renderHarness({ handleLabel: 'Resize form' });
        expect(screen.getByRole('separator').getAttribute('aria-label')).toBe('Resize form');
    });

    it('applies handle variants: default is 5px, thin is 1px', async () => {
        const first = await renderHarness();
        expect(screen.getByTestId('handle').className).toContain('w-1.25');

        first.unmount();
        await renderHarness({ thin: true });
        expect(screen.getByTestId('handle').className).toContain('w-px');
    });

    it('passes pixel constraints through and applies the default layout', async () => {
        const groupRef = createRef<GroupImperativeHandle>();

        await renderHarness({ groupRef });

        expect(groupRef.current?.getLayout().first).toBeCloseTo(38, 0);
    });

    it('resizes panels with the keyboard', async () => {
        const groupRef = createRef<GroupImperativeHandle>();

        await renderHarness({ groupRef });

        const handle = screen.getByRole('separator');
        const before = groupRef.current?.getLayout().first;

        await act(async () => {
            handle.focus();
            handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        });

        expect(groupRef.current?.getLayout().first).not.toBe(before);
    });

    it('collapses and expands through the controlled collapsed prop', async () => {
        const panelRef = createRef<PanelImperativeHandle>();
        const onCollapsedChange = vi.fn();

        const result = await renderHarness({ panelRef, collapsed: false, onCollapsedChange });
        expect(panelRef.current?.isCollapsed()).toBe(false);

        await rerenderHarness(result, { panelRef, collapsed: true, onCollapsedChange });
        expect(panelRef.current?.isCollapsed()).toBe(true);
        expect(onCollapsedChange).toHaveBeenLastCalledWith(true);

        await rerenderHarness(result, { panelRef, collapsed: false, onCollapsedChange });
        expect(panelRef.current?.isCollapsed()).toBe(false);
        expect(onCollapsedChange).toHaveBeenLastCalledWith(false);
    });

    it('shows the drag shield and dragging attribute only while dragging', async () => {
        await renderHarness();

        const root = screen.getByTestId('root');
        const shieldSelector = '[data-component="SplitView.DragShield"]';

        expect(root.querySelector(shieldSelector)).toBeNull();
        expect(root.hasAttribute('data-dragging')).toBe(false);

        await act(async () => {
            screen.getByTestId('handle').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        });

        expect(root.querySelector(shieldSelector)).not.toBeNull();
        expect(root.hasAttribute('data-dragging')).toBe(true);

        await act(async () => {
            // Dispatched on document so it reaches both the library's document-level
            // listeners and the component's window listener via bubbling.
            document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        });

        expect(root.querySelector(shieldSelector)).toBeNull();
        expect(root.hasAttribute('data-dragging')).toBe(false);
    });

    it('persists the layout under the storageId after a user resize', async () => {
        await renderHarness({ storageId: 'test-split' });

        await act(async () => {
            const handle = screen.getByRole('separator');
            handle.focus();
            handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        });

        expect(window.localStorage.getItem('react-resizable-panels:test-split')).not.toBeNull();
    });

    it('does not persist anything without a storageId', async () => {
        await renderHarness();

        await act(async () => {
            const handle = screen.getByRole('separator');
            handle.focus();
            handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        });

        expect(window.localStorage.length).toBe(0);
    });
});
