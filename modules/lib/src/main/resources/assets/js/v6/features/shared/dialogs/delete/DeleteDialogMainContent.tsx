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
    onArchive: () => void;
    'data-component'?: string;
};

const DELETE_DIALOG_MAIN_CONTENT_NAME = 'DeleteDialogMainContent';

export const DeleteDialogMainContent = ({
    onArchive,
    'data-component': componentName = DELETE_DIALOG_MAIN_CONTENT_NAME,
}: DeleteDialogMainContentProps): ReactElement => {
    const {loading, failed, items, dependants, inboundIgnored} = useStore($deleteDialog,
        {keys: ['loading', 'failed', 'items', 'dependants', 'inboundIgnored']});
    const ready = useStore($isDeleteDialogReady);
    const total = useStore($deleteItemsCount);
    const inboundIds = useStore($deleteInboundIds);
    const inboundSet = useMemo(() => new Set(inboundIds), [inboundIds]);
    const isInbound = (content: ContentSummaryAndCompareStatus) => inboundSet.has(content.getContentId().toString());

    const single = useI18n('dialog.delete.single');
    const multiple = useI18n('dialog.delete.multiple');
    const title = total > 1 ? multiple : single;
    const description = useI18n('dialog.archive.subname');
    const dependantsLabel = useI18n('dialog.archive.dependants');
    const deleteLabel = useI18n('action.delete');
    const deleteButtonLabel = total > 1 ? `${deleteLabel} (${total})` : deleteLabel;

    const actionButtonRef = useRef<HTMLButtonElement>(null);

    useOnceWhen(() => {
        actionButtonRef.current?.focus({focusVisible: true});
    }, ready);

    const handleOpenAutoFocus = (event: FocusEvent) => {
        event.preventDefault();
        actionButtonRef.current?.focus({focusVisible: true});
    };

    const inboundCount = useMemo(() => {
        if (inboundIgnored) {
            return 0;
        }
        const allItems = [...items, ...dependants];
        return allItems.filter(item => inboundSet.has(item.getContentId().toString())).length;
    }, [items, dependants, inboundSet, inboundIgnored]);

    return (
        <Dialog.Content
            className="w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220"
            onOpenAutoFocus={handleOpenAutoFocus}
            data-component={componentName}
        >
            <Dialog.DefaultHeader title={title} description={description} withClose />

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
                <Button variant="solid" size="lg" label={deleteButtonLabel} disabled={!ready} onClick={onArchive} ref={actionButtonRef} />
            </Dialog.Footer>
        </Dialog.Content>
    );
};

DeleteDialogMainContent.displayName = DELETE_DIALOG_MAIN_CONTENT_NAME;
