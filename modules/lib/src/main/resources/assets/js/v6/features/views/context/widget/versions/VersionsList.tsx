import {Listbox} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {
    $selectedVersions,
    $versions,
    $versionsByDate,
    setSelectedVersions,
} from '../../../../store/context/versionStore';
import {useInfiniteScroll} from '../../../../hooks/useInfiniteScroll';
import {useVersionsData} from './hooks/useVersionsData';
import {useVersionsKeyboard} from './hooks/useVersionsKeyboard';
import {VersionsListContent} from './VersionsListContent';
import {VersionSelectionToolbar} from './VersionSelectionToolbar';
import {VersionsShowAllActivitiesSection} from './VersionsShowAllActivitiesSection';

const INFINITE_SCROLL_CONFIG = {
    ROOT_MARGIN: '200px',
    THRESHOLD: 0.1,
};

const COMPONENT_NAME = 'VersionsList';

/**
 * Main versions list component
 * Displays content versions grouped by date with infinite scroll and keyboard navigation
 */
export const VersionsList = (): ReactElement => {
    const versions = useStore($versions);
    const versionsByDate = useStore($versionsByDate);
    const selection = useStore($selectedVersions);
    const selectionArray = useMemo(() => Array.from(selection), [selection]);
    const content = useStore($contextContent);

    const [activeVersionId, setActiveVersionId] = useState<string | null>(null);
    const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
    const [restoreFocusVersionId, setRestoreFocusVersionId] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    const listRef = useRef<HTMLDivElement | null>(null);

    const noVersionsLabel = useI18n('widget.versions.noVersions');
    const loadingLabel = useI18n('widget.versions.loading');

    // Custom hooks for data loading and keyboard handling
    const {hasMore, isLoading, error, loadMore} = useVersionsData(content);

    const expandVersion = useCallback((versionId: string) => {
        setExpandedVersionId((current) => current === versionId ? current : versionId);
    }, []);

    const collapseExpanded = useCallback(() => {
        setExpandedVersionId(null);
    }, []);

    const toggleExpanded = useCallback((versionId: string) => {
        setExpandedVersionId((current) => current === versionId ? null : versionId);
    }, []);

    const {handleKeyDown} = useVersionsKeyboard({
        contentId: content.getContentId(),
        activeListItemId: activeVersionId,
        expandedVersionId,
        restoreFocusVersionId,
        onExpand: expandVersion,
        onCollapse: collapseExpanded,
        onSetRestoreFocus: setRestoreFocusVersionId,
    });

    // Infinite scroll observer
    const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
        hasMore,
        isLoading,
        onLoadMore: loadMore,
        rootMargin: INFINITE_SCROLL_CONFIG.ROOT_MARGIN,
        threshold: INFINITE_SCROLL_CONFIG.THRESHOLD
    });

    // Reset active version and collapse when content changes
    useEffect(() => {
        setActiveVersionId(null);
        setExpandedVersionId(null);
        setRestoreFocusVersionId(null);
    }, [content]);

    // Collapse expanded item when active item changes
    useEffect(() => {
        if (expandedVersionId && expandedVersionId !== activeVersionId) {
            setExpandedVersionId(null);
        }
        setRestoreFocusVersionId(null);
    }, [activeVersionId, expandedVersionId]);

    // Clear restore focus when nothing is expanded
    useEffect(() => {
        if (!expandedVersionId) {
            setRestoreFocusVersionId(null);
        }
    }, [expandedVersionId]);

    // Collapse when list loses focus
    useEffect(() => {
        if (!isFocused) {
            setExpandedVersionId(null);
            setRestoreFocusVersionId(null);
        }
    }, [isFocused]);

    const handleSelectionChange = useCallback((newSelection: string[]) => {
        setSelectedVersions(newSelection);
    }, []);

    const handleCancelSelection = useCallback(() => {
        listRef.current?.focus();
    }, []);

    const handleFocus = useCallback(() => setIsFocused(true), []);
    const handleBlur = useCallback(() => setIsFocused(false), []);

    // Show error state
    if (error) {
        return (
            <div className='text-center text-red-600'>
                {error.message}
            </div>
        );
    }

    // Show empty state
    if (versions.length === 0 && !isLoading) {
        return (
            <div className='text-center text-subtle'>
                {noVersionsLabel}
            </div>
        );
    }

    return (
        <div
            data-component={COMPONENT_NAME}
            className={'flex flex-col gap-5'}
        >
            {selection.size === 0 && <VersionsShowAllActivitiesSection />}

            {selection.size > 0 && (
                <VersionSelectionToolbar
                    selectionSize={selection.size}
                    selectedVersionIds={selectionArray}
                    content={content}
                    onCancel={handleCancelSelection}
                />
            )}

            <div onFocus={handleFocus} onBlur={handleBlur}>
                <Listbox
                    selectionMode='multiple'
                    selection={selectionArray}
                    focusMode='activedescendant'
                    active={activeVersionId}
                    setActive={setActiveVersionId}
                    onSelectionChange={handleSelectionChange}
                >
                    <VersionsListContent
                        content={content}
                        versionsByDate={versionsByDate}
                        activeVersionId={activeVersionId}
                        expandedVersionId={expandedVersionId}
                        restoreFocusVersionId={restoreFocusVersionId}
                        isFocused={isFocused}
                        onKeyDown={handleKeyDown}
                        onToggleExpanded={toggleExpanded}
                        listRef={listRef}
                    />
                </Listbox>

                {isLoading && (
                    <div className='flex items-center justify-center text-sm text-grey-600'>
                        {loadingLabel}
                    </div>
                )}

                {hasMore && !isLoading && (
                    <div ref={loadMoreRef} className='h-10 w-full opacity-0' />
                )}
            </div>
        </div>
    );
};

VersionsList.displayName = COMPONENT_NAME;
