import {Button, cn, Dialog, Separator} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Calendar} from 'lucide-react';
import {useId, type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {$config} from '../../../store/config.store';
import {$dependantPublishItems, $isPublishChecking, $isPublishReady, $isPublishSelectionSynced, $mainPublishItems, $publishCheckErrors, $publishDialog, $totalPublishableItems, applyDraftPublishDialogSelection, cancelDraftPublishDialogSelection, excludeInProgressPublishItems, excludeInvalidPublishItems, excludeNotPublishablePublishItems, markAllAsReadyInProgressPublishItems, publishItems, resetPublishDialogContext, setPublishDialogDependantItemSelected, setPublishDialogItemSelected, setPublishDialogItemWithChildrenSelected} from '../../../store/dialogs/publishDialog.store';
import {ContentItemCheckable} from '../../items/ContentItemCheckable';
import {ContentItemWithChildren} from '../../items/ContentItemWithChildren';
import {SelectionStatusBar} from '../SelectionStatusBar';

const PUBLISH_DIALOG_NAME = 'PublishDialog';

export const PublishDialog = (): ReactElement => {
    const {open, failed} = useStore($publishDialog, {keys: ['open', 'failed']});
    const loading = useStore($isPublishChecking);
    const isPublishReady = useStore($isPublishReady);
    const {allowContentUpdate} = useStore($config, {keys: ['allowContentUpdate']});

    const mainItems = useStore($mainPublishItems);
    const dependantItems = useStore($dependantPublishItems);
    const publishCount = useStore($totalPublishableItems);

    const hasDependantItems = dependantItems.length > 0;

    const isSelectionSynced = useStore($isPublishSelectionSynced);

    const {invalid, inProgress, noPermissions} = useStore($publishCheckErrors);

    const title = useI18n('dialog.publish');
    const separatorLabel = useI18n('dialog.publish.dependants');
    const scheduleLabel = useI18n('action.schedule');
    const publishLabel = useI18n('action.publishNowCount', publishCount);

    const handleOpen = (open: boolean) => {
        // TODO: See if this should be moved to the store
        if (!open) {
            resetPublishDialogContext();
        }
    };

    const handleSchedule = () => {
        // TODO: Add schedule support
    };

    const baseId = useId();
    const titleId = `${PUBLISH_DIALOG_NAME}-${baseId}-title`;

    return (
        <Dialog.Root open={open} onOpenChange={handleOpen}>
            <Dialog.Portal>
                <Dialog.Overlay />
                <Dialog.Content
                    className="w-full h-full gap-7.5 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220"
                >
                    <Dialog.DefaultHeader titleId={titleId} title={title} withClose />

                    <SelectionStatusBar
                        editing={!isSelectionSynced}
                        failed={failed}
                        loading={loading}
                        showReady={isPublishReady}
                        onApply={applyDraftPublishDialogSelection}
                        onCancel={cancelDraftPublishDialogSelection}
                        errors={{
                            inProgress: {
                                ...inProgress,
                                onMarkAsReady: allowContentUpdate ? () => void markAllAsReadyInProgressPublishItems() : undefined,
                                onExclude: () => excludeInProgressPublishItems(),
                            },
                            invalid: {
                                ...invalid,
                                onExclude: () => excludeInvalidPublishItems(),
                            },
                            noPermissions: {
                                ...noPermissions,
                                onExclude: () => excludeNotPublishablePublishItems(),
                            },
                        }} />

                    <Dialog.Body className="flex flex-col gap-y-7.5">
                        <ul className='flex flex-col gap-y-2.5 py-2.5'>
                            {mainItems.map(({id, content, included, childrenIncluded, required}) => {
                                return <ContentItemWithChildren
                                    key={id}
                                    id={`main-${id}`}
                                    content={content}
                                    checked={included}
                                    onCheckedChange={(enabled) => setPublishDialogItemSelected(content.getContentId(), enabled)}
                                    defaultIncludeChildren={childrenIncluded}
                                    onIncludeChildrenChange={(enabled) => setPublishDialogItemWithChildrenSelected(content.getContentId(), enabled)}
                                    readOnly={required || loading}
                                />;
                            })}
                        </ul>
                        <div className={cn("flex flex-col gap-y-7.5", !hasDependantItems && 'hidden')}>
                            <Separator className="pr-2.5" label={separatorLabel} />
                            <ul className='flex flex-col gap-y-2.5'>
                                {dependantItems.map(({id, content, included, required}) => {
                                    return <ContentItemCheckable
                                        key={id}
                                        id={`dependant-${id}`}
                                        content={content}
                                        checked={included}
                                        onCheckedChange={(enabled) => setPublishDialogDependantItemSelected(content.getContentId(), enabled)}
                                        readOnly={required || loading}
                                    />;
                                })}
                            </ul>
                        </div>
                    </Dialog.Body>

                    <Dialog.Footer>
                        <Button className="hidden" label={scheduleLabel} variant="outline" onClick={handleSchedule} endIcon={Calendar} disabled={loading} />
                        <Button label={publishLabel} variant="solid" onClick={() => void publishItems()} disabled={!isPublishReady} />
                    </Dialog.Footer>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

PublishDialog.displayName = PUBLISH_DIALOG_NAME;
