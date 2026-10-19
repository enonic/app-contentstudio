import { cn } from '@enonic/ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { createContext, forwardRef, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    Group,
    Panel as GroupPanel,
    Separator,
    type GroupImperativeHandle,
    type GroupProps,
    type Layout,
    type Orientation,
    type PanelImperativeHandle,
    type PanelProps as GroupPanelProps,
    type SeparatorProps,
} from 'react-resizable-panels';
import { useI18n } from '../../lib/hooks/useI18n';

//
// * Context
//

// Called by Root after every layout change so panels can detect collapse transitions.
type PanelLayoutSync = (isUserInteraction: boolean) => void;

type SplitViewContextValue = {
    orientation: Orientation;
    registerPanel: (sync: PanelLayoutSync) => () => void;
};

const SplitViewContext = createContext<SplitViewContextValue>({
    orientation: 'horizontal',
    registerPanel: () => () => undefined,
});

//
// * SplitView.Root
//

const haveSamePanels = (a: Layout, b: Layout): boolean => {
    const aKeys = Object.keys(a);
    return aKeys.length === Object.keys(b).length && aKeys.every((key) => key in b);
};

const haveSameIds = (a: string[] | undefined, b: string[] | undefined): boolean =>
    a === b || (a != null && b != null && a.length === b.length && a.every((id, index) => id === b[index]));

const toStorageKey = (storageId: string, panelIds: string[] | undefined): string =>
    ['react-resizable-panels', storageId, ...(panelIds ?? [])].join(':');

const readStoredLayout = (key: string | undefined): Layout | undefined => {
    if (key == null) return undefined;
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
        if (parsed == null || typeof parsed !== 'object') return undefined;
        const layout: Layout = {};
        for (const [id, size] of Object.entries(parsed)) {
            if (typeof size !== 'number') return undefined;
            layout[id] = size;
        }
        return layout;
    } catch {
        return undefined;
    }
};

const writeStoredLayout = (key: string, layout: Layout): void => {
    try {
        localStorage.setItem(key, JSON.stringify(layout));
    } catch (error) {
        console.error(error);
    }
};

export type SplitViewRootProps = {
    // Persists the layout to localStorage under this id; omit to disable persistence.
    storageId?: string;
    // Ids of the panels the user sees right now, in group order: mounted and not
    // collapsed. Each distinct set keeps its own persisted layout, and a change of
    // the set restores that layout or, when there is none, asks the resolver.
    // Must be referentially stable between renders.
    panelIds?: string[];
    // Called when the set of panels changes and no layout is stored for the new set.
    resolveLayoutOnPanelsChange?: (previous: Layout, next: Layout) => Layout | undefined;
} & Omit<GroupProps, 'defaultLayout' | 'onLayoutChange'>;

