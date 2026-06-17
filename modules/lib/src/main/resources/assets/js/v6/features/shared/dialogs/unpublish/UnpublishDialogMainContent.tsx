import {Button, Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useCallback, useEffect, useMemo, useRef, type ReactElement} from 'react';
import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import {Branch} from '../../../../../app/versioning/Branch';
import {useI18n} from '../../../hooks/useI18n';
import {
    $hasMoreUnpublishDependants,
    $isUnpublishDialogReady, $unpublishDialog,
    $unpublishInboundIds,
    $unpublishItemsCount, ignoreUnpublishInboundDependencies,
    loadMoreUnpublishDependants
} from '../../../store/dialogs/unpublishDialog.store';
import {ContentReferenceList} from '../ContentReferenceList';
import {InboundStatusBar} from '../status-bar/InboundStatusBar';

type UnpublishDialogMainContentProps = {
    onUnpublish: () => void;
    'data-component'?: string;
};

const UNPUBLISH_DIALOG_MAIN_CONTENT_NAME = 'UnpublishDialogMainContent';

export const UnpublishDialogMainContent = ({
    onUnpublish,
    'data-component': componentName = UNPUBLISH_DIALOG_MAIN_CONTENT_NAME,
}: UnpublishDialogMainContentProps): ReactElement => {
    const {loading, failed, items, dependants, inboundIgnored} = useStore($unpublishDialog,
        {keys: ['loading', 'failed', 'items', 'dependants', 'inboundIgnored']});
    const ready = useStore($isUnpublishDialogReady);
    const total = useStore($unpublishItemsCount);
    const hasMoreDependants = useStore($hasMoreUnpublishDependants);
    const inboundIds = useStore($unpublishInboundIds);
    const inboundSet = useMemo(() => new Set(inboundIds), [inboundIds]);
    const isInbound = useCallback((content: ContentSummary) =>
        inboundSet.has(content.getContentId().toString()), [inboundSet]);

    const title = useI18n('dialog.unpublish');
    const dependantsLabel = useI18n('dialog.unpublish.dependants');
    const unpublishLabel = useI18n('action.unpublish');
    const unpublishButtonLabel = total > 1 ? `${unpublishLabel} (${total})` : unpublishLabel;

    const unpublishButtonRef = useRef<HTMLButtonElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!ready) {
            return;
        }

        unpublishButtonRef.current?.focus();
    }, [ready]);

    const handleOpenAutoFocus = (event: Event) => {
        event.preventDefault();

        if (ready) {
            unpublishButtonRef.current?.focus();
            return;
        }

        dialogRef.current?.focus();
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
            ref={dialogRef}
            className="w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220"
            onOpenAutoFocus={handleOpenAutoFocus}
            data-component={componentName}
        >
            <Dialog.DefaultHeader title={title} withClose />

            <InboundStatusBar
                loading={loading}
                failed={failed}
                errors={{
                    inbound: {
                        count: inboundCount,
                        onIgnore: () => ignoreUnpublishInboundDependencies(),
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
                    onEndReached={loadMoreUnpublishDependants}
                />
            </Dialog.Body>

            <Dialog.Footer className="flex items-center gap-1">
                <Button
                    ref={unpublishButtonRef}
                    variant="solid"
                    size="lg"
                    label={unpublishButtonLabel}
                    disabled={!ready}
                    onClick={onUnpublish}
                />
            </Dialog.Footer>
        </Dialog.Content>
    );
};

UnpublishDialogMainContent.displayName = UNPUBLISH_DIALOG_MAIN_CONTENT_NAME;
