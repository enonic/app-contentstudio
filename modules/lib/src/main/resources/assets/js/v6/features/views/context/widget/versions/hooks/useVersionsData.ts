import {useCallback, useEffect, useState} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../../../../app/content/ContentSummaryAndCompareStatus';
import {
    appendVersions,
    resetVersionsSelection, setOnlineVersionId,
    setVersions
} from '../../../../../store/context/versionStore';
import {loadContentVersions} from '../../../../../utils/widget/versions/versionsLoader';

/**
 * Hook for managing versions data loading
 * Handles initial load, pagination, and error states
 */
type UseVersionsDataResult = {
    hasMore: boolean;
    isLoading: boolean;
    error: Error | null;
    loadMore: () => Promise<void>;
}

export const useVersionsData = (content: ContentSummaryAndCompareStatus | null): UseVersionsDataResult => {
    const [hasMore, setHasMore] = useState(true);
    const [cursor, setCursor] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Initial load when content changes
    useEffect(() => {
        let cancelled = false;
        if (!content) {
            setVersions([]);
            setOnlineVersionId(undefined);
            resetVersionsSelection();
            setHasMore(false);
            setCursor(undefined);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        loadContentVersions(content.getContentId())
            .then((result) => {
                if (cancelled) return;
                setVersions(result.versions);
                setOnlineVersionId(result.onlineVersionId);
                resetVersionsSelection();
                setHasMore(result.hasMore);
                setCursor(result.cursor);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err instanceof Error ? err : new Error('Failed to load versions'));
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => { cancelled = true; };
    }, [content]);

    const loadMore = useCallback(async () => {
        if (!content || !hasMore || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await loadContentVersions(content.getContentId(), cursor);
            appendVersions(result.versions);
            setHasMore(result.hasMore);
            setCursor(result.cursor);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load more versions'));
        } finally {
            setIsLoading(false);
        }
    }, [content, cursor, hasMore, isLoading]);

    return {
        hasMore,
        isLoading,
        error,
        loadMore
    };
};
