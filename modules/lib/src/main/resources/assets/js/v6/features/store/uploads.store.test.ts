import {describe, it, expect, beforeEach} from 'vitest';
import {
    $uploads,
    addUpload,
    updateUploadProgress,
    completeUpload,
    failUpload,
    removeUpload,
    clearUploads,
    clearCompletedUploads,
    clearErrorUploads,
    getUpload,
    getUploadsForParent,
    getActiveUploads,
    getPendingUploads,
    getCompletedUploads,
    getFailedUploads,
    hasActiveUploads,
    getUploadCount,
} from './uploads.store';

describe('uploads.store', () => {
    beforeEach(() => {
        clearUploads();
    });

    describe('addUpload', () => {
        it('adds a new upload with pending status', () => {
            addUpload('upload-1', 'file.png', 'parent-1');

            const upload = getUpload('upload-1');

            expect(upload).toBeDefined();
            expect(upload?.name).toBe('file.png');
            expect(upload?.parentId).toBe('parent-1');
            expect(upload?.progress).toBe(0);
            expect(upload?.status).toBe('pending');
        });

        it('allows null parent for root uploads', () => {
            addUpload('upload-1', 'file.png', null);

            const upload = getUpload('upload-1');

            expect(upload?.parentId).toBeNull();
        });
    });

    describe('updateUploadProgress', () => {
        it('updates progress and status to uploading', () => {
            addUpload('upload-1', 'file.png', null);

            updateUploadProgress('upload-1', 50);

            const upload = getUpload('upload-1');
            expect(upload?.progress).toBe(50);
            expect(upload?.status).toBe('uploading');
        });

        it('keeps pending status when progress is 0', () => {
            addUpload('upload-1', 'file.png', null);

            updateUploadProgress('upload-1', 0);

            const upload = getUpload('upload-1');
            expect(upload?.status).toBe('pending');
        });

        it('does nothing for non-existent upload', () => {
            updateUploadProgress('non-existent', 50);
            expect(getUpload('non-existent')).toBeUndefined();
        });
    });

    describe('completeUpload', () => {
        it('sets progress to 100 and status to complete', () => {
            addUpload('upload-1', 'file.png', null);
            updateUploadProgress('upload-1', 50);

            completeUpload('upload-1');

            const upload = getUpload('upload-1');
            expect(upload?.progress).toBe(100);
            expect(upload?.status).toBe('complete');
        });

        it('does nothing for non-existent upload', () => {
            completeUpload('non-existent');
            expect(getUpload('non-existent')).toBeUndefined();
        });
    });

    describe('failUpload', () => {
        it('sets status to error with message', () => {
            addUpload('upload-1', 'file.png', null);

            failUpload('upload-1', 'File too large');

            const upload = getUpload('upload-1');
            expect(upload?.status).toBe('error');
            expect(upload?.error).toBe('File too large');
        });

        it('does nothing for non-existent upload', () => {
            failUpload('non-existent', 'Error');
            expect(getUpload('non-existent')).toBeUndefined();
        });
    });

    describe('removeUpload', () => {
        it('removes upload from store', () => {
            addUpload('upload-1', 'file.png', null);

            removeUpload('upload-1');

            expect(getUpload('upload-1')).toBeUndefined();
        });

        it('does nothing for non-existent upload', () => {
            removeUpload('non-existent');
            // Should not throw
            expect(getUploadCount()).toBe(0);
        });
    });

    describe('clearUploads', () => {
        it('removes all uploads', () => {
            addUpload('upload-1', 'file1.png', null);
            addUpload('upload-2', 'file2.png', null);

            clearUploads();

            expect(getUploadCount()).toBe(0);
        });
    });

    describe('clearCompletedUploads', () => {
        it('removes only completed uploads', () => {
            addUpload('upload-1', 'file1.png', null);
            addUpload('upload-2', 'file2.png', null);
            addUpload('upload-3', 'file3.png', null);

            completeUpload('upload-1');
            completeUpload('upload-3');

            clearCompletedUploads();

            expect(getUpload('upload-1')).toBeUndefined();
            expect(getUpload('upload-2')).toBeDefined();
            expect(getUpload('upload-3')).toBeUndefined();
        });
    });

    describe('clearErrorUploads', () => {
        it('removes only error uploads', () => {
            addUpload('upload-1', 'file1.png', null);
            addUpload('upload-2', 'file2.png', null);

            failUpload('upload-1', 'Error');

            clearErrorUploads();

            expect(getUpload('upload-1')).toBeUndefined();
            expect(getUpload('upload-2')).toBeDefined();
        });
    });

    describe('getUpload', () => {
        it('returns upload by ID', () => {
            addUpload('upload-1', 'file.png', null);

            const upload = getUpload('upload-1');

            expect(upload?.id).toBe('upload-1');
        });

        it('returns undefined for non-existent upload', () => {
            expect(getUpload('non-existent')).toBeUndefined();
        });
    });

    describe('getUploadsForParent', () => {
        it('returns uploads for specific parent', () => {
            addUpload('upload-1', 'file1.png', 'parent-1');
            addUpload('upload-2', 'file2.png', 'parent-2');
            addUpload('upload-3', 'file3.png', 'parent-1');

            const uploads = getUploadsForParent('parent-1');

            expect(uploads).toHaveLength(2);
            expect(uploads.map((u) => u.id).sort()).toEqual(['upload-1', 'upload-3']);
        });

        it('returns uploads for root (null parent)', () => {
            addUpload('upload-1', 'file1.png', null);
            addUpload('upload-2', 'file2.png', 'parent-1');

            const uploads = getUploadsForParent(null);

            expect(uploads).toHaveLength(1);
            expect(uploads[0].id).toBe('upload-1');
        });

        it('returns empty array when no uploads for parent', () => {
            addUpload('upload-1', 'file1.png', 'parent-1');

            expect(getUploadsForParent('parent-2')).toEqual([]);
        });
    });

    describe('getActiveUploads', () => {
        it('returns pending and uploading uploads', () => {
            addUpload('upload-1', 'file1.png', null); // pending
            addUpload('upload-2', 'file2.png', null);
            updateUploadProgress('upload-2', 50); // uploading
            addUpload('upload-3', 'file3.png', null);
            completeUpload('upload-3'); // complete
            addUpload('upload-4', 'file4.png', null);
            failUpload('upload-4', 'Error'); // error

            const active = getActiveUploads();

            expect(active).toHaveLength(2);
            expect(active.map((u) => u.id).sort()).toEqual(['upload-1', 'upload-2']);
        });
    });

    describe('getPendingUploads', () => {
        it('returns only pending uploads', () => {
            addUpload('upload-1', 'file1.png', null);
            addUpload('upload-2', 'file2.png', null);
            updateUploadProgress('upload-2', 50);

            const pending = getPendingUploads();

            expect(pending).toHaveLength(1);
            expect(pending[0].id).toBe('upload-1');
        });
    });

    describe('getCompletedUploads', () => {
        it('returns only completed uploads', () => {
            addUpload('upload-1', 'file1.png', null);
            addUpload('upload-2', 'file2.png', null);
            completeUpload('upload-1');

            const completed = getCompletedUploads();

            expect(completed).toHaveLength(1);
            expect(completed[0].id).toBe('upload-1');
        });
    });

    describe('getFailedUploads', () => {
        it('returns only failed uploads', () => {
            addUpload('upload-1', 'file1.png', null);
            addUpload('upload-2', 'file2.png', null);
            failUpload('upload-1', 'Error');

            const failed = getFailedUploads();

            expect(failed).toHaveLength(1);
            expect(failed[0].id).toBe('upload-1');
        });
    });

    describe('hasActiveUploads', () => {
        it('returns true when there are active uploads', () => {
            addUpload('upload-1', 'file1.png', null);

            expect(hasActiveUploads()).toBe(true);
        });

        it('returns false when no active uploads', () => {
            addUpload('upload-1', 'file1.png', null);
            completeUpload('upload-1');

            expect(hasActiveUploads()).toBe(false);
        });

        it('returns false for empty store', () => {
            expect(hasActiveUploads()).toBe(false);
        });
    });

    describe('getUploadCount', () => {
        it('returns total upload count', () => {
            addUpload('upload-1', 'file1.png', null);
            addUpload('upload-2', 'file2.png', null);

            expect(getUploadCount()).toBe(2);
        });

        it('returns 0 for empty store', () => {
            expect(getUploadCount()).toBe(0);
        });
    });
});
