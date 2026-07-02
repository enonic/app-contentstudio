import { cn, Separator } from '@enonic/ui';
import {
    type KeyboardEvent,
    type MouseEvent,
    type ReactElement,
    useCallback,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { type Branch } from '../../../../app/versioning/Branch';
import { useInfiniteScroll } from '../../../shared/lib/hooks/useInfiniteScroll';
import type { ContentLabelVariant } from '../content/ContentLabel';
import { ContentListItemWithReference } from '../items';

type ContentReferenceAction = 'content' | 'reference';

type ActiveReferenceAction = {
    rowIndex: number;
    action: ContentReferenceAction;
} | null;

type ContentReferenceRow = {
    content: ContentSummary;
    hasInbound: boolean;
    key: string;
    rowIndex: number;
    section: 'main' | 'dependant';
    variant: ContentLabelVariant;
};

export type ContentReferenceListProps = {
    items: ContentSummary[];
    dependants?: ContentSummary[];
    dependantsLabel?: string;
    branch: Branch;
    isInbound: (content: ContentSummary) => boolean;
    label?: string;
    mainVariant?: ContentLabelVariant;
    dependantVariant?: ContentLabelVariant;
    mainListClassName?: string;
    dependantListClassName?: string;
    dependantSectionClassName?: string;
    /** When true, more dependants can be lazy-loaded as the user scrolls to the end. */
    hasMore?: boolean;
    /** Invoked when the end of the dependant list is scrolled into view. */
    onEndReached?: () => void | Promise<void>;
    'data-component'?: string;
};

const CONTENT_REFERENCE_LIST_NAME = 'ContentReferenceList';
const ACTIVE_ACTION_CLASS = [
    'data-[active=true]:ring-3',
    'data-[active=true]:ring-ring-offset',
    'data-[active=true]:ring-inset',
    'data-[active=true]:ring-offset-3',
    'data-[active=true]:ring-offset-ring',
].join(' ');
const ACTIVE_REFERENCE_LINK_CLASS = cn('rounded-sm', 'data-[active=true]:bg-btn-active', ACTIVE_ACTION_CLASS);

function getActionKey(rowIndex: number, action: ContentReferenceAction): string {
    return `${rowIndex}-${action}`;
}

function getActionId(baseId: string, rowIndex: number, action: ContentReferenceAction): string {
    return `${baseId}-content-reference-list-${rowIndex}-${action}`;
}

function normalizeActiveAction(active: ActiveReferenceAction, rows: ContentReferenceRow[]): ActiveReferenceAction {
    if (rows.length === 0) {
        return null;
    }

    if (!active) {
        return { rowIndex: 0, action: 'content' };
    }

    const rowIndex = Math.min(Math.max(active.rowIndex, 0), rows.length - 1);
    const row = rows[rowIndex];
    const action = active.action === 'reference' && row.hasInbound ? 'reference' : 'content';

    return { rowIndex, action };
}

function isSameActiveAction(left: ActiveReferenceAction, right: ActiveReferenceAction): boolean {
    return left?.rowIndex === right?.rowIndex && left?.action === right?.action;
}

function getLastActiveAction(rows: ContentReferenceRow[]): ActiveReferenceAction {
    if (rows.length === 0) {
        return null;
    }

    const rowIndex = rows.length - 1;
    const row = rows[rowIndex];

    return { rowIndex, action: row.hasInbound ? 'reference' : 'content' };
}

export const ContentReferenceList = ({
    items,
    dependants = [],
    dependantsLabel,
    branch,
    isInbound,
    label,
    mainVariant = 'normal',
    dependantVariant = 'normal',
    mainListClassName,
    dependantListClassName,
    dependantSectionClassName,
    hasMore = false,
    onEndReached,
    'data-component': componentName = CONTENT_REFERENCE_LIST_NAME,
}: ContentReferenceListProps): ReactElement => {
    const baseId = useId();
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const handleLoadMore = useCallback((): void => {
        if (isLoadingMore || !onEndReached) {
            return;
        }
        setIsLoadingMore(true);
        void Promise.resolve(onEndReached()).finally(() => setIsLoadingMore(false));
    }, [isLoadingMore, onEndReached]);
    const sentinelRef = useInfiniteScroll<HTMLDivElement>({
        hasMore,
        isLoading: isLoadingMore,
        onLoadMore: handleLoadMore,
    });
    const actionRefs = useRef(new Map<string, HTMLElement>());
    const [activeAction, setActiveAction] = useState<ActiveReferenceAction>(null);
    const [focused, setFocused] = useState(false);

    const rows = useMemo<ContentReferenceRow[]>(() => {
        const mainRows = items.map((content) => ({
            content,
            hasInbound: isInbound(content),
            key: `main-${content.getId()}`,
            section: 'main' as const,
            variant: mainVariant,
        }));
        const dependantRows = dependants.map((content) => ({
            content,
            hasInbound: isInbound(content),
            key: `dep-${content.getId()}`,
            section: 'dependant' as const,
            variant: dependantVariant,
        }));

        return [...mainRows, ...dependantRows].map((row, rowIndex) => ({
            ...row,
            key: `${row.key}-${rowIndex}`,
            rowIndex,
        }));
    }, [items, dependants, isInbound, mainVariant, dependantVariant]);

    const normalizedActiveAction = useMemo(() => normalizeActiveAction(activeAction, rows), [activeAction, rows]);
    const mainRows = useMemo(() => rows.filter((row) => row.section === 'main'), [rows]);
    const dependantRows = useMemo(() => rows.filter((row) => row.section === 'dependant'), [rows]);

    useEffect(() => {
        setActiveAction((current) => {
            const next = normalizeActiveAction(current, rows);
            return isSameActiveAction(current, next) ? current : next;
        });
    }, [rows]);

    useEffect(() => {
        if (!focused || !normalizedActiveAction) {
            return;
        }

        actionRefs.current
            .get(getActionKey(normalizedActiveAction.rowIndex, normalizedActiveAction.action))
            ?.scrollIntoView({
                block: 'nearest',
                inline: 'nearest',
            });
    }, [focused, normalizedActiveAction]);

    const setActionElement = useCallback(
        (rowIndex: number, action: ContentReferenceAction, element: HTMLElement | null): void => {
            const key = getActionKey(rowIndex, action);
            if (element) {
                actionRefs.current.set(key, element);
            } else {
                actionRefs.current.delete(key);
            }
        },
        [],
    );

    const handleFocus = (): void => {
        setFocused(true);
        setActiveAction((current) => normalizeActiveAction(current, rows));
    };

    const handleBlur = (): void => setFocused(false);

    const handleActionMouseDown = useCallback(
        (event: MouseEvent<HTMLElement>, rowIndex: number, action: ContentReferenceAction): void => {
            event.preventDefault();
            setActiveAction({ rowIndex, action });
        },
        [],
    );

    const moveActiveRow = useCallback(
        (direction: -1 | 1): void => {
            setActiveAction((current) => {
                const active = normalizeActiveAction(current, rows);
                if (!active) {
                    return null;
                }

                const rowIndex = Math.min(Math.max(active.rowIndex + direction, 0), rows.length - 1);
                const row = rows[rowIndex];
                const action = active.action === 'reference' && row.hasInbound ? 'reference' : 'content';

                return { rowIndex, action };
            });
        },
        [rows],
    );

    const moveActiveAction = useCallback(
        (action: ContentReferenceAction): void => {
            setActiveAction((current) => {
                const active = normalizeActiveAction(current, rows);
                if (!active) {
                    return null;
                }

                const row = rows[active.rowIndex];
                if (action === 'reference' && !row.hasInbound) {
                    return active;
                }

                return { ...active, action };
            });
        },
        [rows],
    );

    const activateCurrentAction = useCallback((): void => {
        const active = normalizeActiveAction(activeAction, rows);
        if (!active) {
            return;
        }

        actionRefs.current.get(getActionKey(active.rowIndex, active.action))?.click();
    }, [activeAction, rows]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>): void => {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    moveActiveRow(1);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    moveActiveRow(-1);
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    moveActiveAction('reference');
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    moveActiveAction('content');
                    break;
                case 'Home':
                    event.preventDefault();
                    setActiveAction(normalizeActiveAction(null, rows));
                    break;
                case 'End':
                    event.preventDefault();
                    setActiveAction(getLastActiveAction(rows));
                    break;
                case 'Enter':
                case ' ':
                case 'Spacebar':
                    event.preventDefault();
                    activateCurrentAction();
                    break;
            }
        },
        [activateCurrentAction, moveActiveAction, moveActiveRow, rows],
    );

    const isActionActive = (rowIndex: number, action: ContentReferenceAction): boolean => {
        return focused && normalizedActiveAction?.rowIndex === rowIndex && normalizedActiveAction.action === action;
    };

    const renderRow = (row: ContentReferenceRow): ReactElement => (
        <ContentListItemWithReference
            key={row.key}
            id={`${baseId}-content-reference-list-row-${row.rowIndex}`}
            role="row"
            aria-rowindex={row.rowIndex + 1}
            variant={row.variant}
            content={row.content}
            branch={branch}
            hasInbound={row.hasInbound}
            contentButtonRef={(element) => setActionElement(row.rowIndex, 'content', element)}
            contentButtonProps={{
                id: getActionId(baseId, row.rowIndex, 'content'),
                tabIndex: -1,
                'data-active': isActionActive(row.rowIndex, 'content') || undefined,
                className: ACTIVE_ACTION_CLASS,
                onMouseDown: (event) => handleActionMouseDown(event, row.rowIndex, 'content'),
            }}
            referenceLinkRef={(element) => setActionElement(row.rowIndex, 'reference', element)}
            referenceLinkProps={{
                id: getActionId(baseId, row.rowIndex, 'reference'),
                tabIndex: -1,
                'data-active': isActionActive(row.rowIndex, 'reference') || undefined,
                className: ACTIVE_REFERENCE_LINK_CLASS,
                onMouseDown: (event) => handleActionMouseDown(event, row.rowIndex, 'reference'),
            }}
        />
    );

    return (
        <div
            role="grid"
            aria-label={label}
            aria-rowcount={rows.length}
            aria-activedescendant={
                normalizedActiveAction
                    ? getActionId(baseId, normalizedActiveAction.rowIndex, normalizedActiveAction.action)
                    : undefined
            }
            tabIndex={rows.length > 0 ? 0 : undefined}
            className="flex flex-col gap-y-10 outline-none"
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            data-component={componentName}
        >
            <ul role="presentation" className={cn('flex flex-col gap-y-2.5', mainListClassName)}>
                {mainRows.map(renderRow)}
            </ul>

            <div
                className={cn(
                    'flex flex-col gap-y-7.5',
                    dependantRows.length === 0 && 'hidden',
                    dependantSectionClassName,
                )}
            >
                {dependantsLabel && <Separator className="pr-1" label={dependantsLabel} />}
                <ul role="presentation" className={cn('flex flex-col gap-y-1.5', dependantListClassName)}>
                    {dependantRows.map(renderRow)}
                </ul>
                {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}
            </div>
        </div>
    );
};

ContentReferenceList.displayName = CONTENT_REFERENCE_LIST_NAME;
