import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {Button, Dialog} from '@enonic/ui';
import {ReactElement, RefObject, useEffect, useRef} from 'react';
import {useI18n} from '../../hooks/useI18n';
import {LegacyElement} from './../LegacyElement';
import {ConfirmationDialog, useConfirmationDialog} from './ConfirmationDialog';
import {Gate} from './Gate';

//
// * DialogPresetConfirm
//

type DialogPresetConfirmProps = {
    open?: boolean;
    title: string;
    description?: string;
    defaultConfirmEnabled?: boolean;
    onConfirm?: () => void;
    onCancel?: () => void;
};

const DIALOG_PRESET_CONFIRM_NAME = 'DialogPresetConfirm';

const DialogPresetConfirm = ({
    open = false,
    title,
    description,
    defaultConfirmEnabled,
    onConfirm,
    onCancel,
}: DialogPresetConfirmProps): ReactElement => {
    return (
        <ConfirmationDialog.Root open={open} onOpenChange={(next) => {
            if (!next) onCancel?.();
        }}>
            <ConfirmationDialog.Portal>
                <ConfirmationDialog.Overlay />
                    <ConfirmationDialog.Content data-component={DIALOG_PRESET_CONFIRM_NAME} defaultConfirmEnabled={defaultConfirmEnabled}>
                    <ConfirmationDialog.DefaultHeader title={title} />
                    <ConfirmationDialog.Body className="mb-7">{description}</ConfirmationDialog.Body>
                    <ConfirmationDialog.Footer onConfirm={onConfirm} onCancel={onCancel} />
                </ConfirmationDialog.Content>
            </ConfirmationDialog.Portal>
        </ConfirmationDialog.Root>
    );
};

DialogPresetConfirm.displayName = DIALOG_PRESET_CONFIRM_NAME;

//
// * DialogPresetGatedConfirmContent
//

type DialogPresetGatedConfirmContentProps = {
    expected: string | number;
    validate?: (value: string) => boolean;
    className?: string;
} & Omit<DialogPresetConfirmProps, 'defaultSubmitEnabled' | 'open'>;

const DIALOG_PRESET_GATED_CONFIRM_CONTENT_NAME = 'DialogPresetGatedConfirmContent';

/**
 * Internal component that renders inside ConfirmationDialog.Content to access ConfirmationDialogProvider context.
 * This allows useConfirmationDialog() to work properly, tracking the confirmEnabled state set by Gate.Input validation.
*/
export const DialogPresetGatedConfirmContent = ({
    className,
    ...props
}: DialogPresetGatedConfirmContentProps): ReactElement => {
    const gateInputRef = useRef<HTMLInputElement>(null);

    // Handles both on open and on rendered (e.g. when switching views in the Dialog)
    const handleOpenAutoFocus = (event: Event): void => {
        event.preventDefault();
        gateInputRef.current?.focus({focusVisible: true});
    };

    return (
        <ConfirmationDialog.Content
            defaultConfirmEnabled={false}
            onOpenAutoFocus={handleOpenAutoFocus}
            data-component={DIALOG_PRESET_GATED_CONFIRM_CONTENT_NAME}
            className={className}
        >
            <DialogPresetGatedConfirmContentParts gateInputRef={gateInputRef} {...props} />
        </ConfirmationDialog.Content>
    );
};

DialogPresetGatedConfirmContent.displayName = DIALOG_PRESET_GATED_CONFIRM_CONTENT_NAME;

type DialogPresetGatedConfirmContentPartsProps = {
    gateInputRef: RefObject<HTMLInputElement>;
} & Omit<DialogPresetGatedConfirmContentProps, 'className'>;

const DialogPresetGatedConfirmContentParts = ({
    title,
    description,
    expected,
    validate,
    onConfirm,
    onCancel,
    gateInputRef,
}: DialogPresetGatedConfirmContentPartsProps): ReactElement => {
    const {confirmEnabled} = useConfirmationDialog();

    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    // Shift focus to confirm the button when Gate becomes valid
    useEffect(() => {
        if (confirmEnabled) {
            confirmButtonRef.current?.focus({focusVisible: true});
        }
    }, [confirmEnabled]);

    const cancel = useI18n('action.cancel');
    const confirm = useI18n('action.confirm');

    return (
        <>
            <ConfirmationDialog.DefaultHeader title={title} />
            {description && (
                <ConfirmationDialog.Body>{description}</ConfirmationDialog.Body>
            )}
            <Gate className="mt-7 mb-9.5">
                <Gate.Hint value={expected} />
                <Gate.Input
                    ref={gateInputRef}
                    inputMode={typeof expected === 'number' ? 'numeric' : undefined}
                    expected={expected}
                    validate={validate}
                />
            </Gate>
            <Dialog.Footer>
                <Button size='lg' label={cancel} variant='outline' onClick={onCancel} />
                <Button ref={confirmButtonRef}
                    className='bg-btn-error text-alt hover:bg-btn-error-hover active:bg-btn-error-active focus-visible:ring-error/50'
                    size='lg'
                    variant='solid'
                    onClick={onConfirm}
                    disabled={!confirmEnabled}
                    label={confirm}
                />
            </Dialog.Footer>
        </>
    );
};

//
// * Legacy elements
//

export const DialogPreset = {
    Confirm: DialogPresetConfirm,
};

export class DialogPresetConfirmElement
    extends LegacyElement<typeof DialogPresetConfirm, DialogPresetConfirmProps> {

    constructor(props: DialogPresetConfirmProps) {
        super({...props}, DialogPresetConfirm);
    }

    open(): void {
        Body.get().appendChild(this);
        this.setProps({open: true});
    }

    close(): void {
        this.setProps({open: false});
        Body.get().removeChild(this);
    }
}
