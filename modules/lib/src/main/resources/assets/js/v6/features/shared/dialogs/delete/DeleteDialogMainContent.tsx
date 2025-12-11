import {Button, Dialog, Separator, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useMemo, useRef, type ReactElement} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {Branch} from '../../../../../app/versioning/Branch';
import {useI18n} from '../../../hooks/useI18n';
import {useOnceWhen} from '../../../hooks/useOnce';
import {
    $deleteDialog,
    $deleteInboundIds,
    $deleteItemsCount,
    $isDeleteDialogReady,
    ignoreDeleteInboundDependencies,
} from '../../../store/dialogs/deleteDialog.store';
import {ContentListItemWithReference} from '../../items/ContentListItemWithReference';
import {InboundStatusBar} from '../status-bar/InboundStatusBar';

type DeleteDialogMainContentProps = {
    onDelete: () => void;
    onArchive: () => void;
};

const DELETE_DIALOG_MAIN_CONTENT_NAME = 'DeleteDialogMainContent';

export const DeleteDialogMainContent = ({onDelete, onArchive}: DeleteDialogMainContentProps): ReactElement => {
    const {loading, failed, items, dependants, inboundIgnored} = useStore($deleteDialog,
        {keys: ['loading', 'failed', 'items', 'dependants', 'inboundIgnored']});
    const ready = useStore($isDeleteDialogReady);
    const total = useStore($deleteItemsCount);
    const inboundIds = useStore($deleteInboundIds);
    const inboundSet = useMemo(() => new Set(inboundIds), [inboundIds]);
    const isInbound = (content: ContentSummaryAndCompareStatus) => inboundSet.has(content.getContentId().toString());

    const title = useI18n('dialog.archive');
    const dependantsLabel = useI18n('dialog.archive.dependants');
    const archiveLabel = useI18n('dialog.archive.action');
    const deleteLabel = useI18n('action.delete');
    const archiveButtonLabel = total > 1 ? `${archiveLabel} (${total})` : archiveLabel;
    const deleteButtonLabel = total > 1 ? `${deleteLabel} (${total})` : deleteLabel;

    const archiveButtonRef = useRef<HTMLButtonElement>(null);

    useOnceWhen(() => {
        archiveButtonRef.current?.focus({focusVisible: true});
    }, ready);

    const handleOpenAutoFocus = (event: FocusEvent) => {
        event.preventDefault();
        archiveButtonRef.current?.focus({focusVisible: true});
    };

    const inboundCount = useMemo(() => {
        if (inboundIgnored) {
            return 0;
        }
        const allItems = [...items, ...dependants];
        return allItems.filter(item => inboundSet.has(item.getContentId().toString())).length;
    }, [items, dependants, inboundSet, inboundIgnored]);

    return (
        <Dialog.Content className="w-full h-full gap-10 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220" onOpenAutoFocus={handleOpenAutoFocus}>
            <Dialog.DefaultHeader title={title} description={useI18n('dialog.archive.subname')} withClose />

            <InboundStatusBar
                loading={loading}
                failed={failed}
                errors={{
                    inbound: {
                        count: inboundCount,
                        onIgnore: () => ignoreDeleteInboundDependencies(),
                    },
                }}
            />

            <Dialog.Body className="flex flex-col gap-y-10">
                <ul className="flex flex-col gap-y-2.5">
                    {items.map(item => (
                        <ContentListItemWithReference
                            key={`main-${item.getId()}`}
                            variant='normal'
                            content={item}
                            branch={Branch.DRAFT}
                            hasInbound={isInbound(item)}
                        />
                    ))}
                </ul>

                <div className={cn('flex flex-col gap-y-7.5', dependants.length === 0 && 'hidden')}>
                    <Separator className="pr-1" label={dependantsLabel} />
                    <ul className="flex flex-col gap-y-1.5">
                        {dependants.map(item => (
                            <ContentListItemWithReference
                                key={`dep-${item.getId()}`}
                                variant='compact'
                                content={item}
                                branch={Branch.DRAFT}
                                hasInbound={isInbound(item)}
                            />
                        ))}
                    </ul>
                </div>
            </Dialog.Body>

            <Dialog.Footer className="flex items-center gap-2.5">
                <Button variant="text" size="lg" className="text-error" label={deleteButtonLabel} disabled={!ready} onClick={onDelete} />
                <Button variant="solid" size="lg" label={archiveButtonLabel} disabled={!ready} onClick={onArchive} ref={archiveButtonRef} />
            </Dialog.Footer>
        </Dialog.Content>
    );
};

DeleteDialogMainContent.displayName = DELETE_DIALOG_MAIN_CONTENT_NAME;
