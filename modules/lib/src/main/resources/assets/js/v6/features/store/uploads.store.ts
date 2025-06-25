import {map} from 'nanostores';

//
// * Types
//

/** Upload status */
export type UploadStatus = 'pending' | 'uploading' | 'complete' | 'error';

/** Individual upload item */
export type UploadItem = {
    /** Temporary ID for the upload (before content is created) */
    id: string;
    /** File name */
    name: string;
    /** Upload progress (0-100) */
    progress: number;
    /** Parent content ID where file is being uploaded. null = root */
    parentId: string | null;
    /** Current status */
    status: UploadStatus;
    /** Error message if status is 'error' */
    error?: string;
};

type UploadsState = Record<string, UploadItem>;

//
// * Store
//

/** Uploads tracking store */
export const $uploads = map<UploadsState>({});

//
// * Actions
//

/**
 * Adds a new upload item.
 */
export function addUpload(id: string, name: string, parentId: string | null): void {
    $uploads.setKey(id, {
        id,
        name,
        progress: 0,
        parentId,
        status: 'pending',
    });
}

/**
 * Updates upload progress.
 */
export function updateUploadProgress(id: string, progress: number): void {
    const upload = $uploads.get()[id];
    if (!upload) return;

    $uploads.setKey(id, {
        ...upload,
        progress,
        status: progress > 0 ? 'uploading' : upload.status,
    });
}

/**
 * Marks upload as complete.
 */
export function completeUpload(id: string): void {
    const upload = $uploads.get()[id];
    if (!upload) return;

    $uploads.setKey(id, {
        ...upload,
        progress: 100,
        status: 'complete',
    });
}

/**
 * Marks upload as failed.
 */
export function failUpload(id: string, error: string): void {
    const upload = $uploads.get()[id];
    if (!upload) return;

    $uploads.setKey(id, {
        ...upload,
        status: 'error',
        error,
    });
}

/**
 * Removes an upload item.
 */
export function removeUpload(id: string): void {
    const current = $uploads.get();
    if (!(id in current)) return;

    const {[id]: _, ...rest} = current;
    $uploads.set(rest);
}

/**
 * Clears all uploads.
 */
export function clearUploads(): void {
    $uploads.set({});
}

/**
 * Clears all completed uploads.
 */
export function clearCompletedUploads(): void {
    const current = $uploads.get();
    const filtered = Object.fromEntries(Object.entries(current).filter(([, upload]) => upload.status !== 'complete'));
    $uploads.set(filtered);
}

/**
 * Clears all error uploads.
 */
export function clearErrorUploads(): void {
    const current = $uploads.get();
    const filtered = Object.fromEntries(Object.entries(current).filter(([, upload]) => upload.status !== 'error'));
    $uploads.set(filtered);
}

//
// * Selectors
//

/**
 * Gets an upload by ID.
 */
export function getUpload(id: string): UploadItem | undefined {
    return $uploads.get()[id];
}

/**
 * Gets uploads for a specific parent.
 */
export function getUploadsForParent(parentId: string | null): UploadItem[] {
    return Object.values($uploads.get()).filter((upload) => upload.parentId === parentId);
}

/**
 * Gets all active (non-complete, non-error) uploads.
 */
export function getActiveUploads(): UploadItem[] {
    return Object.values($uploads.get()).filter((upload) => upload.status === 'pending' || upload.status === 'uploading');
}

/**
 * Gets all pending uploads.
 */
export function getPendingUploads(): UploadItem[] {
    return Object.values($uploads.get()).filter((upload) => upload.status === 'pending');
}

/**
 * Gets all completed uploads.
 */
export function getCompletedUploads(): UploadItem[] {
    return Object.values($uploads.get()).filter((upload) => upload.status === 'complete');
}

/**
 * Gets all failed uploads.
 */
export function getFailedUploads(): UploadItem[] {
    return Object.values($uploads.get()).filter((upload) => upload.status === 'error');
}

/**
 * Checks if there are any active uploads.
 */
export function hasActiveUploads(): boolean {
    return getActiveUploads().length > 0;
}

/**
 * Gets the count of all uploads.
 */
export function getUploadCount(): number {
    return Object.keys($uploads.get()).length;
}
