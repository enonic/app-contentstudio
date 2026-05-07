import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {Button, cn, Combobox, Toggle, Tooltip} from '@enonic/ui';
import {AlertCircle, ListTree, RefreshCw} from 'lucide-react';
import {useId, useMemo, type ReactElement} from 'react';
import type {ContentSummary} from '../../../../../../app/content/ContentSummary';
import {useI18n} from '../../../../hooks/useI18n';
import type {ContentRowProps} from '../../shared/combobox/ContentRow';
import {ContentComboboxList} from './ContentComboboxList';
import {useContentComboboxController, type UseContentComboboxControllerOptions} from './useContentComboboxController';

//
// * Constants
//

const EMPTY_STRING_ARRAY: string[] = [];

//
// * Types
//

export type ContentComboboxProps = {
    'selection': readonly string[];
    'onSelectionChange': (selection: readonly string[]) => void;
    'selectionMode'?: 'single' | 'multiple';
    'listMode'?: 'tree' | 'flat';
    'closeOnBlur'?: boolean;
    'disabled'?: boolean;
    'label'?: string;
    'placeholder'?: string;
    'searchPlaceholder'?: string;
    'emptyLabel'?: string;
    'withRightButton'?: boolean;
    'className'?: string;
    'hideToggleIcon'?: boolean;
    'error'?: boolean;
    'aria-label'?: string;

    /** Row renderer */
    'rowRenderer'?: (props: ContentRowProps) => ReactElement;
    /** Height for each tree row in pixels */
    'rowTreeHeight'?: number;
    /** Height for each flat row in pixels */
    'rowFlatHeight'?: number;
    /** If set, the flat row height will be calculated as a percentage of the container's width */
    'rowFlatHeightRatio'?: number;
    /** Maximum height for the dropdown in pixels */
    'dropdownMaxHeight'?: number;

    /** Content types to filter by (e.g., ['app:article', 'media:image']) */
    'contentTypeNames'?: string[];
    /** Allowed content paths for site restriction (e.g., ['${site}']) */
    'allowedContentPaths'?: string[];
    /** Context content for path matching in query expressions */
    'contextContent'?: ContentSummary;
    /** Application key for filtering */
    'applicationKey'?: ApplicationKey;
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
    'listMode': externalListMode = 'tree',
    closeOnBlur = false,
    disabled = false,
    label,
    placeholder,
    searchPlaceholder,
    emptyLabel,
    withRightButton = false,
    className,
    error = false,
    hideToggleIcon = false,
    'aria-label': ariaLabel,
    rowRenderer,
    rowTreeHeight,
    rowFlatHeight,
    rowFlatHeightRatio,
    dropdownMaxHeight,
    contentTypeNames = EMPTY_STRING_ARRAY,
    allowedContentPaths = EMPTY_STRING_ARRAY,
    contextContent,
    applicationKey,
}: ContentComboboxProps): ReactElement => {
    // Accessibility IDs
    const labelId = useId();

    // i18n
    const defaultPlaceholder = useI18n('field.option.placeholder');
    const defaultEmptyLabel = useI18n('field.search.noItems');
    const treeViewLabel = useI18n('field.view.tree');
    const listViewLabel = useI18n('field.view.list');
    const errorLabel = useI18n('field.error.loadFailed');
    const retryLabel = useI18n('action.retry');

    // Memoize filter options to avoid recreating on every render
    const filterOptions: UseContentComboboxControllerOptions['filters'] = useMemo(
        () => ({
            contextContent,
            contentTypeNames,
            allowedContentPaths,
            applicationKey,
        }),
        [contextContent, contentTypeNames, allowedContentPaths, applicationKey]
    );

    const dropdownOptions: UseContentComboboxControllerOptions['dropdown'] = useMemo(
        () => ({
            treeRowHeight: rowTreeHeight,
            flatRowHeight: rowFlatHeight,
            flatRowHeightRatio: rowFlatHeightRatio,
            maxHeight: dropdownMaxHeight,
        }),
        [rowTreeHeight, rowFlatHeight, rowFlatHeightRatio, dropdownMaxHeight]
    );

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
        error: internalError,
        retry,
    } = useContentComboboxController({filters: filterOptions, listMode: externalListMode, dropdown: dropdownOptions});

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
        <div data-component={CONTENT_COMBOBOX_NAME} className={cn('flex flex-col gap-2.5', className)}>
            {label && (
                <label id={labelId} className="text-md font-semibold">
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
                contentType="tree"
                closeOnBlur={closeOnBlur}
                disabled={disabled}
                error={error}
            >
                <Combobox.Content onKeyDown={handleKeyDown}>
                    <Combobox.Control className={cn(withRightButton && 'rounded-tr-none rounded-br-none')}>
                        <Combobox.Search className={cn(!hideToggleIcon && 'pl-0', withRightButton && 'rounded-tr-none rounded-br-none')}>
                            {hideToggleIcon ? (
                                <Combobox.SearchIcon />
                            ) : (
                                <Tooltip delay={300} value="⌘/Ctrl+Shift+V">
                                    <Toggle
                                        startIcon={ListTree}
                                        size="sm"
                                        iconSize="md"
                                        pressed={isTreeView}
                                        onPressedChange={handleToggleView}
                                        aria-label={isTreeView ? treeViewLabel : listViewLabel}
                                        tabIndex={-1}
                                        className={cn(
                                            'ml-1.25 size-9 shrink-0 rounded-[0.1875rem] p-0 hover:bg-surface-neutral-hover',
                                            'after:-inset-1.25 after:-z-10 relative z-0 overflow-visible after:pointer-events-auto after:absolute after:rounded-sm after:content-[""]'
                                        )}
                                    />
                                </Tooltip>
                            )}
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
                            {internalError ? (
                                <div className="flex flex-col items-center justify-center gap-3 p-4">
                                    <AlertCircle className="size-8 text-danger" />
                                    <span className="text-sm text-subtle">{resolvedErrorLabel}</span>
                                    <Button size="sm" variant="outline" startIcon={RefreshCw} onClick={retry}>
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
                                    rowRenderer={rowRenderer}
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