const SplitViewRoot = forwardRef<HTMLDivElement, SplitViewRootProps>(
    (
        {
            orientation = 'horizontal',
            storageId,
            panelIds,
            resolveLayoutOnPanelsChange,
            onLayoutChanged,
            groupRef,
            className,
            children,
            ...props
        },
        ref,
    ) => {
        const [isDragging, setIsDragging] = useState(false);
        const panelSyncs = useRef(new Set<PanelLayoutSync>());
        const groupHandleRef = useRef<GroupImperativeHandle | null>(null);
        const lastLayoutRef = useRef<Layout | undefined>(undefined);
        const lastPanelIdsRef = useRef<string[] | undefined>(undefined);
        const resolvePendingRef = useRef(false);
        const resolveLayoutRef = useRef(resolveLayoutOnPanelsChange);
        resolveLayoutRef.current = resolveLayoutOnPanelsChange;
        const panelIdsRef = useRef(panelIds);
        panelIdsRef.current = panelIds;
        const storageKey = storageId != null ? toStorageKey(storageId, panelIds) : undefined;
        const storageKeyRef = useRef(storageKey);
        storageKeyRef.current = storageKey;
        const storedLayout = useMemo(() => readStoredLayout(storageKey), [storageKey]);
        useEffect(
            () => () => {
                resolvePendingRef.current = false;
            },
            [],
        );

        const composedGroupRef = useCallback(
            (handle: GroupImperativeHandle | null) => {
                groupHandleRef.current = handle;
                if (typeof groupRef === 'function') groupRef(handle);
                else if (groupRef != null) groupRef.current = handle;
            },
            [groupRef],
        );

        const registerPanel = useCallback((sync: PanelLayoutSync) => {
            panelSyncs.current.add(sync);
            return () => panelSyncs.current.delete(sync);
        }, []);

        const contextValue = useMemo(() => ({ orientation, registerPanel }), [orientation, registerPanel]);

        const handleLayoutChanged: GroupProps['onLayoutChanged'] = (layout, meta) => {
            const previous = lastLayoutRef.current;
            const previousIds = lastPanelIdsRef.current;
            lastLayoutRef.current = layout;
            lastPanelIdsRef.current = panelIdsRef.current;

            const panelsChanged =
                previous != null &&
                (!haveSamePanels(previous, layout) || !haveSameIds(previousIds, panelIdsRef.current));
            // ! Deferred out of the library's layout effect, but still before paint.
            if (panelsChanged && !resolvePendingRef.current) {
                resolvePendingRef.current = true;
                queueMicrotask(() => {
                    if (!resolvePendingRef.current) return;
                    resolvePendingRef.current = false;
                    const handle = groupHandleRef.current;
                    if (handle == null) return;
                    const current = handle.getLayout();
                    lastLayoutRef.current = current;
                    if (haveSamePanels(previous, current) && haveSameIds(previousIds, panelIdsRef.current)) return;
                    const stored = readStoredLayout(storageKeyRef.current);
                    const resolved =
                        stored != null && haveSamePanels(stored, current)
                            ? stored
                            : resolveLayoutRef.current?.(previous, current);
                    if (resolved == null) return;
                    handle.setLayout(resolved);
                    // ! The library skips the report when the layout equals the last reported one,
                    // so a controlled panel the applied layout collapsed is re-synced here.
                    panelSyncs.current.forEach((sync) => sync(false));
                    lastLayoutRef.current = handle.getLayout();
                });
            }

            if (storageKey != null && meta.isUserInteraction) {
                writeStoredLayout(storageKey, meta.requestedLayout ?? layout);
            }
            onLayoutChanged?.(layout, meta);
            panelSyncs.current.forEach((sync) => sync(meta.isUserInteraction));
        };

        const stopDraggingRef = useRef<(() => void) | undefined>(undefined);
        useEffect(() => () => stopDraggingRef.current?.(), []);

        // Pointer events over an iframe never reach this document, so a drag would freeze
        // there; while dragging, a shield overlay and pointer-events lock keep them out.
        const handlePointerDownCapture = (event: { target: EventTarget | null; pointerId: number }): void => {
            const target = event.target;
            if (!(target instanceof Element) || target.closest('[data-separator]') == null) return;

            const { pointerId } = event;
            const stopDragging = (): void => {
                window.removeEventListener('pointerup', handleStop);
                window.removeEventListener('pointercancel', handleStop);
                stopDraggingRef.current = undefined;
                setIsDragging(false);
            };
            // ! Only this drag's pointer may end it: a stray pointercancel from another
            // pointer (touch gesture, palm) must not drop the shield mid-drag.
            const handleStop = (stopEvent: PointerEvent): void => {
                if (stopEvent.pointerId !== pointerId) return;
                stopDragging();
            };

            stopDraggingRef.current?.();
            stopDraggingRef.current = stopDragging;
            setIsDragging(true);
            window.addEventListener('pointerup', handleStop);
            window.addEventListener('pointercancel', handleStop);
        };

        return (
            <SplitViewContext.Provider value={contextValue}>
                <Group
                    data-component="SplitView.Root"
                    data-dragging={isDragging || undefined}
                    orientation={orientation}
                    elementRef={ref}
                    groupRef={composedGroupRef}
                    defaultLayout={storedLayout}
                    onLayoutChanged={handleLayoutChanged}
                    onPointerDownCapture={handlePointerDownCapture}
                    className={cn('relative', String.raw`[&[data-dragging]_iframe]:pointer-events-none`, className)}
                    {...props}
                >
                    {children}
                    {isDragging && <div data-component="SplitView.DragShield" className="absolute inset-0 z-50" />}
                </Group>
            </SplitViewContext.Provider>
        );
    },
);
SplitViewRoot.displayName = 'SplitView.Root';

//
// * SplitView.Panel
//

export type SplitViewPanelProps = {
    // Controlled collapse; drives the imperative collapse()/expand() API.
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
} & GroupPanelProps;

