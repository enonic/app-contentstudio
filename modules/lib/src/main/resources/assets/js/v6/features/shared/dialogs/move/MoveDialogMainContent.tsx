import {Button, Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $moveDialog,
    $moveItemsCount,
    $isMoveDialogReady,
    setMoveDestinationItem,
    setMoveDestinationId,
} from '../../../store/dialogs/moveDialog.store';
import {$currentItems} from '../../../store/contentTreeSelection.store';
import {PathSelector} from '../../selectors/path/PathSelector';

type MoveDialogMainContentProps = {
    onMove: () => void;
    'data-component'?: string;
};

const MOVE_DIALOG_MAIN_CONTENT_NAME = 'MoveDialogMainContent';

export const MoveDialogMainContent = ({
    onMove,
    'data-component': componentName = MOVE_DIALOG_MAIN_CONTENT_NAME,
}: MoveDialogMainContentProps): ReactElement => {
    const {destinationId, excludedIds, submitting} = useStore($moveDialog, {keys: ['destinationId', 'excludedIds', 'submitting']});
    const ready = useStore($isMoveDialogReady);
    const total = useStore($moveItemsCount);
    const isMultiple = total > 1;
    const currentItems = useStore($currentItems);
    const hasRootLevelSelection = currentItems.some((item) => {
        const path = item.getPath();
        return path ? !path.hasParentContent() : false;
    });

    const title = useI18n(isMultiple ? 'dialog.move.multi' : 'dialog.move.single');
    const description = useI18n(isMultiple ? 'dialog.move.subname.multi' : 'dialog.move.subname.single');
    const destinationLabel = useI18n('dialog.move.destination');
    const moveLabel = useI18n('action.move');
    const moveButtonLabel = total > 1 ? `${moveLabel} (${total})` : moveLabel;
    const selectedId = destinationId ?? null;

    return (
        <Dialog.Content
            className="w-full h-full gap-10 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220"
            data-component={componentName}
        >
            <Dialog.DefaultHeader title={title} description={description} withClose />
            <Dialog.Body className='overflow-y-visible'>
                <div className='flex flex-col gap-2.5'>
                    <span className='text-md font-semibold'>{destinationLabel}</span>
                    <PathSelector
                        label={destinationLabel}
                        selectedId={selectedId}
                        excludedIds={excludedIds}
                        hideRoot={hasRootLevelSelection}
                        filterItems={currentItems}
                        disabled={submitting}
                        onSelectionChange={setMoveDestinationId}
                        onItemChange={setMoveDestinationItem}
                    />
                </div>
            </Dialog.Body>
            <Dialog.Footer>
                <Button
                    variant="solid"
                    size="lg"
                    label={moveButtonLabel}
                    disabled={!ready}
                    onClick={onMove}
                />
            </Dialog.Footer>
        </Dialog.Content>
    );
};

MoveDialogMainContent.displayName = MOVE_DIALOG_MAIN_CONTENT_NAME;
