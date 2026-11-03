import { type ReactElement } from 'react';
import { cn } from '@enonic/ui';
import { type MediaSelectorFilterOptions, type MediaSelectorMode } from './media-selector.types';
import { ContentCombobox } from '../content';
import { SelectorUploadButton, useSelectorUpload } from '../shared/upload';
import { SelectorSelection, SelectorSelectionItem } from '../shared/selection';
import { useFormScope } from '../../form/FormScopeContext';
import { ContentRow } from '../shared/combobox/ContentRow';
import { MediaSelectorItemView } from './MediaSelectorItemView';
import { useAcceptMimeTypes } from '../../../../entities/schema';
import { CONTENT_TYPE } from '../../../../shared/lib/cms/schema/contentTypeName';

export type MediaSelectorProps = {
    /** Selected content IDs */
    selection: readonly string[];
    /** Callback when selection changes */
    onSelectionChange: (selection: readonly string[]) => void;
    /** Whether the selector can add more items */
    canAdd?: boolean;
    /** Selection mode */
    selectionMode?: MediaSelectorMode;
    /** List mode */
    listMode?: 'tree' | 'flat';
    /** Whether to close the combobox when the input is blurred */
    closeOnBlur?: boolean;
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
    /** Whether to hide the toggle icon */
    hideToggleIcon?: boolean;
    /** Whether the selector has an error */
    error?: boolean;
    /** Aria label for accessibility */
    'aria-label'?: string;
    /** Whether to show the upload button */
    withUpload?: boolean;
} & MediaSelectorFilterOptions;

const MEDIA_SELECTOR_NAME = 'MediaSelector';
const MEDIA_SELECTOR_CONTENT_TYPE_NAMES = [
    CONTENT_TYPE.MEDIA,
    CONTENT_TYPE.MEDIA_TEXT,
    CONTENT_TYPE.MEDIA_DATA,
    CONTENT_TYPE.MEDIA_AUDIO,
    CONTENT_TYPE.MEDIA_VIDEO,
    CONTENT_TYPE.MEDIA_IMAGE,
    CONTENT_TYPE.MEDIA_VECTOR,
    CONTENT_TYPE.MEDIA_ARCHIVE,
    CONTENT_TYPE.MEDIA_DOCUMENT,
    CONTENT_TYPE.MEDIA_SPREADSHEET,
    CONTENT_TYPE.MEDIA_PRESENTATION,
    CONTENT_TYPE.MEDIA_CODE,
    CONTENT_TYPE.MEDIA_EXECUTABLE,
    CONTENT_TYPE.MEDIA_UNKNOWN,
];

export const MediaSelector = ({
    selection,
    onSelectionChange,
    canAdd = true,
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
    const resolvedContentTypeNames =
        contentTypeNames && contentTypeNames.length > 0 ? contentTypeNames : MEDIA_SELECTOR_CONTENT_TYPE_NAMES;
    const { project } = useFormScope();
    const projectName = project?.getName();
    const acceptMimeTypes = useAcceptMimeTypes(resolvedContentTypeNames);

    const { canUpload, handleFiles, progress, isUploading, dragProps } = useSelectorUpload({
        selection,
        onSelectionChange,
        accept: acceptMimeTypes,
        multiple: selectionMode === 'multiple',
        disabled: disabled || !withUpload,
    });

    return (
        <div data-component={MEDIA_SELECTOR_NAME} className={cn('flex flex-col gap-2.5', className)}>
            {/* TODO: Add htmlFor to associate label with combobox input */}
            {label && <label className="text-md font-semibold">{label}</label>}

            {canAdd && (
                <div
                    className={cn(
                        'flex items-center rounded transition-highlight',
                        dragProps.isDragging && 'ring-3 ring-ring ring-offset-3 ring-offset-ring-offset',
                    )}
                    onDragOver={dragProps.onDragOver}
                    onDragLeave={dragProps.onDragLeave}
                    onDrop={dragProps.onDrop}
                >
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
                        projectName={projectName}
                        rowRenderer={ContentRow}
                        contentTypeNames={resolvedContentTypeNames}
                        allowedContentPaths={allowedContentPaths}
                        contextContent={contextContent}
                        applicationKey={applicationKey}
                        className="w-full focus-within:z-10"
                        withRightButton={withUpload && canUpload}
                    />
                    {withUpload && canUpload && (
                        <SelectorUploadButton
                            onFiles={handleFiles}
                            progress={progress}
                            isUploading={isUploading}
                            disabled={disabled}
                            multiple={selectionMode === 'multiple'}
                            accept={acceptMimeTypes}
                        />
                    )}
                </div>
            )}

            <SelectorSelection
                selection={selection}
                onSelectionChange={onSelectionChange}
                disabled={disabled}
                projectName={projectName}
                className={className}
                renderItem={(context) => (
                    <SelectorSelectionItem
                        project={project}
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
