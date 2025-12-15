import {Button, Listbox} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {$contextContent, openContextContentForEdit} from '../../../../store/context/contextContent.store';
import {
    $selectedVersions,
    $versionsByDate,
    $visualFocus,
    appendVersions,
    getVisualTargets,
    moveVisualFocus,
    resetVersionsSelection,
    revertToVersion,
    setSelectedVersions,
    setVersions, setVisualFocus,
    toggleVersionSelection,
} from '../../../../store/context/versionStore';
import {loadContentVersions} from '../../../../utils/widget/versions/versionsLoader';
import {VersionsListItem} from './VersionsListItem';

const COMPONENT_NAME = 'VersionsList';

export const VersionsList = (): ReactElement => {
    const versionsByDate = useStore($versionsByDate);
    const selection = useStore($selectedVersions);
    const selectionArray = useMemo(() => Array.from(selection), [selection]);
    const content = useStore($contextContent);
    const visualFocus = useStore($visualFocus);
    const [activeListItem, setActiveListItem] = useState<string | null>(null);
    const [isFocused, setFocused] = useState(false);
    const showChangesButtonLabel = useI18n('text.versions.showChanges');
    const cancelButtonLabel = useI18n('action.cancel');
    const loadingLabel = useI18n('widget.versions.loading');
    const noVersionsLabel = useI18n('widget.versions.noVersions');
    const [moreToLoad, setMoreToLoad] = useState(true);
    const [offset, setOffset] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const listRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setVisualFocus('compare');
    }, [activeListItem, isFocused]);

    useEffect(() => {
        setActiveListItem(null);
    }, [content]);

    const handleSelectionChange = useCallback((newSelection: string[]) => {
        setSelectedVersions(newSelection);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!activeListItem) return;

        const visualTargets = getVisualTargets(activeListItem);

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopPropagation();
            moveVisualFocus(1, visualTargets);
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            e.stopPropagation();
            moveVisualFocus(-1, visualTargets);
        }

        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();

            switch (visualFocus) {
                case 'edit':
                    openContextContentForEdit();
                    break;
                case 'restore':
                    revertToVersion(activeListItem);
                    break;
                case 'compare':
                    toggleVersionSelection(activeListItem);
                    break;
            }
        }
    }, [activeListItem, visualFocus]);

    const cancelHandler = useCallback(() => {
        resetVersionsSelection();
        listRef.current?.focus();
    }, []);

    // Initial load when content changes
    useEffect(() => {
        if (!content) {
            setVersions([]);
            resetVersionsSelection();
            setMoreToLoad(false);
            setOffset(0);
            return;
        }

        loadContentVersions(content.getContentId(), 0)
            .then((result) => {
                setVersions(result.versions);
                resetVersionsSelection();
                setMoreToLoad(result.hasMore);
                setOffset(result.versions.length);
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
                {noVersionsLabel}
            </div>
        );
    }

    return (
        <div data-component={COMPONENT_NAME} onFocus={() => setFocused(true)}
             onBlur={() => setFocused(false)}>
            {selection.size > 0 &&

             <div className='flex justify-center items-center gap-2.5 sticky top-0 bg-surface-neutral/85 py-3 z-1' data-component={COMPONENT_NAME}>
                 <Button label={showChangesButtonLabel} variant='filled' disabled={selection.size !== 2} />
                 <Button label={cancelButtonLabel} variant='outline' onClick={cancelHandler} />
             </div>
            }

            <Listbox
                selectionMode='multiple'
                selection={selectionArray}
                focusMode={'activedescendant'}
                active={activeListItem}
                setActive={setActiveListItem}
                onSelectionChange={handleSelectionChange}
            >
                <Listbox.Content className='flex flex-col gap-7.5 max-h-none p-0 overflow-y-visible' onKeyDownCapture={handleKeyDown} ref={listRef}>
                    {Object.entries(versionsByDate).map(([date, versions]) => (
                        <div key={date} className='flex flex-col gap-3 w-full'>
                            <div className='text-base font-semibold'>{date}</div>

                            <div className='flex flex-col gap-1.25'>
                                {versions.map((version) => (
                                    <Listbox.Item key={version.getId()}
                                                  value={version.getId()}
                                                  className='p-0 data-[active=true]:ring-1 data-[active=true]:ring-offset-0 rounded-sm'
                                                  data-active={isFocused && activeListItem === version.getId()}
                                    >
                                        <VersionsListItem version={version} isFocused={isFocused} />
                                    </Listbox.Item>
                                ))}
                            </div>
                        </div>
                    ))}
                </Listbox.Content>
            </Listbox>

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
