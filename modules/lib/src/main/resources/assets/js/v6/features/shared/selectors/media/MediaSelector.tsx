import {useEffect, type ReactElement} from 'react';
import {cn} from '@enonic/ui';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type MediaSelectorFilterOptions, type MediaSelectorMode} from './media-selector.types';
import {ContentCombobox} from '../content';
import {SelectorUploadButton} from '../shared/upload';
import {SelectorSelection, SelectorSelectionItem} from '../shared/selection';
import {useStore} from '@nanostores/preact';
import {$activeProject} from '../../../store/projects.store';
import {ContentRow, ContentRowProps} from '../shared/combobox/ContentRow';
import {MediaSelectorItemView} from './MediaSelectorItemView';
import {useAcceptMimeTypes} from '../../../hooks/useAcceptMimeTypes';

export type MediaSelectorProps = {
    /** Selected content IDs */
    'selection': readonly string[];
    /** Callback when selection changes */
    'onSelectionChange': (selection: readonly string[]) => void;
    /** Selection mode */
    'selectionMode'?: MediaSelectorMode;
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
} & MediaSelectorFilterOptions;

const MEDIA_SELECTOR_NAME = 'MediaSelector';
const MEDIA_SELECTOR_CONTENT_TYPE_NAMES = [
    ContentTypeName.MEDIA.toString(),
    ContentTypeName.MEDIA_TEXT.toString(),
    ContentTypeName.MEDIA_DATA.toString(),
    ContentTypeName.MEDIA_AUDIO.toString(),
    ContentTypeName.MEDIA_VIDEO.toString(),
    ContentTypeName.MEDIA_IMAGE.toString(),
    ContentTypeName.MEDIA_VECTOR.toString(),
    ContentTypeName.MEDIA_ARCHIVE.toString(),
    ContentTypeName.MEDIA_DOCUMENT.toString(),
    ContentTypeName.MEDIA_SPREADSHEET.toString(),
    ContentTypeName.MEDIA_PRESENTATION.toString(),
    ContentTypeName.MEDIA_CODE.toString(),
    ContentTypeName.MEDIA_EXECUTABLE.toString(),
    ContentTypeName.MEDIA_UNKNOWN.toString(),
];

export const MediaSelector = ({
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
    contentTypeNames,
    allowedContentPaths,
    contextContent,
    applicationKey,
}: MediaSelectorProps): ReactElement => {
    const resolvedContentTypeNames = contentTypeNames && contentTypeNames.length > 0 ? contentTypeNames : MEDIA_SELECTOR_CONTENT_TYPE_NAMES;
    const activeProject = useStore($activeProject);
    const acceptMimeTypes = useAcceptMimeTypes(resolvedContentTypeNames);

    return (
        <div data-component={MEDIA_SELECTOR_NAME} className={cn('flex flex-col gap-2.5', className)}>
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
                    rowRenderer={ContentRow}
                    contentTypeNames={resolvedContentTypeNames}
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
                        accept={acceptMimeTypes}
                    />
                )}
            </div>

            <SelectorSelection
                selection={selection}
                onSelectionChange={onSelectionChange}
                disabled={disabled}
                className={className}
                renderItem={(context) => (
                    <SelectorSelectionItem
                        project={activeProject}
                        context={context}
                        disabled={disabled}
                        selection={selection}
                        onSelectionChange={onSelectionChange}
                        renderContent={(content) => <MediaSelectorItemView content={content} />}
                    />
                )}
            />
        </div>
    );
};

MediaSelector.displayName = MEDIA_SELECTOR_NAME;
