import {useCallback, useEffect, useState} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../../app/content/ContentSummaryAndCompareStatus';
import {
    appendVersions,
    resetVersionsSelection,
    setVersions
} from '../../../../../store/context/versionStore';
import {loadContentVersions} from '../../../../../utils/widget/versions/versionsLoader';

/**
 * Hook for managing versions data loading
 * Handles initial load, pagination, and error states
 */
interface UseVersionsDataResult {
    hasMore: boolean;
    isLoading: boolean;
    error: Error | null;
    loadMore: () => Promise<void>;
}

export const useVersionsData = (content: ContentSummaryAndCompareStatus | null): UseVersionsDataResult => {
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Initial load when content changes
    useEffect(() => {
        if (!content) {
            setVersions([]);
            resetVersionsSelection();
            setHasMore(false);
            setOffset(0);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        loadContentVersions(content.getContentId(), 0)
            .then((result) => {
                setVersions(result.versions);
                resetVersionsSelection();
                setHasMore(result.hasMore);
                setOffset(result.versions.length);
            })
            .catch((err) => {
                setError(err instanceof Error ? err : new Error('Failed to load versions'));
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [content]);

    const loadMore = useCallback(async () => {
        if (!content || !hasMore || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await loadContentVersions(content.getContentId(), offset);
            appendVersions(result.versions);
            setHasMore(result.hasMore);
            setOffset((prev) => prev + result.versions.length);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load more versions'));
        } finally {
            setIsLoading(false);
        }
    }, [content, offset, hasMore, isLoading]);

    return {
        hasMore,
        isLoading,
        error,
        loadMore
    };
};

