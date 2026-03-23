import {Button, cn} from '@enonic/ui';
import {Plus} from 'lucide-react';
import {ReactElement, useEffect, useRef, useState} from 'react';
import {useStore} from '@nanostores/preact';
import {listenKeys} from 'nanostores';
import {$newContentDialog, openNewContentDialog} from '../../../../store/dialogs/newContentDialog.store';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {$contentCreated} from '../../../../store/socket.store';
import {$uploads, getUploadsForParent} from '../../../../store/uploads.store';

type ContentSelectorInputAddButtonProps = {
    disabled: boolean;
    selection: readonly string[];
    onSelectionChange: (selection: readonly string[]) => void;
};

export const ContentSelectorInputAddButton = ({
    disabled,
    selection,
    onSelectionChange,
}: ContentSelectorInputAddButtonProps): ReactElement => {
    const [progress, setProgress] = useState(0);
    const [uploadIds, setUploadIds] = useState<string[]>([]);
    const contextContent = useStore($contextContent);
    const parentId = contextContent?.getContentId()?.toString() ?? null;

    // Refs
    const isWaitingForContentCreationRef = useRef(false);

    const selectionRef = useRef(selection);
    selectionRef.current = selection;

    const onSelectionChangeRef = useRef(onSelectionChange);
    onSelectionChangeRef.current = onSelectionChange;

    const highestProgressRef = useRef(0);
    const isUploading = uploadIds.length > 0;

    // When the dialog closes with active parent uploads, capture their IDs for progress tracking
    useEffect(() => {
        const unlisten = listenKeys($newContentDialog, ['open'], ({open}) => {
            if (open || !isWaitingForContentCreationRef.current) return;

            const active = getUploadsForParent(parentId).filter((u) => u.status === 'pending' || u.status === 'uploading');

            if (active.length > 0) {
                setUploadIds(active.map((u) => u.id));
            }
        });

        return unlisten;
    }, [parentId]);

    // Track upload progress
    useEffect(() => {
        if (uploadIds.length === 0) {
            setProgress(0);
            highestProgressRef.current = 0;
            return;
        }

        const unlisten = listenKeys($uploads, uploadIds, (uploads) => {
            const activeIds = uploadIds.filter((id) => uploads[id]);

            if (activeIds.length === 0) {
                setUploadIds([]);
                highestProgressRef.current = 0;
                setProgress(0);
                return;
            }

            const avg = activeIds.reduce((acc, id) => acc + uploads[id].progress / activeIds.length, 0);
            const final = Math.min(100, Math.max(highestProgressRef.current, avg));
            highestProgressRef.current = final;
            setProgress(final);
        });

        return unlisten;
    }, [uploadIds]);

    // Listen for content creation events and add the content to the selection
    useEffect(() => {
        const unlisten = $contentCreated.listen((event) => {
            if (!event?.data || !isWaitingForContentCreationRef.current || !contextContent) return;

            const contentIds = event.data
                .filter((content) => content.getPath().getParentPath().toString() === contextContent.getPath().toString())
                .map((content) => content.getId());

            if (contentIds.length === 0) return;

            const newSelection = [...selectionRef.current, ...contentIds];

            onSelectionChangeRef.current(newSelection);

            const hasActiveParentUploads = getUploadsForParent(parentId).some((u) => u.status === 'pending' || u.status === 'uploading');

            if (!hasActiveParentUploads) {
                isWaitingForContentCreationRef.current = false;
            }
        });

        return unlisten;
    }, [contextContent, parentId]);

    // Handler
    const handleClick = () => {
        if (!contextContent) return;
        openNewContentDialog(contextContent);
        isWaitingForContentCreationRef.current = true;
    };

    return (
        <Button
            variant="solid"
            onClick={handleClick}
            disabled={disabled}
            className={cn(
                isUploading && 'pointer-events-none',
                'relative w-full h-full rounded-none border border-bdr-subtle rounded-tr rounded-br bg-surface-selected',
                'hover:outline-1 hover:outline-bdr-subtle',
                'focus-within:outline-none focus-within:ring-3 focus-within:ring-ring focus-within:ring-offset-3 focus-within:ring-offset-ring-offset transition-highlight'
            )}
        >
            {isUploading && (
                <div className="animate-pulse absolute top-0 left-0 h-full bg-success-rev opacity-30" style={{width: `${progress}%`}} />
            )}
            <Plus size={20} />
        </Button>
    );
};

ContentSelectorInputAddButton.displayName = 'ContentSelectorInputAddButton';
