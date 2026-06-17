import {Button, Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useCallback, useEffect, useMemo, useRef, type ReactElement} from 'react';
import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import {Branch} from '../../../../../app/versioning/Branch';
import {useI18n} from '../../../hooks/useI18n';
import {useOnceWhen} from '../../../hooks/useOnce';
import {
    $deleteDialog,
    $deleteInboundIds,
    $deleteItemsCount,
    $hasMoreDeleteDependants,
    $isDeleteDialogReady,
    ignoreDeleteInboundDependencies,
    loadMoreDeleteDependants,
} from '../../../store/dialogs/deleteDialog.store';
import {ContentReferenceList} from '../ContentReferenceList';
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
    const hasMoreDependants = useStore($hasMoreDeleteDependants);
    const inboundIds = useStore($deleteInboundIds);
    const inboundSet = useMemo(() => new Set(inboundIds), [inboundIds]);
    const isInbound = useCallback((content: ContentSummary) =>
        inboundSet.has(content.getContentId().toString()), [inboundSet]);

    const single = useI18n('dialog.delete.single');
    const multiple = useI18n('dialog.delete.multiple');
    const title = total > 1 ? multiple : single;
    const description = useI18n('dialog.archive.subname');
    const dependantsLabel = useI18n('dialog.archive.dependants');
    const deleteLabel = useI18n('action.delete');
    const deleteButtonLabel = total > 1 ? `${deleteLabel} (${total})` : deleteLabel;

    const deleteButtonRef = useRef<HTMLButtonElement>(null);
    const ignoreButtonRef = useRef<HTMLButtonElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ready) {
            return;
        }

        deleteButtonRef.current?.focus();
    }, [ready]);

    const inboundCount = useMemo(() => {
        if (inboundIgnored) {
            return 0;
        }
        const allItems = [...items, ...dependants];
        return allItems.filter(item => inboundSet.has(item.getContentId().toString())).length;
    }, [items, dependants, inboundSet, inboundIgnored]);

    const hasInboundErrors = inboundCount > 0 && !inboundIgnored;

    useOnceWhen(() => {
        if (!ready) {
            ignoreButtonRef.current?.focus();
        }
    }, hasInboundErrors);

    const handleOpenAutoFocus = (event: Event) => {
        event.preventDefault();

        if (ready) {
            deleteButtonRef.current?.focus();
            return;
        }

        dialogRef.current?.focus();
    };

    return (
        <Dialog.Content
            ref={dialogRef}
            className="w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220"
            onOpenAutoFocus={handleOpenAutoFocus}
            data-component={componentName}
        >
            <Dialog.DefaultHeader title={title} description={description} withClose/>

            <InboundStatusBar
                ignoreButtonRef={ignoreButtonRef}
                loading={loading}
                failed={failed}
                errors={{
                    inbound: {
                        count: inboundCount,
                        onIgnore: () => ignoreDeleteInboundDependencies(),
                    },
                }}
            />

            <Dialog.Body>
                <ContentReferenceList
                    items={items}
                    dependants={dependants}
                    dependantsLabel={dependantsLabel}
                    branch={Branch.DRAFT}
                    isInbound={isInbound}
                    label={title}
                    dependantVariant='compact'
                    hasMore={hasMoreDependants}
                    onEndReached={loadMoreDeleteDependants}
                />
            </Dialog.Body>

            <Dialog.Footer className="flex items-center gap-2.5">
                <Button variant="solid" size="lg" label={deleteButtonLabel} disabled={!ready} onClick={onArchive} ref={deleteButtonRef}/>
            </Dialog.Footer>
        </Dialog.Content>
    );
};

DeleteDialogMainContent.displayName = DELETE_DIALOG_MAIN_CONTENT_NAME;
