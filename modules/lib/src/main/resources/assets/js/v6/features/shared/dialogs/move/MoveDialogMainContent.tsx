import {Button, Dialog} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useEffect, useRef, type ReactElement} from 'react';
import {Branch} from '../../../../../app/content/Branch';
import {ContentPath} from '../../../../../app/content/ContentPath';
import {ContentMoveComboBox} from '../../../../../app/move/ContentMoveComboBox';
import {useI18n} from '../../../hooks/useI18n';
import {useOnceWhen} from '../../../hooks/useOnce';
import {
    $isMoveDialogReady,
    $moveDialog,
    $moveItemsCount,
    executeMoveDialogAction,
    setMoveTargetPath,
} from '../../../store/dialogs/moveDialog.store';
import {ContentListItemWithReference} from '../../items/ContentListItemWithReference';

const MOVE_DIALOG_MAIN_CONTENT_NAME = 'MoveDialogMainContent';

export const MoveDialogMainContent = (): ReactElement => {
    const {loading, failed, items} = useStore($moveDialog, {keys: ['loading', 'failed', 'items']});
    const ready = useStore($isMoveDialogReady);
    const total = useStore($moveItemsCount);

    const title = useI18n('dialog.move');
    const moveLabel = useI18n('action.move');
    const moveButtonLabel = total > 1 ? `${moveLabel} (${total})` : moveLabel;

    const moveButtonRef = useRef<HTMLButtonElement>(null);
    const comboBoxRef = useRef<HTMLDivElement>(null);
    const comboBoxInstanceRef = useRef<ContentMoveComboBox | null>(null);

    useOnceWhen(() => {
        moveButtonRef.current?.focus({focusVisible: true});
    }, ready);

    const handleOpenAutoFocus = (event: FocusEvent) => {
        event.preventDefault();
        moveButtonRef.current?.focus({focusVisible: true});
    };

    const handleMove = async () => {
        await executeMoveDialogAction();
    };

    // Initialize the legacy combo box
    useEffect(() => {
        if (!comboBoxRef.current || comboBoxInstanceRef.current) {
            return;
        }

        const comboBox = new ContentMoveComboBox();
        comboBoxInstanceRef.current = comboBox;

        // Set up filtering based on items being moved
        if (items.length > 0) {
            const summaries = items.map(item => item.getContentSummary());
            comboBox.setFilterContents(summaries);
        }

        // Listen for selection changes
        comboBox.onSelectionChanged((change) => {
            if (change.selected?.length > 0) {
                const selectedItem = change.selected[0].getOption().getDisplayValue();
                const path: ContentPath = selectedItem.getPath();
                setMoveTargetPath(path);
            } else {
                setMoveTargetPath(null);
            }
        });

        // Render the combo box
        comboBox.renderToElement(comboBoxRef.current);

        return () => {
            comboBox.remove();
            comboBoxInstanceRef.current = null;
        };
    }, [items]);

    return (
        <Dialog.Content
            className="w-full h-full gap-10 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220"
            onOpenAutoFocus={handleOpenAutoFocus}
        >
            <Dialog.DefaultHeader title={title} description={useI18n('dialog.move.subname')} withClose />

            <Dialog.Body className="flex flex-col gap-y-10">
                <ul className="flex flex-col gap-y-2.5">
                    {items.map(item => (
                        <ContentListItemWithReference
                            key={`main-${item.getId()}`}
                            variant="normal"
                            content={item}
                            branch={Branch.DRAFT}
                            hasInbound={false}
                        />
                    ))}
                </ul>

                <div ref={comboBoxRef} className="content-move-selector" />
            </Dialog.Body>

            <Dialog.Footer className="flex items-center gap-2.5">
                <Button
                    variant="solid"
                    size="lg"
                    label={moveButtonLabel}
                    disabled={!ready}
                    onClick={handleMove}
                    ref={moveButtonRef}
                />
            </Dialog.Footer>
        </Dialog.Content>
    );
};

MoveDialogMainContent.displayName = MOVE_DIALOG_MAIN_CONTENT_NAME;
