import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {Button, Combobox, Toggle, Tooltip, cn} from '@enonic/ui';
import {AlertCircle, ListTree, RefreshCw} from 'lucide-react';
import {useId, useMemo, type ReactElement} from 'react';
import type {ContentSummary} from '../../../../../../app/content/ContentSummary';
import type {ContentFilterOptions} from '../../../../hooks/useContentComboboxData';
import {useI18n} from '../../../../hooks/useI18n';
import {ContentComboboxList} from './ContentComboboxList';
import {useContentComboboxController} from './useContentComboboxController';

//
// * Constants
//

const EMPTY_STRING_ARRAY: string[] = [];

//
// * Types
//

export type ContentComboboxProps = {
    selection: readonly string[];
    onSelectionChange: (selection: readonly string[]) => void;
    selectionMode?: 'single' | 'multiple';
    disabled?: boolean;
    label?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyLabel?: string;
    className?: string;
    'aria-label'?: string;
    /** Content types to filter by (e.g., ['app:article', 'media:image']) */
    contentTypeNames?: string[];
    /** Allowed content paths for site restriction (e.g., ['${site}']) */
    allowedContentPaths?: string[];
    /** Context content for path matching in query expressions */
    contextContent?: ContentSummary;
    /** Application key for filtering */
    applicationKey?: ApplicationKey;
};

//
// * Constants
//

const CONTENT_COMBOBOX_NAME = 'ContentCombobox';

//
// * Component
//

export const ContentCombobox = ({
    selection,
    onSelectionChange,
    selectionMode = 'multiple',
    disabled = false,
    label,
    placeholder,
    searchPlaceholder,
    emptyLabel,
    className,
    'aria-label': ariaLabel,
    contentTypeNames = EMPTY_STRING_ARRAY,
    allowedContentPaths = EMPTY_STRING_ARRAY,
    contextContent,
    applicationKey,
}: ContentComboboxProps): ReactElement => {
    // Accessibility IDs
    const labelId = useId();

    // i18n
    const defaultPlaceholder = useI18n('field.search.placeholder');
    const defaultEmptyLabel = useI18n('field.search.noItems');
    const treeViewLabel = useI18n('field.view.tree');
    const listViewLabel = useI18n('field.view.list');
    const errorLabel = useI18n('field.error.loadFailed');
    const retryLabel = useI18n('field.error.retry');

    // Memoize filter options to avoid recreating on every render
    const filterOptions: ContentFilterOptions = useMemo(() => ({
        contextContent,
        contentTypeNames,
        allowedContentPaths,
        applicationKey,
    }), [contextContent, contentTypeNames, allowedContentPaths, applicationKey]);

    // Controller hook handles all state and logic
    const {
        virtuosoRef,
        inputRef,
        open,
        isTreeView,
        inputValue,
        activeId,
        setInputValue,
        setActiveId,
        handleOpenChange,
        handleToggleView,
        handleKeyDown,
        handleExpand,
        handleCollapse,
        handleLoadMore,
        handleFlatListEndReached,
        displayItems,
        listMode,
        isLoading,
        hasMore,
        dropdownHeight,
        error,
        retry,
    } = useContentComboboxController({filters: filterOptions});

    // Resolved labels
    const resolvedPlaceholder = placeholder ?? defaultPlaceholder;
    const resolvedSearchPlaceholder = searchPlaceholder ?? resolvedPlaceholder;
    const resolvedEmptyLabel = emptyLabel ?? defaultEmptyLabel;
    const resolvedAriaLabel = ariaLabel ?? label ?? 'Content selector';
    const resolvedErrorLabel = errorLabel || 'Failed to load content';
    const resolvedRetryLabel = retryLabel || 'Retry';

    // Use staged selection mode for multiple selection
    const comboboxSelectionMode = selectionMode === 'multiple' ? 'staged' : 'single';

    return (
        <div
            data-component={CONTENT_COMBOBOX_NAME}
            className={cn('flex flex-col gap-2.5', className)}
        >
            {label && (
                <label
                    id={labelId}
                    className='text-md font-semibold'
                >
                    {label}
                </label>
            )}
            <Combobox.Root
                open={open}
                onOpenChange={handleOpenChange}
                value={inputValue}
                onChange={setInputValue}
                selection={selection}
                onSelectionChange={onSelectionChange}
                selectionMode={comboboxSelectionMode}
                contentType='tree'
                closeOnBlur={false}
                disabled={disabled}
            >
                <Combobox.Content onKeyDown={handleKeyDown}>
                    <Combobox.Control>
                        <Combobox.Search className='pl-0'>
                            <Tooltip delay={500} value='⌘/Ctrl+Shift+V'>
                                <Toggle
                                    startIcon={ListTree}
                                    size='sm'
                                    iconSize='md'
                                    pressed={isTreeView}
                                    onPressedChange={handleToggleView}
                                    aria-label={isTreeView ? treeViewLabel : listViewLabel}
                                    tabIndex={-1}
                                    className={cn(
                                        'ml-1.25 size-9 shrink-0 rounded-[0.1875rem] p-0 hover:bg-surface-neutral-hover',
                                        'after:-inset-1.25 after:-z-10 relative z-0 overflow-visible after:pointer-events-auto after:absolute after:rounded-sm after:content-[""]',
                                    )}
                                />
                            </Tooltip>
                            <Combobox.Input
                                ref={inputRef}
                                placeholder={resolvedSearchPlaceholder}
                                aria-labelledby={label ? labelId : undefined}
                                aria-label={!label ? resolvedAriaLabel : undefined}
                            />
                            {selectionMode === 'multiple' && <Combobox.Apply />}
                            <Combobox.Toggle />
                        </Combobox.Search>
                    </Combobox.Control>

                    <Combobox.Portal>
                        <Combobox.Popup>
                            {error ? (
                                <div className='flex flex-col items-center justify-center gap-3 p-4'>
                                    <AlertCircle className='size-8 text-danger' />
                                    <span className='text-sm text-subtle'>{resolvedErrorLabel}</span>
                                    <Button
                                        size='sm'
                                        variant='outline'
                                        startIcon={RefreshCw}
                                        onClick={retry}
                                    >
                                        {resolvedRetryLabel}
                                    </Button>
                                </div>
                            ) : (
                                <ContentComboboxList
                                    items={displayItems}
                                    mode={listMode}
                                    activeId={activeId}
                                    onActiveChange={setActiveId}
                                    onExpand={handleExpand}
                                    onCollapse={handleCollapse}
                                    onLoadMore={handleLoadMore}
                                    onEndReached={handleFlatListEndReached}
                                    height={dropdownHeight}
                                    ariaLabel={resolvedAriaLabel}
                                    emptyLabel={resolvedEmptyLabel}
                                    isLoading={isLoading}
                                    hasMore={hasMore}
                                    virtuosoRef={virtuosoRef}
                                />
                            )}
                        </Combobox.Popup>
                    </Combobox.Portal>
                </Combobox.Content>
            </Combobox.Root>
        </div>
    );
};

ContentCombobox.displayName = CONTENT_COMBOBOX_NAME;
