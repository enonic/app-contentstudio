import {useCallback, useEffect, useRef, useState, type ReactElement} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {fetchContentByIds} from '../../../../api/content-fetcher';
import {SortableList, type SortableListItemContext} from '@enonic/lib-admin-ui/form2/components';
import {$contentDeleted, $contentUpdated} from '../../../../store/socket.store';

export type SelectorSelectionRenderItem = (context: SortableListItemContext<ContentSummaryAndCompareStatus>) => ReactElement;

export type SelectorSelectionProps = {
    /** Selected content IDs */
    selection: readonly string[];
    /** Callback when selection changes */
    onSelectionChange: (selection: readonly string[]) => void;
    /** Render callback for each selected item */
    renderItem: SelectorSelectionRenderItem;
    /** Whether the selection is disabled */
    disabled?: boolean;
    /** Additional CSS class */
    className?: string;
};

const SELECTOR_SELECTION_NAME = 'SelectorSelection';

// Get a list of content ids, fetch those contents, render them and allow selection reordering.
export const SelectorSelection = ({
    disabled,
    selection,
    onSelectionChange,
    renderItem,
    className,
}: SelectorSelectionProps): ReactElement | null => {
    const requestIdRef = useRef(0);

    const [contents, setContents] = useState<ContentSummaryAndCompareStatus[]>([]);
    const contentsRef = useRef<ContentSummaryAndCompareStatus[]>([]);

    const selectionRef = useRef<readonly string[]>(selection);
    selectionRef.current = selection;

    const onSelectionChangeRef = useRef(onSelectionChange);
    onSelectionChangeRef.current = onSelectionChange;

    // Fetch contents when selection changes
    useEffect(() => {
        const requestId = ++requestIdRef.current;
        const contentIds = [...selection];

        if (contentIds.length === 0) {
            setContents([]);
            contentsRef.current = [];
            return;
        }

        fetchContentByIds(contentIds).then((items) => {
            if (requestId !== requestIdRef.current) return;
            // Preserve selection order
            const itemMap = new Map(items.map((item) => [item.getId(), item]));
            const ordered = contentIds.map((id) => itemMap.get(id)).filter((item): item is ContentSummaryAndCompareStatus => item != null);
            setContents(ordered);
            contentsRef.current = ordered;
        });
    }, [selection]);

    // Handle content updated and deleted events
    useEffect(() => {
        const unlistenUpdate = $contentUpdated.listen((event) => {
            if (!event?.data) return;

            const newContents = contentsRef.current.map((content) => {
                const updatedContent = event.data.find((item) => item.getId() === content.getId());

                return updatedContent || content;
            });

            setContents(newContents);
            contentsRef.current = newContents;
        });

        const unlistenDelete = $contentDeleted.listen((event) => {
            if (!event?.data) return;
            const deletedContentIds = event.data.map((item) => item.getId());
            const newSelection = selectionRef.current.filter((id) => !deletedContentIds.includes(id));
            onSelectionChangeRef.current(newSelection);
            selectionRef.current = newSelection;
        });

        return () => {
            unlistenUpdate();
            unlistenDelete();
        };
    }, []);

    const handleReorder = useCallback(
        (fromIndex: number, toIndex: number) => {
            const newContents = [...contents];
            const [movedContent] = newContents.splice(fromIndex, 1);
            newContents.splice(toIndex, 0, movedContent);

            setContents(newContents);
            contentsRef.current = newContents;

            onSelectionChange(newContents.map((content) => content.getId()));
        },
        [contents, onSelectionChange]
    );

    if (!contents || contents.length === 0) return null;

    return (
        <SortableList
            data-component={SELECTOR_SELECTION_NAME}
            items={contents}
            fullRowDraggable
            keyExtractor={(content) => content.getId()}
            onMove={handleReorder}
            enabled={!disabled}
            className={className}
            renderItem={renderItem}
        />
    );
};

SelectorSelection.displayName = SELECTOR_SELECTION_NAME;
