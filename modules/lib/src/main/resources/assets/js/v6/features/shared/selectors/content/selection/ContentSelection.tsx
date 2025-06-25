import {cn, GridList} from '@enonic/ui';
import {useCallback, useEffect, useRef, useState, type ReactElement} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {fetchContentByIds} from '../../../../api/content-fetcher';
import {useI18n} from '../../../../hooks/useI18n';
import {ContentSelectionItem} from './ContentSelectionItem';

//
// * Types
//

export type ContentSelectionProps = {
    /** IDs of selected content items */
    selection: readonly string[];
    /** Callback when selection changes (item removed) */
    onSelectionChange: (selection: readonly string[]) => void;
    /** Whether the selection is disabled */
    disabled?: boolean;
    /** Additional CSS class */
    className?: string;
};

//
// * Constants
//

const CONTENT_SELECTION_NAME = 'ContentSelection';

//
// * Skeleton Component
//

type ContentSelectionItemSkeletonProps = {
    id: string;
};

const ContentSelectionItemSkeleton = ({id}: ContentSelectionItemSkeletonProps): ReactElement => (
    <GridList.Row id={id} disabled className='gap-3 px-2.5 animate-pulse'>
        <GridList.Cell className='flex-1 min-w-0'>
            <div className='flex items-center gap-2.5'>
                <div className='size-6 rounded-full bg-surface-neutral-hover' />
                <div className='flex flex-col gap-1 flex-1'>
                    <div className='h-4 w-32 rounded bg-surface-neutral-hover' />
                    <div className='h-3 w-24 rounded bg-surface-neutral-hover' />
                </div>
            </div>
        </GridList.Cell>
        <GridList.Cell>
            <div className='h-5 w-12 rounded bg-surface-neutral-hover' />
        </GridList.Cell>
        <GridList.Cell>
            <div className='size-7' />
        </GridList.Cell>
    </GridList.Row>
);

//
// * Component
//

/**
 * Container component for displaying selected content items.
 * Uses GridList with ContentSelectionItem rows for each selected item.
 * Fetches content data for selected IDs and handles race conditions.
 */
export const ContentSelection = ({
    selection,
    onSelectionChange,
    disabled = false,
    className,
}: ContentSelectionProps): ReactElement | null => {
    const [loadedItems, setLoadedItems] = useState<ContentSummaryAndCompareStatus[]>([]);
    const [loading, setLoading] = useState(false);
    const requestIdRef = useRef(0);
    const selectedItemsLabel = useI18n('field.treeListToolbar.selected');

    useEffect(() => {
        const requestId = ++requestIdRef.current;

        if (selection.length === 0) {
            setLoadedItems([]);
            return;
        }

        setLoading(true);
        fetchContentByIds([...selection])
            .then((items) => {
                if (requestId !== requestIdRef.current) return;
                // Preserve selection order
                const itemMap = new Map(items.map(item => [item.getId(), item]));
                const ordered = selection
                    .map(id => itemMap.get(id))
                    .filter((item): item is ContentSummaryAndCompareStatus => item != null);
                setLoadedItems(ordered);
            })
            .finally(() => {
                if (requestId === requestIdRef.current) setLoading(false);
            });
    }, [selection]);

    const handleRemove = useCallback((id: string) => {
        onSelectionChange(selection.filter(itemId => itemId !== id));
    }, [selection, onSelectionChange]);

    if (selection.length === 0) {
        return null;
    }

    return (
        <GridList
            data-component={CONTENT_SELECTION_NAME}
            className={cn('flex flex-col gap-y-1.5', className)}
            label={selectedItemsLabel || 'Selected'}
            disabled={disabled}
        >
            {loading
                ? selection.map((id) => <ContentSelectionItemSkeleton key={id} id={id} />)
                : loadedItems.map((item) => (
                    <ContentSelectionItem
                        key={item.getId()}
                        content={item}
                        onRemove={handleRemove}
                        disabled={disabled}
                    />
                ))
            }
        </GridList>
    );
};

ContentSelection.displayName = CONTENT_SELECTION_NAME;
