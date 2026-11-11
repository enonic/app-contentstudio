import { Avatar, cn, GridList, Tooltip, useGridList } from '@enonic/ui';
import type { Principal } from '@enonic/ui-types';
import { type ReactElement, useLayoutEffect, useRef } from 'react';
import { getInitials } from '../lib/format/initials';
import { useVisibleAvatars } from '../lib/hooks/useVisibleAvatars';

export type PrincipalAvatarRow = {
    id: string;
    label: string;
    principals: readonly Principal[];
};

type PrincipalAvatarGridProps = {
    rows: readonly PrincipalAvatarRow[];
    label: string;
    variant?: 'compact' | 'stacked';
    highlightedPrincipalKey?: string;
    className?: string;
    'data-component'?: string;
};

type PrincipalAvatarGridRowProps = PrincipalAvatarRow & {
    variant: 'compact' | 'stacked';
    highlightedPrincipalKey?: string;
    firstRowId?: string;
};

const PrincipalAvatarGridRow = ({
    id,
    label,
    principals,
    variant,
    highlightedPrincipalKey,
    firstRowId,
}: PrincipalAvatarGridRowProps): ReactElement => {
    const listRef = useRef<HTMLDivElement>(null);
    const { activeCell, setActiveCell } = useGridList();
    const stacked = variant === 'stacked';
    const { visibleCount } = useVisibleAvatars(listRef, principals.length, stacked ? 50 : 0);
    const maxVisible = stacked
        ? Math.min(principals.length, visibleCount + 1)
        : principals.length > visibleCount
          ? Math.max(visibleCount - 1, 0)
          : principals.length;
    const hiddenPrincipals = principals.slice(maxVisible);
    const hiddenNames = hiddenPrincipals.map((principal) => principal.displayName);
    const overflowLabel = hiddenNames.join('\n');
    const cellCount = maxVisible + (hiddenPrincipals.length > 0 ? 1 : 0);
    // Remount the cells together so GridList assigns contiguous columns after a resize.
    const cellKey = `${principals.map((principal) => principal.key).join('|')}:${maxVisible}`;
    const root = listRef.current?.getRootNode() as Document | ShadowRoot | undefined;
    const hadFocus = root?.activeElement != null && listRef.current?.contains(root.activeElement);

    useLayoutEffect(() => {
        if (cellCount === 0) {
            if (activeCell?.row === id) {
                setActiveCell(firstRowId == null ? undefined : { row: firstRowId, col: 1 });
            }
            return;
        }
        if (activeCell == null) {
            if (id === firstRowId) {
                setActiveCell({ row: id, col: 1 });
            }
            return;
        }
        if (activeCell.row !== id) {
            return;
        }

        const col = Math.min(Math.max(activeCell.col, 1), cellCount);
        if (col !== activeCell.col) {
            setActiveCell({ row: id, col });
        }
        // The old cell may have been removed; restore focus before the browser paints.
        if (hadFocus) {
            listRef.current?.querySelectorAll<HTMLElement>('[role="gridcell"]')[col - 1]?.focus();
        }
    }, [activeCell, cellCount, cellKey, firstRowId, hadFocus, id, setActiveCell]);

    const avatar = (principal: Principal): ReactElement => (
        <Avatar
            aria-hidden="true"
            size={stacked ? 'md' : 'sm'}
            className={cn(
                stacked ? 'border-2 border-surface-neutral' : 'size-6',
                principal.key === highlightedPrincipalKey && 'border-info',
            )}
        >
            <Avatar.Fallback className="text-alt font-semibold">{getInitials(principal.displayName)}</Avatar.Fallback>
        </Avatar>
    );
    const cellClassName =
        'relative rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring';

    return (
        <GridList.Row id={id} aria-label={label} className="contents">
            <GridList.Cell key={`label:${cellKey}`} interactive={false}>
                {label}
            </GridList.Cell>
            <div
                ref={listRef}
                className={cn('flex min-w-0', stacked ? 'overflow-hidden -space-x-2' : 'gap-2.5 -my-0.5')}
            >
                {principals.map((principal, index) =>
                    index < maxVisible ? (
                        <Tooltip
                            key={`${cellKey}:${principal.key}`}
                            delay={stacked ? 300 : 150}
                            value={principal.displayName}
                        >
                            <div className="relative shrink-0 rounded-full focus-within:z-10">
                                <GridList.Cell
                                    aria-label={`${label}: ${principal.displayName}`}
                                    className={cellClassName}
                                >
                                    {avatar(principal)}
                                </GridList.Cell>
                            </div>
                        </Tooltip>
                    ) : (
                        <div
                            key={`hidden:${principal.key}`}
                            aria-hidden="true"
                            className="invisible order-last shrink-0"
                        >
                            {avatar(principal)}
                        </div>
                    ),
                )}
                {hiddenPrincipals.length > 0 && (
                    <Tooltip
                        key={`overflow:${cellKey}`}
                        delay={stacked ? 300 : 150}
                        value={overflowLabel}
                        className="whitespace-pre-line"
                    >
                        <div className="relative shrink-0 rounded-full focus-within:z-10">
                            <GridList.Cell aria-label={`${label}: ${hiddenNames.join(', ')}`} className={cellClassName}>
                                <Avatar
                                    aria-hidden="true"
                                    size={stacked ? 'md' : 'sm'}
                                    className={cn(
                                        'text-alt font-semibold',
                                        stacked ? 'border-2 border-surface-neutral' : 'size-6',
                                    )}
                                >
                                    <Avatar.Fallback>+{hiddenPrincipals.length}</Avatar.Fallback>
                                </Avatar>
                            </GridList.Cell>
                        </div>
                    </Tooltip>
                )}
            </div>
        </GridList.Row>
    );
};

PrincipalAvatarGridRow.displayName = 'PrincipalAvatarGridRow';

export const PrincipalAvatarGrid = ({
    rows,
    label,
    variant = 'compact',
    highlightedPrincipalKey,
    className,
    'data-component': componentName = 'PrincipalAvatarGrid',
}: PrincipalAvatarGridProps): ReactElement => {
    const firstRowId = rows.find((row) => row.principals.length > 0)?.id;

    return (
        <GridList
            label={label}
            aria-readonly="true"
            defaultActiveCell={firstRowId == null ? undefined : { row: firstRowId, col: 1 }}
            data-component={componentName}
            className={cn(
                'grid grid-cols-[max-content_minmax(0,1fr)] items-center gap-y-2.5 gap-x-2.5 focus-within:ring-0',
                className,
            )}
        >
            {rows.map((row) => (
                <PrincipalAvatarGridRow
                    key={row.id}
                    {...row}
                    variant={variant}
                    highlightedPrincipalKey={highlightedPrincipalKey}
                    firstRowId={firstRowId}
                />
            ))}
        </GridList>
    );
};

PrincipalAvatarGrid.displayName = 'PrincipalAvatarGrid';
