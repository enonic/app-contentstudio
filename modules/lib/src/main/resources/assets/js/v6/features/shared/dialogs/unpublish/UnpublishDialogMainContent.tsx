import {Button, Dialog, Separator, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useMemo, useRef, type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {useOnceWhen} from '../../../hooks/useOnce';
import {
    $isUnpublishDialogReady, $unpublishDialog,
    $unpublishInboundIds,
    $unpublishItemsCount, ignoreUnpublishInboundDependencies
} from '../../../store/dialogs/unpublishDialog.store';
import {ContentListItem} from '../../items/ContentListItem';
import {InboundStatusBar} from '../status-bar/InboundStatusBar';

type UnpublishDialogMainContentProps = {
    onUnpublish: () => void;
};

const UNPUBLISH_DIALOG_MAIN_CONTENT_NAME = 'UnpublishDialogMainContent';

export const UnpublishDialogMainContent = ({onUnpublish}: UnpublishDialogMainContentProps): ReactElement => {
    const {loading, failed, items, dependants, inboundIgnored} = useStore($unpublishDialog,
        {keys: ['loading', 'failed', 'items', 'dependants', 'inboundIgnored']});
    const ready = useStore($isUnpublishDialogReady);
    const total = useStore($unpublishItemsCount);
    const inboundIds = useStore($unpublishInboundIds);
    const inboundSet = useMemo(() => new Set(inboundIds), [inboundIds]);

    const title = useI18n('dialog.unpublish');
    const dependantsLabel = useI18n('dialog.unpublish.dependants');
    const unpublishLabel = useI18n('action.unpublish');
    const unpublishButtonLabel = total > 1 ? `${unpublishLabel} (${total})` : unpublishLabel;

    const unpublishButtonRef = useRef<HTMLButtonElement>(null);

    useOnceWhen(() => {
        unpublishButtonRef.current?.focus({focusVisible: true});
    }, ready);

    const handleOpenAutoFocus = (event: FocusEvent) => {
        event.preventDefault();
        unpublishButtonRef.current?.focus({focusVisible: true});
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

            <Dialog.Body className="flex flex-col gap-y-10">
                <ul className="flex flex-col gap-y-2.5">
                    {items.map(item => (
                        <ContentListItem
                            key={`main-${item.getId()}`}
                            content={item}
                        />
                    ))}
                </ul>

                <div className={cn('flex flex-col gap-y-7.5', dependants.length === 0 && 'hidden')}>
                    <Separator className="pr-1" label={dependantsLabel} />
                    <ul className="flex flex-col gap-y-1.5">
                        {dependants.map(item => (
                            <ContentListItem
                                key={`dep-${item.getId()}`}
                                content={item}
                                variant="compact"
                            />
                        ))}
                    </ul>
                </div>

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
