import {useCallback, useEffect, useRef, useState, type ReactElement} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {fetchContentByIds} from '../../../../api/content-fetcher';
import {SortableList, type SortableListItemContext} from '@enonic/lib-admin-ui/form2/components';
import {
    $contentArchived,
    $contentDeleted,
    $contentMoved,
    $contentPublished,
    $contentUnpublished,
    $contentUpdated,
} from '../../../../store/socket.store';
import {CompareStatus} from '../../../../../../app/content/CompareStatus';

type ContentUpdatedEvent = Parameters<Parameters<typeof $contentUpdated.listen>[0]>[0];
type ContentPublishedEvent = Parameters<Parameters<typeof $contentPublished.listen>[0]>[0];
type ContentUnpublishedEvent = Parameters<Parameters<typeof $contentUnpublished.listen>[0]>[0];
type ContentMovedEvent = Parameters<Parameters<typeof $contentMoved.listen>[0]>[0];
type ContentDeletedEvent = Parameters<Parameters<typeof $contentDeleted.listen>[0]>[0];
type ContentArchivedEvent = Parameters<Parameters<typeof $contentArchived.listen>[0]>[0];

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
// Also updates the selection based on content events.
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
        [onSelectionChange]
    );
    const handleUpdateContents = useCallback(
        (event: ContentUpdatedEvent | ContentPublishedEvent | ContentUnpublishedEvent) => {
            if (!event?.data) return;
            const newContents = contentsRef.current.map((content) => {
                const updatedContent = event.data.find((item) => item.getId() === content.getId());
                return updatedContent || content;
            });
            setContents(newContents);
            contentsRef.current = newContents;
        },
        [setContents]
    );
    const handleRemoveContents = useCallback(
        (event: ContentDeletedEvent | ContentArchivedEvent, compareStatus: CompareStatus) => {
            if (!event?.data) return;
            const removedContentIds = event.data.map((item) => item.getId());
            const newContents = contentsRef.current.map((content) => {
                const removedContent = removedContentIds.includes(content.getId());
                return removedContent ? content.setCompareStatus(compareStatus) : content;
            });
            setContents(newContents);
            contentsRef.current = newContents;
        },
        [setContents]
    );
    const handleMoveContents = useCallback(
        (event: ContentMovedEvent) => {
            handleUpdateContents({...event, data: event.data.map((item) => item.item)});
        },
        [handleUpdateContents]
    );

    // Handle events
    useEffect(() => {
        const unlistenUpdate = $contentUpdated.listen(handleUpdateContents);
        const unlistenPublish = $contentPublished.listen(handleUpdateContents);
        const unlistenUnpublish = $contentUnpublished.listen(handleUpdateContents);
        const unlistenMove = $contentMoved.listen(handleMoveContents);
        const unlistenDelete = $contentDeleted.listen((event) => handleRemoveContents(event, CompareStatus.UNKNOWN));
        const unlistenArchive = $contentArchived.listen((event) => handleRemoveContents(event, CompareStatus.ARCHIVED));

        return () => {
            unlistenUpdate();
            unlistenPublish();
            unlistenUnpublish();
            unlistenMove();
            unlistenDelete();
            unlistenArchive();
        };
    }, [handleUpdateContents, handleRemoveContents, handleMoveContents]);

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
