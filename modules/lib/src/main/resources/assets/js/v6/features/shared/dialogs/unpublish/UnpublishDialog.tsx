import {Button, Dialog, Separator, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useEffect, useMemo, useRef, useState, type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {SelectionStatusBar} from '../SelectionStatusBar';
import {ConfirmationDialog, useConfirmationDialog} from '../ConfirmationDialog';
import {Gate} from '../Gate';
import {ContentListItem} from '../../items/ContentListItem';
import {
    $unpublishDialog,
    $isUnpublishDialogReady,
    $isUnpublishTargetSite,
    $unpublishInboundIds,
    $unpublishItemsCount,
    cancelUnpublishDialog,
    confirmUnpublishAction,
    ignoreUnpublishInboundDependencies,
} from '../../../store/dialogs/unpublishDialog.store';

const UNPUBLISH_DIALOG_NAME = 'UnpublishDialog';
type View = 'main' | 'confirmation' | 'progress';

export const UnpublishDialog = (): ReactElement => {
    const {open, loading, failed, items, dependants, inboundIgnored} = useStore($unpublishDialog,
        {keys: ['open', 'loading', 'failed', 'items', 'dependants', 'inboundIgnored']});
    const ready = useStore($isUnpublishDialogReady);
    const total = useStore($unpublishItemsCount);
    const hasSite = useStore($isUnpublishTargetSite);
    const inboundIds = useStore($unpublishInboundIds);
    const inboundSet = useMemo(() => new Set(inboundIds), [inboundIds]);

    const [view, setView] = useState<View>('main');
    const gateInputRef = useRef<HTMLInputElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    const title = useI18n('dialog.unpublish');
    const dependantsLabel = useI18n('dialog.unpublish.dependants');
    const unpublishLabel = useI18n('action.unpublish');
    const confirmTitle = useI18n('dialog.unpublish.confirm.title');
    const confirmDescription = useI18n('dialog.unpublish.confirm.subtitle');
    const unpublishButtonLabel = total > 1 ? `${unpublishLabel} (${total})` : unpublishLabel;

    useEffect(() => {
        if (view === 'confirmation') {
            gateInputRef.current?.focus();
        }
    }, [view]);

    const resetView = () => setView('main');

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            cancelUnpublishDialog();
            resetView();
        }
    };

    const handleUnpublish = async () => {
        if (total > 1 || hasSite) {
            setView('confirmation');
            return;
        }
        await confirmUnpublishAction(items);
    };

    const inboundCount = useMemo(() => {
        if (inboundIgnored) {
            return 0;
        }
        const allItems = [...items, ...dependants];
        return allItems.filter(item => inboundSet.has(item.getContentId().toString())).length;
    }, [items, dependants, inboundSet, inboundIgnored]);

    const ConfirmationView = (): ReactElement => {
        const cancelLabel = useI18n('action.cancel');
        const {confirmEnabled} = useConfirmationDialog();

        useEffect(() => {
            if (confirmEnabled) {
                confirmButtonRef.current?.focus();
            }
        }, [confirmEnabled]);

        return (
            <>
                <Dialog.DefaultHeader title={confirmTitle} description={confirmDescription}/>
                <Dialog.Body className="flex flex-col gap-y-5 py-5">
                    <Gate className="mt-2.5">
                        <Gate.Hint value={total} />
                        <Gate.Input ref={gateInputRef} expected={total} inputMode="numeric" />
                    </Gate>
                </Dialog.Body>
                <Dialog.Footer className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="lg"
                        label={cancelLabel}
                        onClick={resetView}
                    />
                    <Button
                        ref={confirmButtonRef}
                        variant="solid"
                        size="lg"
                        label={unpublishButtonLabel}
                        disabled={!confirmEnabled}
                        onClick={() => {
                            void confirmUnpublishAction(items);
                            resetView();
                        }}
                    />
                </Dialog.Footer>
            </>
        );
    };

    return (
            <Dialog.Root open={open} onOpenChange={handleOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay/>

                    {view === 'main' &&
                     <Dialog.Content className="w-full h-full gap-10 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220">
                         <Dialog.DefaultHeader title={title} withClose/>

                         <SelectionStatusBar
                             loading={loading}
                             failed={failed}
                             showReady={false}
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
                                 <Separator className="pr-1" label={dependantsLabel}/>
                                 <ul className="flex flex-col gap-y-1.5">
                                     {dependants.map(item => (
                                         <ContentListItem
                                             key={`main-${item.getId()}`}
                                             content={item}
                                             variant="compact"
                                         />
                                     ))}
                                 </ul>
                             </div>

                         </Dialog.Body>

                         <Dialog.Footer className="flex items-center gap-1">
                             <Button
                                 variant="solid"
                                 size="lg"
                                 label={unpublishButtonLabel}
                                 disabled={!ready}
                                 onClick={() => void handleUnpublish()}
                             />
                         </Dialog.Footer>
                     </Dialog.Content>
                    }
                    {view === 'confirmation' &&
                        <ConfirmationDialog.Content
                            defaultConfirmEnabled={false}
                            className="w-full h-full gap-7.5 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220"
                            onOpenAutoFocus={(event) => {
                                event.preventDefault();
                                gateInputRef.current?.focus();
                            }}
                        >
                            <ConfirmationView />
                        </ConfirmationDialog.Content>
                    }
                </Dialog.Portal>
            </Dialog.Root>
    );
};

UnpublishDialog.displayName = UNPUBLISH_DIALOG_NAME;
