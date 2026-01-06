import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';
import {cn, Dialog, Tab} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useRef, useState} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $newContentDialog,
    closeNewContentDialog,
    setInputValue,
    setSelectedTab,
    uploadDragImages,
    uploadMediaFiles,
} from '../../../store/dialogs/newContentDialog.store';
import {NewContentDialogContentTypesTab} from './NewContentDialogContentTypesTab';
import {NewContentDialogMediaTab} from './NewContentDialogMediaTab';
import {NewContentDialogSearch} from './NewContentDialogSearch';

const NEW_CONTENT_DIALOG_NAME = 'NewContentDialog';

export const NewContentDialog = (): ReactElement => {
    const [isInputVisible, setIsInputVisible] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dialogContentRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const {open, selectedTab, parentContent, filteredBaseContentTypes, filteredSuggestedContentTypes} =
        useStore($newContentDialog);

    const titleLabel = useI18n('dialog.new.title');
    const allTabLabel = useI18n('dialog.new.tab.all');
    const suggestedTabLabel = useI18n('dialog.new.tab.suggested');
    const mediaTabLabel = useI18n('dialog.new.tab.media');
    const hintLabel = useI18n('dialog.new.hint.filter');

    const dialogDescriptionLabel = parentContent ? parentContent?.getContentSummary().getPath().toString() + '/' : '/';

    const handleOpenChange = (open: boolean) => {
        if (open) return;

        closeNewContentDialog();
        setIsInputVisible(false);
        setInputValue('');
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        const isLetterOrNumber = !event.altKey && !event.ctrlKey && KeyHelper.isAlphaNumeric(event);

        if (selectedTab === 'media' || !isLetterOrNumber || isInputVisible) return;

        setIsInputVisible(true);
        setInputValue(event.key);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 1);
    };

    const handleInputChange = (newValue: string) => {
        if (newValue.length > 0) return;

        setIsInputVisible(false);

        requestAnimationFrame(() => {
            dialogContentRef.current?.focus();
        });
    };

    const handleInputEscape = () => {
        setInputValue('');
        setIsInputVisible(false);
        dialogContentRef.current?.focus();
    };

    const handleDragEnter = (event: DragEvent) => {
        setIsDragging(true);
        setSelectedTab('media');
    };

    const handleDragLeave = (event: DragEvent) => {
        // Only set isDragging to false if we're leaving the container entirely
        if (dialogContentRef.current && !dialogContentRef.current.contains(event.relatedTarget as Node)) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (event: DragEvent) => {
        event.preventDefault();
    };

    const handleDrop = async (event: DragEvent) => {
        event.preventDefault();

        setIsDragging(false);

        if (selectedTab !== 'media') return;

        const {dataTransfer} = event;

        if (!dataTransfer) return;

        void uploadMediaFiles({
            dataTransfer,
            parentContent,
        });

        void uploadDragImages({
            dataTransfer,
            parentContent,
        });

        closeNewContentDialog();
    };

    return (
        <Dialog.Root data-component={NEW_CONTENT_DIALOG_NAME} open={open} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    ref={dialogContentRef}
                    className="h-[710px] w-200 max-w-auto"
                    onKeyDown={handleKeyDown}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <Tab.Root value={selectedTab} onValueChange={setSelectedTab} className="flex flex-col h-full">
                        <Dialog.Header className="flex flex-col gap-2.5">
                            <div className="flex justify-between">
                                <div className="space-y-2.5">
                                    <h3 className="font-semibold">{titleLabel}</h3>
                                    <p className="text-2xl font-semibold">{dialogDescriptionLabel}</p>
                                </div>

                                <Dialog.DefaultClose />
                            </div>

                            <Tab.List>
                                <Tab.Trigger value="all">{allTabLabel}</Tab.Trigger>
                                <Tab.Trigger value="suggested">{suggestedTabLabel}</Tab.Trigger>
                                <Tab.Trigger value="media">{mediaTabLabel}</Tab.Trigger>
                            </Tab.List>
                        </Dialog.Header>

                        <Dialog.Body className="p-1.5 -mx-1.5">
                            {selectedTab !== 'media' && (
                                <NewContentDialogSearch
                                    onChange={handleInputChange}
                                    onEscape={handleInputEscape}
                                    inputRef={inputRef}
                                    hidden={!isInputVisible}
                                />
                            )}

                            <NewContentDialogContentTypesTab
                                tabName="all"
                                contentTypes={filteredBaseContentTypes}
                                parentContent={parentContent}
                            />

                            <NewContentDialogContentTypesTab
                                tabName="suggested"
                                contentTypes={filteredSuggestedContentTypes}
                                parentContent={parentContent}
                            />

                            <NewContentDialogMediaTab tabName="media" isDragging={isDragging} />
                        </Dialog.Body>

                        {!isInputVisible && selectedTab !== 'media' && (
                            <Dialog.Footer className="flex justify-center mt-10">
                                <p className="text-sm text-subtle">{hintLabel}</p>
                            </Dialog.Footer>
                        )}
                    </Tab.Root>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

NewContentDialog.displayName = NEW_CONTENT_DIALOG_NAME;
