import {type ReactElement} from 'react';
import {cn} from '@enonic/ui';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type ImageSelectorFilterOptions, type ImageSelectorMode} from './image-selector.types';
import {ImageSelection} from './selection';
import {ContentCombobox} from '../content';
import {ImageComboboxRow} from './combobox';
import {ImageSelectorUploadButton} from './upload';

export type ImageSelectorProps = {
    /** Selected content IDs */
    'selection': readonly string[];
    /** Callback when selection changes */
    'onSelectionChange': (selection: readonly string[]) => void;
    /** Selection mode */
    'selectionMode'?: ImageSelectorMode;
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
    /** Whether to hide the toggle icon */
    'hideToggleIcon'?: boolean;
    /** Whether the selector has an error */
    'error'?: boolean;
    /** Aria label for accessibility */
    'aria-label'?: string;
    /** Whether to show the upload button */
    'withUpload'?: boolean;
} & ImageSelectorFilterOptions;

const IMAGE_SELECTOR_NAME = 'ImageSelector';
const IMAGE_SELECTOR_CONTENT_TYPE_NAMES = [ContentTypeName.IMAGE.toString(), ContentTypeName.MEDIA_VECTOR.toString()];

export const ImageSelector = ({
    selection,
    onSelectionChange,
    selectionMode = 'multiple',
    listMode,
    disabled = false,
    label,
    placeholder,
    emptyLabel,
    className,
    error = false,
    hideToggleIcon = false,
    'aria-label': ariaLabel,
    withUpload = false,
    allowedContentPaths,
    contextContent,
    applicationKey,
}: ImageSelectorProps): ReactElement => (
    <div data-component={IMAGE_SELECTOR_NAME} className={cn('flex flex-col gap-2.5', className)}>
        {/** TODO: htmlFor */}
        <label className="text-md font-semibold">{label}</label>

        <div className="flex items-center">
            <ContentCombobox
                selection={selection}
                onSelectionChange={onSelectionChange}
                selectionMode={selectionMode}
                listMode={listMode}
                disabled={disabled}
                placeholder={placeholder}
                emptyLabel={emptyLabel}
                aria-label={ariaLabel}
                error={error}
                hideToggleIcon={hideToggleIcon}
                rowRenderer={ImageComboboxRow}
                rowTreeHeight={48}
                rowFlatHeight={270}
                dropdownMaxHeight={500}
                contentTypeNames={IMAGE_SELECTOR_CONTENT_TYPE_NAMES}
                allowedContentPaths={allowedContentPaths}
                contextContent={contextContent}
                applicationKey={applicationKey}
                className="w-full"
                inputClassName="border-r-0 rounded-tr-none rounded-br-none"
            />
            {withUpload && (
                <ImageSelectorUploadButton
                    selection={selection}
                    onSelectionChange={onSelectionChange}
                    disabled={disabled}
                    multiple={selectionMode === 'multiple'}
                />
            )}
        </div>

        <ImageSelection selection={selection} onSelectionChange={onSelectionChange} selectionMode={selectionMode} disabled={disabled} />
    </div>
);

ImageSelector.displayName = IMAGE_SELECTOR_NAME;
