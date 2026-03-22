import {type ReactElement} from 'react';
import {cn} from '@enonic/ui';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type ImageSelectorFilterOptions, type ImageSelectorMode} from './image-selector.types';
import {ContentCombobox} from '../content';
import {SelectorUploadButton} from '../shared/upload';
import {SelectorSelection, SelectorSelectionItem} from '../shared/selection';
import {useStore} from '@nanostores/preact';
import {$activeProject} from '../../../store/projects.store';
import {ContentRow, type ContentRowProps} from '../shared/combobox/ContentRow';
import {ImageSelectorItemView} from './ImageSelectorItemView';
import {useAcceptMimeTypes} from '../../../hooks/useAcceptMimeTypes';

export type ImageSelectorProps = {
    /** Selected content IDs */
    'selection': readonly string[];
    /** Callback when selection changes */
    'onSelectionChange': (selection: readonly string[]) => void;
    /** Selection mode */
    'selectionMode'?: ImageSelectorMode;
    /** List mode */
    'listMode'?: 'tree' | 'flat';
    /** Whether to close the combobox when the input is blurred */
    'closeOnBlur'?: boolean;
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
    closeOnBlur = false,
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
}: ImageSelectorProps): ReactElement => {
    const activeProject = useStore($activeProject);
    const acceptMimeTypes = useAcceptMimeTypes(IMAGE_SELECTOR_CONTENT_TYPE_NAMES);

    return (
        <div data-component={IMAGE_SELECTOR_NAME} className={cn('flex flex-col gap-2.5', className)}>
            {/** TODO: htmlFor */}
            <label className="text-md font-semibold">{label}</label>

            <div className="flex items-center">
                <ContentCombobox
                    selection={selection}
                    onSelectionChange={onSelectionChange}
                    selectionMode={selectionMode}
                    listMode={listMode}
                    closeOnBlur={closeOnBlur}
                    disabled={disabled}
                    placeholder={placeholder}
                    emptyLabel={emptyLabel}
                    aria-label={ariaLabel}
                    error={error}
                    hideToggleIcon={hideToggleIcon}
                    rowRenderer={ImageComboboxRow}
                    rowTreeHeight={48}
                    rowFlatHeight={270}
                    rowFlatHeightRatio={0.43}
                    dropdownMaxHeight={500}
                    contentTypeNames={IMAGE_SELECTOR_CONTENT_TYPE_NAMES}
                    allowedContentPaths={allowedContentPaths}
                    contextContent={contextContent}
                    applicationKey={applicationKey}
                    className="w-full focus-within:z-10"
                    inputClassName={cn(withUpload && 'rounded-tr-none rounded-br-none')}
                />
                {withUpload && (
                    <SelectorUploadButton
                        selection={selection}
                        onSelectionChange={onSelectionChange}
                        disabled={disabled}
                        multiple={selectionMode === 'multiple'}
                        accept={acceptMimeTypes ?? 'image/*'}
                    />
                )}
            </div>

            <SelectorSelection
                selection={selection}
                onSelectionChange={onSelectionChange}
                disabled={disabled}
                renderItem={(context) => (
                    <SelectorSelectionItem
                        project={activeProject}
                        context={context}
                        disabled={disabled}
                        selection={selection}
                        onSelectionChange={onSelectionChange}
                        renderContent={(content) => <ImageSelectorItemView content={content} />}
                    />
                )}
            />
        </div>
    );
};

ImageSelector.displayName = IMAGE_SELECTOR_NAME;

const ImageComboboxRow = (props: ContentRowProps): ReactElement => (
    <ContentRow
        {...props}
        renderFlatContent={(content, hideStatus) => <ImageSelectorItemView content={content} hideStatus={hideStatus} />}
    />
);

ImageComboboxRow.displayName = 'ImageComboboxRow';
