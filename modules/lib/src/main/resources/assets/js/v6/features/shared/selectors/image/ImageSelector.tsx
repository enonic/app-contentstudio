import {type ReactElement} from 'react';
import {type ImageSelectorFilterOptions, type ImageSelectorMode} from './image-selector.types';
import {cn} from '@enonic/ui';
import {ImageSelection} from './selection/ImageSelection';

export type ImageSelectorProps = {
    /** Selected content IDs */
    selection: readonly string[];
    /** Callback when selection changes */
    onSelectionChange: (selection: readonly string[]) => void;
    /** Selection mode */
    selectionMode?: ImageSelectorMode;
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
} & ImageSelectorFilterOptions;

const IMAGE_SELECTOR_NAME = 'ImageSelector';
const IMAGE_SELECTOR_CONTENT_TYPE_NAMES = ['media:image', 'media:vector'];

export const ImageSelector = ({
    selection,
    onSelectionChange,
    selectionMode = 'multiple',
    disabled = false,
    label,
    placeholder,
    emptyLabel,
    className,
    'aria-label': ariaLabel,
    allowedContentPaths,
    contextContent,
    applicationKey,
}: ImageSelectorProps): ReactElement => {
    return (
        <div data-component={IMAGE_SELECTOR_NAME} className={cn('flex flex-col gap-2.5', className)}>
            {/* TODO: reuse ContentCombobox */}

            <ImageSelection selection={selection} onSelectionChange={onSelectionChange} selectionMode={selectionMode} disabled={disabled} />
        </div>
    );
};

ImageSelector.displayName = IMAGE_SELECTOR_NAME;
