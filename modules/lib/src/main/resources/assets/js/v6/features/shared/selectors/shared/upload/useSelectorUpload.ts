import { showError } from '@enonic/lib-admin-ui/notify/MessageBus';
import { useStore } from '@nanostores/preact';
import { listenKeys } from 'nanostores';
import { type DragEvent as ReactDragEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { UploadMediaSuccess } from '../../../../../entities/content/api/uploadMedia.api';
import type { UploadError } from '../../../../../shared/api';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { useUploadMedia } from '../../../../../entities/content/lib/useUploadMedia';
import { $contextContent } from '../../../../../widgets/context-panel/model/contextContent.store';
import { $uploads, removeUpload } from '../../../../../entities/content/model/uploads.store';

//
// * Types
//

export type UseSelectorUploadOptions = {
    selection: readonly string[];
    onSelectionChange: (selection: readonly string[]) => void;
    /** MIME type filter (e.g. "image/*", "image/png,.svg") used for both the file input and dropped files */
    accept?: string;
    /** Whether multiple files may be uploaded at once */
    multiple?: boolean;
    /** When true, drop handling is disabled */
    disabled?: boolean;
};

export type SelectorUploadDragProps = {
    isDragging: boolean;
    onDragOver: (event: ReactDragEvent<HTMLDivElement>) => void;
    onDragLeave: (event: ReactDragEvent<HTMLDivElement>) => void;
    onDrop: (event: ReactDragEvent<HTMLDivElement>) => void;
};

export type UseSelectorUploadReturn = {
    /** Upload the given files; completed uploads are appended to the selection */
    handleFiles: (files: FileList | File[]) => void;
    /** Aggregate upload progress (0-100) */
    progress: number;
    /** Whether one or more uploads are in flight */
    isUploading: boolean;
    /** Native drag-and-drop handlers + state for the drop target */
    dragProps: SelectorUploadDragProps;
};

//
// * Helpers
//

// Same matching rule as DropZone.tsx (exact MIME / "type/*" wildcard / ".ext").
const filterByAccept = (files: FileList, accept?: string): File[] => {
    const all = Array.from(files);

    if (!accept) {
        return all;
    }

    const acceptedTypes = accept.split(',').map((type) => type.trim().toLowerCase());

    return all.filter((file) =>
        acceptedTypes.some((type) => {
            if (type.startsWith('.')) {
                return file.name.toLowerCase().endsWith(type);
            }
            if (type.endsWith('/*')) {
                return file.type.startsWith(type.slice(0, -1));
            }
            return file.type === type;
        }),
    );
};

//
// * Hook
//

export const useSelectorUpload = ({
    selection,
    onSelectionChange,
    accept,
    multiple = false,
    disabled = false,
}: UseSelectorUploadOptions): UseSelectorUploadReturn => {
    const [progress, setProgress] = useState<number>(0);
    const [uploadIds, setUploadIds] = useState<string[]>([]);
    const [newContentIds, setNewContentIds] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const uploadParent = useStore($contextContent);
    const highestProgress = useRef<number>(0);
    const isUploading = uploadIds.length > 0;

    const selectionRef = useRef(selection);
    selectionRef.current = selection;

    const onSelectionChangeRef = useRef(onSelectionChange);
    onSelectionChangeRef.current = onSelectionChange;

    // Update selection when uploads are complete.
    // Tracks progress of all uploads based on the upload ids.
    useEffect(() => {
        if (uploadIds.length === 0) {
            if (newContentIds.length > 0) {
                onSelectionChangeRef.current([...selectionRef.current, ...newContentIds]);
                setNewContentIds([]);
            }
            setProgress(0);
            return;
        }

        return listenKeys($uploads, uploadIds, (uploads) => {
            const activeIds = uploadIds.filter((id) => uploads[id]);

            if (activeIds.length === 0) {
                highestProgress.current = 0;
                setProgress(0);
                return;
            }

            const progress = activeIds.reduce((acc, id) => acc + uploads[id].progress / activeIds.length, 0);

            // Avoid progress decreasing due to completion of other uploads
            const finalProgress = Math.min(100, Math.max(highestProgress.current, progress));
            highestProgress.current = finalProgress;
            setProgress(finalProgress);
        });
    }, [uploadIds]);

    // Upload handlers
    const onUploadStart = useCallback((file: File) => {
        setUploadIds((prev) => [...prev, file.name]);
    }, []);

    const onUploadComplete = useCallback((success: UploadMediaSuccess) => {
        const contentId = success.content.getId();
        setNewContentIds((prev) => [...prev, contentId]);
        removeUpload(success.mediaIdentifier);
        setUploadIds((prev) => prev.filter((id) => id !== success.mediaIdentifier));
    }, []);

    const onUploadError = useCallback((error: UploadError) => {
        removeUpload(error.mediaIdentifier);
        setUploadIds((prev) => prev.filter((id) => id !== error.mediaIdentifier));
        showError(useI18n('notify.upload.error', error.mediaIdentifier, error.message));
    }, []);

    const { handleFiles: uploadFiles } = useUploadMedia({
        parentContent: uploadParent,
        onUploadStart,
        onUploadComplete,
        onUploadError,
    });

    const handleFiles = useCallback(
        (files: FileList | File[]) => {
            void uploadFiles(files);
        },
        [uploadFiles],
    );

    // Drag-and-drop handlers
    const onDragOver = useCallback(
        (event: ReactDragEvent<HTMLDivElement>) => {
            if (disabled || !event.dataTransfer.types.includes('Files')) {
                return;
            }
            event.preventDefault();
            setIsDragging(true);
        },
        [disabled],
    );

    const onDragLeave = useCallback((event: ReactDragEvent<HTMLDivElement>) => {
        // Ignore leaves into descendant elements to avoid highlight flicker.
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) {
            return;
        }
        setIsDragging(false);
    }, []);

    const onDrop = useCallback(
        (event: ReactDragEvent<HTMLDivElement>) => {
            if (disabled || !event.dataTransfer.types.includes('Files')) {
                return;
            }
            event.preventDefault();
            setIsDragging(false);

            const matched = filterByAccept(event.dataTransfer.files, accept);
            const files = multiple ? matched : matched.slice(0, 1);

            if (files.length > 0) {
                void uploadFiles(files);
            }
        },
        [disabled, accept, multiple, uploadFiles],
    );

    const dragProps = useMemo<SelectorUploadDragProps>(
        () => ({ isDragging, onDragOver, onDragLeave, onDrop }),
        [isDragging, onDragOver, onDragLeave, onDrop],
    );

    return useMemo(
        () => ({ handleFiles, progress, isUploading, dragProps }),
        [handleFiles, progress, isUploading, dragProps],
    );
};
