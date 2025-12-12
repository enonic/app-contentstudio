import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {
    $selectedVersions,
    $versionsByDate,
    appendVersions,
    resetVersionsSelection,
    setExpandedVersion,
    setVersions
} from '../../../../store/context/versionStore';
import {loadContentVersions} from '../../../../utils/widget/versions/versionsLoader';
import {VersionsListItem} from './VersionsListItem';
import {VersionSelectionToolbar} from './VersionSelectionToolbar';

const COMPONENT_NAME = 'VersionsList';

export const VersionsList = (): ReactElement => {
    const versionsByDate = useStore($versionsByDate);
    const selection = useStore($selectedVersions);
    const content = useStore($contextContent);

    const loadingLabel = useI18n('widget.versions.loading');

    const [moreToLoad, setMoreToLoad] = useState(true);
    const [offset, setOffset] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    // Initial load when content changes
    useEffect(() => {
        if (!content) {
            setVersions([]);
            resetVersionsSelection();
            setMoreToLoad(false);
            setOffset(0);
            setExpandedVersion(undefined);
            return;
        }

        loadContentVersions(content.getContentId(), 0)
            .then((result) => {
                setVersions(result.versions);
                resetVersionsSelection();
                setMoreToLoad(result.hasMore);
                setOffset(result.versions.length);
                setExpandedVersion(undefined);
            })
            .catch(() => {
                // TODO: handle error
            });

    }, [content]);

    const loadMore = useCallback(async () => {
        if (!content || !moreToLoad || isLoadingMore) return;

        setIsLoadingMore(true);

        try {
            const result = await loadContentVersions(content.getContentId(), offset);
            appendVersions(result.versions);
            setMoreToLoad(result.hasMore);
            setOffset((x) => x + result.versions.length);
        } catch (err) {
            // TODO: handle error
        } finally {
            setIsLoadingMore(false);
        }
    }, [content, offset, moreToLoad, isLoadingMore]);

    useEffect(() => {
        if (!moreToLoad || isLoadingMore) return;

        const node = loadMoreRef.current;
        if (!node) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMore();
            }
        }, {
            root: null,
            rootMargin: '200px',
            threshold: 0.1
        });

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, [moreToLoad, isLoadingMore, loadMore]);

    if (Object.keys(versionsByDate).length === 0) {
        return (
            <div className='text-center text-subtle'>
                {useI18n('widget.versions.noVersions')}
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-7.5' data-component={COMPONENT_NAME}>
            {selection.size > 0 && <VersionSelectionToolbar />}

            {Object.entries(versionsByDate).map(([date, versions]) => (
                <div key={date} className='flex flex-col gap-3 w-full'>
                    <div className='text-base font-semibold'>{date}</div>

                    <div className='flex flex-col gap-1.25'>
                        {versions.map((version) => (
                            <VersionsListItem key={version.getId()} version={version} />
                        ))}
                    </div>
                </div>
            ))}

            {isLoadingMore && (
                <div className='flex items-center justify-center text-sm text-grey-600'>
                    {loadingLabel}
                </div>
            )}

            {moreToLoad && !isLoadingMore && (
                <div ref={loadMoreRef} className='h-10 w-full opacity-0' />
            )}
        </div>
    );
};
