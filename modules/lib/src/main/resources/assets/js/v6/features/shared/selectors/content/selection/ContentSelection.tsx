import {cn} from '@enonic/ui';
import {useCallback, useEffect, useRef, useState, type ReactElement} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {fetchContentByIds} from '../../../../api/content-fetcher';
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

const ContentSelectionItemSkeleton = (): ReactElement => (
    <li className='flex items-center gap-2.5 px-2.5 py-1 animate-pulse'>
        <div className='size-6 rounded-full bg-surface-neutral-hover' />
        <div className='flex-1 flex flex-col gap-1'>
            <div className='h-4 w-32 rounded bg-surface-neutral-hover' />
            <div className='h-3 w-24 rounded bg-surface-neutral-hover' />
        </div>
        <div className='h-5 w-12 rounded bg-surface-neutral-hover' />
        <div className='size-7' />
    </li>
);

//
// * Component
//

/**
 * Container component for displaying selected content items.
 * Shows a list of ContentSelectionItem components for each selected item.
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

    // Don't render if no selection
    if (selection.length === 0) {
        return null;
    }

    return (
        <ul
            data-component={CONTENT_SELECTION_NAME}
            className={cn('flex flex-col gap-2.5', className)}
        >
            {loading
                ? selection.map((id) => <ContentSelectionItemSkeleton key={id} />)
                : loadedItems.map((item) => (
                    <ContentSelectionItem
                        key={item.getId()}
                        content={item}
                        onRemove={handleRemove}
                        disabled={disabled}
                    />
                ))
            }
        </ul>
    );
};

ContentSelection.displayName = CONTENT_SELECTION_NAME;
