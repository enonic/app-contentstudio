import {useCallback, useEffect, useRef, useState} from 'react';
import {type ContentId} from '../../../../../../../app/content/ContentId';
import {type ContentSummary} from '../../../../../../../app/content/ContentSummary';
import {setOnlineVersionId} from '../../../../../store/context/versionPublishState';
import {
    $allVersionsLoaded,
    appendVersions,
    resetVersionsSelection,
    setContentCreatedTime,
    setVersions,
} from '../../../../../store/context/versionStore';
import {useVersionsConfig} from '../config/VersionsConfigContext';

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
    const {services} = useVersionsConfig();
    const loadVersions = services.loadVersions;
    const subscribeContentInvalidation = services.subscribeContentInvalidation;

    const [hasMore, setHasMore] = useState(true);
    const [cursor, setCursor] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const loadIdRef = useRef(0);

    const loadInitialVersions = useCallback((contentId: ContentId, createdDate: Date) => {
        const id = ++loadIdRef.current;

        setIsLoading(true);
        setError(null);
        setContentCreatedTime(createdDate);

        loadVersions(contentId)
            .then((result) => {
                if (loadIdRef.current !== id) return;
                setVersions(result.versions);
                setOnlineVersionId(result.onlineVersionId);
                resetVersionsSelection();
                setHasMore(result.hasMore);
                $allVersionsLoaded.set(!result.hasMore);
                setCursor(result.cursor);
            })
            .catch((err) => {
                if (loadIdRef.current !== id) return;
                setError(err instanceof Error ? err : new Error('Failed to load versions'));
            })
            .finally(() => {
                if (loadIdRef.current === id) setIsLoading(false);
            });
    }, [loadVersions]);

    // Initial load when content changes
    useEffect(() => {
        if (!content) {
            loadIdRef.current++;
            setVersions([]);
            setOnlineVersionId(undefined);
            setContentCreatedTime(undefined);
            resetVersionsSelection();
            setHasMore(false);
            $allVersionsLoaded.set(false);
            setCursor(undefined);
            setError(null);
            return;
        }

        loadInitialVersions(content.getContentId(), content.getCreatedTime());
    }, [content, loadInitialVersions]);

    // Reload when content invalidation is signaled for the current content
    useEffect(() => {
        if (!content || !subscribeContentInvalidation) return;

        return subscribeContentInvalidation((invalidatedId) => {
            if (invalidatedId === content.getId()) {
                loadInitialVersions(content.getContentId(), content.getCreatedTime());
            }
        });
    }, [content, subscribeContentInvalidation, loadInitialVersions]);

    const loadMore = useCallback(async () => {
        if (!content || !hasMore || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await loadVersions(content.getContentId(), cursor);
            appendVersions(result.versions);
            setHasMore(result.hasMore);
            $allVersionsLoaded.set(!result.hasMore);
            setCursor(result.cursor);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load more versions'));
        } finally {
            setIsLoading(false);
        }
    }, [content, cursor, hasMore, isLoading, loadVersions]);

    return {
        hasMore,
        isLoading,
        error,
        loadMore
    };
};
