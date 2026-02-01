import type {ReactElement} from 'react';
import {ContentCombobox} from './combobox';
import type {ContentSelectorFilterOptions, ContentSelectorMode} from './content-selector.types';
import {ContentSelection} from './selection';

//
// * Types
//

export type ContentSelectorProps = {
    /** Selected content IDs */
    selection: readonly string[];
    /** Callback when selection changes */
    onSelectionChange: (selection: readonly string[]) => void;
    /** Selection mode */
    selectionMode?: ContentSelectorMode;
    /** Whether the selector is disabled */
    disabled?: boolean;
    /** Label for the selector */
    label?: string;
    /** Placeholder text for the search input */
    placeholder?: string;
    /** Text shown when no results found */
    emptyLabel?: string;
    /** Additional CSS class for the wrapper */
    className?: string;
    /** Aria label for accessibility */
    'aria-label'?: string;
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
    'aria-label': ariaLabel,
    contentTypeNames,
    allowedContentPaths,
    contextContent,
    applicationKey,
}: ContentSelectorProps): ReactElement => {
    return (
        <div
            data-component={CONTENT_SELECTOR_NAME}
            className={className}
        >
            <ContentCombobox
                selection={selection}
                onSelectionChange={onSelectionChange}
                selectionMode={selectionMode}
                disabled={disabled}
                label={label}
                placeholder={placeholder}
                emptyLabel={emptyLabel}
                aria-label={ariaLabel}
                contentTypeNames={contentTypeNames}
                allowedContentPaths={allowedContentPaths}
                contextContent={contextContent}
                applicationKey={applicationKey}
            />
            <ContentSelection
                selection={selection}
                onSelectionChange={onSelectionChange}
                disabled={disabled}
            />
        </div>
    );
};

ContentSelector.displayName = CONTENT_SELECTOR_NAME;
