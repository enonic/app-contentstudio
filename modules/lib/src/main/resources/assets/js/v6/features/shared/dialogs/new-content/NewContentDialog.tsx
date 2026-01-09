import {cn, Dialog, Tab} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {KeyboardEvent, ReactElement, useRef, useState} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $newContentDialog,
    closeNewContentDialog,
    setInputValue,
    setSelectedTab,
    uploadDragImages,
    uploadMediaFiles,
} from '../../../store/dialogs/newContentDialog.store';
import {isTypingCharacter} from '../../../utils/dom/keyboard';
import {NewContentDialogContentTypesTab} from './NewContentDialogContentTypesTab';
import {NewContentDialogMediaTab} from './NewContentDialogMediaTab';
import {NewContentDialogSearch} from './NewContentDialogSearch';

const NEW_CONTENT_DIALOG_NAME = 'NewContentDialog';

export const NewContentDialog = (): ReactElement => {
    const [isInputEmpty, setIsInputEmpty] = useState(true);
    const inputRef = useRef<HTMLInputElement>(null);
    const dialogContentRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const {open, selectedTab, parentContent, filteredBaseContentTypes, filteredSuggestedContentTypes} = useStore($newContentDialog);
    const isMediaTab = selectedTab === 'media';
    const isInputHidden = isInputEmpty || isMediaTab;

    const titleLabel = useI18n('dialog.new.title');
    const allTabLabel = useI18n('dialog.new.tab.all');
    const suggestedTabLabel = useI18n('dialog.new.tab.suggested');
    const mediaTabLabel = useI18n('dialog.new.tab.media');
    const hintLabel = useI18n('dialog.new.hint.filter');

    const dialogDescriptionLabel = parentContent ? parentContent?.getContentSummary().getPath().toString() + '/' : '/';

    const handleOpenChange = (open: boolean) => {
        if (open) return;

        closeNewContentDialog();
        setIsInputEmpty(true);
        setInputValue('');
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (isMediaTab || !isTypingCharacter(event) || !isInputEmpty) return;

        setIsInputEmpty(false);
        setInputValue(event.key);
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    };

    const handleInputChange = (newValue: string) => {
        if (newValue.length > 0) return;

        setIsInputEmpty(true);

        requestAnimationFrame(() => {
            dialogContentRef.current?.focus();
        });
    };

    const handleSearchKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        setInputValue('');
        setIsInputEmpty(true);
        requestAnimationFrame(() => {
            dialogContentRef.current?.focus();
        });
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

    const handleDrop = (event: DragEvent): void => {
        event.preventDefault();

        setIsDragging(false);

        if (!isMediaTab) return;

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
                    className="h-178 w-200 max-w-auto"
                    onKeyDown={handleKeyDown}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <Tab.Root value={selectedTab} onValueChange={setSelectedTab} className="flex flex-col h-full gap-2.5">
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

                        <Dialog.Body className="contents">
                            <div className={cn(
                                'h-20 p-1.5 -m-1.5 overflow-hidden',
                                isMediaTab ? 'hidden' : 'transition-all ease-in-out duration-150',
                                isInputHidden && 'h-0 p-0 pointer-events-none'
                            )}>
                                <NewContentDialogSearch
                                    className={isInputHidden && 'hidden'}
                                    onChange={handleInputChange}
                                    onKeyDown={handleSearchKeyDown}
                                    inputRef={inputRef}
                                />
                            </div>

                            <div className={cn(
                                'min-h-0 flex-1 my-5',
                                isMediaTab ? 'overflow-visible' : 'overflow-y-auto px-1.5 -mx-1.5'
                            )}>

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
                            </div>
                        </Dialog.Body>

                        {isInputEmpty && !isMediaTab && (
                            <Dialog.Footer className="flex justify-center mt-5">
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
