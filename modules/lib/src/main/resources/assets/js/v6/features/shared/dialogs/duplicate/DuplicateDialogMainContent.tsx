import {Button, Dialog, Separator, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useMemo, useRef, type ReactElement} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {useI18n} from '../../../hooks/useI18n';
import {useOnceWhen} from '../../../hooks/useOnce';
import {
    $duplicateDialog,
    $duplicateDraftIncludeChildrenIds,
    $duplicateItemsCount,
    $isDuplicateDialogReady,
    $isDuplicateSelectionSynced,
    applyDuplicateIncludeChildrenSelection,
    cancelDuplicateIncludeChildrenSelection,
    toggleDuplicateIncludeChildren
} from '../../../store/dialogs/duplicateDialog.store';
import {ContentListItem} from '../../items/ContentListItem';
import {ContentListItemWithChildren} from '../../items/ContentListItemWithChildren';
import {SelectionStatusBar} from '../status-bar/SelectionStatusBar';

type DuplicateDialogMainContentProps = {
    onDuplicate: () => void;
    'data-component'?: string;
};

const DUPLICATE_DIALOG_MAIN_CONTENT_NAME = 'DuplicateDialogMainContent';

export const DuplicateDialogMainContent = ({
    onDuplicate,
    'data-component': componentName = DUPLICATE_DIALOG_MAIN_CONTENT_NAME,
}: DuplicateDialogMainContentProps): ReactElement => {
    const {loading, items, dependants} = useStore($duplicateDialog,
        {keys: ['loading', 'items', 'dependants']});
    const draftIncludeChildrenIds = useStore($duplicateDraftIncludeChildrenIds);
    const synced = useStore($isDuplicateSelectionSynced);
    const ready = useStore($isDuplicateDialogReady);
    const total = useStore($duplicateItemsCount);

    const includeChildrenSet = useMemo(() => new Set(draftIncludeChildrenIds.map(id => id.toString())), [draftIncludeChildrenIds]);

    const title = useI18n('dialog.duplicate');
    const dependantsLabel = useI18n('dialog.duplicate.dependants');
    const duplicateLabel = useI18n('action.duplicate');
    const duplicateButtonLabel = total > 1 ? `${duplicateLabel} (${total})` : duplicateLabel;

    const duplicateButtonRef = useRef<HTMLButtonElement>(null);

    useOnceWhen(() => {
        duplicateButtonRef.current?.focus({focusVisible: true});
    }, ready);

    const handleOpenAutoFocus = (event: FocusEvent) => {
        event.preventDefault();
        duplicateButtonRef.current?.focus({focusVisible: true});
    };

    const noop = () => undefined;

    return (
        <Dialog.Content
            className="w-full h-full gap-10 sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220"
            onOpenAutoFocus={handleOpenAutoFocus}
            data-component={componentName}
        >
            <Dialog.DefaultHeader title={title} withClose />

            <SelectionStatusBar
                loading={loading}
                editing={!synced}
                failed={false}
                showReady={false}
                onApply={() => applyDuplicateIncludeChildrenSelection()}
                onCancel={() => cancelDuplicateIncludeChildrenSelection()}
                errors={{
                    inProgress: {count: 0, disabled: true, onExclude: noop},
                    invalid: {count: 0, disabled: true, onExclude: noop},
                    noPermissions: {count: 0, disabled: true, onExclude: noop},
                }}
            />

            <Dialog.Body className="flex flex-col gap-y-10">
                <ul className='flex flex-col gap-y-2.5'>
                    {items.map(item => {
                        const includeChildren = includeChildrenSet.has(item.getContentId().toString());
                        const hasChildren = item.hasChildren();

                        return (
                            <ContentListItemWithChildren
                                key={`main-${item.getId()}`}
                                id={`main-${item.getId()}`}
                                content={item}
                                readOnly={loading}
                                includeChildren={includeChildren}
                                defaultIncludeChildren={hasChildren}
                                onIncludeChildrenChange={(enabled) => toggleDuplicateIncludeChildren(item.getContentId(), enabled)}
                                showIncludeChildren={hasChildren}
                            />
                        );
                    })}
                </ul>

                <div className={cn('flex flex-col gap-y-7.5', dependants.length === 0 && 'hidden')}>
                    <Separator className="pr-1" label={dependantsLabel} />
                    <ul className="flex flex-col gap-y-1.5">
                        {dependants.map((item: ContentSummaryAndCompareStatus) => (
                            <ContentListItem
                                key={`dep-${item.getId()}`}
                                content={item}
                                variant='compact'
                                aria-label={item.getDisplayName()}
                            />
                        ))}
                    </ul>
                </div>
            </Dialog.Body>

            <Dialog.Footer className="flex items-center gap-1">
                <Button
                    ref={duplicateButtonRef}
                    variant="solid"
                    size="lg"
                    label={duplicateButtonLabel}
                    disabled={!ready}
                    onClick={onDuplicate}
                />
            </Dialog.Footer>
        </Dialog.Content>
    );
};

DuplicateDialogMainContent.displayName = DUPLICATE_DIALOG_MAIN_CONTENT_NAME;
