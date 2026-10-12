import { type Action } from '@enonic/lib-admin-ui/ui/Action';
import { cn } from '@enonic/ui';
import { type ReactElement, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getIsElementVisible } from '../../shared/lib/dom/getIsElementVisible';
import { createThrottle } from '../../shared/lib/timing/createThrottle';
import { ActionGroup } from './ActionGroup';
import { calculateVisibleActionCount, getOverflowLayout } from './OverflowActionRow.utils';
import { SplitActionButton } from './SplitActionButton';
import { ToolbarActionButton } from './ToolbarActionButton';
import { useObservedActions } from './useObservedActions';

export type OverflowActionRowItem = {
    id: string;
    action: Action;
    /** When this item overflows, the highest rank takes the split button's main slot. */
    primaryRank?: number;
};

type Props = {
    actions: OverflowActionRowItem[];
    className?: string;
};

const TOOLBAR_ACTION_GAP_PX = 8;

export const OverflowActionRow = ({ actions, className }: Props): ReactElement | null => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const actionButtonMeasureRefs = useRef<(HTMLDivElement | null)[]>([]);
    const splitButtonMeasureRefs = useRef<(HTMLDivElement | null)[]>([]);
    const observedActions = useMemo(() => actions.map(({ action }) => action), [actions]);
    const renderVersion = useObservedActions(observedActions);
    const visibleActions = useMemo(
        () => actions.filter(({ action }) => action.isVisible()),
        // ? `renderVersion` ticks when any observed action fires `onPropertyChanged`,
        // ? invalidating the visibility filter without reading the counter directly.
        [actions, renderVersion],
    );
    const visibleActionIds = useMemo(
        () => visibleActions.map(({ id, primaryRank }) => `${id}:${primaryRank ?? 0}`).join('|'),
        [visibleActions],
    );
    const visibleActionsRef = useRef(visibleActions);
    const [visibleActionsCount, setVisibleActionsCount] = useState(visibleActions.length);
    const [isContainerVisible, setIsContainerVisible] = useState(false);

    // Sync in useLayoutEffect so sibling layout effects below read the latest
    // visibleActions (useEffect runs after layout effects, which would leave
    // calculateVisibleActions reading a stale list on the first paint after a change).
    useLayoutEffect(() => {
        visibleActionsRef.current = visibleActions;
    }, [visibleActions]);

    const calculateVisibleActions = useCallback(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const nextVisibleActions = visibleActionsRef.current;
        const containerVisible = getIsElementVisible(container);
        setIsContainerVisible(containerVisible);

        const containerWidth = container.getBoundingClientRect().width;
        if (!containerVisible || containerWidth <= 0) {
            setVisibleActionsCount(0);
            return;
        }

        const buttonWidths = nextVisibleActions.map(
            (_, index) => actionButtonMeasureRefs.current[index]?.getBoundingClientRect().width ?? 0,
        );
        const overflowButtonWidths = nextVisibleActions.map(
            (_, index) => splitButtonMeasureRefs.current[index]?.getBoundingClientRect().width ?? 0,
        );
        const nextVisibleCount = calculateVisibleActionCount({
            actionButtonWidths: buttonWidths,
            overflowButtonWidths,
            containerWidth,
            gapPx: TOOLBAR_ACTION_GAP_PX,
        });

        setVisibleActionsCount(nextVisibleCount);
    }, []);

    useLayoutEffect(() => {
        calculateVisibleActions();
        const animationFrameId = requestAnimationFrame(calculateVisibleActions);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [calculateVisibleActions, renderVersion, visibleActionIds]);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const throttledCalculateVisibleActions = createThrottle(calculateVisibleActions, 50);
        const observer = new ResizeObserver(throttledCalculateVisibleActions);
        observer.observe(container);
        actionButtonMeasureRefs.current.forEach((element) => {
            if (element) {
                observer.observe(element);
            }
        });
        splitButtonMeasureRefs.current.forEach((element) => {
            if (element) {
                observer.observe(element);
            }
        });
        window.addEventListener('resize', throttledCalculateVisibleActions);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', throttledCalculateVisibleActions);
            throttledCalculateVisibleActions.cancel();
        };
    }, [calculateVisibleActions, visibleActionIds]);

    if (visibleActions.length === 0) {
        return null;
    }

    const { rowItems, overflowItems } = getOverflowLayout(visibleActions, visibleActionsCount);

    return (
        <>
            <div ref={containerRef} className={cn('min-w-0', className)}>
                <div className="flex min-w-0 items-center gap-2">
                    {rowItems.length > 0 && (
                        <ActionGroup>
                            {rowItems.map(({ id, action }) => (
                                <ToolbarActionButton key={id} action={action} disabled={!isContainerVisible} />
                            ))}
                        </ActionGroup>
                    )}
                    {overflowItems.length > 0 && (
                        <SplitActionButton
                            key={`toolbar-overflow-${overflowItems.map(({ id }) => id).join('-')}`}
                            actions={[overflowItems.map(({ action }) => action)]}
                            disabled={!isContainerVisible}
                            primaryActionStrategy="firstVisible"
                            disableMenuWhenAllMenuActionsDisabled={false}
                        />
                    )}
                </div>
            </div>
            <div aria-hidden="true" className="fixed -left-[9999px] top-0 invisible pointer-events-none">
                <div className="flex items-center gap-2">
                    {visibleActions.map(({ id, action }, index) => (
                        <div
                            key={`measure-button-${id}`}
                            ref={(element) => {
                                actionButtonMeasureRefs.current[index] = element;
                            }}
                        >
                            <ToolbarActionButton action={action} disabled={true} />
                        </div>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {visibleActions.map(({ id }, index) => {
                        const measuredOverflowItems = getOverflowLayout(visibleActions, index).overflowItems;

                        return (
                            <div
                                key={`measure-split-${id}`}
                                ref={(element) => {
                                    splitButtonMeasureRefs.current[index] = element;
                                }}
                            >
                                <SplitActionButton
                                    actions={[measuredOverflowItems.map(({ action }) => action)]}
                                    disabled={true}
                                    primaryActionStrategy="firstVisible"
                                    disableMenuWhenAllMenuActionsDisabled={false}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

OverflowActionRow.displayName = 'OverflowActionRow';
