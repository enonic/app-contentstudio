import {Button, Checkbox, IconButton, Input, RadioGroup} from '@enonic/ui';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {UploadIcon, X} from 'lucide-react';
import {useCallback, useEffect, useMemo, useRef, useState, type ReactElement} from 'react';
import {fetchNearestSite} from '../../../api/content';
import {type UploadMediaError, type UploadMediaSuccess} from '../../../api/uploadMedia';
import {useI18n} from '../../../hooks/useI18n';
import {useUploadMedia} from '../../../hooks/useUploadMedia';
import {$contextContent} from '../../../store/context/contextContent.store';
import {useStore} from '@nanostores/preact';
import {type MediaOption, useHtmlAreaLinkDialogContext} from './HtmlAreaLinkDialogContext';
import {ContentSelector} from '../../selectors/content';

const COMPONENT_NAME = 'ContentTabPanel';

export const ContentTabPanel = (): ReactElement => {
    const {
        state: {
            selectedContentId, selectedContent, mediaOption, showAllContent,
            contentTarget, fragment, fragmentVisible, queryParams,
            contentSummary,
        },
        validationErrors: errors,
        selectContentById,
        deselectContent,
        setMediaOption,
        setShowAllContent,
        setContentTarget,
        setFragment,
        toggleFragmentVisible,
        addQueryParam,
        removeQueryParam,
        setQueryParamKey,
        setQueryParamValue,
    } = useHtmlAreaLinkDialogContext();

    const contentLabel = useI18n('field.content');
    const showAllLabel = useI18n('dialog.link.formitem.showallcontent');
    const openLabel = useI18n('dialog.link.radio.options.open');
    const downloadLabel = useI18n('dialog.link.radio.options.download');
    const linkLabel = useI18n('dialog.link.radio.options.link');
    const openInNewTabLabel = useI18n('dialog.link.formitem.openinnewtab');
    const fragmentLabel = useI18n('dialog.link.fragment');
    const paramsLabel = useI18n('dialog.link.parameters');
    const paramNameLabel = useI18n('dialog.link.parameters.name');
    const paramValueLabel = useI18n('dialog.link.parameters.value');
    const addLabel = useI18n('action.add');

    // Load parent site path for scoping
    const [parentSitePath, setParentSitePath] = useState<string | undefined>(undefined);

    useEffect(() => {
        const contentId = contentSummary?.getContentId();
        if (!contentId) {
            setParentSitePath(undefined);
            return;
        }
        fetchNearestSite(contentId).match(
            (site) => {
                setParentSitePath(site ? site.getPath().toString() : undefined);
            },
            () => {
                setParentSitePath(undefined);
            },
        );
    }, [contentSummary]);

    const selection = selectedContentId ? [selectedContentId] : [];
    const isMedia = selectedContent?.getType()?.isDescendantOfMedia() ?? false;
    const showMediaOptions = !!selectedContent && isMedia;
    const showNonMediaOptions = !!selectedContent && !isMedia;
    const showTargetCheckbox = showNonMediaOptions || (showMediaOptions && mediaOption !== 'download');

    const handleSelectionChange = useCallback((newSelection: readonly string[]) => {
        if (newSelection.length === 0) {
            deselectContent();
        } else {
            selectContentById(newSelection[0]);
        }
    }, [deselectContent, selectContentById]);

    const allowedContentPaths = useMemo(() => {
        if (showAllContent || !parentSitePath) {
            return undefined;
        }
        return [parentSitePath];
    }, [showAllContent, parentSitePath]);

    // Media upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadParent = useStore($contextContent);

    const onUploadComplete = useCallback((success: UploadMediaSuccess) => {
        handleSelectionChange([success.content.getId()]);
    }, [handleSelectionChange]);

    const onUploadError = useCallback((error: UploadMediaError) => {
        showError(i18n('notify.upload.error', error.mediaIdentifier, error.message));
    }, []);

    const {handleInputChange} = useUploadMedia({
        parentContent: uploadParent ?? undefined,
        onUploadComplete,
        onUploadError,
    });

    const handleUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const showUpload = !selectedContentId;

    return (
        <div data-component={COMPONENT_NAME} className='flex flex-col gap-4 pt-4'>
            <div className='flex flex-col gap-2.5'>
                {contentLabel && <label className='text-md font-semibold'>{contentLabel} *</label>}
                <div className='flex items-center'>
                    <ContentSelector
                        selection={selection}
                        onSelectionChange={handleSelectionChange}
                        selectionMode='single'
                        allowedContentPaths={allowedContentPaths}
                        error={!!errors.content}
                        closeOnBlur
                        className='flex-1 focus-within:z-10'
                        withRightButton={showUpload}
                    />
                    {showUpload && (
                        <>
                            <input
                                tabIndex={-1}
                                ref={fileInputRef}
                                type='file'
                                onChange={handleInputChange}
                                className='sr-only'
                            />
                            <Button
                                onClick={handleUploadClick}
                                variant='solid'
                                className='relative h-12 rounded-none border border-bdr-subtle rounded-tr rounded-br bg-surface-selected focus-within:ring-3 focus-within:ring-ring focus-within:ring-offset-3 focus-within:ring-offset-ring-offset transition-highlight'
                            >
                                <UploadIcon size={20} absoluteStrokeWidth />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {parentSitePath && !selectedContent && (
                <Checkbox
                    checked={showAllContent}
                    onCheckedChange={(checked) => setShowAllContent(checked === true)}
                    label={showAllLabel}
                />
            )}

            {showMediaOptions && (
                <RadioGroup.Root
                    name='mediaOption'
                    value={mediaOption}
                    onValueChange={(val) => setMediaOption(val as MediaOption)}
                    className='rounded-md'
                >
                    <RadioGroup.Item value='open'>
                        <RadioGroup.Indicator />
                        {openLabel}
                    </RadioGroup.Item>
                    <RadioGroup.Item value='download'>
                        <RadioGroup.Indicator />
                        {downloadLabel}
                    </RadioGroup.Item>
                    <RadioGroup.Item value='link'>
                        <RadioGroup.Indicator />
                        {linkLabel}
                    </RadioGroup.Item>
                </RadioGroup.Root>
            )}

            {showTargetCheckbox && (
                <Checkbox
                    checked={contentTarget}
                    onCheckedChange={(checked) => setContentTarget(checked === true)}
                    label={openInNewTabLabel}
                />
            )}

            {showNonMediaOptions && (
                <>
                    <div className='flex flex-col gap-2'>
                        <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium'>{fragmentLabel}</span>
                            {!fragmentVisible && (
                                <Button
                                    size='sm'
                                    variant='text'
                                    label={addLabel}
                                    onClick={toggleFragmentVisible}
                                />
                            )}
                            {fragmentVisible && (
                                <IconButton
                                    size='sm'
                                    variant='text'
                                    icon={X}
                                    onClick={toggleFragmentVisible}
                                />
                            )}
                        </div>
                        {fragmentVisible && (
                            <Input
                                value={fragment}
                                onChange={(e) => setFragment((e.target as HTMLInputElement).value)}
                            />
                        )}
                    </div>

                    <div className='flex flex-col gap-2'>
                        <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium'>{paramsLabel}</span>
                            <Button
                                size='sm'
                                variant='text'
                                label={addLabel}
                                onClick={addQueryParam}
                            />
                        </div>
                        {errors.queryParams && (
                            <span className='text-sm text-enonic-red-500'>{errors.queryParams}</span>
                        )}
                        {queryParams.map((param, index) => (
                            <div key={index} className='flex items-center gap-2'>
                                <Input
                                    placeholder={paramNameLabel}
                                    value={param.key}
                                    error={!param.key ? errors.queryParams : undefined}
                                    onChange={(e) => setQueryParamKey(index, (e.target as HTMLInputElement).value)}
                                    className='flex-1'
                                />
                                <Input
                                    placeholder={paramValueLabel}
                                    value={param.value}
                                    onChange={(e) => setQueryParamValue(index, (e.target as HTMLInputElement).value)}
                                    className='flex-1'
                                />
                                <IconButton
                                    size='sm'
                                    variant='text'
                                    icon={X}
                                    onClick={() => removeQueryParam(index)}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

ContentTabPanel.displayName = COMPONENT_NAME;
