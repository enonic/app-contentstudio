import {cn} from '@enonic/ui';
import type {ReactElement} from 'react';
import {ContentCombobox} from './combobox';
import type {ContentSelectorFilterOptions, ContentSelectorMode} from './content-selector.types';
import {ContentSelection} from './selection';
import {ContentComboboxRowProps} from './combobox/ContentComboboxRow';

//
// * Types
//
export type ContentSelectorProps = {
    /** Selected content IDs */
    'selection': readonly string[];
    /** Callback when selection changes */
    'onSelectionChange': (selection: readonly string[]) => void;
    /** Selection mode */
    'selectionMode'?: ContentSelectorMode;
    /** List mode */
    'listMode'?: 'tree' | 'flat';
    /** Whether the selector is disabled */
    'disabled'?: boolean;
    /** Label for the selector */
    'label'?: string;
    /** Placeholder text for the search input */
    'placeholder'?: string;
    /** Text shown when no results found */
    'emptyLabel'?: string;
    /** Additional CSS class for the wrapper */
    'className'?: string;
    /** Additional CSS class for the input */
    'inputClassName'?: string;
    /** Aria label for accessibility */
    'aria-label'?: string;
    /** Whether to hide the toggle icon */
    'hideToggleIcon'?: boolean;
    /** Whether the selector has an error */
    'error'?: boolean;
    /** Custom row renderer */
    'rowRenderer'?: (props: ContentComboboxRowProps) => ReactElement;
} & ContentSelectorFilterOptions;

//
// * Constants
//

const CONTENT_SELECTOR_NAME = 'ContentSelector';

//
// * Component
//

/**
 * Facade component that composes ContentCombobox and ContentSelection.
 * Provides a complete content selection experience with search, tree/list view,
 * and display of selected items.
 *
 * For single selection mode: hides combobox when an item is selected,
 * showing only the selected item with a remove button.
 *
 * For multiple selection mode: uses staged selection in the combobox.
 *
 * Use this component when you need both the combobox picker and the selected
 * items display. For just the picker, use ContentCombobox directly.
 */
export const ContentSelector = ({
    selection,
    onSelectionChange,
    selectionMode = 'multiple',
    disabled = false,
    label,
    placeholder,
    emptyLabel,
    className,
    inputClassName,
    hideToggleIcon = false,
    error = false,
    listMode,
    'aria-label': ariaLabel,
    contentTypeNames,
    allowedContentPaths,
    contextContent,
    applicationKey,
    rowRenderer,
}: ContentSelectorProps): ReactElement => {
    const isSingleMode = selectionMode === 'single';
    const hasSelection = selection.length > 0;
    const hideCombobox = isSingleMode && hasSelection;

    return (
        <div data-component={CONTENT_SELECTOR_NAME} className={cn('flex flex-col gap-2.5', className)}>
            {!hideCombobox && (
                <ContentCombobox
                    selection={selection}
                    onSelectionChange={onSelectionChange}
                    selectionMode={selectionMode}
                    listMode={listMode}
                    disabled={disabled}
                    label={label}
                    placeholder={placeholder}
                    emptyLabel={emptyLabel}
                    hideToggleIcon={hideToggleIcon}
                    error={error}
                    aria-label={ariaLabel}
                    contentTypeNames={contentTypeNames}
                    allowedContentPaths={allowedContentPaths}
                    contextContent={contextContent}
                    applicationKey={applicationKey}
                    rowRenderer={rowRenderer}
                    inputClassName={inputClassName}
                />
            )}
            <ContentSelection selection={selection} onSelectionChange={onSelectionChange} disabled={disabled} />
        </div>
    );
};

ContentSelector.displayName = CONTENT_SELECTOR_NAME;
