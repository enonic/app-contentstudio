import {Button, cn, Dialog, Input} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useRef} from 'react';
import {useI18n} from '../../../hooks/useI18n';
import {
    $canSubmitRenameContentDialog,
    $renameContentDialog,
    closeRenameContentDialog,
    setRenameContentDialogValue,
    submitRenameContentDialog,
} from '../../../store/dialogs/renameContentDialog.store';

const RENAME_CONTENT_DIALOG_NAME = 'RenameContentDialog';

export const RenameContentDialog = (): ReactElement => {
    const inputRef = useRef<HTMLInputElement>(null);
    const {
        open,
        mode,
        path,
        initialName,
        value,
        placeholder,
        checkingAvailability,
        isPathAvailable,
    } = useStore($renameContentDialog, {
        keys: [
            'open',
            'mode',
            'path',
            'initialName',
            'value',
            'placeholder',
            'checkingAvailability',
            'isPathAvailable',
        ],
    });

    const canSubmit = useStore($canSubmitRenameContentDialog);

    const renamePublishedTitle = useI18n('dialog.rename.published.title');
    const renameTitle = useI18n('dialog.rename.title');
    const setNameTitle = useI18n('dialog.rename.setName.title');
    const newNameLabel = useI18n('dialog.rename.label');
    const nameLabel = useI18n('dialog.rename.name');
    const checkingLabel = useI18n('dialog.state.checking');
    const availableLabel = useI18n('path.available');
    const notAvailableLabel = useI18n('path.not.available');
    const renameLabel = useI18n('action.rename');

    const title = mode === 'rename-published'
                  ? renamePublishedTitle
                  : mode === 'set-name'
                    ? setNameTitle
                    : renameTitle;

    const inputLabel = mode === 'set-name' ? nameLabel : newNameLabel;
    const trimmedValue = value.trim();
    const hasChanges = trimmedValue.length > 0 && trimmedValue !== initialName;
    const inputError = hasChanges && !checkingAvailability && !isPathAvailable ? notAvailableLabel : undefined;
    const helperText = !hasChanges
                       ? undefined
                       : checkingAvailability
                         ? checkingLabel
                         : isPathAvailable
                           ? availableLabel
                           : inputError
                             ? notAvailableLabel
                             : undefined;

    return (
        <Dialog.Root
            open={open}
            onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                    closeRenameContentDialog();
                }
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay/>
                <Dialog.Content
                    className='w-full h-full gap-7.5 sm:h-fit md:min-w-180 md:max-w-184'
                    data-component={RENAME_CONTENT_DIALOG_NAME}
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        inputRef.current?.focus({focusVisible: true});
                    }}
                >
                    <Dialog.DefaultHeader title={title} withClose>
                        <Dialog.Description className='text-subtle'>
                            {path}
                        </Dialog.Description>
                    </Dialog.DefaultHeader>
                    <Dialog.Body className='flex flex-col gap-2.5 overflow-visible'>
                        <Input
                            ref={inputRef}
                            label={inputLabel}
                            value={value}
                            placeholder={placeholder}
                            onChange={(event) => {
                                setRenameContentDialogValue(event.currentTarget.value);
                            }}
                            endAddon={
                                helperText ? (
                                    <span className={cn(
                                        'whitespace-nowrap text-xs font-medium',
                                        checkingAvailability && 'text-subtle',
                                        !checkingAvailability && isPathAvailable && 'text-success',
                                        inputError && 'text-error',
                                    )}>
                                        {helperText}
                                    </span>
                                ) : undefined
                            }
                        />
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Button
                            size='lg'
                            variant='solid'
                            label={renameLabel}
                            disabled={!canSubmit}
                            onClick={submitRenameContentDialog}
                        />
                    </Dialog.Footer>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

RenameContentDialog.displayName = RENAME_CONTENT_DIALOG_NAME;
