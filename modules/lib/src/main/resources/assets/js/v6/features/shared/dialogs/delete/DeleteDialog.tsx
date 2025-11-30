import {Button, Dialog, Separator, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useMemo, useState, type ReactElement} from 'react';
import {EditContentEvent} from '../../../../../app/event/EditContentEvent';
import {useI18n} from '../../../hooks/useI18n';
import {$deleteDialog, $deleteDialogReady, $deleteHasSite, $deleteInboundIds, $deleteTotalItems, cancelDeleteDialog, executeDeleteDialogAction, ignoreDeleteInboundDependencies, type DeleteAction} from '../../../store/dialogs/deleteDialog.store';
import {ContentItem} from '../../items/ContentItem';
import {SelectionStatusBar} from '../SelectionStatusBar';
import {DialogPresetConfirmDelete} from '../DialogPreset';
import {Branch} from '../../../../../app/versioning/Branch';

const DELETE_DIALOG_NAME = 'DeleteDialog';

export const DeleteDialog = (): ReactElement => {
    const {open, loading, failed, items, dependants, inboundIgnored} = useStore($deleteDialog);
    const ready = useStore($deleteDialogReady);
    const total = useStore($deleteTotalItems);
    const hasSite = useStore($deleteHasSite);
    const inboundIds = useStore($deleteInboundIds);
    const inboundSet = useMemo(() => new Set(inboundIds), [inboundIds]);
    const isInbound = (id: string) => inboundSet.has(id);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState<DeleteAction>('delete');

    const title = useI18n('dialog.archive');
    const dependantsLabel = useI18n('dialog.archive.dependants');
    const archiveLabel = useI18n('dialog.archive.action');
    const deleteLabel = useI18n('action.delete');
    const confirmDeleteTitle = useI18n('dialog.confirmDelete');
    const confirmDeleteDescription = useI18n('dialog.confirmDelete.subname');
    const confirmArchiveTitle = useI18n('dialog.confirmArchive');
    const confirmArchiveDescription = useI18n('dialog.confirmArchive.subname');
    const archiveButtonLabel = total > 1 ? `${archiveLabel} (${total})` : archiveLabel;
    const deleteButtonLabel = total > 1 ? `${deleteLabel} (${total})` : deleteLabel;

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            cancelDeleteDialog();
        }
    };

    const openConfirm = (action: DeleteAction) => {
        setConfirmAction(action);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (total > 1 || hasSite) {
            openConfirm('delete');
            return;
        }
        await executeDeleteDialogAction('delete');
    };

    const handleArchive = async () => {
        if (total > 1 || hasSite) {
            openConfirm('archive');
            return;
        }
        await executeDeleteDialogAction('archive');
    };

    const inboundCount = useMemo(() => {
        if (inboundIgnored) {
            return 0;
        }
        const allItems = [...items, ...dependants];
        return allItems.filter(item => inboundSet.has(item.getContentId().toString())).length;
    }, [items, dependants, inboundSet, inboundIgnored]);

    const confirmTitle = confirmAction === 'archive' ? confirmArchiveTitle : confirmDeleteTitle;
    const confirmDescription = confirmAction === 'archive' ? confirmArchiveDescription : confirmDeleteDescription;

    return (
        <>
            <Dialog.Root open={open && !confirmOpen} onOpenChange={handleOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay />
                    <Dialog.Content className="w-full h-full gap-5 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220">
                        <Dialog.DefaultHeader title={title} description={useI18n('dialog.archive.subname')} withClose />

                        <SelectionStatusBar
                            className="pt-5"
                            loading={loading}
                            failed={failed}
                            showReady={false}
                            onApply={() => {}}
                            onCancel={() => {}}
                            errors={{
                                inProgress: {count: 0, onExclude: () => {}},
                                invalid: {count: 0, onExclude: () => {}},
                                noPermissions: {count: 0, onExclude: () => {}},
                                inbound: {
                                    count: inboundCount,
                                    onIgnore: () => ignoreDeleteInboundDependencies(),
                                },
                            }}
                        />

                        <Dialog.Body className="flex flex-col gap-y-10 py-5">
                            <div className="flex flex-col gap-y-2.5">
                                <ul className="flex flex-col gap-y-2.5">
                                    {items.map(item => (
                                        <ContentItem
                                            key={`main-${item.getId()}`}
                                            content={item}
                                            showReferences
                                            target={Branch.DRAFT}
                                            hasInbound={isInbound(item.getContentId().toString())}
                                            showOnlineStatus
                                            mainItem
                                            onClick={() => {
                                                new EditContentEvent([item]).fire();
                                            }}
                                        />
                                    ))}
                                </ul>
                            </div>

                            <div className={cn('flex flex-col gap-y-7.5', dependants.length === 0 && 'hidden')}>
                                <Separator className="" label={dependantsLabel} />
                                <ul className="flex flex-col gap-y-2.5">
                                    {dependants.map(item => (
                                        <ContentItem
                                            key={`dep-${item.getId()}`}
                                            content={item}
                                            showReferences
                                            target={Branch.DRAFT}
                                            hasInbound={isInbound(item.getContentId().toString())}
                                            showOnlineStatus
                                        />
                                    ))}
                                </ul>
                            </div>

                        </Dialog.Body>

                        <Dialog.Footer className="flex items-center gap-1">
                            <Button variant="text" size="lg" className="text-error font-normal" label={deleteButtonLabel} disabled={!ready} onClick={() => void handleDelete()} />
                            <Button variant="solid" size="lg" className="font-normal"  label={archiveButtonLabel} disabled={!ready} onClick={() => void handleArchive()} />
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <DialogPresetConfirmDelete
                open={confirmOpen}
                title={confirmTitle}
                description={confirmDescription}
                expected={total}
                onConfirm={() => {
                    setConfirmOpen(false);
                    void executeDeleteDialogAction(confirmAction);
                    setConfirmAction('delete');
                }}
                onCancel={() => {
                    setConfirmOpen(false);
                    setConfirmAction('delete');
                }}
            />
        </>
    );
};

DeleteDialog.displayName = DELETE_DIALOG_NAME;