const SplitViewPanel = forwardRef<HTMLDivElement, SplitViewPanelProps>(
    ({ collapsed, onCollapsedChange, panelRef, ...props }, ref) => {
        const { registerPanel } = useContext(SplitViewContext);
        const innerRef = useRef<PanelImperativeHandle | null>(null);
        const lastCollapsed = useRef<boolean | undefined>(undefined);
        // The prop, or the user's drag or keyboard collapse since the prop last changed.
        const intendedCollapsed = useRef(collapsed);
        const lastCollapsedProp = useRef(collapsed);
        if (lastCollapsedProp.current !== collapsed) {
            lastCollapsedProp.current = collapsed;
            intendedCollapsed.current = collapsed;
        }
        const onCollapsedChangeRef = useRef(onCollapsedChange);
        onCollapsedChangeRef.current = onCollapsedChange;

        const composedPanelRef = useCallback(
            (handle: PanelImperativeHandle | null) => {
                innerRef.current = handle;
                if (typeof panelRef === 'function') panelRef(handle);
                else if (panelRef != null) panelRef.current = handle;
            },
            [panelRef],
        );

        const syncCollapsed = useCallback((isUserInteraction: boolean) => {
            const handle = innerRef.current;
            if (handle == null) return;

            const isNowCollapsed = handle.isCollapsed();

            const intended = intendedCollapsed.current;
            if (intended != null) {
                if (isUserInteraction) {
                    intendedCollapsed.current = isNowCollapsed;
                } else if (intended !== isNowCollapsed) {
                    if (intended) handle.collapse();
                    else handle.expand();
                    return;
                }
            }

            if (lastCollapsed.current === isNowCollapsed) return;

            const isFirstReport = lastCollapsed.current === undefined;
            lastCollapsed.current = isNowCollapsed;
            if (!isFirstReport) onCollapsedChangeRef.current?.(isNowCollapsed);
        }, []);

        useEffect(() => {
            // The mount layout event precedes this effect, so the baseline is read here;
            // a controlled panel trusts its prop over a possibly not-yet-measured group.
            if (lastCollapsed.current === undefined && innerRef.current != null) {
                lastCollapsed.current = collapsed ?? innerRef.current.isCollapsed();
            }
            return registerPanel(syncCollapsed);
            // `collapsed` seeds the baseline only, so it is not a dependency.
        }, [registerPanel, syncCollapsed]);

        useEffect(() => {
            const handle = innerRef.current;
            if (handle == null || collapsed == null) return;

            if (collapsed && !handle.isCollapsed()) handle.collapse();
            else if (!collapsed && handle.isCollapsed()) handle.expand();
        }, [collapsed]);

        return <GroupPanel data-component="SplitView.Panel" elementRef={ref} panelRef={composedPanelRef} {...props} />;
    },
);
SplitViewPanel.displayName = 'SplitView.Panel';

//
// * SplitView.Handle
//

const handleVariants = cva(
    [
        'bg-bdr-soft transition-colors',
        'data-[separator=active]:bg-bdr-select hover:bg-bdr-select',
        'focus-visible:ring-3 focus-visible:ring-ring focus-visible:z-10',
    ],
    {
        variants: {
            variant: {
                default: '',
                thin: '',
            },
            orientation: {
                horizontal: '',
                vertical: '',
            },
        },
        compoundVariants: [
            { variant: 'default', orientation: 'horizontal', className: 'w-1.25' },
            { variant: 'thin', orientation: 'horizontal', className: 'w-px' },
            { variant: 'default', orientation: 'vertical', className: 'h-1.25' },
            { variant: 'thin', orientation: 'vertical', className: 'h-px' },
        ],
        defaultVariants: {
            variant: 'default',
        },
    },
);

export type SplitViewHandleProps = Pick<VariantProps<typeof handleVariants>, 'variant'> & SeparatorProps;

const SplitViewHandle = forwardRef<HTMLDivElement, SplitViewHandleProps>(
    ({ variant, className, 'aria-label': ariaLabel, ...props }, ref) => {
        const { orientation } = useContext(SplitViewContext);
        const defaultLabel = useI18n('field.splitView.resize');

        return (
            <Separator
                data-component="SplitView.Handle"
                elementRef={ref}
                aria-label={ariaLabel ?? defaultLabel}
                className={cn(handleVariants({ variant, orientation }), className)}
                {...props}
            />
        );
    },
);
SplitViewHandle.displayName = 'SplitView.Handle';

//
// * SplitView
//

export const SplitView = Object.assign(SplitViewRoot, {
    Root: SplitViewRoot,
    Panel: SplitViewPanel,
    Handle: SplitViewHandle,
});
