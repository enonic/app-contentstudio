import {useStore} from '@nanostores/preact';
import {useCallback, useEffect, useRef, useState} from 'react';
import {type ContentId} from '../../../../../../../app/content/ContentId';
import {type ContentSummary} from '../../../../../../../app/content/ContentSummary';
import {
    $allVersionsLoaded,
    appendSyntheticCreateVersion,
    appendVersions,
    resetVersionsSelection, setOnlineVersionId,
    setVersions
} from '../../../../../store/context/versionStore';
import {$versionsCacheInvalidated} from '../../../../../utils/widget/versions/versionsCache';
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

export const useVersionsData = (content: ContentSummary | null): UseVersionsDataResult => {
    const [hasMore, setHasMore] = useState(true);
    const [cursor, setCursor] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const cacheInvalidated = useStore($versionsCacheInvalidated);
    const loadIdRef = useRef(0);

    const loadInitialVersions = useCallback((contentId: ContentId, createdDate: Date) => {
        const id = ++loadIdRef.current;

        setIsLoading(true);
        setError(null);

        loadContentVersions(contentId)
            .then((result) => {
                if (loadIdRef.current !== id) return;
                setVersions(result.versions);
                setOnlineVersionId(result.onlineVersionId);
                resetVersionsSelection();
                setHasMore(result.hasMore);
                $allVersionsLoaded.set(!result.hasMore);
                if (!result.hasMore) {
                    appendSyntheticCreateVersion(createdDate);
                }
                setCursor(result.cursor);
            })
            .catch((err) => {
                if (loadIdRef.current !== id) return;
                setError(err instanceof Error ? err : new Error('Failed to load versions'));
            })
            .finally(() => {
                if (loadIdRef.current === id) setIsLoading(false);
            });
    }, []);

    // Initial load when content changes
    useEffect(() => {
        if (!content) {
            loadIdRef.current++;
            setVersions([]);
            setOnlineVersionId(undefined);
            resetVersionsSelection();
            setHasMore(false);
            $allVersionsLoaded.set(false);
            setCursor(undefined);
            setError(null);
            return;
        }

        loadInitialVersions(content.getContentId(), content.getCreatedTime());
    }, [content, loadInitialVersions]);

    // Reload when cache is invalidated for the current content
    useEffect(() => {
        if (!cacheInvalidated || !content) return;
        if (cacheInvalidated.id !== content.getId()) return;

        loadInitialVersions(content.getContentId(), content.getCreatedTime());
    }, [cacheInvalidated, content, loadInitialVersions]);

    const loadMore = useCallback(async () => {
        if (!content || !hasMore || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await loadContentVersions(content.getContentId(), cursor);
            appendVersions(result.versions);
            setHasMore(result.hasMore);
            $allVersionsLoaded.set(!result.hasMore);
            if (!result.hasMore && content) {
                appendSyntheticCreateVersion(content.getCreatedTime());
            }
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
