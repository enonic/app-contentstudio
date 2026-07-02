import { SortableGridList, type SortableGridListItemContext } from '@enonic/lib-admin-ui/form2/components';
import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import type { MovedContentItem } from '../../../../../../app/browse/MovedContentItem';
import { ContentSummary, ContentSummaryBuilder } from '../../../../../../app/content/ContentSummary';
import type { ContentServerChangeItem } from '../../../../../../app/event/ContentServerChangeItem';
import { fetchContentByIds } from '../../../../../entities/content';
import {
    $contentArchived,
    $contentDeleted,
    $contentMoved,
    $contentPublished,
    $contentRenamed,
    $contentUnpublished,
    $contentUpdated,
    type ContentEvent,
    type ContentRenamedData,
} from '../../../../../shared/socket/socket.store';

export type SelectorSelectionRenderItem = (context: SortableGridListItemContext<ContentSummary>) => ReactElement;

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
// Also updates the selection based on content events.
export const SelectorSelection = ({
    disabled,
    selection,
    onSelectionChange,
    renderItem,
    className,
}: SelectorSelectionProps): ReactElement | null => {
    const requestIdRef = useRef(0);
    const [contents, setContents] = useState<ContentSummary[]>([]);
    const contentsRef = useRef<ContentSummary[]>([]);

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
            const itemMap = new Map(items.map((item) => [item.getId(), item]));
            // Preserve selection order; use stub for IDs not found (deleted)
            const ordered = contentIds.map((id) => itemMap.get(id) ?? new ContentSummaryBuilder().setId(id).build());
            setContents(ordered);
            contentsRef.current = ordered;
        });
    }, [selection]);

    // Handlers
    const handleReorder = useCallback(
        (fromIndex: number, toIndex: number) => {
            const newContents = [...contentsRef.current];
            const [movedContent] = newContents.splice(fromIndex, 1);
            newContents.splice(toIndex, 0, movedContent);

            setContents(newContents);
            contentsRef.current = newContents;

            onSelectionChange(newContents.map((content) => content.getId()));
        },
        [onSelectionChange],
    );
    const handleUpdateContents = useCallback(
        (event: ContentEvent | null) => {
            if (!event?.data) return;
            const newContents = contentsRef.current.map((content) => {
                const updatedItem = event.data.find((item) => item.getId() === content.getId());
                return updatedItem || content;
            });
            setContents(newContents);
            contentsRef.current = newContents;
        },
        [setContents],
    );
    const handleRemoveContents = useCallback(
        (event: ContentEvent<ContentServerChangeItem[]> | null) => {
            if (!event?.data) return;
            const removedContentIds = new Set(event.data.map((item) => item.getId()));
            const newContents = contentsRef.current.map((content) =>
                removedContentIds.has(content.getId())
                    ? new ContentSummaryBuilder().setId(content.getId()).build()
                    : content,
            );
            setContents(newContents);
            contentsRef.current = newContents;
        },
        [setContents],
    );
    const handleMoveContents = useCallback(
        (event: ContentEvent<MovedContentItem[]> | null) => {
            if (!event?.data) return;
            handleUpdateContents({ ...event, data: event.data.map((item) => item.item.getContentSummary()) });
        },
        [handleUpdateContents],
    );
    const handleRenameContents = useCallback(
        (event: ContentEvent<ContentRenamedData> | null) => {
            if (!event?.data) return;
            handleUpdateContents({ ...event, data: event.data.items });
        },
        [handleUpdateContents],
    );

    // Handle events
    useEffect(() => {
        const unlistenUpdate = $contentUpdated.listen(handleUpdateContents);
        const unlistenPublish = $contentPublished.listen(handleUpdateContents);
        const unlistenUnpublish = $contentUnpublished.listen(handleUpdateContents);
        const unlistenMove = $contentMoved.listen(handleMoveContents);
        const unlistenRename = $contentRenamed.listen(handleRenameContents);
        const unlistenDelete = $contentDeleted.listen(handleRemoveContents);
        const unlistenArchive = $contentArchived.listen(handleRemoveContents);

        return () => {
            unlistenUpdate();
            unlistenPublish();
            unlistenUnpublish();
            unlistenMove();
            unlistenRename();
            unlistenDelete();
            unlistenArchive();
        };
    }, [handleUpdateContents, handleRemoveContents, handleMoveContents, handleRenameContents]);

    if (!contents || contents.length === 0) return null;

    return (
        <SortableGridList
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
