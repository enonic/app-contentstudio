import { cn } from '@enonic/ui';
import { cva, type VariantProps } from 'class-variance-authority';
import {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Group,
    Panel as GroupPanel,
    Separator,
    useDefaultLayout,
    type GroupProps,
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
type PanelLayoutSync = () => void;

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

export type SplitViewRootProps = {
    // Persists the layout to localStorage under this id; omit to disable persistence.
    storageId?: string;
} & Omit<GroupProps, 'defaultLayout' | 'onLayoutChange'>;

const SplitViewRoot = forwardRef<HTMLDivElement, SplitViewRootProps>(
    ({ orientation = 'horizontal', storageId, onLayoutChanged, className, children, ...props }, ref) => {
        const fallbackId = useId();
        const [isDragging, setIsDragging] = useState(false);
        const panelSyncs = useRef(new Set<PanelLayoutSync>());

        const { defaultLayout, onLayoutChanged: persistLayout } = useDefaultLayout({
            id: storageId ?? fallbackId,
            onlySaveAfterUserInteractions: true,
        });

        const registerPanel = useCallback((sync: PanelLayoutSync) => {
            panelSyncs.current.add(sync);
            return () => panelSyncs.current.delete(sync);
        }, []);

        const contextValue = useMemo(() => ({ orientation, registerPanel }), [orientation, registerPanel]);

        const handleLayoutChanged: GroupProps['onLayoutChanged'] = (layout, meta) => {
            if (storageId != null) persistLayout(layout, meta);
            onLayoutChanged?.(layout, meta);
            panelSyncs.current.forEach((sync) => sync());
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
                    data-component='SplitView.Root'
                    data-dragging={isDragging || undefined}
                    orientation={orientation}
                    elementRef={ref}
                    defaultLayout={storageId != null ? defaultLayout : undefined}
                    onLayoutChanged={handleLayoutChanged}
                    onPointerDownCapture={handlePointerDownCapture}
                    className={cn('relative', String.raw`[&[data-dragging]_iframe]:pointer-events-none`, className)}
                    {...props}
                >
                    {children}
                    {isDragging && <div data-component='SplitView.DragShield' className='absolute inset-0 z-50' />}
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

        const syncCollapsed = useCallback(() => {
            const handle = innerRef.current;
            if (handle == null) return;

            const isNowCollapsed = handle.isCollapsed();
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

        return (
            <GroupPanel data-component='SplitView.Panel' elementRef={ref} panelRef={composedPanelRef} {...props} />
        );
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
                data-component='SplitView.Handle'
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
